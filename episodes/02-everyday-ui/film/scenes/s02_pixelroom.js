/* s02 Slider -> pixel room inside a glass capsule. Procedural pixel person on the room's 4 px grid; glass bead lens via per-pixel refraction. */
(function(){
const CELL=4, RX=210, RY=330, RW=1500, RH=420;           // room (pocket) origin on screen
const SH_X=162, SH_Y=282, SH_W=1596, SH_H=516, SH_R=222;  // capsule shell
const PK_R=170;                                           // pocket corner radius
const CY=540, TR=190, TX0=362, TX1=1558;                  // thumb radius / travel
const HALF=300;                                           // lens capture half-size
const CYAN='#3FD1C4', PINK='#F27BA8';
const OUT='#1B2036', SKIN='#F4C9A3', SKIN2='#D9A07E', HAIR='#3A2620', HAIR2='#6A4636',
      SHIRT='#2F4B86', SHIRT_L='#5A82CF', SHIRT_D='#21386A', PANT='#2A2E48', SHOE='#F6F2E8', SOLE='#B9B0A2',
      BLANK='#B9A6E0', BLANK_L='#D9CCF5', BLANK_D='#8C78C4';
let cv,g,room,bd,pkOv,thOv,thSh,lens,lg,seed;

function rr(c,x,y,w,h,r){c.beginPath();c.moveTo(x+r,y);c.arcTo(x+w,y,x+w,y+h,r);c.arcTo(x+w,y+h,x,y+h,r);c.arcTo(x,y+h,x,y,r);c.arcTo(x,y,x+w,y,r);c.closePath()}
function mk(w,h){const k=document.createElement('canvas');k.width=w;k.height=h;return k}

/* ---------- static layers ---------- */
function buildBackdrop(W,H){
  bd=mk(W,H);const c=bd.getContext('2d');
  let gr=c.createRadialGradient(700,300,100,960,540,1250);gr.addColorStop(0,'#F4F3F9');gr.addColorStop(.6,'#ECEAF3');gr.addColorStop(1,'#DEDCEA');
  c.fillStyle=gr;c.fillRect(0,0,W,H);
  // soft studio shadow (contact + wide)
  c.save();c.fillStyle='#ECEAF3';
  c.shadowColor='rgba(40,36,80,.22)';c.shadowBlur=90;c.shadowOffsetY=46;rr(c,SH_X,SH_Y,SH_W,SH_H,SH_R);c.fill();
  c.shadowColor='rgba(40,36,80,.20)';c.shadowBlur=26;c.shadowOffsetY=14;rr(c,SH_X,SH_Y,SH_W,SH_H,SH_R);c.fill();c.restore();
  // shell body (frosted white porcelain-glass)
  gr=c.createLinearGradient(SH_X,SH_Y,SH_X+380,SH_Y+SH_H);gr.addColorStop(0,'#FFFFFF');gr.addColorStop(.45,'#F2F1F7');gr.addColorStop(1,'#D9D7E6');
  c.fillStyle=gr;rr(c,SH_X,SH_Y,SH_W,SH_H,SH_R);c.fill();
  c.save();rr(c,SH_X,SH_Y,SH_W,SH_H,SH_R);c.clip();
  gr=c.createLinearGradient(0,SH_Y,0,SH_Y+SH_H);gr.addColorStop(0,'rgba(255,255,255,.65)');gr.addColorStop(.12,'rgba(255,255,255,0)');gr.addColorStop(.85,'rgba(120,115,160,0)');gr.addColorStop(1,'rgba(120,115,160,.20)');
  c.fillStyle=gr;c.fillRect(SH_X,SH_Y,SH_W,SH_H);c.restore();
  c.lineWidth=2;c.strokeStyle='rgba(255,255,255,.95)';rr(c,SH_X+1,SH_Y+1,SH_W-2,SH_H-2,SH_R);c.stroke();
  // pocket recess: dark upper-left lip, light lower-right lip
  const px=RX,py=RY;
  c.save();c.lineWidth=14;
  gr=c.createLinearGradient(px,py,px+300,py+RH);gr.addColorStop(0,'rgba(95,90,130,.38)');gr.addColorStop(.5,'rgba(95,90,130,.10)');gr.addColorStop(1,'rgba(255,255,255,.9)');
  c.strokeStyle=gr;rr(c,px-7,py-7,RW+14,RH+14,PK_R+7);c.stroke();c.restore();
}
function buildPocketOverlay(){
  pkOv=mk(RW,RH);const c=pkOv.getContext('2d');
  c.save();rr(c,0,0,RW,RH,PK_R);c.clip();
  let gr=c.createLinearGradient(0,0,0,70);gr.addColorStop(0,'rgba(40,24,40,.34)');gr.addColorStop(1,'rgba(40,24,40,0)');c.fillStyle=gr;c.fillRect(0,0,RW,70);
  gr=c.createLinearGradient(0,RH,0,RH-40);gr.addColorStop(0,'rgba(40,24,40,.14)');gr.addColorStop(1,'rgba(40,24,40,0)');c.fillStyle=gr;c.fillRect(0,RH-40,RW,40);
  gr=c.createLinearGradient(0,0,90,0);gr.addColorStop(0,'rgba(40,24,40,.18)');gr.addColorStop(1,'rgba(40,24,40,0)');c.fillStyle=gr;c.fillRect(0,0,90,RH);
  gr=c.createLinearGradient(RW,0,RW-90,0);gr.addColorStop(0,'rgba(40,24,40,.14)');gr.addColorStop(1,'rgba(40,24,40,0)');c.fillStyle=gr;c.fillRect(RW-90,0,90,RH);
  // glass cover: two soft diagonal reflections, fixed
  c.fillStyle='rgba(255,255,255,.07)';
  [[260,120],[960,90]].forEach(([x,w])=>{c.beginPath();c.moveTo(x,0);c.lineTo(x+w,0);c.lineTo(x+w-170,RH);c.lineTo(x-170,RH);c.closePath();c.fill()});
  c.restore();
  c.save();rr(c,.75,.75,RW-1.5,RH-1.5,PK_R);c.lineWidth=1.5;c.strokeStyle='rgba(255,255,255,.35)';c.stroke();c.restore();
}
function buildThumbSprites(){
  const S=TR*2+120,m=S/2;
  // contact shadow (light from upper-left -> falls lower-right)
  thSh=mk(S,S);let c=thSh.getContext('2d');c.fillStyle='#000';c.shadowColor='rgba(30,26,70,.34)';c.shadowBlur=56;c.shadowOffsetX=16+4000;c.shadowOffsetY=40;
  c.beginPath();c.arc(m-16-4000,m-40+6,TR-18,0,6.2832);c.fill();
  // overlay: rim shading, specular, caustic
  const D=TR*2+8,o=D/2;thOv=mk(D,D);c=thOv.getContext('2d');
  c.save();c.beginPath();c.arc(o,o,TR,0,6.2832);c.clip();
  let gr=c.createRadialGradient(o,o,TR*.62,o,o,TR);gr.addColorStop(0,'rgba(70,80,140,0)');gr.addColorStop(.7,'rgba(70,80,140,.10)');gr.addColorStop(1,'rgba(40,46,110,.18)');c.fillStyle=gr;c.fillRect(0,0,D,D);
  // darker upper-left inner rim, brighter lower-right caustic
  gr=c.createLinearGradient(o-TR,o-TR,o+TR,o+TR);gr.addColorStop(0,'rgba(30,34,90,.16)');gr.addColorStop(.45,'rgba(30,34,90,0)');gr.addColorStop(.78,'rgba(255,244,222,0)');gr.addColorStop(1,'rgba(255,244,222,.30)');
  c.fillStyle=gr;c.fillRect(0,0,D,D);
  // large soft specular upper-left
  c.save();c.translate(o-TR*.34,o-TR*.50);c.rotate(-.62);
  gr=c.createRadialGradient(0,0,0,0,0,TR*.52);gr.addColorStop(0,'rgba(255,255,255,.85)');gr.addColorStop(.5,'rgba(255,255,255,.28)');gr.addColorStop(1,'rgba(255,255,255,0)');
  c.scale(1,.42);c.fillStyle=gr;c.beginPath();c.arc(0,0,TR*.52,0,6.2832);c.fill();c.restore();
  // thin rim light arc (top-left) and caustic arc (bottom-right)
  c.lineCap='round';
  c.strokeStyle='rgba(255,255,255,.75)';c.lineWidth=5;c.beginPath();c.arc(o,o,TR-9,Math.PI*1.08,Math.PI*1.52);c.stroke();
  c.strokeStyle='rgba(255,250,235,.55)';c.lineWidth=7;c.beginPath();c.arc(o,o,TR-10,Math.PI*.04,Math.PI*.40);c.stroke();
  c.restore();
  c.lineWidth=2;c.strokeStyle='rgba(255,255,255,.9)';c.beginPath();c.arc(o,o,TR-1,0,6.2832);c.stroke();
  c.lineWidth=1.5;c.strokeStyle='rgba(50,56,110,.28)';c.beginPath();c.arc(o,o,TR+.5,0,6.2832);c.stroke();
}

/* ---------- pixel helpers (cell coords on the room grid) ---------- */
function F(x,y,w,h,col){g.fillStyle=col;g.fillRect(RX+x*CELL,RY+y*CELL,w*CELL,h*CELL)}
function Line(x0,y0,x1,y1,w,col,grow){
  x0=Math.round(x0);y0=Math.round(y0);x1=Math.round(x1);y1=Math.round(y1);
  const dx=Math.abs(x1-x0),dy=Math.abs(y1-y0),sx=x0<x1?1:-1,sy=y0<y1?1:-1;let e=dx-dy,x=x0,y=y0,k=(w>>1);
  g.fillStyle=col;const ww=w+2*grow;
  for(let n=0;n<400;n++){g.fillRect(RX+(x-k-grow)*CELL,RY+(y-k-grow)*CELL,ww*CELL,ww*CELL);if(x===x1&&y===y1)break;const e2=2*e;if(e2>-dy){e-=dy;x+=sx}if(e2<dx){e+=dx;y+=sy}}
}
/* parts: array of fn(grow,colOverride) drawn twice: outline (grow=1, OUT) then fill */
function drawParts(parts){parts.forEach(p=>p(1,OUT));parts.forEach(p=>p(0,null))}
const R_=(x,y,w,h,col)=>(gr,co)=>F(x-gr,y-gr,w+2*gr,h+2*gr,co||col);
const L_=(x0,y0,x1,y1,w,col)=>(gr,co)=>Line(x0,y0,x1,y1,w,co||col,gr);

function standing(ox,oy,pose,mouth){
  const b=pose.bob||0,y0=oy-b,P=[],hipY=y0-18,shY=y0-31;
  P.push(L_(ox-3,hipY,ox+pose.fl[0],oy+pose.fl[1]-3,5,PANT));
  P.push(L_(ox+3,hipY,ox+pose.fr[0],oy+pose.fr[1]-3,5,PANT));
  P.push(R_(ox+pose.fl[0]-4,oy+pose.fl[1]-3,8,3,SHOE),R_(ox+pose.fr[0]-4,oy+pose.fr[1]-3,8,3,SHOE));
  P.push(R_(ox-8,y0-34,16,16,SHIRT),R_(ox-8,y0-34,4,16,SHIRT_L),R_(ox+4,y0-34,4,16,SHIRT_D),R_(ox-2,y0-34,4,3,SKIN2));
  P.push(R_(ox-8,y0-19,16,1,PANT));
  P.push(L_(ox-8,shY,ox+pose.hl[0],y0+pose.hl[1],4,SHIRT_L),L_(ox+8,shY,ox+pose.hr[0],y0+pose.hr[1],4,SHIRT));
  P.push(R_(ox+pose.hl[0]-2,y0+pose.hl[1]-2,4,4,SKIN),R_(ox+pose.hr[0]-2,y0+pose.hr[1]-2,4,4,SKIN));
  P.push(R_(ox-7,y0-48,14,14,SKIN),R_(ox-8,y0-52,16,7,HAIR),R_(ox-8,y0-46,3,6,HAIR),R_(ox+5,y0-46,3,6,HAIR),R_(ox-6,y0-52,6,1,HAIR2));
  drawParts(P);
  F(ox-4,y0-43,2,2,OUT);F(ox+2,y0-43,2,2,OUT);F(ox-6,y0-40,2,1,'#F29B92');F(ox+4,y0-40,2,1,'#F29B92');
  if(mouth)F(ox-2,y0-39,4,2,OUT);else F(ox-1,y0-39,3,1,OUT);
}
const CYCLE=[
  {hl:[-13,-50],hr:[13,-50],fl:[-8,0],fr:[8,0],bob:3,jy:0},
  {hl:[-16,-40],hr:[16,-40],fl:[-5,0],fr:[5,0],bob:0,jy:4},
  {hl:[-12,-53],hr:[16,-42],fl:[-8,0],fr:[8,0],bob:3,jy:0},
  {hl:[-16,-40],hr:[16,-40],fl:[-5,0],fr:[5,0],bob:0,jy:4}
];
const DANCE=[
  {hl:[-14,-22],hr:[15,-56],fl:[-6,0],fr:[6,0],bob:0},
  {hl:[-15,-56],hr:[14,-22],fl:[-6,0],fr:[6,0],bob:0}
];
const DANCE_D=[
  {hl:[-12,-18],hr:[13,-46],fl:[-8,0],fr:[8,0],bob:3},
  {hl:[-13,-46],hr:[12,-18],fl:[-8,0],fr:[8,0],bob:3}
];
function seated(hx,hy,o){
  const ln=o.lean||0,hd=o.headDy||0,P=[];
  P.push(L_(hx,hy-3,hx-15,hy-3,5,PANT),L_(hx-15,hy-3,hx-15,hy+14,5,PANT));
  P.push(R_(hx-22,hy+14,10,3,SHOE),R_(hx-22,hy+17,10,1,SOLE));
  P.push(L_(hx,hy-9,hx+ln,hy-10,11,SHIRT));
  P.push(R_(hx-6,hy-15,5,5,SHIRT_L));
  const nx=hx+ln;
  if(o.arms==='up'){P.push(L_(nx-2,hy-15,nx-4,hy-36,4,SHIRT_L),R_(nx-6,hy-40,4,4,SKIN))}
  else{P.push(L_(nx-2,hy-15,nx-4,hy-6,4,SHIRT_L),L_(nx-4,hy-6,hx-12,hy-6,4,SHIRT_L),R_(hx-15,hy-8,4,4,SKIN))}
  const hy2=hy-29+hd;
  P.push(R_(nx-7,hy2,14,14,SKIN),R_(nx-7,hy2-4,15,7,HAIR),R_(nx+1,hy2,7,12,HAIR),R_(nx-5,hy2-4,6,1,HAIR2));
  F(hx-24,hy+17,14,1,'rgba(60,30,20,.3)');drawParts(P);
  if(o.eyes==='closed')F(nx-6,hy2+6,4,1,OUT);else F(nx-6,hy2+5,2,2,OUT);
  F(nx-7,hy2+9,2,1,'#F29B92');
  if(o.mouth)F(nx-7,hy2+11,3,2,OUT);else F(nx-6,hy2+11,3,1,OUT);
}
function lying(ox,oy,breath){
  const P=[],by=oy;
  P.push(R_(ox+12,by-11-breath,50,11+breath,BLANK),R_(ox+12,by-11-breath,50,2,BLANK_L),R_(ox+12,by-2,50,2,BLANK_D),R_(ox+14,by-11-breath,2,11+breath,BLANK_L));
  P.push(R_(ox+61,by-5,5,5,SHOE),R_(ox+61,by-1,5,1,SOLE));
  P.push(R_(ox,by-14,14,14,SKIN),R_(ox-1,by-17,15,7,HAIR),R_(ox,by-11,5,10,HAIR),R_(ox+3,by-17,6,1,HAIR2));
  P.push(R_(ox+9,by-11,5,4,SHIRT));
  drawParts(P);F(ox+12,by,52,1,'rgba(70,24,12,.35)');
  F(ox+7,by-7,4,1,OUT);F(ox+10,by-4,2,1,'#F29B92');F(ox+9,by-2,3,1,OUT);
}
function zGlyph(x,y,n,col){ // n x n z shape, absolute px
  const s=CELL;g.fillStyle=OUT;
  const draw=(c,gw)=>{g.fillStyle=c;g.fillRect(x-gw,y-gw,(n*s)+2*gw,s+2*gw);g.fillRect(x-gw,y+(n-1)*s-gw,n*s+2*gw,s+2*gw);for(let i=0;i<n;i++){g.fillRect(x+(n-1-i)*s-gw,y+i*s-gw,s+2*gw,s+2*gw)}};
  draw(OUT,s);draw(col,0);
}

/* ---------- speaker (pixel cone drawn over the asset's woofer) ---------- */
const SPK={cx:30,cy:64,r:17};
function speaker(env,lvl,hero){
  const {cx,cy,r}=SPK,e=env*lvl;
  for(let j=-r-1;j<=r+1;j++)for(let i=-r-1;i<=r+1;i++){
    const d=Math.sqrt(i*i+j*j);if(d>r+.5)continue;
    let col;
    const push=e*.5;                      // cone pushes outward on the kick
    if(d>r-1.2)col='#2E150F';
    else if(d>r-3.6)col=((i-j)>6)?'#5B2B1E':'#6A3222';
    else if(d>5.2-push){const t=(i+j)/(2*r);col=t<-.28?'#7A3B28':t<.1?'#5A2A1F':'#46201A'}
    else if(d>2.2){col='#8A4A30'}
    else col='#C98A4B';
    F(cx+i-1,cy+j-1,1,1,col);
  }
  // kick halo (light, not motion)
  if(e>.05){g.save();g.globalAlpha=Math.min(.9,e*1.1);
    for(let k=0;k<1;k++){g.fillStyle=CYAN;for(let a=0;a<96;a++){const t=a/96*Math.PI*2,rr2=r+1.5+k*2.2,x=Math.round((cx-1+Math.cos(t)*rr2)),y=Math.round((cy-1+Math.sin(t)*rr2));g.fillRect(RX+x*CELL,RY+y*CELL,CELL,CELL)}}
    g.restore()}
}
function arcCells(cx,cy,r,a0,a1,col,alpha,thick,dither){
  g.save();g.globalAlpha=alpha;g.fillStyle=col;
  const step=Math.max(.004,4.2/r);let n=0;
  for(let a=a0;a<=a1;a+=step,n++){
    if(dither&&(n&1))continue;
    const x=cx+Math.cos(a)*r,y=cy+Math.sin(a)*r;
    for(let k=0;k<thick;k++){const rx=Math.round((x+Math.cos(a)*k*CELL)/CELL)*CELL,ry=Math.round((y+Math.sin(a)*k*CELL)/CELL)*CELL;g.fillRect(RX+rx,RY+ry,CELL,CELL)}
  }
  g.restore();
}

Film.scene('s02',{
  mount(root,{W,H}){
    cv=document.createElement('canvas');cv.width=W;cv.height=H;cv.style.cssText='position:absolute;left:0;top:0';root.appendChild(cv);
    g=cv.getContext('2d',{willReadFrequently:true});
    room=Film.img('assets/room_pixel_day.png');
    buildBackdrop(W,H);buildPocketOverlay();buildThumbSprites();
    lens=mk(TR*2+8,TR*2+8);lg=lens.getContext('2d');
    seed=Film.rand('s02',16);
  },
  render(c){
    const W=c.W,H=c.H,t=c.t,beat=c.beat;
    const evt=ty=>{const e=c.ev.find(q=>q.type===ty);return e?e.lt:null};
    const tWake=evt('wake'),tFlip=evt('flip'),tSit=evt('sit'),tNod=evt('nod'),tLand=evt('land');
    const forced=c.forced||!c.ev.length;
    const p=Math.max(0,Math.min(1,c.p));

    g.imageSmoothingEnabled=false;
    g.drawImage(bd,0,0);

    /* ---- room ---- */
    g.save();rr(g,RX,RY,RW,RH,PK_R);g.clip();
    if(room.complete&&room.naturalWidth)g.drawImage(room,RX,RY,RW,RH);
    else{const gr=g.createLinearGradient(0,RY,0,RY+RH);gr.addColorStop(0,'#F2D9B8');gr.addColorStop(1,'#C9A27A');g.fillStyle=gr;g.fillRect(RX,RY,RW,RH)}

    /* phase machine from cues (forced -> dancing) */
    let phase;
    if(forced)phase='dance';
    else if(tWake==null||t<tWake)phase='sleep';
    else if(tFlip==null||t<tFlip)phase=(t<tWake+.18)?'rise':'sit1';
    else if(tSit==null||t<tSit)phase='dance';
    else phase=(t<tSit+.18)?'crouch2':'sit2';

    /* music level + kick envelope */
    const hasKick=forced||(tFlip!=null&&t>=tFlip);
    const ph=beat-Math.floor(beat);
    let lvl=0;
    if(hasKick){lvl=Math.max(0,Math.min(1,(p-.25)/.45));const hb=forced?0:Math.max(0,1-(t-tFlip)/.6);lvl=Math.max(lvl,.9*hb);if(forced)lvl=1}
    const kick=Math.exp(-ph*3);                       // 2 Hz kick envelope
    speaker(hasKick?kick:0,hasKick?Math.max(.35,lvl):0,0);

    /* hero light: soft warm bloom behind speaker, <=25%, 0.3 s */
    if(!forced&&tFlip!=null){const a=t-tFlip;if(a>=0&&a<.3){const k=.24*(1-a/.3)*(1-a/.3);
      const gr=g.createRadialGradient(RX+122,RY+256,20,RX+122,RY+256,620);gr.addColorStop(0,'rgba(255,244,214,'+k+')');gr.addColorStop(1,'rgba(255,244,214,0)');g.fillStyle=gr;g.fillRect(RX,RY,RW,RH)}}

    /* sound rings (dotted pixel arcs), colour alternates per beat */
    if(hasKick&&phase==='sit2'){   // settled: one small calm ring pair, radius fixed (only its brightness breathes with the soft kick)
      const sx=SPK.cx*CELL-2,sy=SPK.cy*CELL-2,al=.6;
      arcCells(sx,sy,150,-.9,.9,CYAN,al,4,false);arcCells(sx,sy,150-2,-.8,.8,'#C9FAF4',al*.9,1,false);arcCells(sx,sy,200,-.8,.8,PINK,al*.6,3,true);
    }else if(hasKick){
      const k0=Math.floor(beat),flipB=forced?-1e9:(c.ev.find(q=>q.type==='flip').lb);
      const sx=RX*0+SPK.cx*CELL-2,sy=SPK.cy*CELL-2;
      const rm=200+860*Math.max(.14,lvl);
      // exactly one ring alive at a time: spawn every 2 beats from the flip, grows smoothly for 2 beats
      const base=forced?0:flipB,n=Math.floor((beat-base)/2),kb=base+2*n,ab=beat-kb;
      if(ab>=0&&ab<2){
        const u=ab/2,e3=1-Math.pow(1-u,3),r=70+(rm-70)*e3;
        const col=(((n%2)+2)%2)?PINK:CYAN,hi=col===CYAN?'#C9FAF4':'#FFD3E4';
        const al=Math.min(1,ab*4)*Math.pow(1-u,1.2)*(.75+.25*Math.min(1,lvl+.2)),span=.95-.25*u,th=u<.25?7:u<.5?6:u<.75?5:4;
        arcCells(sx,sy,r,-span,span,col,al,th,false);
        arcCells(sx,sy,r,-span,span,hi,al,1,false);
      }
    }

    /* ---- person ---- */
    const SIT={x:282,y:80};
    if(phase==='sleep'){
      const br=(Math.floor(t*0.9+0)%2===0)?0:1;
      lying(244,80,br);
      // Zz rising, deterministic drift
      for(let i=0;i<3;i++){const u=((t*.42+i/3)%1),n=4+i,x=RX+(262+i*5)*CELL+Math.round(Math.sin(u*6.28+i)*2)*CELL,y=RY+(56-u*20)*CELL;
        g.globalAlpha=u<.12||u>.8?0:1;zGlyph(Math.round(x/CELL)*CELL,Math.round(y/CELL)*CELL,n,'#8A78E8');g.globalAlpha=1}
    }else if(phase==='rise')seated(SIT.x,SIT.y,{lean:6,eyes:'closed',arms:'rest',headDy:1});
    else if(phase==='sit1'){const st=Math.floor((t-tWake)*4)%2;seated(SIT.x,SIT.y,{lean:1,eyes:(t-tWake<.7)?'closed':'open',arms:'up',mouth:st===0,headDy:0})}
    else if(phase==='crouch'||phase==='crouch2'){standing(SIT.x+10,98,{hl:[-12,-14],hr:[12,-14],fl:[-8,0],fr:[8,0],bob:6},false)}
    else if(phase==='sit2'){
      const nod=(tNod!=null&&t>=tNod&&t<tNod+.35)?1:0,bob=(Math.floor(beat*2)%2)?1:0;
      seated(SIT.x,SIT.y,{lean:0,eyes:nod?'closed':'open',arms:'rest',headDy:nod+(nod?0:bob*0)})
    }else{ // dance
      const fr=(((Math.floor(beat))%2)+2)%2*2,half=false;        // one pose per beat (2 Hz): arms-up V <-> one arm up
      const pose=CYCLE[fr];
      let jy=Math.round(4*Math.sin(Math.PI*ph));                   // eased jump arc over one beat (0..4 cells)
      if(!forced&&tLand!=null){const u=(t-(tLand-.4))/.4;if(u>0&&u<1)jy+=Math.round(8*4*u*(1-u))}
      // ground shadow + dust on landing
      F(313,97,34,2,'rgba(60,30,20,.32)');F(316,96,28,1,'rgba(60,30,20,.2)');
      standing(330,98-jy,pose,!half);
      if(!forced&&tLand!=null){const a=t-tLand;if(a>=0&&a<.4){const u=a/.4;g.globalAlpha=1-u;g.fillStyle='#FFF3DC';
        [-1,1].forEach(sg=>{for(let i=0;i<3;i++){g.fillRect(RX+(330+sg*(8+i*4+Math.round(u*6)))*CELL,RY+(97-i%2-Math.round(u*2))*CELL,CELL,CELL)}});g.globalAlpha=1}}
    }

    /* ---- glass cover sweep at arrival (0.15 s) ---- */
    const ia=Film.since(c,'impact');
    g.drawImage(pkOv,RX,RY);
    if(ia<.15){const u=ia/.15,x=-260+u*(RW+520);g.save();
      const gr=g.createLinearGradient(RX+x,0,RX+x+170,0);gr.addColorStop(0,'rgba(255,255,255,0)');gr.addColorStop(.5,'rgba(255,255,255,.50)');gr.addColorStop(1,'rgba(255,255,255,0)');
      g.fillStyle=gr;g.beginPath();g.moveTo(RX+x+60,RY);g.lineTo(RX+x+230,RY);g.lineTo(RX+x+170,RY+RH);g.lineTo(RX+x,RY+RH);g.closePath();g.fill();g.restore()}
    g.restore();

    /* ---- scale ticks + readout ---- */
    const N=25,tx0=TX0,tx1=TX1;
    for(let i=0;i<N;i++){const u=i/(N-1),x=Math.round(tx0+u*(tx1-tx0)),h=16+Math.round(u*22),lit=Math.max(0,Math.min(1,(p-u)*N*.8+.5));
      g.fillStyle='#CFCCDD';rr(g,x-3,872-h,6,h,3);g.fill();
      if(lit>0){g.globalAlpha=lit;g.fillStyle=u<.5?CYAN:PINK;
        const gr2=g.createLinearGradient(tx0,0,tx1,0);gr2.addColorStop(0,CYAN);gr2.addColorStop(1,PINK);g.fillStyle=gr2;rr(g,x-3,872-h,6,h,3);g.fill();g.globalAlpha=1}}
    {const nx=Math.round(TX0+p*(TX1-TX0));g.fillStyle='#8D8AA6';g.font='600 80px "SF Mono",Consolas,monospace';g.textAlign='center';g.textBaseline='alphabetic';
      g.fillText(String(Math.round(p*100)).padStart(3,'0'),nx,966)}

    /* ---- glass thumb ---- */
    const cx=Math.round(TX0+p*(TX1-TX0));
    g.drawImage(thSh,cx-TR-60,CY-TR-60);
    const bx=cx-HALF,by=CY-HALF,S=HALF*2;
    let ok=true,src;
    try{src=g.getImageData(bx,by,S,S)}catch(e){ok=false}
    if(ok){
      const D=TR*2+8,o=D/2,out=lg.createImageData(D,D),sd=src.data,od=out.data;
      for(let y=0;y<D;y++)for(let x=0;x<D;x++){
        const dx=x-o+.5,dy=y-o+.5,r=Math.sqrt(dx*dx+dy*dy);if(r>TR+.5)continue;
        const rn=Math.min(1,r/TR),f=.90+.30*rn*rn*rn;
        const k=(y*D+x)*4;
        for(let ch=0;ch<3;ch++){
          const ff=f*(1+(ch-1)*.012);
          let sx=Math.round(HALF+dx*ff-.5),sy=Math.round(HALF+dy*ff-.5);
          sx=sx<0?0:sx>=S?S-1:sx;sy=sy<0?0:sy>=S?S-1:sy;
          od[k+ch]=sd[(sy*S+sx)*4+ch];
        }
        od[k+3]=r>TR-.5?Math.round(255*(TR+.5-r)):255;
      }
      lg.putImageData(out,0,0);
      g.drawImage(lens,cx-TR-4,CY-TR-4);
    }
    g.drawImage(thOv,cx-TR-4,CY-TR-4);

    /* ---- touch ring ---- */
    Film.cue(c,'touch').forEach(q=>Film.touch(g,cx+60,CY+10,q.age));
  }
});
})();
