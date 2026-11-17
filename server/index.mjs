
import http from 'node:http';
import {Pool} from 'pg';
import {randomBytes,createHash} from 'node:crypto';
import {readFileSync,existsSync} from 'node:fs';
import {resolve,extname} from 'node:path';
import {fileURLToPath} from 'node:url';
import {BALANCE,RARITIES,ATTRIBUTES,CLANS,WEAPONS,RACES,ENEMIES,MISSIONS} from './balance.mjs';
import {createCharacter,action,stats,nextStage,xpNeeded} from './engine.mjs';

const root=resolve(fileURLToPath(new URL('..',import.meta.url)));

const db=new Pool({
 connectionString:process.env.DATABASE_URL,
 ssl:{rejectUnauthorized:false},
 max:5
});

await db.query(`
 CREATE TABLE IF NOT EXISTS players (
  token TEXT PRIMARY KEY,
  state TEXT NOT NULL
 );
`);

const hash=token=>createHash('sha256').update(token).digest('hex');
const publicState=p=>({...p,stats:stats(p),nextStage:nextStage(p),xpNeeded:xpNeeded(p.level)});
const buckets=new Map();

function respond(res,status,data){
 res.writeHead(status,{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store'});
 res.end(JSON.stringify(data));
}

const server=http.createServer(async(req,res)=>{
 res.setHeader('X-Content-Type-Options','nosniff');
 res.setHeader('Referrer-Policy','same-origin');

 try{
  const url=new URL(req.url,'http://127.0.0.1');

  if(url.pathname.startsWith('/api/')){
   if(req.method==='GET'&&url.pathname==='/api/catalog')
    return respond(res,200,{BALANCE,RARITIES,ATTRIBUTES,CLANS,WEAPONS,RACES,ENEMIES,MISSIONS});

   const token=(req.headers.cookie||'').split(';').map(v=>v.trim()).find(v=>v.startsWith('soul_session='))?.slice(13);
   const clientIp=(req.headers['x-forwarded-for']||'').split(',')[0].trim()||req.socket.remoteAddress||'local';
   const key=hash(token||clientIp);
   const tick=Date.now(),bucket=buckets.get(key);

   if(bucket&&tick-bucket.start<60000){
    bucket.count++;
    if(bucket.count>150)return respond(res,429,{error:'Muitas ações. Aguarde um minuto.'});
   }else buckets.set(key,{start:tick,count:1});

   if(buckets.size>10000)
    for(const [k,v] of buckets)if(tick-v.start>60000)buckets.delete(k);

   const result=token?await db.query('SELECT state FROM players WHERE token=$1',[hash(token)]):{rows:[]};
   const row=result.rows[0];

   if(req.method==='GET'&&url.pathname==='/api/me')
    return respond(res,200,row?publicState(JSON.parse(row.state)):null);

   if(req.method!=='POST')return respond(res,405,{error:'Método não permitido.'});

   const origin=req.headers.origin;
   const forwardedProto=(req.headers['x-forwarded-proto']||'').split(',')[0].trim();
   const protocol=forwardedProto==='https'?'https':'http';

   if(origin&&origin!==protocol+'://'+req.headers.host)
    return respond(res,403,{error:'Origem inválida.'});

   if(!req.headers['content-type']?.startsWith('application/json'))
    return respond(res,415,{error:'JSON obrigatório.'});

   let raw='';
   for await(const chunk of req){
    raw+=chunk;
    if(raw.length>8192)return respond(res,413,{error:'Requisição grande demais.'});
   }

   const body=JSON.parse(raw||'{}');

   if(url.pathname==='/api/character'){
    if(row)return respond(res,409,{error:'Já existe um personagem nesta sessão.'});

    const p=createCharacter(body.name,body.race,body.object||'Pingente');
    const secret=randomBytes(32).toString('hex');

    await db.query('INSERT INTO players VALUES ($1,$2)',[hash(secret),JSON.stringify(p)]);

    const secure=process.env.NODE_ENV==='production'||forwardedProto==='https'?' Secure;':'';
    res.setHeader('Set-Cookie','soul_session='+secret+'; HttpOnly; SameSite=Lax; Path=/; Max-Age=31536000;'+secure);

    return respond(res,201,publicState(p));
   }

   if(url.pathname!=='/api/action')
    return respond(res,404,{error:'Rota inválida.'});

   if(!row)return respond(res,401,{error:'Crie um personagem primeiro.'});

   const client=await db.connect();

   try{
    await client.query('BEGIN');

    const currentResult=await client.query(
     'SELECT state FROM players WHERE token=$1 FOR UPDATE',
     [hash(token)]
    );

    if(!currentResult.rows[0]){
     await client.query('ROLLBACK');
     return respond(res,401,{error:'Crie um personagem primeiro.'});
    }

    const current=JSON.parse(currentResult.rows[0].state);
    action(current,body.type,body.payload||{});

    await client.query(
     'UPDATE players SET state=$1 WHERE token=$2',
     [JSON.stringify(current),hash(token)]
    );

    await client.query('COMMIT');
    return respond(res,200,publicState(current));

   }catch(error){
    await client.query('ROLLBACK');
    throw error;
   }finally{
    client.release();
   }
  }

  if(req.method!=='GET'&&req.method!=='HEAD'){
   res.writeHead(405);
   return res.end();
  }

  const dist=resolve(root,'dist');
  const requested=resolve(dist,'.'+decodeURIComponent(url.pathname));

  if(!requested.startsWith(dist+'/')&&!requested.startsWith(dist+'\\')&&requested!==dist){
   res.writeHead(403);
   return res.end();
  }

  const file=existsSync(requested)&&extname(requested)?requested:resolve(dist,'index.html');

  if(!existsSync(file)){
   res.writeHead(404);
   return res.end('Execute npm run build ou use npm run dev.');
  }

  const mime={'.html':'text/html; charset=utf-8','.js':'text/javascript','.css':'text/css','.svg':'image/svg+xml'};

  res.writeHead(200,{'Content-Type':mime[extname(file)]||'application/octet-stream'});
  res.end(readFileSync(file));

 }catch(error){
  console.error(error);
  respond(res,500,{error:error instanceof SyntaxError?'JSON inválido.':'Erro interno do servidor.'});
 }
});

const port=Number(process.env.PORT||3001);
const host=process.env.HOST||'0.0.0.0';

server.listen(port,host,()=>console.log('Soul Reborn listening on '+host+':'+port));

process.on('SIGTERM',()=>server.close(async()=>{
 await db.end();
 process.exit(0);
}));
