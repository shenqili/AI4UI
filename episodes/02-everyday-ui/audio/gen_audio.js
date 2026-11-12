/* 《一物一控》 60 s film — beat-locked ORIGINAL music + foley synthesiser (G major, 120 BPM, 120 beats = 60.000 s).
   Timeline = timeline.js (docs/方案.md section C). Music = section D1 (no MIDI, no external song). Foley = D2.
   Output: out/music.wav sfx.wav mix.wav mix.mp3 cues.json ledger.json                                         */
const fs=require('fs'),path=require('path'),{execFileSync,spawnSync}=require('child_process');
const TL=require('./timeline.js');
const SR=44100,SPB=TL.SPB,BARS=30,DUR=TL.DUR,N=Math.round(DUR*SR);
const OUT=path.join(__dirname,'out');fs.mkdirSync(OUT,{recursive:true});
const T=TL.T,E=TL.E;
let _s=1234567;const seed=v=>{_s=v|0};const rnd=()=>{_s|=0;_s=_s+0x6D2B79F5|0;let t=Math.imul(_s^_s>>>15,1|_s);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296};
const mtof=m=>440*Math.pow(2,(m-69)/12),TAU=Math.PI*2;
const clamp=(x,a,b)=>Math.min(b,Math.max(a,x)),sstep=u=>{u=clamp(u,0,1);return u*u*(3-2*u)};

/* ================= engine ================= */
const mk=()=>({L:new Float32Array(N),R:new Float32Array(N)});
const music=mk(),sfx=mk(),sendM=mk(),sendS=mk();
const kicks=[];
const sc=new Float32Array(N).fill(1);
let CUR=null;                                   // ledger: first sfx voice start per cue
function voice(bus,t0,dur,fn,{g=1,pan=0,snd=0,side=false}={}){
  if(bus===sfx&&CUR&&(CUR.first==null||t0<CUR.first))CUR.first=t0;
  const i0=Math.max(0,Math.floor(t0*SR)),n=Math.floor(dur*SR),l=Math.cos((pan+1)*Math.PI/4),r=Math.sin((pan+1)*Math.PI/4);
  for(let k=0;k<n;k++){const i=i0+k;if(i>=N)break;let v=fn(k/SR,k)*g;if(side)v*=sc[i];bus.L[i]+=v*l;bus.R[i]+=v*r;if(snd){const S=bus===sfx?sendS:sendM;S.L[i]+=v*snd*l;S.R[i]+=v*snd*r}}}
const lp=a=>{let y=0;return x=>(y+=a*(x-y))};
const svf=()=>{let lo=0,bp=0;return(x,fc,q=.5)=>{const f=2*Math.sin(Math.PI*Math.min(fc,SR*.45)/SR);lo+=f*bp;const hi=x-lo-q*bp;bp+=f*hi;return{lo,bp,hi}}};
const saw=ph=>2*(ph-Math.floor(ph+.5)),sq=ph=>ph%1<.5?1:-1;

/* ================= drums (music bus) ================= */
function kick(b,g=1){const t=T(b);kicks.push(t);let ph=0;voice(music,t,.5,tt=>{ph+=TAU*(46+120*Math.exp(-tt*30))/SR;return(Math.sin(ph)*Math.exp(-tt*7.5)+.25*Math.sin(ph*2)*Math.exp(-tt*40))},{g:.9*g})}
function ghostKick(b,g=1){const t=T(b);let ph=0;kicks.push(t);voice(music,t,.18,tt=>{ph+=TAU*(48+90*Math.exp(-tt*36))/SR;return Math.sin(ph)*Math.exp(-tt*16)},{g:.5*g})}
function clap(b,g=1){const t=T(b);[0,.011,.022].forEach((o,j)=>{const f=svf();voice(music,t+o,.2,tt=>f(rnd()*2-1,1700,.9).bp*Math.exp(-tt*(j<2?90:14))*1.6,{g:.5*g,snd:.25,pan:.05})})}
function hat(b,g=1,open=false){const t=T(b),f=svf();voice(music,t,open?.25:.07,tt=>f(rnd()*2-1,9000,.3).hi*Math.exp(-tt*(open?18:70)),{g:.22*g,pan:.25})}
function shaker(b,g=1){const t=T(b),f=svf();voice(music,t,.05,tt=>f(rnd()*2-1,7500,.3).hi*Math.exp(-tt*90),{g:.14*g,pan:-.3})}
function rim(b,g=1){const t=T(b);let ph=0;voice(music,t,.06,tt=>{ph+=TAU*1750/SR;return Math.sin(ph)*Math.exp(-tt*90)},{g:.16*g,pan:.3})}
function crash(b,g=1){const t=T(b),f=svf();voice(music,t,1.6,tt=>f(rnd()*2-1,6500+3000*Math.exp(-tt*6),.3).hi*Math.exp(-tt*2.6),{g:.28*g,snd:.5})}
function snareRoll(b0,b1,g=1,step=.25){const n=Math.round((b1-b0)/step);for(let i=0;i<n;i++){const b=b0+i*step,f=svf();voice(music,T(b),.12,tt=>f(rnd()*2-1,3500,.6).bp*Math.exp(-tt*35),{g:.35*g*(.45+.55*i/Math.max(1,n-1))})}}
/* ================= tonal (music bus) ================= */
function subBass(b,len,note,g=1){const t=T(b),f0=mtof(note);let ph=0;const l=lp(.1);voice(music,t,len*SPB+.05,tt=>{ph+=f0/SR;const e=Math.min(1,tt*120)*Math.min(1,Math.max(0,(len*SPB+.05-tt)*40));return(l(saw(ph))*.45+Math.sin(ph*TAU)*.85)*e},{g:.62*g,side:true})}
function bass(b,len,note,g=1){const t=T(b),f0=mtof(note);let ph=0;const l=lp(.12);voice(music,t,len*SPB,tt=>{ph+=f0/SR;const e=Math.min(1,tt*80)*Math.exp(-tt*3.2);return l(saw(ph)*.6+Math.sin(ph*TAU)*.8)*e},{g:.55*g,side:true})}
function lush(b,len,notes,g=1,tail=.5){const t=T(b),d=len*SPB;notes.forEach((m,j)=>{const f0=mtof(m);[-1,1].forEach((side,s)=>{const f=svf();let p1=rnd(),p2=rnd(),p3=rnd();
  voice(music,t,d+tail,tt=>{const lfo=.5+.5*Math.sin(tt*1.7+j+s*2);p1+=f0*(1+.0045*side)/SR;p2+=f0*(1-.003*side)/SR;p3+=f0*2*(1+.002*side)/SR;
    const e=Math.min(1,tt*2.2)*Math.min(1,Math.max(0,(d+tail-tt)*2.2));return f((saw(p1)+saw(p2)+.3*saw(p3))*.4,1100+1700*lfo,.25).lo*e},{g:.095*g,pan:side*.7*(j%2?-1:1),snd:.45,side:true})})})}
