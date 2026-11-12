/* s03 — Checkbox -> rubber stamp + to-do sheet. Shares the stamp/ink language with s00. All times come from c.ev. */
(function(){
const E=Film.ease,cl=Film.clamp,lerp=Film.lerp;
const PX=250,PY=60,PW=1080,PH=960;                 // paper
const BOX=[[400,300],[400,550],[400,800]];          // check box centres
const MIS=[[-7,5],[6,-4],[0,0]];                    // hand registration error
const Q=[0.84,0.92,1];                              // ink quality (3rd = clean)
const REST={x:1545,y:836};                          // stamp resting on the ink pad
const HH=64,FACE=104;                                // hover height, contact line below box centre
const INK='#C8321E',WET='#E8603A';
let cv,g,st,stTile=null,tile,rnd,chk=[];

function rr(c,x,y,w,h,r){c.beginPath();c.moveTo(x+r,y);c.arcTo(x+w,y,x+w,y+h,r);c.arcTo(x+w,y+h,x,y+h,r);c.arcTo(x,y+h,x,y,r);c.arcTo(x,y,x+w,y,r);c.closePath()}

/* ---- check mark textures (dry + wet colour), rough edge via seeded multi-pass jitter ---- */
function makeCheck(q,k){
  const mk=()=>{const c=document.createElement('canvas');c.width=240;c.height=220;return c};
  const A=[-50,0],B=[-14,38],C=[56,-48];
  const dry=mk(),d=dry.getContext('2d');
  d.translate(120,110);d.strokeStyle=INK;d.lineCap='round';d.lineJoin='round';
  for(let j=0;j<7;j++){
    const jx=(rnd[k*40+j*2]-.5)*3.2,jy=(rnd[k*40+j*2+1]-.5)*3.2;
    d.lineWidth=25-(j%2)*2;d.beginPath();d.moveTo(A[0]+jx,A[1]+jy);d.lineTo(B[0]+jx,B[1]+jy);d.stroke();
    for(let s=0;s<9;s++){
      const u0=s/9,u1=(s+1)/9,w=lerp(25,11,u0)-(j%2)*2;
      d.lineWidth=w;d.beginPath();d.moveTo(lerp(B[0],C[0],u0)+jx,lerp(B[1],C[1],u0)+jy);d.lineTo(lerp(B[0],C[0],u1)+jx,lerp(B[1],C[1],u1)+jy);d.stroke();
    }
  }
  // ink starvation: mottling + uneven pressure (only lowers density, never moves the shape)
  d.globalCompositeOperation='destination-out';
  const n=26;
  for(let j=0;j<n;j++){
    const x=(rnd[200+k*60+j*2]-.5)*130,y=(rnd[201+k*60+j*2]-.5)*100,r=1+rnd[400+k*30+j%30]*(1.6+(1-q)*3);
    d.fillStyle='rgba(0,0,0,'+(0.06+(1-q)*.75*rnd[600+k*30+j%30])+')';d.beginPath();d.arc(x,y,r,0,7);d.fill();
  }
  const lg=d.createLinearGradient(-60,0,60,0);lg.addColorStop(0,'rgba(0,0,0,'+(1-q)*.85+')');lg.addColorStop(.6,'rgba(0,0,0,'+(1-q)*.12+')');lg.addColorStop(1,'rgba(0,0,0,0)');
  d.fillStyle=lg;d.fillRect(-120,-110,240,220);
  const wet=mk(),w=wet.getContext('2d');w.drawImage(dry,0,0);w.globalCompositeOperation='source-in';w.fillStyle=WET;w.fillRect(0,0,240,220);
  return{dry,wet};
}

/* ---- static layer: desk + sheet + ink pad (built once; rebuilt only when the fibre tile finishes loading) ---- */
function buildStatic(W,H){
  if(!st){st=document.createElement('canvas');st.width=W;st.height=H}
  const s=st.getContext('2d'),ok=tile&&tile.complete&&tile.naturalWidth;
  s.clearRect(0,0,W,H);
  s.fillStyle='#2B2E33';s.fillRect(0,0,W,H);
  let v=s.createRadialGradient(840,470,200,960,540,1300);v.addColorStop(0,'rgba(255,255,255,.03)');v.addColorStop(1,'rgba(0,0,0,.34)');
  s.fillStyle=v;s.fillRect(0,0,W,H);
  // sheet
  s.save();s.shadowColor='rgba(0,0,0,.5)';s.shadowBlur=44;s.shadowOffsetY=18;s.shadowOffsetX=6;s.fillStyle='#F4EDDC';rr(s,PX,PY,PW,PH,5);s.fill();s.restore();
  s.save();rr(s,PX,PY,PW,PH,5);s.clip();
  let pg=s.createLinearGradient(PX,PY,PX+PW,PY+PH);pg.addColorStop(0,'#FAF5E8');pg.addColorStop(1,'#E9DFC8');s.fillStyle=pg;s.fillRect(PX,PY,PW,PH);
  if(ok){s.globalCompositeOperation='multiply';s.globalAlpha=.55;s.fillStyle=s.createPattern(tile,'repeat');s.fillRect(PX,PY,PW,PH);s.globalAlpha=1;s.globalCompositeOperation='source-over'}
  // printed content: heading bars + three rows (box outline, two grey bars)
  s.fillStyle='rgba(43,46,51,.82)';rr(s,PX+100,PY+66,360,40,7);s.fill();
  s.fillStyle='rgba(43,46,51,.22)';rr(s,PX+100,PY+128,PW-200,3,1.5);s.fill();
  const L=[[500,360,180],[430,290,130],[550,380,240]];
  BOX.forEach((b,i)=>{
    s.strokeStyle='rgba(50,46,38,.85)';s.lineWidth=8;rr(s,b[0]-75,b[1]-75,150,150,12);s.stroke();
    s.fillStyle='rgba(60,56,48,.30)';rr(s,PX+330,b[1]-40,L[i][0],26,13);s.fill();
    s.fillStyle='rgba(60,56,48,.16)';rr(s,PX+330,b[1]+8,L[i][1],19,9);s.fill();
  });
  s.fillStyle='rgba(60,56,48,.10)';rr(s,PX+100,PY+PH-80,PW-200,3,1.5);s.fill();
  s.restore();
  s.fillStyle='rgba(255,255,255,.55)';s.fillRect(PX+4,PY,PW-8,1.5);s.fillRect(PX,PY+4,1.5,PH-8);
  s.fillStyle='rgba(0,0,0,.14)';s.fillRect(PX+4,PY+PH-1.5,PW-8,1.5);s.fillRect(PX+PW-1.5,PY+4,1.5,PH-8);
  // ink pad tin (rest position)
  const px=REST.x,py=REST.y;
  s.save();s.shadowColor='rgba(0,0,0,.5)';s.shadowBlur=30;s.shadowOffsetY=16;
  let tg=s.createLinearGradient(px-120,0,px+120,0);tg.addColorStop(0,'#5A544C');tg.addColorStop(.5,'#3E3A35');tg.addColorStop(1,'#24221F');
  s.fillStyle=tg;rr(s,px-122,py-6,244,44,10);s.fill();s.restore();
  s.fillStyle='#6B645A';s.beginPath();s.ellipse(px,py,122,34,0,0,7);s.fill();
  let fg=s.createRadialGradient(px-40,py-8,6,px,py,118);fg.addColorStop(0,'#D8452C');fg.addColorStop(1,'#A52716');
  s.fillStyle=fg;s.beginPath();s.ellipse(px,py,108,27,0,0,7);s.fill();
  s.strokeStyle='rgba(255,170,140,.35)';s.lineWidth=2;s.beginPath();s.ellipse(px,py-1,100,22,0,Math.PI*1.05,Math.PI*1.55);s.stroke();
  stTile=ok?tile:null;
}

/* ---- the stamp (side elevation; y = bottom of the rubber face). Light fixed from top-left. ---- */
function drawStamp(c,x,y,inked,tl){
  c.save();c.translate(x,y);c.rotate(-(tl||0));c.scale(1,1);c.translate(-x,-y);
  // rubber slab
  let r=c.createLinearGradient(x-68,0,x+68,0);r.addColorStop(0,'#5A4640');r.addColorStop(.35,'#3E322D');r.addColorStop(1,'#241B18');
  c.fillStyle=r;rr(c,x-68,y-34,136,34,5);c.fill();
  if(inked){c.fillStyle=INK;rr(c,x-66,y-4,132,4,2);c.fill()}
  c.fillStyle='rgba(255,255,255,.12)';c.fillRect(x-64,y-33,128,2);
  // wooden plate
  wood(c,x-74,y-58,148,24,5);
  // neck
  wood(c,x-27,y-124,54,68,6);
  // knob (sphere)
  const kx=x,ky=y-150;
  let kg=c.createRadialGradient(kx-22,ky-24,4,kx,ky,66);kg.addColorStop(0,'#D6A06A');kg.addColorStop(.45,'#A36E3A');kg.addColorStop(1,'#5E3A1B');
  c.fillStyle=kg;c.beginPath();c.ellipse(kx,ky,56,42,0,0,7);c.fill();
  c.strokeStyle='rgba(60,32,12,.22)';c.lineWidth=1.5;
  for(let i=0;i<4;i++){c.beginPath();c.ellipse(kx,ky+4+i*0,48-i*9,34-i*7,0,Math.PI*.15,Math.PI*.85);c.stroke()}
  c.restore();
}
function wood(c,x,y,w,h,r){
  let gr=c.createLinearGradient(x,0,x+w,0);gr.addColorStop(0,'#C48B52');gr.addColorStop(.3,'#9C6633');gr.addColorStop(1,'#5A361A');
  c.fillStyle=gr;rr(c,x,y,w,h,r);c.fill();
  c.save();rr(c,x,y,w,h,r);c.clip();c.strokeStyle='rgba(50,26,8,.2)';c.lineWidth=1.2;
  for(let i=0;i<5;i++){const yy=y+(i+.5)*h/5+(rnd[900+i]-.5)*3;c.beginPath();c.moveTo(x,yy);c.bezierCurveTo(x+w*.3,yy-2,x+w*.6,yy+2,x+w,yy);c.stroke()}
  c.fillStyle='rgba(255,255,255,.16)';c.fillRect(x,y,w,1.5);c.restore();
}
function shadow(c,x,y,h,k){
  const rx=(68+h*.2)*k,ry=(12+h*.08)*k,a=.5*(1-cl(h/(HH*2.4)))*(1.0);
  c.save();c.translate(x+8+h*.28,y+4+h*.12);c.scale(1,ry/rx);
  const gr=c.createRadialGradient(0,0,0,0,0,rx);gr.addColorStop(0,'rgba(0,0,0,'+a+')');gr.addColorStop(.6,'rgba(0,0,0,'+a*.5+')');gr.addColorStop(1,'rgba(0,0,0,0)');
  c.fillStyle=gr;c.beginPath();c.arc(0,0,rx,0,7);c.fill();c.restore();
}

/* ---- stamp pose: a pure function of c.ev ---- */
function pose(c){
  const S=c.ev.filter(e=>e.type==='stamp').sort((a,b)=>a.lt-b.lt),n=Math.min(S.length,3);
  const R={x:REST.x,y:REST.y,h:0};
  if(c.forced||!n)return R;
  const P=i=>({x:BOX[i][0],y:BOX[i][1]+FACE}),t=c.t;
  for(let i=0;i<n;i++){
    const s=S[i].lt,p=P(i);
    if(t<s-.08)return{x:p.x,y:p.y,h:HH};
    if(t<s)return{x:p.x,y:p.y,h:HH*(1-E.eo((t-s+.08)/.08))};
    if(t<s+.06)return{x:p.x,y:p.y,h:0};
    if(t<s+.24)return{x:p.x,y:p.y,h:HH*E.sio((t-s-.06)/.18)};
    if(i<n-1){
      const m0=s+.30;
      if(t<m0)return{x:p.x,y:p.y,h:HH};
      if(t<m0+.25){const u=E.sio((t-m0)/.25),q=P(i+1);return{x:lerp(p.x,q.x,u),y:lerp(p.y,q.y,u),h:HH}}
    }else{
      const lf=S.length&&c.ev.find(e=>e.type==='lift'),rs=c.ev.find(e=>e.type==='rest');
      const L=lf?lf.lt:s+.25,Rt=rs?rs.lt:L+.25;
      if(t<L)return{x:p.x,y:p.y,h:HH};
      if(t<Rt){const u=(t-L)/(Rt-L),m=E.sio(u),d=E.eio(cl((u-.5)/.5));return{x:lerp(p.x,R.x,m),y:lerp(p.y,R.y,m),h:HH*(1-d)}}
      return R;
    }
  }
  return R;
}

Film.scene('s03',{
  mount(root,{W,H}){
    cv=document.createElement('canvas');cv.width=W;cv.height=H;cv.style.cssText='position:absolute;left:0;top:0';root.appendChild(cv);g=cv.getContext('2d');
    rnd=Film.rand('s03',1000);tile=Film.img('assets/paper_fiber_tile.png');
    for(let i=0;i<3;i++)chk.push(makeCheck(Q[i],i));
  },
  render(c){
    const W=c.W,H=c.H;
    if(!st||stTile!==((tile.complete&&tile.naturalWidth)?tile:null))buildStatic(W,H);
    g.drawImage(st,0,0);
    const S=c.ev.filter(e=>e.type==='stamp').sort((a,b)=>a.lt-b.lt);
    const age3=c.forced?9:(S[2]?c.t-S[2].lt:-1);
    // lamp pool on the desk: +10 % after the third stamp (smooth ramp, no pulse)
    const ramp=age3>=0?E.eo(cl(age3/.6)):0;
    g.save();g.globalCompositeOperation='soft-light';
    const lp=g.createRadialGradient(700,380,60,800,520,1050);
    lp.addColorStop(0,'rgba(255,232,190,'+(.62+.10*ramp*1.0)+')');lp.addColorStop(.6,'rgba(255,226,170,'+(.2+.04*ramp)+')');lp.addColorStop(1,'rgba(255,226,170,0)');
    g.fillStyle=lp;g.fillRect(0,0,W,H);g.restore();
    // checks
    for(let i=0;i<3;i++){
      const age=c.forced?9:(S[i]?c.t-S[i].lt:-1);
      if(age<0)continue;
      const u=cl(age/.1),cx=BOX[i][0]+MIS[i][0],cy=BOX[i][1]+MIS[i][1];
      g.save();g.beginPath();g.rect(cx-108,cy-96,216,192*u);g.clip();
      g.drawImage(chk[i].dry,cx-108,cy-96,216,198);
      const wa=cl(1-(age-.05)/.35)*.85;
      if(wa>0){g.globalAlpha=wa;g.drawImage(chk[i].wet,cx-108,cy-96,216,198)}
      g.restore();
    }
    // hero light: small warm halo on the third check, <=0.3 s, <=25 %
    if(!c.forced&&age3>=0&&age3<.3){
      const a=.2*(1-E.eo(age3/.3)),cx=BOX[2][0],cy=BOX[2][1];
      g.save();g.globalCompositeOperation='screen';
      const hg=g.createRadialGradient(cx,cy,10,cx,cy,300);hg.addColorStop(0,'rgba(255,120,80,'+a+')');hg.addColorStop(1,'rgba(255,120,80,0)');
      g.fillStyle=hg;g.fillRect(cx-300,cy-300,600,600);g.restore();
    }
    // stamp
    const P=pose(c);
    // arrival: shadow tightens (<=0.15 s)
    const sk=c.forced?1:1+.3*(1-E.sio(cl(c.t/.15)));
    shadow(g,P.x,P.y,P.h,sk);
    const tl=.5*(1-cl(P.h/HH))*(1-E.sio(cl((P.x-BOX[0][0])/200)));
    drawStamp(g,P.x,P.y-P.h,true,tl);
  }
});
})();
