/* 《一物一控》 timeline — single source of truth = docs/方案.md section C (global beats, 120 BPM, 120 beats = 60.000 s).
   Exports scenes + events (E) + writeCues(). Run `node gen_cues.js` for cues.json only. */
const fs=require('fs'),path=require('path');
const BPM=120,SPB=60/BPM,BEATS=120,DUR=BEATS*SPB;
const T=b=>b*SPB;
const scenes=[ // id, start beat, beats (B1 table)
 ['s00',0,2],['s01',2,6],['s02',8,14],['s03',22,8],['s04',30,10],['s05',40,10],['s06',50,8],
 ['s07',58,6],['s08',64,10],['s09',74,10],['s10',84,12],['s11',96,8],['s12',104,8],['final',112,8]];
const E=[];
const ev=(b,type,scene,x={})=>E.push({b,type,scene,...x});
const on=(b,scene,v,x={})=>ev(b,'flip',scene,{to:'on',v,D:.26,...x});
const off=(b,scene,v,x={})=>ev(b,'flip',scene,{to:'off',v,D:.26,...x});
const cut=(b,scene)=>ev(b,'cut',scene);

/* s00 opener */
ev(0,'press','s00');ev(0,'ink','s00',{len:.75});ev(1,'sub','s00');ev(1.5,'riser','s00',{len:.5});cut(2,'s00');
/* s01 pudding (soft jelly) */
ev(2,'drop','s01');ev(3.5,'touch','s01');ev(3.5,'slide','s01',{len:.5});
on(4,'s01',1,{soft:true,D:.7});ev(4.5,'cherry','s01');
ev(6.5,'touch','s01');ev(6.5,'slide','s01',{len:.5});off(7,'s01',0,{soft:true,D:.7});ev(7.5,'settle','s01');cut(8,'s01');
/* s02 slider */
ev(8,'impact','s02');ev(9.5,'touch','s02');
ev(10,'drag','s02',{len:4,from:0,to:1});ev(11.4,'wake','s02');
on(12,'s02',.5,{beatIn:'kick'});ev(14,'land','s02');[14,15,16].forEach(b=>ev(b,'pulse','s02'));
ev(16.5,'drag','s02',{len:1.5,from:1,to:.3});ev(18,'sit','s02');ev(20,'nod','s02');cut(22,'s02');
/* s03 stamp */
ev(22,'impact','s03');
[[24,.33],[25.5,.67],[28,1]].forEach(([b,v],i)=>{ev(b,'stamp','s03',{n:i+1,v});on(b,'s03',v,{n:i+1})});
ev(28.5,'lift','s03');ev(29,'rest','s03');cut(30,'s03');
/* s04 fan */
ev(30,'impact','s04');ev(31,'touch','s04');ev(31.25,'unfold','s04',{len:.75});
on(32,'s04',.5,{wow:1,filter:'narrow'});
[34,34.5,35].forEach((b,i)=>ev(b,'hover','s04',{i}));ev(35.5,'touch','s04');
on(36,'s04',1,{wow:2});ev(36.5,'fold','s04',{len:.5});cut(40,'s04');
/* s05 knob */
ev(40,'impact','s05');ev(41.5,'touch','s05');
ev(41.5,'drag','s05',{len:4,from:0,to:1.08,kind:'turn'});
for(let i=0;i<24;i++)ev(41.75+i*.25,'tick','s05',{i});
ev(45.5,'overshoot','s05');
ev(46,'drag','s05',{len:1.5,from:1.08,to:1,kind:'turn'});
ev(47.5,'hover','s05');ev(47.75,'gap','s05');
on(48,'s05',1,{lock:true,drop:1});cut(50,'s05');
/* s06 sand */
ev(50,'impact','s06');ev(50.5,'pour','s06',{len:5.5});ev(53,'pause','s06',{len:.5});
on(56,'s06',1,{close:true});cut(58,'s06');
/* s07 cards */
ev(58,'impact','s07');
[[59,3,.5],[60,5,1],[61.5,2,.25]].forEach(([b,card,v])=>{ev(b,'pull','s07',{card});ev(b,'flip','s07',{to:'on',v,D:.26,card})});
cut(64,'s07');
/* s08 lens */
ev(64,'impact','s08');ev(65,'touch','s08');ev(65,'drag','s08',{len:3,from:0,to:1});
on(68,'s08',.5,{chip:1});ev(68.3,'caption','s08',{n:1});ev(69.3,'tray','s08',{n:1});
ev(70,'touch','s08');ev(70,'drag','s08',{len:2,from:0,to:1});
on(72,'s08',1,{chip:2});ev(72.3,'caption','s08',{n:2});ev(73.3,'tray','s08',{n:2});cut(74,'s08');
/* s09 blind */
ev(74,'impact','s09');ev(76,'touch','s09');ev(76,'pull','s09',{len:3.5,kind:'drag'});
ev(79.75,'release','s09');on(80,'s09',1,{roll:true,soft:true,D:.7});ev(81.5,'flap','s09');cut(84,'s09');
/* s10 pinwheel */
ev(84,'impact','s10');ev(85,'gust','s10',{len:.5});ev(85,'spin','s10',{len:2,from:0,to:2});
ev(86,'release','s10',{len:5});ev(88,'hero','s10');
ev(92,'spindown','s10',{len:1});on(92,'s10',1,{loaded:true,soft:true,D:.7});ev(93,'stop','s10');cut(96,'s10');
/* s11 firefly */
ev(96,'impact','s11',{crash:true});ev(96.5,'touch','s11');on(97,'s11',1,{rate:5});
[97,97.5,98,98.5,100].forEach((b,i)=>ev(b,'fly','s11',{n:i+1,hero:i===4}));
ev(102,'perch','s11');cut(104,'s11');
/* s12 postbox */
ev(104,'impact','s12');ev(105,'drag','s12',{len:2,from:0,to:1});ev(107,'lid','s12');ev(107.5,'in','s12');
ev(108,'clank','s12');on(108,'s12',.5);ev(109,'receipt','s12');ev(110.5,'seal','s12');on(110.5,'s12',1,{seal:true});cut(112,'s12');
/* final */
['s02','s04','s08'].forEach((id,i)=>ev(112+i,'show','final',{id,i}));
ev(115,'riser','final',{len:1});ev(116,'final','final',{big:true});
ev(116,'title','final',{len:.6});ev(116.5,'subtitle','final');ev(119,'bell','final');ev(120,'end','final');
E.sort((a,b)=>a.b-b.b);
const cues=()=>({bpm:BPM,beatSec:SPB,duration:DUR,beats:BEATS,
 scenes:scenes.map(([id,s,l])=>({id,startBeat:s,beats:l,start:T(s),dur:T(l),k:1})),
 events:E.map(e=>({...e,t:+T(e.b).toFixed(4)}))});
function writeCues(dir){fs.mkdirSync(dir,{recursive:true});fs.writeFileSync(path.join(dir,'cues.json'),JSON.stringify(cues(),null,1))}
module.exports={BPM,SPB,BEATS,DUR,T,scenes,E,cues,writeCues};