const VOW={a:[800,1200],o:[500,900],u:[320,800]};
function choir(b,len,note,g=1,vow='a'){const t=T(b),f0=mtof(note),[f1,f2]=VOW[vow],a=svf(),c=svf();let p1=rnd(),p2=rnd();
  voice(music,t,len*SPB+.6,tt=>{const v=1+.004*Math.sin(tt*5.1);p1+=f0*v/SR;p2+=f0*1.004*v/SR;const x=(saw(p1)+saw(p2))*.5+.05*(rnd()*2-1);
    const e=Math.min(1,tt/.55)*Math.min(1,Math.max(0,(len*SPB+.6-tt)/.5));return(a(x,f1,.1).bp+c(x,f2,.1).bp*.6)*e},{g:.17*g,pan:(rnd()-.5)*.8,snd:.8,side:true})}
function pluck(b,note,len,g=1,bright=false){const t=T(b),f0=mtof(note),f=svf();let ph=0;
  voice(music,t,Math.max(.3,len*SPB)+.25,tt=>{ph+=f0/SR;const env=Math.exp(-tt*(len>1?3.2:8));
    const cut=(bright?5200:2600)*(.25+Math.exp(-tt*16)*1.5);
    const tone=f(saw(ph)*.55+sq(ph)*.25,cut,.22).lo+Math.sin(TAU*f0*tt)*.5+Math.sin(TAU*f0*2*tt)*.18*Math.exp(-tt*10);
    return tone*env*Math.min(1,tt*500)},{g:.26*g,pan:Math.sin(note*1.7)*.4,snd:.4,side:true})}
function piano(b,notes,len,g=1){notes.forEach((m,j)=>{const t=T(b)+j*.012,f0=mtof(m);voice(music,t,len*SPB+.3,tt=>{let s=0;for(let h=1;h<=5;h++)s+=Math.sin(TAU*f0*h*(1+.0004*h*h)*tt)*Math.exp(-tt*(1.1+h*1.3))/h;return s*Math.min(1,tt*300)},{g:.2*g,pan:(j-1)*.3,snd:.5,side:true})})}
function stab2(b,notes,g=1,len=.22){const t=T(b);notes.forEach((m,j)=>{const f0=mtof(m+12),f=svf();let p1=rnd(),p2=rnd(),p3=rnd();voice(music,t,len+.1,tt=>{p1+=f0*.994/SR;p2+=f0/SR;p3+=f0*1.006/SR;const e=Math.min(1,tt*400)*Math.exp(-tt*(9/len*.22));return f((saw(p1)+saw(p2)+saw(p3))/3,5200*Math.exp(-tt*10)+900,.22).lo*e},{g:.15*g,pan:(j-1)*.6,snd:.4,side:true})})}
function twinkle(b,note,g=1){const t=T(b),f0=mtof(note);voice(music,t,.6,tt=>(Math.sin(TAU*f0*tt)+.5*Math.sin(TAU*f0*3.01*tt)*Math.exp(-tt*10)+.25*Math.sin(TAU*f0*5.4*tt)*Math.exp(-tt*18))*Math.exp(-tt*7.5)*Math.min(1,tt*800),{g:.14*g,pan:(rnd()-.5)*1.2,snd:.7})}
function swell(b0,b1,g=1){const f=svf(),d=(b1-b0)*SPB;voice(music,T(b0),d+.1,tt=>{const u=Math.min(1,tt/d);return f(rnd()*2-1,400+7000*u*u,.4).bp*u*u*2},{g:.2*g,snd:.5})}

/* ================= harmony + motifs (G major, D1) ================= */
const CH={ // r = bass root midi, pad = lush voicing
 Em9:  {r:40,pad:[52,55,59,62,66]},
 Cmaj9:{r:36,pad:[48,55,59,62,64]},
 Em7:  {r:40,pad:[52,55,59,62,67]},
 GB:   {r:35,pad:[47,55,62,67,71]},
 Dsus2:{r:38,pad:[50,57,64,69]},
 D:    {r:38,pad:[50,57,62,66,69]},
 Am7:  {r:33,pad:[45,52,55,60,64]},
 D7s4: {r:38,pad:[50,55,57,60,67]},
 Gadd9:{r:31,pad:[43,55,59,62,69]},
 DF:   {r:30,pad:[42,57,62,66,69]},
 Bm7:  {r:35,pad:[47,57,62,66,69]}};
