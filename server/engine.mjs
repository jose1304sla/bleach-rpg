import {randomInt} from 'node:crypto';
import {BALANCE,ATTRIBUTES,CLANS,WEAPONS,RACES,ENEMIES,MISSIONS} from './balance.mjs';
export const assert=(ok,message)=>{if(!ok)throw Error(message);};
export function roll(catalog,weights,rng=randomInt){
 const ticket=rng(10000);let sum=0,tier=0;
 for(;tier<weights.length;tier++){sum+=weights[tier];if(ticket<sum)break;}
 const options=catalog.filter(x=>x.tier===tier);return options[rng(options.length)];
}
export function createCharacter(name,race,object='Pingente'){
 assert(typeof name==='string'&&name.trim().length>=2&&name.trim().length<=24,'Nome deve ter entre 2 e 24 caracteres.');
 assert(Object.hasOwn(RACES,race),'Raça inválida.');
 assert(typeof object==='string'&&object.trim().length>=2&&object.trim().length<=40,'Objeto inválido.');
 return {name:name.trim(),race,object:object.trim(),level:1,xp:0,coins:150,spins:6,points:5,
 attributes:Object.fromEntries(Object.keys(ATTRIBUTES).map(k=>[k,5])),
 clan:null,weapon:null,stage:0,wins:0,training:0,bosses:0,claimed:[],history:[],battle:null,
 potions:3,lastDaily:null,lastTraining:0};
}
export const xpNeeded=level=>80+level*20;
export function gainXP(p,amount){
 p.xp+=amount;
 while(p.level<BALANCE.maxLevel&&p.xp>=xpNeeded(p.level)){p.xp-=xpNeeded(p.level);p.level++;p.points+=BALANCE.pointsPerLevel;}
 if(p.level===BALANCE.maxLevel)p.xp=0;
}
export function stats(p){
 const a={...p.attributes};
 for(const bonus of [RACES[p.race].bonus,CLANS.find(c=>c.id===p.clan)?.bonus??{}])
  for(const [k,v] of Object.entries(bonus))a[k]+=v;
 return {hp:100+a.endurance*14+p.level*8,energy:60+a.reiatsu*8+a.control*3,
 physical:10+a.strength*3+p.level*2,spiritual:10+a.reiatsu*3+a.intelligence*1.5+p.level*2,
 defense:a.endurance*1.6+a.control*.4,crit:Math.min(.35,.05+a.intelligence*.002+a.speed*.001),
 dodge:Math.min(.30,a.speed*.003),regen:2+Math.floor(a.control/6),initiative:a.speed*2+p.level};
}
export function nextStage(p){return p.stage+1<RACES[p.race].stages.length?BALANCE.stages[p.stage+1]:null;}
function ready(p){assert(!p.battle||p.battle.result,'Finalize o combate primeiro.');}
function reward(p,xp,coins,spins=0){gainXP(p,xp);p.coins+=coins;p.spins+=spins;}
function hitDamage(base,defense,crit,rng){return Math.max(1,Math.floor((base-defense*.55)*(rng(10000)<crit*10000?1.5:1)));}
export function action(p,type,payload={},rng=randomInt,now=Date.now()){
 const s=stats(p);
 switch(type){
 case 'spin':{
  ready(p);assert(p.spins>0,'Você não tem giros.');
  assert(['clan','weapon'].includes(payload.kind),'Roleta inválida.');
  assert(payload.kind!=='weapon'||p.race==='Shinigami','Apenas Shinigamis usam esta roleta.');
  const weapon=payload.kind==='weapon';
  const item=roll(weapon?WEAPONS:CLANS,weapon?BALANCE.weaponWeights:BALANCE.clanWeights,rng);
  p.spins--;p[payload.kind]=item.id;
  p.history.unshift({kind:payload.kind,name:item.name,tier:item.tier,date:new Date(now).toISOString()});
  p.history=p.history.slice(0,100);break;
 }
 case 'allocate':
  ready(p);assert(Object.hasOwn(ATTRIBUTES,payload.attribute),'Atributo inválido.');assert(p.points>0,'Sem pontos disponíveis.');
  p.attributes[payload.attribute]++;p.points--;break;
 case 'reset':
  ready(p);assert(p.coins>=BALANCE.resetCost,'Moedas insuficientes.');
  p.coins-=BALANCE.resetCost;p.points+=Object.values(p.attributes).reduce((a,b)=>a+b-5,0);
  p.attributes=Object.fromEntries(Object.keys(ATTRIBUTES).map(k=>[k,5]));break;
 case 'daily':{
  const day=new Date(now).toISOString().slice(0,10);
  assert(p.lastDaily!==day,'Recompensa já recebida hoje (dia UTC).');p.lastDaily=day;p.spins+=BALANCE.dailySpins;break;
 }
 case 'train':
  ready(p);assert(now-p.lastTraining>=10000,'Aguarde 10 segundos entre treinos.');
  p.lastTraining=now;p.training++;reward(p,20+p.level*3,5);break;
 case 'evolve':{
  ready(p);const req=nextStage(p);assert(req,'Evolução máxima atingida.');
  assert(p.clan,'Obtenha sua família primeiro.');
  assert(p.race!=='Shinigami'||p.weapon,'Obtenha sua Zanpakutō primeiro.');
  assert(p.level>=req.level&&p.wins>=req.wins&&p.training>=req.training,'Cumpra os requisitos de evolução.');
  p.stage++;break;
 }
 case 'claim':{
  const m=MISSIONS.find(m=>m.id===payload.id);assert(m,'Missão inválida.');
  assert(!p.claimed.includes(m.id),'Recompensa já coletada.');
  assert(p[m.counter]>=m.target,'Missão incompleta.');p.claimed.push(m.id);reward(p,m.xp,m.coins,m.spins);break;
 }
 case 'buy':
  ready(p);assert(p.coins>=30,'Poção custa 30 moedas.');assert(p.potions<99,'Limite de poções atingido.');p.coins-=30;p.potions++;break;
 case 'start':{
  ready(p);assert(p.clan,'Role sua família antes de lutar.');
  assert(p.race!=='Shinigami'||p.weapon,'Role sua Zanpakutō antes de lutar.');
  const e=ENEMIES.find(e=>e.id===payload.id);assert(e,'Inimigo inválido.');
  assert(p.level>=Math.max(1,e.level-5),'Você precisa de mais níveis para essa área.');
  p.battle={enemy:e.id,enemyHP:e.hp,hp:s.hp,energy:s.energy,turn:1,transformed:false,cooldowns:{},statuses:{},enemyStatuses:{},log:['Você encontrou '+e.name+'.'],result:null};break;
 }
 case 'combat': combat(p,payload.move,rng);break;
 default:throw Error('Ação inválida.');
 }return p;
}
function combat(p,move,rng){
 const b=p.battle;assert(b&&!b.result,'Nenhum combate ativo.');
 const e=ENEMIES.find(e=>e.id===b.enemy),s=stats(p),w=WEAPONS.find(w=>w.id===p.weapon);
 assert(['attack','skill','racial','defend','dodge','transform','potion','flee'].includes(move),'Movimento inválido.');
 if(move==='flee'){b.result='fled';b.log.push('Você recuou sem recompensas.');return;}
 const log=message=>b.log.push(message);
 const stun=b.statuses.freeze>0;
 if(!stun){
 if(move==='transform'){
  assert(p.stage>0,'Desbloqueie uma transformação pela evolução.');assert(!b.transformed,'Transformação já ativa.');assert(b.energy>=20,'Energia insuficiente.');
  b.energy-=20;b.transformed=true;log('Sua pressão espiritual se expande: '+RACES[p.race].stages[p.stage]+'!');
 }else if(move==='potion'){
  assert(p.potions>0,'Sem poções.');p.potions--;b.hp=Math.min(s.hp,b.hp+Math.floor(s.hp*.4));log('Poção restaura 40% da vida máxima.');
 }else if(['attack','skill','racial'].includes(move)){
  const skill=move!=='attack',racial=move==='racial';
  assert(!skill||!(b.cooldowns[move]>0),'Habilidade em recarga.');
  const cost=skill?Math.max(6,Math.floor((racial&&p.race==='Hollow'?26:20)-p.attributes.control*.12)):0;
  assert(b.energy>=cost,'Energia insuficiente.');b.energy-=cost;
  if(skill)b.cooldowns[move]=racial?4:3;
  const mult=(b.transformed?1.3+p.stage*.17:1)*(skill&&w&&p.stage>0?1+w.tier*.025:1);
  const weakened=b.statuses.weaken>0?.75:1;
  let damage=hitDamage((skill?s.spiritual*1.35:s.physical)*mult*weakened,e.defense,s.crit,rng);
  const effect=racial?({Shinigami:'pierce',Hollow:'drain',Quincy:'freeze',Fullbringer:'weaken'}[p.race]):(p.race==='Shinigami'&&p.stage>0?w?.effect:'burn');
  if(skill&&effect==='pierce')damage+=Math.ceil(e.defense*.5);
  if(skill&&effect===e.resistance){damage=Math.floor(damage*.7);log('O inimigo resiste ao efeito espiritual.');}
  b.enemyHP=Math.max(0,b.enemyHP-damage);
  log((skill?(racial?RACES[p.race].skills[0]:(w&&p.stage>0?(p.stage>=2&&b.transformed?w.advancedTechnique:w.technique):'Técnica espiritual')):'Ataque')+': '+damage+' de dano.');
  if(skill&&effect!==e.resistance){
   if(effect==='drain'||effect==='heal')b.hp=Math.min(s.hp,b.hp+Math.floor(damage*.3));
   if(['burn','freeze','weaken'].includes(effect))b.enemyStatuses[effect]=effect==='freeze'?1:3;
  }
 }else log(move==='defend'?'Você assume uma postura defensiva.':'Você prepara uma esquiva.');
 }else log('O gelo impede seu movimento.');
 if(b.enemyStatuses.burn>0){b.enemyHP=Math.max(0,b.enemyHP-Math.ceil(s.spiritual*.15));b.enemyStatuses.burn--;log('Chamas espirituais causam dano contínuo.');}
 if(b.enemyHP<=0){
  b.result='win';p.wins++;if(e.kind.includes('Chefe'))p.bosses++;
  const xp=Math.max(5,Math.floor(e.xp*Math.min(1,(e.level+5)/p.level)));
  const spins=p.wins%3===0?1:0;reward(p,xp,e.coins,spins);
  b.reward={xp,coins:e.coins,spins};log('Vitória! +'+xp+' XP, +'+e.coins+' moedas.');return;
 }
 const swift=s.initiative>e.level*3;
 if(b.enemyStatuses.freeze>0){b.enemyStatuses.freeze--;log('O inimigo está congelado.');}
 else if(rng(10000)<Math.min(.8,s.dodge+(move==='dodge'&&!stun?.45:0)+(swift?.04:0))*10000)log('Você esquivou do ataque inimigo.');
 else{
  let damage=hitDamage(e.attack*(b.enemyStatuses.weaken>0?.75:1),s.defense,0,rng);
  if(move==='defend'&&!stun)damage=Math.max(1,Math.floor(damage*.35));
  b.hp=Math.max(0,b.hp-damage);log(e.name+' causa '+damage+' de dano.');
  if(b.turn%4===0){b.statuses[e.effect]=2;log('O inimigo aplica '+e.effect+'.');}
 }
 if(b.statuses.burn>0){b.hp=Math.max(0,b.hp-Math.ceil(e.attack*.2));log('Você sofre queimadura.');}
 if(b.statuses.drain>0)b.energy=Math.max(0,b.energy-6);
 for(const map of [b.cooldowns,b.statuses])for(const k of Object.keys(map))map[k]=Math.max(0,map[k]-1);
 if(b.enemyStatuses.weaken>0)b.enemyStatuses.weaken--;
 b.energy=Math.min(s.energy,b.energy+s.regen);b.turn++;b.log=b.log.slice(-60);
 if(b.hp<=0){b.result='loss';log('Derrota. Treine, distribua atributos e tente novamente.');}
}
