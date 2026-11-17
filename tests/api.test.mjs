import test from 'node:test';
import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import {mkdtempSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join,resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
import {randomInt} from 'node:crypto';
const root=fileURLToPath(new URL('..',import.meta.url));
test('HTTP integration: sessions, validation, transactions, combat and restart persistence',async t=>{
 const temporary=mkdtempSync(join(tmpdir(),'soul-reborn-test-'));
 const port=randomInt(20000,50000),base='http://127.0.0.1:'+port;
 let child,cookie='';
 const launch=async()=>{
  child=spawn(process.execPath,['server/index.mjs'],{cwd:root,env:{...process.env,PORT:String(port),DB_PATH:join(temporary,'game.sqlite')},stdio:['ignore','pipe','pipe']});
  let output='';child.stderr.on('data',x=>output+=x);child.stdout.on('data',x=>output+=x);
  for(let i=0;i<60;i++){
   if(child.exitCode!==null)throw Error(output);
   try{if((await fetch(base+'/api/catalog')).ok)return;}catch{}
   await new Promise(r=>setTimeout(r,100));
  }
  throw Error('Server did not start: '+output);
 };
 const stop=async()=>{if(child&&child.exitCode===null)await new Promise(r=>{child.once('exit',r);child.kill();});};
 const call=async(path,body,extra={})=>{
  const res=await fetch(base+'/api/'+path,{...(body?{method:'POST',body:JSON.stringify(body)}:{}),headers:{'Content-Type':'application/json',...(cookie?{Cookie:cookie}:{}),...extra}});
  return {res,data:await res.json()};
 };
 try{
  await launch();
  await t.test('compiled page and assets are served',async()=>{
   const res=await fetch(base);assert.equal(res.status,200);const html=await res.text();assert.match(html,/Soul Reborn/);
   const asset=html.match(/src="([^"]+\.js)"/);assert.ok(asset);assert.equal((await fetch(base+asset[1])).status,200);
  });
  await t.test('isolated authenticated session and untrusted state fields',async()=>{
   assert.equal((await call('me')).data,null);
   assert.equal((await call('action',{type:'daily'})).res.status,401);
   const created=await call('character',{name:'Teste de alma',race:'Shinigami',coins:999999,level:100});
   assert.equal(created.res.status,201);assert.equal(created.data.level,1);assert.equal(created.data.coins,150);
   const header=created.res.headers.get('set-cookie');assert.match(header,/HttpOnly/);assert.match(header,/SameSite=Strict/);cookie=header.split(';')[0];
   assert.equal((await call('character',{name:'Duplicate',race:'Hollow'})).res.status,409);
  });
  await t.test('origin and action validation',async()=>{
   assert.equal((await call('action',{type:'daily'},{Origin:'https://invalid.example'})).res.status,403);
   assert.equal((await call('action',{type:'setXP',payload:{xp:99999}})).res.status,400);
   const invalid=await fetch(base+'/api/action',{method:'POST',headers:{'Content-Type':'application/json',Cookie:cookie},body:'invalid'});
   assert.equal(invalid.status,400);
  });
  await t.test('concurrent allocations cannot duplicate points',async()=>{
   const results=await Promise.all(Array.from({length:6},()=>call('action',{type:'allocate',payload:{attribute:'strength'}})));
   assert.equal(results.filter(r=>r.res.ok).length,5);
   const {data}=await call('me');assert.equal(data.points,0);assert.equal(data.attributes.strength,10);
  });
  await t.test('server roletas and combat rewards persist',async()=>{
   await call('action',{type:'spin',payload:{kind:'clan'}});
   await call('action',{type:'spin',payload:{kind:'weapon'}});
   let result=await call('action',{type:'start',payload:{id:'lost'}});
   assert.ok(result.res.ok);
   for(let i=0;i<20&&!result.data.battle.result;i++)result=await call('action',{type:'combat',payload:{move:'attack'}});
   assert.equal(result.data.battle.result,'win');assert.equal(result.data.wins,1);
   assert.equal((await call('action',{type:'combat',payload:{move:'attack'}})).res.status,400);
   const before=(await call('me')).data;
   await stop();await launch();
   const after=(await call('me')).data;
   assert.deepEqual(after,before);assert.equal(after.history.length,2);
   assert.equal((await fetch(base+'/api/me').then(r=>r.json())),null);
  });
 }finally{
  await stop();
  const target=resolve(temporary),allowed=resolve(tmpdir())+ (process.platform==='win32'?'\\':'/');
  assert.ok(target.startsWith(allowed)&&target.includes('soul-reborn-test-'));
  rmSync(target,{recursive:true,force:true});
 }
});