for(const k in CH)CH[k].choir=CH[k].pad.slice(1,4).map(n=>n+12);
const BARCH=[ // bars 1..30 -> [[startOffset,len,chord],...]
 'Em9','Cmaj9','Em7','Cmaj9','GB',[['Dsus2',0,2],['D',2,2]],'Am7','D7s4',
 'Cmaj9','Cmaj9','D7s4','D7s4',
 'Gadd9','DF','Em7','Cmaj9','Gadd9','Bm7','Cmaj9',
 'D7s4','Em9',
 'Cmaj9','Am7','D7s4',
 'Gadd9','DF','Em7','Cmaj9','D7s4','Gadd9'].map(x=>typeof x==='string'?[[0,4,x]]:x.map(([k,a,l])=>[a,l,k]));
const secOf=m=>m<=2?'intro':m<=8?'build':m<=12?'brk':m<=19?'drop1':m<=21?'ebb':m<=24?'bd':m<=29?'drop2':'end';
const PADG={intro:.95,build:.6,brk:.95,drop1:2.5,ebb:.6,bd:.6,drop2:2.1,end:1.7};
/* motif identity = B4 D5 E5 (71 74 76). [beat offset, midi, length]; gaps are real rests */
const MA=[[0,71,.5],[.5,74,.5],[1,76,1.5],[4.5,76,.5],[5,74,.5],[5.5,71,1.5]];                           // A, 2 bars
const MB=[[0,71,.25],[.25,74,.25],[.5,76,1],[2.5,71,.5],[3,74,.5],[4,76,2],[7,74,.5],[7.5,71,.5]];         // B (Drop), 2 bars
const MB2=[[.5,71,.25],[.75,74,.25],[1,76,1],[3,71,.25],[3.25,74,.25],[4.5,76,1.25],[6.5,74,.5],[7,71,1]]; // B, shifted rhythm
const MC=[[0,76,2],[2.5,71,1]];                                                                          // sparse 1-bar tail
function motif(M,b0,fn,{lo=-1e9,hi=1e9}={}){for(const [o,n,l] of M){const b=b0+o;if(b>=lo-1e-9&&b<hi-1e-9)fn(b,n,l)}}
function arrange(){
  seed(1234567);
  for(let bar=0;bar<BARS;bar++){
    const m=bar+1,b0=bar*4,S=secOf(m),segs=BARCH[bar];
    const endb=m===12?47.75:1e9;
    segs.forEach(([a,l,k])=>{const c=CH[k],len=m===12?3.75:l;
      lush(b0+a,len,c.pad.map(n=>n+(S==='ebb'?12:0)),PADG[S]*(m===1?.8:1),m===12?0:.5);
      if(S==='drop1'||S==='drop2')lush(b0+a,len,c.pad.slice(2).map(n=>n+12),PADG[S]*.9);
      if(S==='drop2'||m===30)c.choir.forEach((n,j)=>choir(b0+a,m===30?3.6:l,n,m===30?1.3:.85,j===1?'o':'a'))});
    if(S==='intro'||m===3||S==='brk'||S==='ebb'||S==='bd'){segs.forEach(([a,l,k])=>{const p=CH[k].pad.filter(n=>n<=67);const seq=[0,2,1,3,2,4,3,1].map(i=>p[i%p.length]);
      for(let i=0;i<l*2;i++){const bb=b0+a+i*.5;if(bb>=endb-.25)break;if(S==='bd'&&m!==22)continue;piano(bb,[seq[i%8]+(S==='ebb'?12:0)],.9,S==='intro'?1.3:m===3?1:S==='brk'?.9:S==='bd'?.7:.8)}})}
    const drums=(m>=4&&m<=8)||S==='drop1'||S==='drop2';
    if(drums){segs.forEach(([a,l,k])=>{const r=CH[k].r;[[0,.75,r],[1.5,.25,r+12],[2.5,.5,r+7],[3.25,.25,r]].forEach(([o,ln,n])=>{if(o>=a&&o<a+l)bass(b0+o,ln,n,S==='drop1'?1.25:S==='drop2'?1.5:.55)})})}
    else if(m===3||S==='brk')subBass(b0,m===12?3.7:3.9,CH[segs[0][2]].r,.55);
    else if(S==='ebb')subBass(b0,3.9,CH[segs[0][2]].r+12,.3);
    if(m===22)subBass(b0,7.9,CH.Cmaj9.r+12,.28);
    if(m===24)subBass(b0,3.9,CH.D7s4.r+12,.25);
    const G=(o,fn)=>fn(b0+o);
    if(m>=4&&m<=8){G(0,b=>kick(b,.75));G(2,b=>kick(b,.7));[.5,1.5,2.5,3.5].forEach(o=>G(o,b=>hat(b,.7)));if(m<=6){G(1,b=>clap(b,.9));G(3,b=>clap(b,.9))}}
    if(S==='drop1'||S==='drop2'){
      const stampRoom=m===13||m===14,cards=m===15||m===16;
      G(0,b=>kick(b,S==='drop1'?1.6:1.9));G(2,b=>kick(b,S==='drop1'?1.6:1.9));G(1.75,b=>ghostKick(b,.9));
      if(S==='drop2'||!stampRoom)[.5,1.5,2.5,3.5].forEach(o=>G(o,b=>hat(b,.9)));       // bars 13-14: sand hiss IS the hat
      G(1,b=>clap(b,1.25));G(3,b=>clap(b,1.25));
      for(let i=0;i<16;i++){const b=b0+i*.25;if(cards&&b>=58)continue;shaker(b,(i%4===3?.95:i%2?.55:.3)*(stampRoom?.5:1))}
      G(2.75,b=>rim(b,.6));if(m%2===0)G(3.5,b=>rim(b,1));
      if(S==='drop2')G(3.5,b=>hat(b,.9,true));
    }
    if(S==='ebb'){G(0,b=>kick(b,.45));G(2,b=>kick(b,.35))}
    if(m===4)motif(MA,b0,(b,n,l)=>pluck(b,n,l,1,false));
    if(m===7)motif(MA,b0,(b,n,l)=>pluck(b,n,l,1.05,false));
    if(m===9)motif(MA,b0,(b,n,l)=>piano(b,[n],l,1.5));
    if(m===13)motif(MB,b0,(b,n,l)=>pluck(b,n,l,1.35,true));
    if(m===15)motif(MB,b0,(b,n,l)=>pluck(b,n,l,1.35,true),{hi:58});                      // lead silent 58..64
    if(m===17)motif(MB2,b0,(b,n,l)=>pluck(b,n,l,1.35,true));
    if(m===19)motif(MC,b0,(b,n,l)=>pluck(b,n,l,1,true));
    if(m===20)motif(MA,b0,(b,n,l)=>pluck(b,n,l,.8,false));
    if(m===22)motif(MA,b0,(b,n,l)=>{if(b<b0+4)piano(b,[n],l,1.3)});
    if(m===25)motif(MB,b0,(b,n,l)=>pluck(b,n,l,1.15,true));
    if(m===27)motif(MB2,b0,(b,n,l)=>pluck(b,n,l,1.15,true));
    if(m===29)motif(MC,b0,(b,n,l)=>pluck(b,n,l,1.1,true));
    if(S==='drop1'&&(m===13||m===14||m===17||m===19))segs.forEach(([a,l,k])=>[2.5].filter(o=>o>=a&&o<a+l).forEach(o=>stab2(b0+o,CH[k].pad.slice(1,4),.8)));
    if(S==='drop2')segs.forEach(([a,l,k])=>[1.5,3.5].filter(o=>o>=a&&o<a+l).forEach(o=>stab2(b0+o,CH[k].pad.slice(1,4),.9)));
    if(m===18)stab2(b0,CH.Bm7.pad.slice(1,4),1.3,.3);                                    // 68: colour-chip stab (no bell)
    if(m===12)snareRoll(b0+3,b0+3.75,1,.125);                                          // 47 -> 47.75
    if(m===17)crash(b0,1.1);                                                           // 64
    if(m===25)crash(b0,1.2);                                                           // 96
    if(m===24)swell(b0+2,b0+4,.9);                                                     // 94 -> 96
    if(m===29)snareRoll(b0+3,b0+4,1.1,.125);                                           // 115 -> 116
  }
  twinkle(105.5,83,1);twinkle(111,88,1);                                                 // Drop 2: <=2 twinkles
  subBass(116,3.5,31,1.5);kick(116,1.3);crash(116,1.4);
  pluck(116,71,1.5,1.2,true);pluck(117,74,1,1.1,true);pluck(118,76,1.5,1.2,true);
}
arrange();
for(const tk of kicks){const i0=Math.floor(tk*SR);for(let k=0;k<.35*SR&&i0+k<N;k++){const d=k/SR,v=1-.82*Math.exp(-d/.11);if(v<sc[i0+k])sc[i0+k]=v}}
music.L.fill(0);music.R.fill(0);sendM.L.fill(0);sendM.R.fill(0);kicks.length=0;
arrange();

