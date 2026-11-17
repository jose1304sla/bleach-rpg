import test from 'node:test';
import assert from 'node:assert/strict';
import {BALANCE,CLANS,WEAPONS,RACES,ENEMIES,validateBalance} from '../server/balance.mjs';
import {roll,createCharacter,action,gainXP,stats,xpNeeded} from '../server/engine.mjs';
const make=()=>{const p=createCharacter('Ichigo','Shinigami');p.clan=CLANS[0].id;p.weapon=WEAPONS[0].id;return p;};
test('distributions sum exactly to 100%; every ticket maps to its configured rarity',()=>{
 validateBalance();
 for(const [catalog,weights] of [[CLANS,BALANCE.clanWeights],[WEAPONS,BALANCE.weaponWeights]]){
  const counts=weights.map(()=>0);
  for(let ticket=0;ticket<10000;ticket++){let n=0;const item=roll(catalog,weights,max=>n++===0?ticket:0);counts[item.tier]++;}
  assert.deepEqual(counts,weights);
 }
});
test('supreme swords have exactly equal 0.05% probabilities, individually the rarest',()=>{
 const supreme=WEAPONS.filter(w=>w.tier===6);assert.deepEqual(supreme.map(w=>w.name),['Zangetsu','Kyōka Suigetsu']);
 assert.equal(BALANCE.weaponWeights[6]/10000/supreme.length,.0005);
 for(const w of WEAPONS.filter(w=>w.tier<6))assert.ok(BALANCE.weaponWeights[w.tier]/WEAPONS.filter(x=>x.tier===w.tier).length>5);
});
test('invalid configuration is rejected',()=>{
 const original=BALANCE.clanWeights[0];BALANCE.clanWeights[0]++;assert.throws(validateBalance);BALANCE.clanWeights[0]=original;
});
test('creation validates race, name and starts with sealed power',()=>{
 for(const race of Object.keys(RACES)){const p=createCharacter('Player',race);assert.equal(p.stage,0);assert.equal(p.level,1);}
 assert.throws(()=>createCharacter('x','Shinigami'));assert.throws(()=>createCharacter('Valid','__proto__'));
});
test('level thresholds, multiple levels, cap and manual points',()=>{
 const p=make();gainXP(p,xpNeeded(1));assert.equal(p.level,2);assert.equal(p.xp,0);assert.equal(p.points,8);
 const before=stats(p).physical;action(p,'allocate',{attribute:'strength'});assert.equal(p.points,7);assert.equal(stats(p).physical,before+3);
 action(p,'reset');assert.equal(p.attributes.strength,5);assert.equal(p.points,8);assert.equal(p.coins,50);
 gainXP(p,10000000);assert.equal(p.level,100);assert.equal(p.xp,0);
 assert.throws(()=>action(p,'allocate',{attribute:'__proto__'}));
});
test('roll consumes currency, records history and enforces race',()=>{
 const p=make();action(p,'spin',{kind:'weapon'},()=>0,100000);assert.equal(p.spins,5);assert.equal(p.history.length,1);
 p.spins=0;assert.throws(()=>action(p,'spin',{kind:'clan'}));
 const h=createCharacter('Hollow','Hollow');assert.throws(()=>action(h,'spin',{kind:'weapon'}));
});
test('daily and training rewards cannot be spammed',()=>{
 const p=make();action(p,'daily',{},undefined,1000000);assert.equal(p.spins,8);
 assert.throws(()=>action(p,'daily',{},undefined,1000001));
 action(p,'train',{},undefined,1000000);assert.throws(()=>action(p,'train',{},undefined,1000001));assert.equal(p.training,1);
});
test('Shikai, Bankai and all racial evolutions require milestones',()=>{
 for(const race of Object.keys(RACES)){
  const p=make();p.race=race;assert.throws(()=>action(p,'evolve'));
  for(let i=1;i<RACES[race].stages.length;i++){Object.assign(p,BALANCE.stages[i]);action(p,'evolve');assert.equal(p.stage,i);}
  assert.throws(()=>action(p,'evolve'));
 }
});
test('mission reward only once and never before completion',()=>{
 const p=make();assert.throws(()=>action(p,'claim',{id:'first'}));p.wins=1;action(p,'claim',{id:'first'});assert.equal(p.spins,8);assert.throws(()=>action(p,'claim',{id:'first'}));
});
test('combat rejects invalid actions, costs and premature transformations',()=>{
 const p=make();action(p,'start',{id:'lost'});
 assert.throws(()=>action(p,'spin',{kind:'clan'}));assert.throws(()=>action(p,'reset'));assert.throws(()=>action(p,'combat',{move:'transform'}));
 assert.throws(()=>action(p,'combat',{move:'cheat'}));p.battle.energy=0;assert.throws(()=>action(p,'combat',{move:'skill'}));
});
test('victory gives rewards once and every third victory grants a spin',()=>{
 const p=make();p.wins=2;action(p,'start',{id:'lost'});p.battle.enemyHP=1;
 action(p,'combat',{move:'attack'},()=>9999);assert.equal(p.battle.result,'win');assert.equal(p.wins,3);assert.equal(p.spins,7);assert.equal(p.coins,168);
 assert.throws(()=>action(p,'combat',{move:'attack'}));
});
test('cooldown, poison-free effects, healing and transformation alter combat',()=>{
 const p=make();p.stage=1;p.level=25;action(p,'start',{id:'menos'});
 action(p,'combat',{move:'transform'},()=>9999);assert.ok(p.battle.transformed);
 const before=p.battle.enemyHP;action(p,'combat',{move:'skill'},()=>9999);
 assert.ok(p.battle.enemyHP<before);assert.throws(()=>action(p,'combat',{move:'skill'}));assert.ok(p.battle.energy>=0);
 const hp=p.battle.hp;action(p,'combat',{move:'potion'},()=>9999);assert.equal(p.potions,2);assert.ok(p.battle.hp>=hp);
});
test('loss and retreat give no rewards; level gate rejects bosses',()=>{
 const p=make();assert.throws(()=>action(p,'start',{id:'eclipse'}));
 action(p,'start',{id:'lost'});p.battle.hp=1;action(p,'combat',{move:'attack'},()=>9999);assert.equal(p.battle.result,'loss');assert.equal(p.coins,150);
 action(p,'start',{id:'lost'});action(p,'combat',{move:'flee'});assert.equal(p.battle.result,'fled');assert.equal(p.wins,0);
});
test('each race can complete a battle using server rules',()=>{
 for(const race of Object.keys(RACES)){const p=make();p.race=race;action(p,'start',{id:ENEMIES[0].id});for(let i=0;i<30&&!p.battle.result;i++)action(p,'combat',{move:'attack'},()=>9999);assert.equal(p.battle.result,'win');}
});
