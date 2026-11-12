/* s10 Spinner -> pinwheel + paper petals (breathing scene). Paper-fold look, white world.
   Everything is a pure function of c.t / c.ev / c.p. Petal trajectories pre-seeded. */
(function(){
const BG='#FAFAF8', LINE='#9AA3B2', R=330, CX=960, CY=470;
const COLS=['#F26B5B','#F5B536','#2F5BD6','#3FBF9F'];
const TAU=Math.PI*2, D2R=Math.PI/180;
const A0=-14*D2R;                                   // rest/start blade orientation
let cv,g,seed={};

/* sail geometry (local, blade pointing right; rotated by k*90deg) */
const PA={x:.707*R,y:-.707*R}, PM={x:.707*R,y:.26*R}, PF={x:.46*R,y:.44*R};
const PET_ST=[[.50,.40],[.76,.14],[.30,.58]];        // bary (s on A, t on M) of 3 petals per sail
const dist=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
const P_OA=dist({x:0,y:0},PA), P_AM=dist(PA,PM), P_MO=dist(PM,{x:0,y:0});
const SAIL_L=P_OA+P_AM+P_MO;
const FLAP_L=dist({x:0,y:0},PM)+dist(PM,PF)+dist(PF,{x:0,y:0});

function shade(hex,k){const n=parseInt(hex.slice(1),16);let r=n>>16,gg=n>>8&255,b=n&255;
  return 'rgb('+Math.round(r*k)+','+Math.round(gg*k)+','+Math.round(b*k)+')'}
function petalPath(x,v,L,W){                         // unit petal along +x from base; returns Path2D for upper half (y<0) and lower
  const up=new Path2D(),lo=new Path2D();
  const sh=[[.22,.95,.66,.80],[.12,1.12,.85,1.0],[.30,.60,.72,.55],[.02,.90,.50,1.18]][v];
  up.moveTo(0,0);up.bezierCurveTo(L*sh[0],-W*sh[1],L*sh[2],-W*sh[3],L,0);up.closePath();
  lo.moveTo(0,0);lo.bezierCurveTo(L*sh[0],W*sh[1]*.92,L*sh[2],W*sh[3]*.92,L,0);lo.closePath();
  return {up,lo}}
const probit=u=>4.91*(Math.pow(u,.14)-Math.pow(1-u,.14));

function mount(root,{W,H}){
  cv=document.createElement('canvas');cv.width=W;cv.height=H;cv.style.cssText='position:absolute;left:0;top:0';root.appendChild(cv);g=cv.getContext('2d');
  const rr=Film.rand('s10',200);
  const ord=Film.prng('s10-order'),order=[];for(let i=0;i<12;i++)order.push(i);
  for(let i=11;i>0;i--){const j=Math.floor(ord()*(i+1));const t=order[i];order[i]=order[j];order[j]=t}
  // petals: slot i -> sail k=floor(i/3), station i%3; colour/shape arranged so neighbours differ
  seed.pet=[];
  for(let i=0;i<12;i++){
    const k=Math.floor(i/3),st=i%3,[s,t]=PET_ST[st];
    const lx=s*PA.x+t*PM.x, ly=s*PA.y+t*PM.y;
    const col=COLS[(k+st*1+(st>1?1:0))%4], shape=(i*3+Math.floor(rr[i]*4))%4;
    const sz=.82+rr[12+i]*.34, ang0=(-70+rr[24+i]*140)*D2R;
    seed.pet.push({k,lx,ly,col,dark:shade(col,.8),light:shade(col,1.0),shape,sz,ang0,
      path:petalPath(0,shape,92,34),
      rank:order[i],                                  // release rank
      uq:0,
      wv:1250+rr[36+i]*450, ky:-(.50+rr[48+i]*.22),   // wind speed & slope (upward right)
      sw:20+rr[60+i]*20, swf:.7+rr[72+i]*.7, swp:rr[84+i]*TAU,
      sp:(rr[96+i]<.5?-1:1)*(1.6+rr[108+i]*1.8),      // in-plane spin rad/s
      ff:.6+rr[120+i]*.5, fp:rr[132+i]*TAU,           // flutter (2nd axis) freq/phase
      vt:.5+rr[144+i]*.3});
  }
  seed.pet.forEach(p=>{p.uq=(p.rank+.5)/12+(rr[156+p.rank]-.5)*.05});
}

/* timeline (cached by event signature) */
const cache={};
function timeline(c){
  const E=t=>c.ev.find(e=>e.type===t);
  const gust=E('gust'),spin=E('spin'),rel=E('release'),hero=E('hero'),down=E('spindown'),stop=E('stop');
  if(!(spin&&rel&&hero&&down&&stop)) return null;
  const key=[spin.lt,spin.lenSec,rel.lt,hero.lt,down.lt,stop.lt,spin.to].join('|');
  if(cache[key]) return cache[key];
  const cap=Math.min(spin.to||2,2.6);
  const S=t=>{ if(t<=spin.lt)return 0;
    if(t<down.lt) return Film.ease.sio(Film.clamp((t-spin.lt)/spin.lenSec));
    if(t<stop.lt) return 1-Film.ease.sio(Film.clamp((t-down.lt)/(stop.lt-down.lt)));
    return 0};
  const h=1/240,N=Math.ceil((c.dur+1)/h);
  let I=0;for(let i=0;i<N;i++)I+=S((i+.5)*h)*h;
  const M=Math.max(1,Math.floor(4*cap*I)), wp=M/(4*I);       // peak r/s so the pinwheel returns exactly to a quarter-turn symmetric rest
  const tab=new Float64Array(N+1);let a=0;for(let i=0;i<N;i++){tab[i]=a;a+=wp*S((i+.5)*h)*h}tab[N]=a;
  const phi=t=>{const x=Film.clamp(t/h,0,N-1e-6),i=Math.floor(x);return tab[i]+(tab[i+1]-tab[i])*(x-i)};
  // release schedule: density peaks at the hero beat
  const t0=rel.lt+.15,t1=down.lt-1.0;
  const ti=seed.pet.map(p=>p.rank<3?Film.clamp(hero.lt+(p.rank-1)*.7,t0,t1):1e9);
  const out={S,wp,phi,h,ti,t0,t1,spinLt:spin.lt,wp2:wp,hero:hero.lt,gust:gust?gust.lt:spin.lt,gustLen:gust?gust.lenSec:.5,stop:stop.lt,down:down.lt,
    rotAt:t=>A0+TAU*phi(t), Om:t=>TAU*wp*S(t)};
  return cache[key]=out;
}

function rot(x,y,a){const c=Math.cos(a),s=Math.sin(a);return{x:x*c-y*s,y:x*s+y*c}}

/* ---------- drawing pieces ---------- */
function dashed(ctx,L,f){ if(f>=.999){ctx.setLineDash([])}else ctx.setLineDash([L*f,L*2]) }
function drawSails(ctx,th,cl,wA,withShadow){
  for(let k=0;k<4;k++){
    ctx.save();ctx.translate(CX,CY);ctx.rotate(th+k*Math.PI/2);
    // facet 1 (lit sail)
    ctx.beginPath();ctx.moveTo(0,0);ctx.lineTo(PA.x,PA.y);ctx.lineTo(PM.x,PM.y);ctx.closePath();
    const gr=ctx.createLinearGradient(0,PA.y,PM.x,PM.y);gr.addColorStop(0,'#FFFFFF');gr.addColorStop(1,'#E6EBF3');
    ctx.fillStyle=gr;ctx.fill();
    // flap (curled corner, in shade)
    ctx.beginPath();ctx.moveTo(0,0);ctx.lineTo(PM.x,PM.y);ctx.lineTo(PF.x,PF.y);ctx.closePath();
    ctx.fillStyle='#E2E7EF';ctx.fill();
    // inner fold shading strip
    ctx.beginPath();ctx.moveTo(0,0);ctx.lineTo(PM.x,PM.y);ctx.lineTo(PM.x*.62+PF.x*.38,PM.y*.62+PF.y*.38);ctx.closePath();
    ctx.fillStyle='rgba(120,132,152,.16)';ctx.fill();
    // outlines (open -> closed)
    ctx.lineCap='round';ctx.lineJoin='round';ctx.strokeStyle=LINE;ctx.lineWidth=3;
    const f1=.64+.36*cl,f2=.6+.4*cl;
    ctx.beginPath();ctx.moveTo(PM.x,PM.y);ctx.lineTo(0,0);ctx.lineTo(PA.x,PA.y);ctx.lineTo(PM.x,PM.y);
    dashed(ctx,SAIL_L,f1);ctx.stroke();
    ctx.beginPath();ctx.moveTo(PF.x,PF.y);ctx.lineTo(PM.x,PM.y);ctx.lineTo(0,0);ctx.lineTo(PF.x,PF.y);
    dashed(ctx,FLAP_L,f2);ctx.lineWidth=2.2;ctx.stroke();ctx.setLineDash([]);
    // crease
    ctx.beginPath();ctx.moveTo(0,0);ctx.lineTo(PM.x,PM.y);ctx.strokeStyle='#B7BFCD';ctx.lineWidth=1.6;ctx.stroke();
    ctx.restore();
  }
}
function drawShadowSails(ctx,th){
  ctx.fillStyle='rgba(40,50,70,.09)';
  for(let k=0;k<4;k++){ctx.save();ctx.translate(CX+16,CY+20);ctx.rotate(th+k*Math.PI/2);
    ctx.beginPath();ctx.moveTo(0,0);ctx.lineTo(PA.x,PA.y);ctx.lineTo(PM.x,PM.y);ctx.lineTo(PF.x,PF.y);ctx.closePath();ctx.fill();ctx.restore()}
}
function petalShape(ctx,p,flip,L,Wd){          // flip = scaleY (can be <0: reverse side)
  ctx.save();ctx.scale(1,Math.max(Math.abs(flip),.06)*(flip<0?-1:1));
  const side=flip<0;
  ctx.fillStyle=side?p.light:p.col;ctx.fill(p.path.up);
  ctx.fillStyle=side?p.col:p.dark;ctx.fill(p.path.lo);
  ctx.strokeStyle='rgba(255,255,255,.55)';ctx.lineWidth=1.3;ctx.beginPath();ctx.moveTo(2,0);ctx.lineTo(L*.94,0);ctx.stroke();
  ctx.restore();
}
function drawAttached(ctx,tl,t,th,cl){
  if(!tl)return;
  const fold=Film.ease.sio(Film.clamp((t-(tl.down-.3))/.5));
  for(let i=0;i<12;i++){
    const p=seed.pet[i];const ti=tl?tl.ti[i]:1e9;
    if(t>=ti)continue;
    const pre=Film.ease.sio(Film.clamp((t-(ti-.32))/.32));
    const q=rot(p.lx,p.ly,th+p.k*Math.PI/2);
    ctx.save();ctx.translate(CX+q.x,CY+q.y);ctx.rotate(th+p.k*Math.PI/2+p.ang0+pre*.5);if(fold>=1){ctx.restore();continue}ctx.scale(p.sz*(1-fold),p.sz);
    // contact shadow
    ctx.save();ctx.translate(3,5);ctx.fillStyle='rgba(40,50,70,.10)';ctx.fill(p.path.up);ctx.fill(p.path.lo);ctx.restore();
    petalShape(ctx,p,1-.35*pre,92,34);ctx.restore();
  }
}
function drawFlying(ctx,tl,t){
  const L=[];
  for(let i=0;i<12;i++){
    const p=seed.pet[i],ti=tl.ti[i],tau=t-ti;if(tau<0)continue;
    const thr=tl.rotAt(ti),q=rot(p.lx,p.ly,thr+p.k*Math.PI/2),Om=tl.Om(ti);
    const tx=-q.y*Om*p.vt,ty=q.x*Om*p.vt,kk=.38,kw=.55;
    const wx=p.wv*.6,wy=p.wv*.6*p.ky;
    const eK=1-Math.exp(-tau/kk), wK=tau-kw*(1-Math.exp(-tau/kw));
    const sway=p.sw*Math.sin(TAU*p.swf*tau+p.swp)*(1-Math.exp(-tau*3));
    const x=CX+q.x+tx*kk*eK+wx*wK, y=CY+q.y+ty*kk*eK+wy*wK+sway;
    if(x>W_+260||y<-200||x<-260||y>H_+260)continue;
    const a=thr+p.k*Math.PI/2+p.ang0+.5+p.sp*tau*(1-.35*Math.exp(-tau*2));
    const fl=.15+.85*Math.cos(TAU*p.ff*tau+p.fp);
    L.push({x,y,a,fl,p,tau});
  }
  // shadows (8% grey, fixed offset)
  ctx.save();ctx.fillStyle='rgba(45,55,75,.08)';
  L.forEach(o=>{ctx.save();ctx.translate(o.x+22,o.y+30);ctx.rotate(o.a);ctx.scale(o.p.sz,o.p.sz*Math.max(Math.abs(o.fl),.1));ctx.fill(o.p.path.up);ctx.fill(o.p.path.lo);ctx.restore()});
  ctx.restore();
  L.forEach(o=>{ctx.save();ctx.translate(o.x,o.y);ctx.rotate(o.a);ctx.scale(o.p.sz,o.p.sz);petalShape(ctx,o.p,o.fl,92,34);ctx.restore()});
}
let W_=1920,H_=1080;

function windLines(ctx,t0,t,y0,list,alpha){
  const u=(t-t0)/1.5;if(u<=0||u>1.6)return;
  list.forEach((l,i)=>{
    const [ox,oy,len,amp]=l, p0=Math.max(0,u*1.0-.5-i*.04), p1=Math.min(1,u-i*.04);
    if(p1<=p0)return;
    const x0=ox,y1=y0+oy;
    ctx.save();ctx.strokeStyle='#BFC8D6';ctx.lineWidth=2.4;ctx.lineCap='round';
    ctx.globalAlpha=alpha*Film.clamp(1-(u-1)/.6)*Film.clamp(u*6);
    ctx.beginPath();
    const n=40;for(let s=0;s<=n;s++){const v=p0+(p1-p0)*s/n;const x=x0+len*v,y=y1-amp*Math.sin(v*Math.PI*1.1)-v*len*.12;s?ctx.lineTo(x,y):ctx.moveTo(x,y)}
    ctx.stroke();ctx.restore();
  });
}
const GUST=[[70,-80,620,34],[40,10,700,22],[120,96,560,40]];
const HEROW=[[1010,-270,560,26],[1100,-200,560,20]];

function drawStick(ctx){
  // ground shadow
  const gs=ctx.createRadialGradient(CX,870,4,CX,870,90);gs.addColorStop(0,'rgba(40,50,70,.12)');gs.addColorStop(1,'rgba(40,50,70,0)');
  ctx.save();ctx.translate(CX,870);ctx.scale(1,.14);ctx.translate(-CX,-870);ctx.fillStyle=gs;ctx.beginPath();ctx.arc(CX,870,90,0,TAU);ctx.fill();ctx.restore();
  ctx.beginPath();ctx.rect(CX-5,CY,10,870-CY);ctx.fillStyle='#F3F5F8';ctx.fill();
  ctx.strokeStyle=LINE;ctx.lineWidth=2.4;ctx.stroke();
  ctx.beginPath();ctx.moveTo(CX-2,CY+30);ctx.lineTo(CX-2,865);ctx.strokeStyle='rgba(255,255,255,.9)';ctx.lineWidth=2;ctx.stroke();
}
function drawCap(ctx,cl,c){
  const mint=[0x3F,0xBF,0x9F],gr=[0xC6,0xCC,0xD8];
  const col=gr.map((v,i)=>Math.round(v+(mint[i]-v)*cl));
  // ripple (light, local)
  const ra=c.forced?9:Math.max(0,Math.min(1,(c.t-(window.__s10loaded||0))));
  ctx.beginPath();ctx.arc(CX,CY,24,0,TAU);ctx.fillStyle='rgb('+col+')';ctx.fill();
  ctx.lineWidth=2.4;ctx.strokeStyle=cl>.5?'rgba(40,150,120,.55)':'#9AA3B2';ctx.stroke();
  ctx.beginPath();ctx.arc(CX-7,CY-8,7,0,TAU);ctx.fillStyle='rgba(255,255,255,.55)';ctx.fill();
}

function drawStatus(ctx,c,tl){
  const p=c.p, YC=955;
  // loading: three dots, one bright at a time (slow cycle)
  const da=1-Film.clamp(p*4);
  if(da>0){
    const ph=((c.t/1.35)%1+1)%1*3;
    for(let i=0;i<3;i++){
      let d=Math.abs(ph-i);d=Math.min(d,3-d);
      const b=Film.clamp(1-d/1.1);const bb=b*b*(3-2*b);
      ctx.beginPath();ctx.arc(CX+(i-1)*52,YC,11+3*bb,0,TAU);
      ctx.globalAlpha=da;ctx.fillStyle=bb>.5?'#2F5BD6':'#CBD2DE';
      ctx.globalAlpha=da*(.35+.65*bb);ctx.fillStyle='#2F5BD6';ctx.fill();ctx.globalAlpha=1;
    }
  }
  // done: big check mark (130px wide), drawn on
  const u=Film.ease.sio(Film.clamp((p-.05)*1.25));
  if(u>0){
    const P=[[CX-65,YC+2],[CX-18,YC+44],[CX+65,YC-48]],L1=Math.hypot(47,42),L2=Math.hypot(83,92),T=L1+L2,d=T*u;
    ctx.save();ctx.lineCap='round';ctx.lineJoin='round';ctx.strokeStyle='#3FBF9F';ctx.lineWidth=18;
    ctx.beginPath();ctx.moveTo(P[0][0],P[0][1]);
    if(d<=L1){const k=d/L1;ctx.lineTo(P[0][0]+(P[1][0]-P[0][0])*k,P[0][1]+(P[1][1]-P[0][1])*k)}
    else{const k=(d-L1)/L2;ctx.lineTo(P[1][0],P[1][1]);ctx.lineTo(P[1][0]+(P[2][0]-P[1][0])*k,P[1][1]+(P[2][1]-P[1][1])*k)}
    ctx.stroke();ctx.restore();
  }
}
function render(c){
  g.fillStyle=BG;g.fillRect(0,0,c.W,c.H);
  const tl=c.forced?null:timeline(c);
  const t=c.t;
  const cl=Film.ease.eo(Film.clamp(c.p));
  // gust wind lines (light thin strokes) + hero
  if(tl){
    windLines(g,tl.gust,t,CY,GUST,.9);
    windLines(g,tl.hero-.1,t,CY,HEROW,.7);
    // hero: local light (<=25% alpha, r<=650, decays in 0.3s)
    const ha=t-tl.hero;if(ha>=0&&ha<.3){const k=1-ha/.3;const rg=g.createRadialGradient(CX,CY,0,CX,CY,420);
      rg.addColorStop(0,'rgba(120,160,235,'+(.10*k)+')');rg.addColorStop(1,'rgba(120,160,235,0)');g.fillStyle=rg;g.fillRect(CX-420,CY-420,840,840)}
  }
  drawStick(g);
  const th=tl?tl.rotAt(t):A0;
  drawShadowSails(g,th);
  // head with deterministic motion blur: 3 sub-angles, running average via alpha 1,1/2,1/3
  const Om=tl?tl.Om(t):0;
  const sub=Math.abs(Om)>.4?[0,-1,1]:[0];
  const spread=Om/330;      // total shutter ~1/85 s, 3 sub-angles
  sub.forEach((s,i)=>{
    g.save();g.globalAlpha=1/(i+1)*(i?0.8:1);
    const a=th+s*spread;
    drawSails(g,a,cl,1);
    g.restore();
  });
  drawAttached(g,tl,t,th,cl);
  drawCap(g,cl,c);drawStatus(g,c,tl);
  // loaded ripple (mint ring, local colour/light)
  if(!c.forced&&c.flipAge<.7){const k=c.flipAge/.7;g.save();g.globalAlpha=.35*(1-k);g.strokeStyle='#3FBF9F';g.lineWidth=3;g.beginPath();g.arc(CX,CY,30+k*90,0,TAU);g.stroke();g.restore()}
  if(tl)drawFlying(g,tl,t);
}

Film.scene('s10',{mount,render});
})();