/* ================= foley (sfx bus, D2) ================= */
seed(777001);
function thumpInk(t,g=1){let ph=0;voice(sfx,t,.55,tt=>{ph+=TAU*(42+28*Math.exp(-tt*25))/SR;return(Math.sin(ph)+.35*Math.sin(ph*2)*Math.exp(-tt*18))*Math.exp(-tt*8)*Math.min(1,tt*1500)},{g:.9*g});
  const f=svf();voice(sfx,t,.03,tt=>f(rnd()*2-1,1800,.7).bp*Math.exp(-tt*110)*2,{g:.5*g,snd:.15})}
function subHit(t,f0=49,g=1,len=.7){let ph=0;voice(sfx,t,len,tt=>{ph+=TAU*f0/SR;return Math.sin(ph)*Math.exp(-tt*5)*Math.min(1,tt*400)},{g:.5*g})}
function whoosh(tEnd,len,g=1){const f=svf();voice(sfx,tEnd-len,len+.25,tt=>{const u=Math.min(1,tt/len),e=u<1?Math.pow(u,2.2):Math.exp(-(tt-len)*18);return f(rnd()*2-1,300+9000*u*u,.35).bp*e*2.3},{g:.5*g,snd:.5})}
function impact(t,big,g=1){let ph=0;voice(sfx,t,1.4,tt=>{ph+=TAU*(49+70*Math.exp(-tt*9))/SR;return Math.sin(ph)*Math.exp(-tt*(big?2.4:4.2))*Math.min(1,tt*800)},{g:(big?1.1:.55)*g});
  const f=svf();voice(sfx,t,big?1.2:.5,tt=>f(rnd()*2-1,big?7000*Math.exp(-tt*3)+400:3500*Math.exp(-tt*8)+300,.4).lo*Math.exp(-tt*(big?3:9)),{g:(big?.5:.3)*g,snd:.5})}
