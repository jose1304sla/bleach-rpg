// Integer weights: one unit = 0.01%. Never use floating point probability totals.
export const BALANCE = {
 maxLevel:100, pointsPerLevel:3, resetCost:100, dailySpins:2,
 clanWeights:[5500,2500,1200,500,250,50],
 weaponWeights:[5000,2500,1400,700,350,40,10],
 stages:[{level:1,wins:0,training:0},{level:10,wins:5,training:5},{level:25,wins:20,training:15},{level:45,wins:45,training:30},{level:65,wins:75,training:45},{level:85,wins:110,training:65}],
};
export const RARITIES=['Comum','Incomum','Raro','Épico','Lendário','Mítico','Mítico Supremo'];
export const ATTRIBUTES={strength:'Força',endurance:'Resistência',speed:'Velocidade',reiatsu:'Reiatsu',control:'Controle Espiritual',intelligence:'Inteligência'};
const clanRows=[
 ['Aokawa','Mizuhara','Ishikaze'],['Tsukimori','Akeboshi'],['Hisagi','Kira'],
 ['Kyōraku','Kasumioji','Ōmaeda'],['Kuchiki','Shihōin','Shiba','Tsunayashiro'],['Kurosaki']
];
const features=[
 ['Vigor persistente','endurance',3],['Fluxo preciso','control',4],['Instinto de combate','speed',5],
 ['Herança espiritual','reiatsu',7],['Disciplina nobre','intelligence',9],['Potencial híbrido','strength',11]
];
export const CLANS=clanRows.flatMap((names,tier)=>names.map((name,i)=>({
 id:'clan-'+tier+'-'+i,name,tier,original:tier<2,passive:features[tier][0],
 bonus:{[features[tier][1]]:features[tier][2],...(i%2?{speed:2}:{endurance:2})},
 description:tier<2?'Família original do jogo.':tier===2?'Sobrenome canônico; herança e passiva são adaptações do jogo.':'Família canônica; bônus adaptados para o jogo.'
})));
const weaponRows=[
 ['Asauchi • Brisa','Asauchi • Pedra','Asauchi • Centelha'],
 ['Asauchi • Maré','Asauchi • Eco'],['Hōzukimaru','Itegumo','Tobiume'],
 ['Sode no Shirayuki','Zabimaru','Kazeshini','Haineko','Wabisuke','Ashisogi Jizō'],
 ['Senbonzakura','Katen Kyōkotsu','Hyōrinmaru','Benihime','Minazuki','Suzumebachi'],
 ['Ryūjin Jakka','Ichimonji','Nozarashi'],['Zangetsu','Kyōka Suigetsu']
];
const effects=['drain','burn','pierce','freeze','weaken','heal'];
const themes=['vento','rocha','chama','gelo','sombra','luz'];
const unrevealed=['Kyōka Suigetsu','Itegumo','Tobiume','Haineko','Wabisuke'];
// Original combat techniques, inspired by each blade's identity; not canonical revelations.
const bladeStyles={
 'Hōzukimaru':['Impacto do dragão','Ruptura tripla','pierce','rocha'],
 'Itegumo':['Geada cortante','Inverno da alma','freeze','gelo'],
 'Tobiume':['Esferas de brasa','Jardim incandescente','burn','chama'],
 'Sode no Shirayuki':['Dança da neve','Silêncio absoluto','freeze','gelo'],
 'Zabimaru':['Presa segmentada','Rugido da serpente','pierce','rocha'],
 'Kazeshini':['Foices do crepúsculo','Colheita espectral','drain','sombra'],
 'Haineko':['Nuvem de cinzas','Tempestade cinzenta','weaken','vento'],
 'Wabisuke':['Peso da culpa','Sentença gravitacional','weaken','sombra'],
 'Ashisogi Jizō':['Névoa debilitante','Jardim paralisante','weaken','sombra'],
 'Senbonzakura':['Chuva de pétalas','Mil lâminas ao luar','pierce','vento'],
 'Katen Kyōkotsu':['Jogo das sombras','Último ato sombrio','drain','sombra'],
 'Hyōrinmaru':['Sopro glacial','Céu congelado','freeze','gelo'],
 'Benihime':['Arco carmesim','Reconstrução vital','heal','luz'],
 'Minazuki':['Maré restauradora','Véu rubro','heal','luz'],
 'Suzumebachi':['Picada espiritual','Impacto da vespa','pierce','luz'],
 'Ryūjin Jakka':['Círculo de brasas','Horizonte solar','burn','chama'],
 'Ichimonji':['Tinta do esquecimento','Nome reescrito','weaken','sombra'],
 'Nozarashi':['Corte indomável','Fúria sem limites','pierce','rocha'],
 'Zangetsu':['Arco da lua negra','Eclipse da alma','drain','sombra'],
 'Kyōka Suigetsu':['Reflexo ilusório','Labirinto dos sentidos','weaken','luz']
};
export const WEAPONS=weaponRows.flatMap((names,tier)=>names.map((name,i)=>({
 id:'weapon-'+tier+'-'+i,name,tier,original:tier<2,
 effect:bladeStyles[name]?.[2]||effects[(i+tier)%effects.length],theme:bladeStyles[name]?.[3]||themes[(i+tier)%themes.length],
 advancedTechnique:bladeStyles[name]?.[1]||name+' • Ascensão espiritual',
 technique:bladeStyles[name]?.[0]||name+' • '+['Corte da alma','Ruptura espiritual','Lâmina crescente','Véu espiritual','Pressão esmagadora','Pulso vital'][(i+tier)%6],
 bankaiOriginal:unrevealed.includes(name)||tier<2,
 description:'Técnica, valores e efeitos são adaptações originais para este RPG.'
})));
export const RACES={
 Shinigami:{icon:'刀',description:'A lâmina reflete a sua alma.',advantage:'+4 Força; versatilidade de Kidō.',weakness:'Depende de treinar a liberação da lâmina.',bonus:{strength:4},stages:['Shinigami','Shikai','Bankai'],skills:['Hadō: pulso','Zanjutsu']},
 Hollow:{icon:'虚',description:'Devore os limites da evolução.',advantage:'+5 Resistência; maior sustentação.',weakness:'Cero custa mais energia.',bonus:{endurance:5},stages:['Hollow','Gillian','Adjuchas','Vasto Lorde','Arrancar','Resurrección'],skills:['Cero','Hierro']},
 Quincy:{icon:'弓',description:'Transforme Reishi em precisão.',advantage:'+4 Controle; técnicas eficientes.',weakness:'Menor dano físico inicial.',bonus:{control:4},stages:['Quincy','Reishi desperto','Schrift','Vollständig'],skills:['Heilig Pfeil','Blut Vene']},
 Fullbringer:{icon:'魂',description:'Encontre o poder no seu objeto.',advantage:'+4 Velocidade; adaptação.',weakness:'Progressão requer domínio do objeto.',bonus:{speed:4},stages:['Portador','Fullbring parcial','Fullbring completo','Fullbring evoluído'],skills:['Bringer Light','Pulso do objeto']}
};
export const ENEMIES=[
 {id:'lost',name:'Alma errante',level:1,kind:'Patrulha',hp:65,attack:10,defense:2,xp:40,coins:18,effect:'weaken',resistance:'drain'},
 {id:'crawler',name:'Hollow rastejante',level:5,kind:'Caçada',hp:130,attack:18,defense:5,xp:95,coins:32,effect:'burn',resistance:'weaken'},
 {id:'guardian',name:'Guardião de Reishi',level:12,kind:'Elite',hp:270,attack:30,defense:11,xp:210,coins:65,effect:'drain',resistance:'freeze'},
 {id:'menos',name:'Menos da fenda',level:25,kind:'Chefe original',hp:650,attack:55,defense:22,xp:520,coins:150,effect:'weaken',resistance:'burn'},
 {id:'sentinel',name:'Sentinela do vazio',level:45,kind:'Chefe original',hp:1350,attack:95,defense:40,xp:1050,coins:300,effect:'burn',resistance:'drain'},
 {id:'king',name:'Soberano da fenda',level:65,kind:'Chefe original',hp:2400,attack:145,defense:60,xp:1850,coins:500,effect:'drain',resistance:'freeze'},
 {id:'eclipse',name:'Eclipse espiritual',level:85,kind:'Chefe original',hp:3800,attack:200,defense:85,xp:3000,coins:800,effect:'weaken',resistance:'burn'}
];
export const MISSIONS=[
 {id:'first',name:'Primeiro contato',description:'Vença 1 batalha.',counter:'wins',target:1,xp:60,coins:50,spins:2},
 {id:'training',name:'Disciplina da alma',description:'Complete 5 treinamentos.',counter:'training',target:5,xp:160,coins:80,spins:2},
 {id:'hunter',name:'Patrulha de Karakura',description:'Vença 10 batalhas.',counter:'wins',target:10,xp:350,coins:200,spins:3},
 {id:'boss',name:'A fenda entre mundos',description:'Derrote 1 chefe.',counter:'bosses',target:1,xp:700,coins:300,spins:4},
 {id:'master',name:'Domínio espiritual',description:'Complete 30 treinamentos.',counter:'training',target:30,xp:1000,coins:400,spins:5},
 {id:'veteran',name:'Guardião dos mundos',description:'Vença 75 batalhas.',counter:'wins',target:75,xp:2000,coins:700,spins:8}
];
export function validateBalance(){
 for(const weights of [BALANCE.clanWeights,BALANCE.weaponWeights]){
  if(weights.some(x=>!Number.isInteger(x)||x<=0)||weights.reduce((a,b)=>a+b,0)!==10000)throw Error('As chances devem totalizar 10000.');
 }
 for(const [catalog,weights] of [[CLANS,BALANCE.clanWeights],[WEAPONS,BALANCE.weaponWeights]])
  weights.forEach((_,tier)=>{if(!catalog.some(x=>x.tier===tier))throw Error('Raridade vazia');});
}
validateBalance();
