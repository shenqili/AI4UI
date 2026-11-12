/* s08 Color picker -> glass lens + enamel colour chips. Grey world, colour only inside the lens. */
(function(){
const R=250,                       // lens radius
  P0={x:470,y:700},                // rest (left)
  P1={x:540,y:400},                // on the red leaf
  P2={x:1460,y:640},               // on the water
  TRAY={x:960,y:945,w:640,h:190},
  WELL={x:757,y:945,s:170},
  SLOT=[{x:757,y:945},{x:757,y:945}],
  CHIP=[{c:'#D9452B',hi:'#F27A5E',lo:'#A82A14',hex:'#D9452B'},{c:'#2F7F86',hi:'#5FB1B6',lo:'#1C5A60',hex:'#2F7F86'}],
  MONO='"SF Mono",Consolas,monospace';
let cv,g,img,sty=null,paper,tile,grey=null,greyFor=null,shade=null,W0=1920,H0=1080;
const clamp=(x,a=0,b=1)=>Math.max(a,Math.min(b,x));
const lerp=(a,b,u)=>a+(b-a)*u;
const sio=u=>u<.5?2*u*u:1-2*(1-u)*(1-u);
const eo=u=>1-(1-u)*(1-u)*(1-u);

function rr(x,y,w,h,r){g.beginPath();g.moveTo(x+r,y);g.arcTo(x+w,y,x+w,y+h,r);g.arcTo(x+w,y+h,x,y+h,r);g.arcTo(x,y+h,x,y,r);g.arcTo(x,y,x+w,y,r);g.closePath()}

function stylize(W,H){
  // illustration chain: smooth -> posterize 7 levels -> soften steps -> top-left light -> shared paper grain
  const o=document.createElement('canvas');o.width=W;o.height=H;const q=o.getContext('2d');
  q.filter='blur(1.4px)';q.drawImage(img,0,0,W,H);q.filter='none';
  const d=q.getImageData(0,0,W,H),a=d.data,N=8;
  for(let i=0;i<a.length;i+=4){const l=(a[i]*.2126+a[i+1]*.7152+a[i+2]*.0722)||1,ql=Math.max(14,Math.round(l/255*N)/N*255),k=ql/l;a[i]=Math.min(255,a[i]*k);a[i+1]=Math.min(255,a[i+1]*k);a[i+2]=Math.min(255,a[i+2]*k)}
  q.putImageData(d,0,0);
  const o2=document.createElement('canvas');o2.width=W;o2.height=H;const p=o2.getContext('2d');
  p.filter='blur(1.1px) saturate(1.05)';p.drawImage(o,0,0);p.filter='none';
  let lg=p.createLinearGradient(0,0,W,H);lg.addColorStop(0,'rgba(255,244,225,.20)');lg.addColorStop(.5,'rgba(255,255,255,0)');lg.addColorStop(1,'rgba(20,24,40,.20)');p.fillStyle=lg;p.fillRect(0,0,W,H);
  if(paper&&paper.complete&&paper.naturalWidth){p.globalCompositeOperation='multiply';p.globalAlpha=.32;p.fillStyle=p.createPattern(paper,'repeat');p.fillRect(0,0,W,H);p.globalAlpha=1;p.globalCompositeOperation='source-over'}
  return o2;
}
function buildGrey(W,H){
  const o=document.createElement('canvas');o.width=W;o.height=H;const q=o.getContext('2d');
  q.drawImage(sty,0,0,W,H);
  const d=q.getImageData(0,0,W,H),a=d.data;
  for(let i=0;i<a.length;i+=4){
    let l=(a[i]*.2126+a[i+1]*.7152+a[i+2]*.0722)/255;
    l=.24+l*.56;           // matte printed grade: lifted blacks, compressed whites
    const v=l*255;a[i]=Math.min(255,v*1.025+2);a[i+1]=v;a[i+2]=v*.95
  }
  q.putImageData(d,0,0);
  // quiet vignette so the glass reads
  const vg=q.createRadialGradient(W/2,H*.5,H*.35,W/2,H*.5,H*.95);
  vg.addColorStop(0,'rgba(60,48,36,0)');vg.addColorStop(1,'rgba(60,48,36,.42)');
  q.fillStyle=vg;q.fillRect(0,0,W,H);
  return o;
}
function buildShade(){ // soft lens shadow sprite
  const s=document.createElement('canvas');s.width=s.height=2*R+240;const q=s.getContext('2d'),m=R+120;
  q.filter='blur(34px)';q.fillStyle='rgba(0,0,0,.5)';q.beginPath();q.arc(m,m,R-6,0,Math.PI*2);q.fill();
  return s;
}

function lensPos(c){
  const d=Film.cue(c,'drag');
  let p=P0;
  if(c.forced||!c.ev.length)return P2;
  if(d[0]&&d[0].started){const u=sio(d[0].u);p={x:lerp(P0.x,P1.x,u),y:lerp(P0.y,P1.y,u)}}
  if(d[1]&&d[1].started){const u=sio(d[1].u);p={x:lerp(P1.x,P2.x,u),y:lerp(P1.y,P2.y,u)}}
  return p;
}
// chip state: {x,y,rise,lift} or null (not yet out)
function chipState(c,i,L){
  const S=SLOT[i];
  if(c.forced||!c.ev.length)return{x:S.x,y:S.y,seated:1,air:0,grow:1};
  const fl=Film.cue(c,'flip').filter(q=>q.e.chip===i+1)[0],tr=Film.cue(c,'tray').filter(q=>q.e.n===i+1)[0];
  if(!fl||!fl.started)return null;
  const t0=fl.e.lt,tEnd=tr?tr.e.lt:t0+.65,tSlide=tEnd-.35,t=c.t;
  const dx=S.x-L.x,dy=S.y-L.y,dl=Math.hypot(dx,dy),ux=dx/dl,uy=dy/dl;
  const rim={x:L.x+ux*(R-4),y:L.y+uy*(R-4)};
  const out=eo(clamp((t-t0)/(tSlide-t0)));            // 0..120 px from the rim
  const A={x:rim.x+ux*120*out,y:rim.y+uy*120*out};
  if(t<tSlide)return{x:A.x,y:A.y,seated:0,air:1,out,grow:0};
  const s=sio(clamp((t-tSlide)/(tEnd-tSlide)));
  return{x:lerp(A.x,S.x,s),y:lerp(A.y,S.y,s),seated:s>=1?1:0,air:1-s,out:1,grow:s};
}

function drawChip(x,y,k,air,grow,mini){
  let w=lerp(124,150,grow||0),h=lerp(78,150,grow||0);if(mini){w=56;h=38}
  g.save();
  // shadow
  const sh=6+air*22;
  g.fillStyle='rgba(0,0,0,'+(.28+.1*air)+')';g.filter='blur('+(5+air*9)+'px)';
  rr(x-w/2+3,y-h/2+sh,w,h,16);g.fill();g.filter='none';
  // brass-less bezel: clear white enamel rim
  let gr=g.createLinearGradient(x-w/2,y-h/2,x+w/2,y+h/2);gr.addColorStop(0,'#FFFFFF');gr.addColorStop(1,'#B9BEC8');
  g.fillStyle=gr;rr(x-w/2,y-h/2,w,h,16);g.fill();
  // enamel face
  gr=g.createLinearGradient(x,y-h/2,x,y+h/2);gr.addColorStop(0,k.hi);gr.addColorStop(.45,k.c);gr.addColorStop(1,k.lo);
  g.fillStyle=gr;rr(x-w/2+6,y-h/2+6,w-12,h-12,11);g.fill();
  // gloss
  g.save();rr(x-w/2+6,y-h/2+6,w-12,h-12,11);g.clip();
  gr=g.createLinearGradient(x-w/2,y-h/2,x-w/2+w*.7,y+h/2);gr.addColorStop(0,'rgba(255,255,255,.55)');gr.addColorStop(.38,'rgba(255,255,255,.12)');gr.addColorStop(.4,'rgba(255,255,255,0)');
  g.fillStyle=gr;g.fillRect(x-w/2,y-h/2,w,h);g.restore();
  g.restore();
}

Film.scene('s08',{
  mount(root,{W,H}){
    W0=W;H0=H;cv=document.createElement('canvas');cv.width=W;cv.height=H;cv.style.cssText='position:absolute;left:0;top:0';root.appendChild(cv);g=cv.getContext('2d');
    img=Film.img('assets/landscape_color.png');tile=Film.img('assets/brass_brushed_tile.png');paper=Film.img('assets/paper_fiber_tile.png');shade=buildShade();
  },
  render(c){
    const W=c.W,H=c.H,ok=img&&img.complete&&img.naturalWidth;
    g.globalAlpha=1;g.filter='none';g.globalCompositeOperation='source-over';
    if(ok&&!sty){sty=stylize(W,H);grey=buildGrey(W,H)}
    // ---- grey world
    if(grey)g.drawImage(grey,0,0);else{g.fillStyle='#5A5C60';g.fillRect(0,0,W,H)}
    const L=lensPos(c);
    // ---- lens shadow on the grey world
    g.globalAlpha=.9;g.drawImage(shade,L.x-R-120+16,L.y-R-120+30);g.globalAlpha=1;
    // ---- colour inside the lens, 1.1x magnified, edge band compressed (refraction)
    g.save();g.beginPath();g.arc(L.x,L.y,R,0,Math.PI*2);g.clip();
    const mag=(m)=>{g.save();g.translate(L.x,L.y);g.scale(m,m);g.translate(-L.x,-L.y);
      // keep the same scene point under the lens centre: sample around lens centre
      g.filter='saturate(1.35) brightness(1.18) contrast(1.05)';g.drawImage(sty||grey||cv,0,0,W,H);g.filter='none';g.restore()};
    if(ok&&sty){
      mag(1.12);
      // refraction rim: annulus drawn stronger-magnified
      g.save();g.beginPath();g.arc(L.x,L.y,R,0,Math.PI*2);g.arc(L.x,L.y,R-16,0,Math.PI*2,true);g.clip();
      g.translate(L.x,L.y);g.scale(1.3,1.3);g.translate(-L.x,-L.y);g.drawImage(sty,0,0,W,H);g.restore();
    }else{g.fillStyle='#D9452B';g.fillRect(L.x-R,L.y-R,2*R,2*R)}
    // glass body: slight cool tint at edge, inner shade
    let gr=g.createRadialGradient(L.x,L.y,R*.62,L.x,L.y,R);
    gr.addColorStop(0,'rgba(255,255,255,0)');gr.addColorStop(.85,'rgba(190,215,235,.08)');gr.addColorStop(1,'rgba(20,40,60,.30)');
    g.fillStyle=gr;g.fillRect(L.x-R,L.y-R,2*R,2*R);
    // broad soft glare, top-left (fixed light 35 deg)
    gr=g.createLinearGradient(L.x-R*.8,L.y-R*.8,L.x,L.y);
    gr.addColorStop(0,'rgba(255,255,255,.22)');gr.addColorStop(1,'rgba(255,255,255,0)');
    g.fillStyle=gr;g.beginPath();g.ellipse(L.x-R*.34,L.y-R*.38,R*.62,R*.38,-.62,0,Math.PI*2);g.fill();
    g.restore();
    // bevel band
    {const b=g.createLinearGradient(L.x-R,L.y-R,L.x+R,L.y+R);b.addColorStop(0,'rgba(255,255,255,.55)');b.addColorStop(.35,'rgba(255,255,255,.08)');b.addColorStop(.7,'rgba(160,200,230,.10)');b.addColorStop(1,'rgba(255,255,255,.4)');g.strokeStyle=b;g.lineWidth=12;g.beginPath();g.arc(L.x,L.y,R-6,0,Math.PI*2);g.stroke()}
    // ---- rim: thin highlight arc + hairline edge + lower caustic arc
    g.save();g.lineCap='round';
    g.strokeStyle='rgba(255,255,255,.28)';g.lineWidth=2;g.beginPath();g.arc(L.x,L.y,R,0,Math.PI*2);g.stroke();
    g.strokeStyle='rgba(10,20,30,.35)';g.lineWidth=1.5;g.beginPath();g.arc(L.x,L.y,R+1.5,0,Math.PI*2);g.stroke();
    // main highlight arc, top-left, tapered by 3 strokes
    const a0=Math.PI*1.08,a1=Math.PI*1.62;
    [[7,.18],[4,.45],[2,.9]].forEach(([w,al],i)=>{g.strokeStyle='rgba(255,255,255,'+al+')';g.lineWidth=w;g.beginPath();g.arc(L.x,L.y,R-7,a0+i*.04,a1-i*.06);g.stroke()});
    // faint opposite caustic, bottom-right
    g.strokeStyle='rgba(210,235,255,.32)';g.lineWidth=3;g.beginPath();g.arc(L.x,L.y,R-9,Math.PI*.08,Math.PI*.34);g.stroke();
    // arrival sweep (impact): a bright spot travelling the rim, <=.15 s
    const ia=Film.since(c,'impact');
    if(ia<.15&&!c.forced){const u=ia/.15,ang=lerp(Math.PI*.95,Math.PI*1.7,u),al=Math.sin(u*Math.PI)*.9;
      g.strokeStyle='rgba(255,255,255,'+al+')';g.lineWidth=5;g.beginPath();g.arc(L.x,L.y,R-3,ang-.18,ang+.18);g.stroke()}
    g.restore();
    // ---- colour well panel (brass tray with one big recessed swatch well + hex readout + mini history dock)
    const T=TRAY;
    g.save();
    g.fillStyle='rgba(0,0,0,.38)';g.filter='blur(16px)';rr(T.x-T.w/2+6,T.y-T.h/2+22,T.w,T.h,30);g.fill();g.filter='none';
    gr=g.createLinearGradient(T.x-T.w/2,T.y-T.h/2,T.x+T.w/2,T.y+T.h/2);gr.addColorStop(0,'#E2C58A');gr.addColorStop(.5,'#B08D57');gr.addColorStop(1,'#7C5F32');
    g.fillStyle=gr;rr(T.x-T.w/2,T.y-T.h/2,T.w,T.h,30);g.fill();
    if(tile&&tile.complete&&tile.naturalWidth){g.save();rr(T.x-T.w/2,T.y-T.h/2,T.w,T.h,30);g.clip();g.globalCompositeOperation='overlay';g.globalAlpha=.4;g.fillStyle=g.createPattern(tile,'repeat');g.fillRect(T.x-T.w/2,T.y-T.h/2,T.w,T.h);g.restore()}
    g.strokeStyle='rgba(255,243,208,.7)';g.lineWidth=2;rr(T.x-T.w/2+1,T.y-T.h/2+1,T.w-2,T.h-2,29);g.stroke();
    const recess=(cx,cy,w,h,r)=>{g.fillStyle='#4A3A1E';rr(cx-w/2,cy-h/2,w,h,r);g.fill();
      gr=g.createLinearGradient(0,cy-h/2,0,cy+h/2);gr.addColorStop(0,'rgba(0,0,0,.55)');gr.addColorStop(1,'rgba(0,0,0,.1)');g.fillStyle=gr;rr(cx-w/2,cy-h/2,w,h,r);g.fill();
      g.save();rr(cx-w/2,cy-h/2,w,h,r);g.clip();g.strokeStyle='rgba(0,0,0,.55)';g.lineWidth=14;g.filter='blur(6px)';rr(cx-w/2,cy-h/2,w,h,r);g.stroke();g.restore();
      g.strokeStyle='rgba(255,236,190,.55)';g.lineWidth=1.5;rr(cx-w/2+8,cy+h/2-1,w-16,2,1);g.stroke()};
    recess(WELL.x,WELL.y,WELL.s,WELL.s,22);
    recess(1170,945,70,50,12);recess(1240,945,70,50,12);
    g.restore();
    // ---- what the well shows
    const dd=Film.cue(c,'drag');let prev=0,pk=0;
    if(c.forced||!c.ev.length){prev=2;pk=1}
    else if(dd[1]&&dd[1].started&&dd[1].u>=.9){prev=2;pk=clamp((dd[1].u-.9)/.1)}
    else if(dd[0]&&dd[0].started&&dd[0].u>=.9){prev=1;pk=clamp((dd[0].u-.9)/.1)}
    if(c.t>=0&&!c.forced&&dd[1]&&dd[1].started&&dd[1].u>=1)pk=1;
    const st=[0,1].map(i=>chipState(c,i,L));
    const seatedIn=(st[1]&&st[1].seated)?2:((st[0]&&st[0].seated&&prev!==2)?1:0);
    if(prev&&!seatedIn){ // flat colour preview, identical to the chip colour
      g.save();g.globalAlpha=pk;g.fillStyle=CHIP[prev-1].c;rr(WELL.x-WELL.s/2+8,WELL.y-WELL.s/2+8,WELL.s-16,WELL.s-16,16);g.fill();g.restore()}
    if(seatedIn)drawChip(WELL.x,WELL.y,CHIP[seatedIn-1],0,1);
    // mini history: chip 1 once the second colour is being picked
    if(prev===2)drawChip(1170,945,CHIP[0],0,0,true);
    if(c.forced||!c.ev.length||(st[1]&&st[1].seated&&false))drawChip(1240,945,CHIP[1],0,0,true);
    // in-flight chip
    [0,1].forEach(i=>{if(st[i]&&!st[i].seated)drawChip(st[i].x,st[i].y,CHIP[i],st[i].air,st[i].grow)});
    // ---- hex readout (58px)
    if(prev){
      g.save();g.font='700 58px '+MONO;g.textAlign='left';g.textBaseline='middle';
      g.globalAlpha=pk;g.fillStyle='rgba(20,16,8,.35)';g.fillText(CHIP[prev-1].hex,872,948);
      g.fillStyle='#FFF8E8';g.fillText(CHIP[prev-1].hex,870,946);g.restore();
    }
    // ---- touch rings
    Film.cue(c,'touch').forEach((q,i)=>{const p=i===0?P0:P1;Film.touch(g,p.x,p.y,q.age)});
  }
});
})();