function boing(t,fa,fb,g=1){let ph=0;voice(sfx,t,.55,tt=>{const u=Math.min(1,tt/.12),fr=fa*Math.pow(fb/fa,u)*(1+.08*Math.sin(TAU*6*tt)*Math.exp(-tt*7));ph+=TAU*fr/SR;return(Math.sin(ph)+.3*Math.sin(2*ph)*Math.exp(-tt*10))*Math.exp(-tt*6.5)*Math.min(1,tt*800)},{g:.55*g,snd:.25})}
function cherryPlop(t){let ph=0;voice(sfx,t,.05,tt=>{ph+=TAU*mtof(74)/SR;return Math.sin(ph)*Math.exp(-tt*70)*Math.min(1,tt*2000)},{g:.35});const l=lp(.12);voice(sfx,t,.12,tt=>l(rnd()*2-1)*Math.exp(-tt*50)*3,{g:.35})}
function slide(t,len,g=.18){const f=svf();voice(sfx,t,len+.1,tt=>f(rnd()*2-1,1500+3000*Math.min(1,tt/len),.8).bp*Math.min(1,tt*40)*Math.exp(-Math.max(0,tt-len)*30),{g})}
function rollBead(t,len,from,to,g=1){const f=svf(),l=lp(.2);voice(sfx,t,len+.1,tt=>{const u=clamp(tt/len,0,1),sp=Math.abs(to-from)*6*u*(1-u)+.02;return f(l(rnd()*2-1)*3,300+300*clamp(sp,0,1.3),.5).bp*(0.2+sp)*(1+.3*Math.sin(tt*57))*Math.min(1,tt*60)*Math.exp(-Math.max(0,tt-len)*30)},{g:.55*g,pan:to>from?.25:-.15})}
function blipE5(t,g=1){const f=svf();let ph=0;voice(sfx,t,.12,tt=>{ph+=659.26/SR;return f(sq(ph),3200,.3).lo*Math.exp(-tt*28)*Math.min(1,tt*1500)},{g:.22*g,snd:.25,pan:.2})}
function tomS(t,fr,g=1){let ph=0;voice(sfx,t,.35,tt=>{ph+=TAU*(fr*(1+.7*Math.exp(-tt*22)))/SR;return Math.sin(ph)*Math.exp(-tt*11)*Math.min(1,tt*1500)},{g:.5*g})}
function swish(t,len,g=1){const f=svf();voice(sfx,t,len+.12,tt=>{const u=clamp(tt/len,0,1),fc=800*Math.pow(5,u);const e=tt<len?Math.pow(Math.sin(u*Math.PI/2),2)*Math.min(1,tt*60):Math.exp(-(tt-len)*40);return f(rnd()*2-1,fc,.45).bp*e*2},{g:.5*g,snd:.35,pan:-.1})}
function tickN(t,f0=1000,g=1){let ph=0;voice(sfx,t,.06,tt=>{ph+=TAU*f0/SR;return Math.sin(ph)*Math.exp(-tt*120)*Math.min(1,tt*3000)},{g:.22*g,pan:.4})}
function snapShut(t,g=1){let ph=0;voice(sfx,t,.12,tt=>{ph+=TAU*520/SR;return Math.sin(ph)*Math.exp(-tt*38)*Math.min(1,tt*3000)},{g:.5*g,snd:.15});const f=svf();voice(sfx,t,.012,tt=>f(rnd()*2-1,5200,.5).hi*Math.exp(-tt*300),{g:.6*g})}
function ratchetTick(t,i,prog){let ph=0;const f0=1500+prog*1700,acc=i%2===0?1:.55;const f=svf();voice(sfx,t,.05,tt=>{ph+=f0/SR;return(sq(ph)*.4+f(rnd()*2-1,6000,.4).hi*.8)*Math.exp(-tt*100)*Math.min(1,tt*3000)},{g:.3*acc,pan:.3})}
function flicker(t,i){const f=svf();voice(sfx,t,.18,tt=>(f(rnd()*2-1,3000+i*700,.6).bp*2+Math.sin(TAU*100*tt)*.5)*Math.exp(-tt*18)*(sq(tt*60)*.5+.5)*Math.min(1,tt*2000),{g:.5,snd:.2})}
function lockThump(t){let ph=0;voice(sfx,t,.7,tt=>{ph+=TAU*(38+70*Math.exp(-tt*14))/SR;return Math.sin(ph)*Math.exp(-tt*6)*Math.min(1,tt*1500)},{g:.9});const f=svf();voice(sfx,t,.02,tt=>f(rnd()*2-1,2500,.5).bp*Math.exp(-tt*200),{g:.4})}
function sandHiss(t0,len){ // three streams; AM on off-beat 8ths so the hiss is the hat (bars 13-14)
  const t1=t0+len*SPB;[[0,3000,-.5],[.5,3600,0],[1,4300,.5]].forEach(([dl,fc,pan],s)=>{const f=svf();const ts=t0+dl*SPB*.5;
    voice(sfx,ts,t1-ts+.2,tt=>{const b=(ts+tt)/SPB;let gate=1;const pa=53,pb=53.5;
      if(b>=pa-.05&&b<pa)gate=1-(b-(pa-.05))/.05;else if(b>=pa&&b<pb)gate=0;else if(b>=pb&&b<pb+.05)gate=(b-pb)/.05;
      const x=(b-.5)-Math.floor(b-.5),am=.5+.5*Math.exp(-x*7),end=b>56?Math.exp(-(b-56)*20):1,start=Math.min(1,tt*20);
      return f(rnd()*2-1,fc,.35).hi*(.8+.2*Math.sin(tt*9+s))*gate*end*start*am},{g:.55,pan})})}
function ping(t,fr,g=1,dec=55){voice(sfx,t,.4,tt=>(Math.sin(TAU*fr*tt)+.45*Math.sin(TAU*fr*2.76*tt)*Math.exp(-tt*dec*.4))*Math.exp(-tt*dec)*Math.min(1,tt*3000),{g:.3*g,snd:.25,pan:.2})}
function cloth(t,len,g=.3){const f=svf();voice(sfx,t,len+.3,tt=>{const u=Math.min(1,tt/len);return f(rnd()*2-1,500+1500*Math.sin(u*Math.PI),.5).bp*Math.min(1,tt*30)*Math.exp(-Math.max(0,tt-len)*14)*(.6+.4*Math.sin(tt*70))},{g,pan:-.2,snd:.3})}
function woodRim(t,g=1){let ph=0;const f=svf();voice(sfx,t,.05,tt=>{ph+=TAU*1350/SR;return(Math.sin(ph)*.6+f(rnd()*2-1,2400,.5).bp*.8)*Math.exp(-tt*90)*Math.min(1,tt*3000)},{g:.3*g,pan:.3})}
function lpFall(t,g=1){const l=lp(.1);voice(sfx,t,.1,tt=>l(rnd()*2-1)*Math.exp(-tt*30)*3,{g:.3*g})}
function paperPull(t,hero){cloth(t,.15*SPB,hero?.5:.38);woodRim(t,hero?1.3:.9);lpFall(t+.09,hero?1:.7)}
function enamelClick(t){let ph=0;const f=svf();voice(sfx,t,.06,tt=>{ph+=TAU*1500/SR;return(Math.sin(ph)*.5+f(rnd()*2-1,4200,.5).bp)*Math.exp(-tt*85)*Math.min(1,tt*3000)},{g:.3,pan:.3})}
function rollUp(t){const f=svf();voice(sfx,t,.55,tt=>{const u=clamp(tt/.4,0,1),fc=600*Math.pow(2500/600,u),e=(tt<.4?Math.sin(Math.min(1,u*1.1+.05)*Math.PI/2)*.9+.1:Math.exp(-(tt-.4)*20))*Math.min(1,tt*400);return f(rnd()*2-1,fc,.4).bp*e*2},{g:.5,snd:.35});
  let ph=0;voice(sfx,t,.35,tt=>{ph+=TAU*(55+60*Math.min(1,tt*6))/SR;return Math.sin(ph)*Math.exp(-tt*8)*Math.min(1,tt*400)},{g:.35})}
function flutter(){ // paper clack tied to blade-pass rate = 4*omega, omega <= 2 r/s  =>  <= 8 Hz
  const om=b=>{if(b<85)return 0;if(b<87)return 2*sstep((b-85)/2);if(b<92)return 2;if(b<93)return 2*(1-sstep(b-92));return 0};
  let phi=0,next=1;const dt=.0005;const pulses=[];for(let t=T(85);t<T(93.2);t+=dt){const b=t/SPB;phi+=4*om(b)*dt;if(phi>=next){pulses.push(t);next++}}
  pulses.forEach((t,i)=>{const b=t/SPB,left=b<86?1:b>91?0:1-(b-86)/5,hero=Math.exp(-Math.pow((b-88)/1.2,2)),f=svf();const amp=(.3+.7*left)*(1+.5*hero)*(.8+.4*rnd());
    voice(sfx,t,.04,tt=>f(rnd()*2-1,2200+300*(i%3),.5).bp*Math.exp(-tt*110)*Math.min(1,tt*3000)*2,{g:.28*amp,pan:Math.sin(i*1.7)*.4})});
  return pulses.length}
function bell(t,note,g=1,dec=3.2){const f0=mtof(note);voice(sfx,t,1.8,tt=>(Math.sin(TAU*f0*tt)+.4*Math.sin(TAU*f0*2.76*tt)*Math.exp(-tt*6))*Math.exp(-tt*dec)*Math.min(1,tt*2000),{g:.2*g,snd:.7,pan:rnd()*1.4-.7})}
function fmLid(t){let ph=0;voice(sfx,t,.3,tt=>{const idx=4*Math.max(0,1-tt/.15);ph+=TAU*310/SR;return Math.sin(ph+idx*Math.sin(TAU*310*1.7*tt))*Math.exp(-tt*22)*Math.min(1,tt*3000)},{g:.45,snd:.2,pan:.2})}
function fmClank(t){let ph=0;voice(sfx,t,.6,tt=>{const idx=6*Math.max(0,1-tt/.15);ph+=TAU*180/SR;return Math.sin(ph+idx*Math.sin(TAU*180*2.41*tt))*Math.exp(-tt*10)*Math.min(1,tt*3000)},{g:.6,snd:.3});
  let p2=0;voice(sfx,t,.5,tt=>{p2+=TAU*(70*Math.exp(-tt*5)+38)/SR;return Math.sin(p2)*Math.exp(-tt*8)*Math.min(1,tt*1500)},{g:.7})}
function tchk(t){let ph=0;voice(sfx,t,.015,tt=>{ph+=900/SR;return sq(ph)*Math.exp(-tt*40)*Math.min(1,tt*5000)},{g:.3});const f=svf();voice(sfx,t,.03,tt=>f(rnd()*2-1,3000,.6).bp*Math.exp(-tt*120)*2,{g:.4})}
function coneThump(t,g=1){let ph=0;voice(sfx,t,.4,tt=>{ph+=TAU*(46+120*Math.exp(-tt*30))/SR;return Math.sin(ph)*Math.exp(-tt*7.5)*Math.min(1,tt*3000)},{g:.8*g})}

const LED=[];
for(const e of E){const t=T(e.b);CUR={type:e.type,scene:e.scene,b:e.b,t,first:null};LED.push(CUR);
  switch(e.type){
  case'press':thumpInk(t,1);break;
  case'sub':subHit(t,49,1,.8);break;
  case'riser':if(e.scene==='s00')whoosh(T(e.b+e.len),e.len*SPB,.7);break;
  case'drop':thumpInk(t,.45);break;
  case'slide':slide(t,e.len*SPB,.14);break;
  case'flip':if(e.scene==='s01'){if(e.to==='on')boing(t,392,196);else boing(t,329.63,164.81)}
    else if(e.scene==='s05'&&e.lock)lockThump(t);
    else if(e.scene==='s06'){tickN(t,640,1.2);ping(t,3100,.9,60)}
    else if(e.scene==='s08')ping(t,2200,1,70);
    else if(e.scene==='s09')rollUp(t);
    break;
  case'cherry':cherryPlop(t);break;
  case'impact':impact(t,false,e.scene==='s11'?.7:e.scene==='s02'?.8:1);break;
  case'drag':if(e.scene==='s02')rollBead(t,e.len*SPB,e.from,e.to);else if(e.scene==='s08')slide(t,e.len*SPB,.07);else if(e.scene==='s12')slide(t,e.len*SPB,.12);break;
  case'pulse':blipE5(t);break;
  case'stamp':thumpInk(t,1.2);if(e.n===3)tomS(t,123.47,1);break;
  case'lift':cloth(t,.15,.22);break;
  case'unfold':swish(t,e.len*SPB);break;
  case'hover':if(e.scene==='s04')tickN(t,[1000,1260,1500][e.i],1);break;
  case'fold':snapShut(t);break;
  case'tick':ratchetTick(t,e.i,e.i/23);break;
  case'overshoot':flicker(t,1);break;
  case'pour':sandHiss(t,e.len);break;
  case'pull':if(e.scene==='s07')paperPull(t,e.card===5);else if(e.scene==='s09')cloth(t,e.len*SPB,.38);break;
  case'tray':enamelClick(t);break;
  case'release':if(e.scene==='s09')tickN(t,700,.8);break;
  case'flap':cloth(t,.1,.25);break;
  case'gust':whoosh(t+e.len*SPB,e.len*SPB,.8);break;
  case'spin':CUR.pulses=flutter();break;
  case'stop':tickN(t,640,1);break;
  case'fly':bell(t,[79,83,86,88,91][e.n-1],e.n===5?1.25:1);break;
  case'lid':fmLid(t);break;
  case'in':cloth(t,.0625,.28);break;
  case'clank':fmClank(t);break;
  case'receipt':tchk(t);break;
  case'seal':thumpInk(t,.45);break;
  case'show':if(e.i===0){coneThump(t,.5);blipE5(t,.5)}else if(e.i===1)snapShut(t,.5);else ping(t,2200,.5,70);break;
  case'final':impact(t,true,1.2);break;
  case'bell':bell(t,91,1.2,7);break;
  }}
CUR={type:'loaded',scene:'s10',b:92,t:T(92),first:null};LED.push(CUR);tickN(T(92),1000,1);CUR=null;   // D1: 92 one tickN

/* ================= reverb + radio double render + master ================= */
function reverb(inL,inR){const dl=[1557,1617,1491,1422,1277,1356],al=[225,556],outL=new Float32Array(N),outR=new Float32Array(N);
  [[inL,outL,0],[inR,outR,23]].forEach(([inp,out,off])=>{
    const combs=dl.map(d=>({buf:new Float32Array(d+off),i:0,y:0}));const aps=al.map(d=>({buf:new Float32Array(d+off),i:0}));
    for(let n=0;n<N;n++){let s=0;for(const c of combs){const v=c.buf[c.i];c.y=v*.5+c.y*.5;c.buf[c.i]=inp[n]*.3+c.y*.84;c.i=(c.i+1)%c.buf.length;s+=v}
      for(const a of aps){const v=a.buf[a.i],x=s;s=-x+v;a.buf[a.i]=x+v*.5;a.i=(a.i+1)%a.buf.length}out[n]=s*.22}});return[outL,outR]}
const [rmL,rmR]=reverb(sendM.L,sendM.R),[rsL,rsR]=reverb(sendS.L,sendS.R);
function bqRun(x,type,f0,Q=.7071){const w=TAU*f0/SR,c=Math.cos(w),s=Math.sin(w),a=s/(2*Q);let b0,b1,b2;
  if(type==='lp'){b0=(1-c)/2;b1=1-c;b2=b0}else{b0=(1+c)/2;b1=-(1+c);b2=b0}
  const a0=1+a,a1=-2*c/a0,a2=(1-a)/a0;b0/=a0;b1/=a0;b2/=a0;const y=new Float32Array(x.length);let x1=0,x2=0,y1=0,y2=0;
  for(let i=0;i<x.length;i++){const v=b0*x[i]+b1*x1+b2*x2-a1*y1-a2*y2;x2=x1;x1=x[i];y2=y1;y1=v;y[i]=v}return y}
/* dry-proximity curve x(beat): 0 = pure radio, 1 = pure dry. Points = knob cue list: 41.5->45.5 up to .8, 45.5 overshoot -> .2, 46->47.5 up to .9 */
const PROX=[[32,0],[41.5,0],[45.5,.8],[45.75,.2],[46,.2],[47.5,.9],[47.75,.9]];
function xAt(b){if(b<32||b>=47.75)return 1;for(let i=1;i<PROX.length;i++){const [b1,v1]=PROX[i],[b0,v0]=PROX[i-1];if(b<=b1){if(b1-b0<=.25&&v1<v0)return v0+(v1-v0)*sstep((b-b0)/(b1-b0));return v0+(v1-v0)*sstep((b-b0)/(b1-b0))}}return 1}
const i32=Math.floor(T(32)*SR),iGap=Math.floor(T(47.75)*SR);
/* render 2 (narrow): mono, small-room reverb only, 350-2800 Hz 4th-order band, soft saturation + noise bed at -22 dB */
const nm=new Float32Array(N);for(let i=0;i<N;i++)nm[i]=.5*(music.L[i]+music.R[i]+.25*(rmL[i]+rmR[i]));
const nb=bqRun(bqRun(bqRun(bqRun(nm,'hp',350),'hp',350),'lp',2800),'lp',2800);
let pw=0;const cnt=iGap-i32;for(let i=i32;i<iGap;i++)pw+=nb[i]*nb[i];const nrms=Math.sqrt(pw/cnt);
const kS=nrms*3;for(let i=0;i<N;i++)nb[i]=Math.tanh(nb[i]/kS)*kS;
seed(4242);const wn=new Float32Array(N);for(let i=0;i<N;i++){wn[i]=rnd()*2-1;if(rnd()<.00018)wn[i]+=(rnd()*2-1)*6}
const nz=bqRun(bqRun(bqRun(wn,'hp',300),'lp',4200),'lp',4200);
let zp=0;for(let i=i32;i<iGap;i++)zp+=nz[i]*nz[i];const NZ=nrms*Math.pow(10,-22/20)/Math.sqrt(zp/cnt);
const musL=new Float32Array(N),musR=new Float32Array(N);
for(let i=0;i<N;i++){const b=i/SR/SPB;let dl=music.L[i]+.55*rmL[i],dr=music.R[i]+.55*rmR[i];
  if(b>=32&&b<48){
    if(b<47.75){const x=xAt(b),wd=Math.sqrt(x),wnw=Math.sqrt(1-x);
      const ramp=clamp((b-32)/.02,0,1),burst=(b>=45.5&&b<45.68)?2:b>=45.68?1+Math.exp(-(b-45.68)*30):1,tailG=clamp((47.75-b)/.05,0,1);
      const nr=nb[i]*wnw+nz[i]*NZ*(1-x)*burst*ramp*tailG;
      dl=dl*wd+nr;dr=dr*wd+nr}
    else{dl*=.07;dr*=.07}                                    // quarter-beat gap: drums + noise out
  }
  musL[i]=dl;musR[i]=dr}
/* hero ducking: -3 dB / 120 ms on music (not at 48 / 116: the drop and the final hit must land) */
const HERO=[4,12,28,32,56,60,68,72,80,88,100,108];
const duck=new Float32Array(N).fill(1);
for(const hb of HERO){const i0=Math.floor(T(hb)*SR);for(let k=0;k<Math.floor(.2*SR)&&i0+k<N;k++){const d=k/SR;const v=d<.003?1-.292*(d/.003):d<.063?.708:.708+.292*sstep((d-.063)/.06);if(v<duck[i0+k])duck[i0+k]=v}}
const fadeAt=(i,a,z)=>{const t=i/SR;return t<a?1:t>=z?0:.5+.5*Math.cos(Math.PI*(t-a)/(z-a))};
for(let i=0;i<N;i++){const g=duck[i]*fadeAt(i,T(118.5),T(119.6));musL[i]*=g;musR[i]*=g}
const sfL=new Float32Array(N),sfR=new Float32Array(N);
for(let i=0;i<N;i++){const g=fadeAt(i,59.6,59.95);sfL[i]=(sfx.L[i]+.7*rsL[i])*g;sfR[i]=(sfx.R[i]+.7*rsR[i])*g}
function wav16(L,R,name,k){const buf=Buffer.alloc(44+N*4);buf.write('RIFF',0);buf.writeUInt32LE(36+N*4,4);buf.write('WAVEfmt ',8);buf.writeUInt32LE(16,16);buf.writeUInt16LE(1,20);buf.writeUInt16LE(2,22);buf.writeUInt32LE(SR,24);buf.writeUInt32LE(SR*4,28);buf.writeUInt16LE(4,32);buf.writeUInt16LE(16,34);buf.write('data',36);buf.writeUInt32LE(N*4,40);
  for(let i=0;i<N;i++){buf.writeInt16LE(Math.round(clamp(L[i]*k,-1,1)*32767),44+i*4);buf.writeInt16LE(Math.round(clamp(R[i]*k,-1,1)*32767),46+i*4)}fs.writeFileSync(path.join(OUT,name),buf)}
const pk=(L,R)=>{let m=0;for(let i=0;i<N;i++)m=Math.max(m,Math.abs(L[i]),Math.abs(R[i]));return m};
const MG=+process.env.MG||.62,SG=+process.env.SG||1;
const mixL=new Float32Array(N),mixR=new Float32Array(N);
for(let i=0;i<N;i++){mixL[i]=musL[i]*MG+sfL[i]*SG;mixR[i]=musR[i]*MG+sfR[i]*SG}
wav16(musL,musR,'music.wav',.89/pk(musL,musR));wav16(sfL,sfR,'sfx.wav',.89/pk(sfL,sfR));
const KM=.5/pk(mixL,mixR);wav16(mixL,mixR,'mix_raw.wav',KM);
const raw=path.join(OUT,'mix_raw.wav'),TARGET='I=-14:TP=-1.5:LRA=7';
const r1=spawnSync('ffmpeg',['-hide_banner','-nostats','-i',raw,'-af','loudnorm='+TARGET+':print_format=json','-f','null','-'],{encoding:'utf8'});
const J=JSON.parse(r1.stderr.slice(r1.stderr.indexOf("{"),r1.stderr.lastIndexOf("}")+1));
const af=`loudnorm=${TARGET}:measured_I=${J.input_i}:measured_TP=${J.input_tp}:measured_LRA=${J.input_lra}:measured_thresh=${J.input_thresh}:offset=${J.target_offset}:linear=true,alimiter=limit=0.77:level=disabled:attack=3:release=40,apad=whole_dur=60,atrim=0:60`;
execFileSync('ffmpeg',['-y','-v','error','-i',raw,'-af',af,'-ar','44100','-c:a','pcm_s16le',path.join(OUT,'mix.wav')]);
execFileSync('ffmpeg',['-y','-v','error','-i',path.join(OUT,'mix.wav'),'-b:a','256k',path.join(OUT,'mix.mp3')]);
fs.unlinkSync(raw);
TL.writeCues(OUT);
fs.writeFileSync(path.join(OUT,'ledger.json'),JSON.stringify(LED.map(l=>({type:l.type,scene:l.scene,b:l.b,t:l.t,first:l.first,errMs:l.first==null?null:+((l.first-l.t)*1000).toFixed(3),pulses:l.pulses})),null,1));
console.log('done',DUR+'s',E.length+' events','loudnorm in',J.input_i,J.input_tp);
