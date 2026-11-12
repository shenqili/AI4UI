/* s01 · Toggle -> pudding on a mint oval dish. Jelly is the one dominant material.
   Everything is a pure function of c: pudding wobble = damped springs integrated from t=0 each render (fixed 1/240 s step, driven only by cue times). */
(function(){
let cv,g,R;
const CX=960,DISH_Y=722,XL=690,XR=1230,YB=732;          // layout (px)
const R0=278,R1=230,PH=380,RYK=.27;                      // pudding geometry
const FALL=.14,AIR=46,CFALL=.2;                          // physical durations of the two falls
const tanh=x=>{const e=Math.exp(2*x);return(e-1)/(e+1)};

function ell(x,y,rx,ry){g.beginPath();g.ellipse(x,y,rx,ry,0,0,Math.PI*2)}
function soft(x,y,rx,ry,rgb,a){g.save();g.translate(x,y);g.scale(1,ry/rx);const q=g.createRadialGradient(0,0,0,0,0,rx);
  q.addColorStop(0,'rgba('+rgb+','+a+')');q.addColorStop(.55,'rgba('+rgb+','+a*.5+')');q.addColorStop(1,'rgba('+rgb+',0)');g.fillStyle=q;g.beginPath();g.arc(0,0,rx,0,Math.PI*2);g.fill();g.restore()}

function slidesOf(c){return c.ev.filter(e=>e.type==='slide').sort((a,b)=>a.lt-b.lt)}
function posAt(sl,tau){let p=0;for(let i=0;i<sl.length;i++){const e=sl[i];if(tau<e.lt)break;const u=Film.clamp((tau-e.lt)/e.lenSec),f=i%2,to=1-f;p=f+(to-f)*Film.ease.sio(u)}return p}

/* spring state (lean px, squash z) at scene time t */
function simulate(c,sl){
  const ev=c.ev,dt=1/240,kicks=[];
  ev.forEach(e=>{
    if(e.type==='drop')kicks.push([e.lt+FALL,-2.6]);
    if(e.type==='cherry')kicks.push([e.lt+CFALL,-1.0]);
  });
  sl.forEach((e,i)=>kicks.push([e.lt+e.lenSec,i===0?-3.8:-.7]));
  const wl=2*Math.PI/.34,zl=.34,wz=2*Math.PI/.32,zz=.24;
  let x=0,v=0,z=0,w=0,n=Math.floor(Math.min(c.t,c.dur+.3)/dt);
  for(let i=0;i<n;i++){
    const tau=i*dt;
    const a=(posAt(sl,tau+dt)-2*posAt(sl,tau)+posAt(sl,Math.max(0,tau-dt)))/(dt*dt)*(XR-XL)*(sl.length>1&&tau>=sl[1].lt-.05?.07:.3);
    const hv=sl.length>1&&tau>=sl[1].lt+sl[1].lenSec,fl=hv?.6:zl,fz=hv?.6:zz;v+=(-wl*wl*x-2*fl*wl*v-a)*dt;x+=v*dt;
    w+=(-wz*wz*z-2*fz*wz*w)*dt;
    for(const k of kicks)if(tau<k[0]&&tau+dt>=k[0])w+=k[1];
    z+=w*dt;
  }
  let m=1;if(sl.length>1){const ta=sl[1].lt+sl[1].lenSec;if(c.t>ta)m=c.t>ta+.16?0:Math.exp(-(c.t-ta)/.02)}return{lean:52*tanh(x/52)*m,z:z*m};
}

Film.scene('s01',{
  mount(root,{W,H}){
    cv=document.createElement('canvas');cv.width=W;cv.height=H;cv.style.cssText='position:absolute;left:0;top:0';root.appendChild(cv);g=cv.getContext('2d');
    R=Film.rand('s01',32);
  },
  render(c){
    const W=c.W,H=c.H,t=c.t,forced=c.forced,sl=slidesOf(c);
    /* ---------- state from cues ---------- */
    const pos=forced?1:posAt(sl,t);
    let lean=0,z=0;
    if(!forced){const s=simulate(c,sl);lean=s.lean;z=s.z}
    if(forced)z+=.004*Math.sin(t*2.9);
    const dropQ=Film.cue(c,'drop')[0];
    let air=0,stretch=0;
    if(!forced&&dropQ){const u=Film.clamp((t-dropQ.e.lt)/FALL);air=AIR*(1-u*u);stretch=.05*(u<1?u:0);if(t<dropQ.e.lt)air=AIR}
    z+=stretch;
    let L=0,sweep=-1,halo=0;
    if(forced)L=1;
    else if(c.flipIdx>=0){
      if(c.flipIdx%2===0){L=Film.clamp(c.flipAge/.35);L=Film.ease.sio(L);if(c.flipIdx===0){sweep=Film.clamp((c.flipAge-.04)/.45);halo=Math.max(0,1-c.flipAge/.3)}}
      else L=Film.ease.sio(Film.clamp(1-c.flipAge/.18));
    }
    const xb=XL+(XR-XL)*pos,yb=YB-air;

    /* ---------- backdrop (static) ---------- */
    let q=g.createLinearGradient(0,0,0,H);q.addColorStop(0,'#F7E9D3');q.addColorStop(.46,'#FBF3E6');q.addColorStop(1,'#F4E5CD');g.fillStyle=q;g.fillRect(0,0,W,H);
    soft(560,330,900,600,'255,255,255',.5);
    soft(1560,980,800,260,'200,150,90',.10);

    /* ---------- dish ---------- */
    const DRX=720,DRY=190,TH=46;
    soft(CX+40,DISH_Y+TH+92,860,220,'110,70,30',.26);
    q=g.createLinearGradient(CX-DRX,0,CX+DRX,0);q.addColorStop(0,'#B6E6D8');q.addColorStop(.55,'#92CDBC');q.addColorStop(1,'#6FB09E');
    g.fillStyle=q;ell(CX,DISH_Y+TH,DRX,DRY);g.fill();g.fillRect(CX-DRX,DISH_Y,2*DRX,TH);
    q=g.createLinearGradient(CX-DRX,DISH_Y-DRY,CX+DRX,DISH_Y+DRY);q.addColorStop(0,'#E4F8F1');q.addColorStop(.5,'#C3EADF');q.addColorStop(1,'#A6D6C8');
    g.fillStyle=q;ell(CX,DISH_Y,DRX,DRY);g.fill();
    // rim highlight, upper-left
    g.save();ell(CX,DISH_Y,DRX,DRY);g.clip();g.strokeStyle='rgba(255,255,255,.7)';g.lineWidth=5;g.beginPath();g.ellipse(CX,DISH_Y+3,DRX-6,DRY-6,0,Math.PI*.92,Math.PI*1.38);g.stroke();g.restore();
    // well
    const WRX=655,WRY=158,WY=DISH_Y+8;
    g.fillStyle='#8FC8B7';ell(CX,WY,WRX,WRY);g.fill();
    g.save();ell(CX,WY,WRX,WRY);g.clip();
    q=g.createLinearGradient(0,WY-WRY,0,WY+WRY);q.addColorStop(0,'#B4E1D3');q.addColorStop(1,'#D3F0E6');g.fillStyle=q;ell(CX+14,WY+18,WRX,WRY);g.fill();
    // pads (the two toggle states)
    // connected groove (slider track) joining the two states
    const gv=()=>{g.beginPath();g.ellipse(XL,YB+4,300,80,0,Math.PI*.5,Math.PI*1.5);g.lineTo(XR,YB+4-80);g.ellipse(XR,YB+4,300,80,0,-Math.PI*.5,Math.PI*.5);g.closePath()};
    g.fillStyle="rgba(60,130,110,.12)";gv();g.fill();g.strokeStyle="rgba(255,255,255,.4)";g.lineWidth=3;g.beginPath();g.moveTo(XL,YB+4+80+3);g.lineTo(XR,YB+4+80+3);g.stroke();g.strokeStyle="rgba(40,100,85,.18)";g.lineWidth=3;g.beginPath();g.moveTo(XL,YB+4-80);g.lineTo(XR,YB+4-80);g.stroke();
    [[XL,0],[XR,1]].forEach(([px,on])=>{
      const lit=on?L:0;
      g.fillStyle='rgba(60,130,110,'+(.10+.05*(1-lit))+')';ell(px,YB+4,300,80);g.fill();
      g.strokeStyle='rgba(255,255,255,.45)';g.lineWidth=3;g.beginPath();g.ellipse(px,YB+7,300,80,0,.15,Math.PI-.15);g.stroke();
      if(on&&lit>0){g.strokeStyle='rgba(242,170,60,'+(.85*lit)+')';g.lineWidth=5;ell(px,YB+4,300,80);g.stroke()}
    });
    // warm pooled light in the dish (R<=330, alpha<=.25)
    if(L>0){const wt2=g.createRadialGradient(XR,YB,0,XR,YB,330);wt2.addColorStop(0,'rgba(255,196,110,'+(.22*L)+')');wt2.addColorStop(1,'rgba(255,196,110,0)');g.fillStyle=wt2;g.fillRect(XR-340,YB-340,680,680);
      g.globalCompositeOperation='screen';const sg=g.createRadialGradient(XR,YB,0,XR,YB,330);sg.addColorStop(0,'rgba(255,214,140,'+(.25*L)+')');sg.addColorStop(1,'rgba(255,214,140,0)');g.fillStyle=sg;g.fillRect(XR-340,YB-340,680,680);g.globalCompositeOperation='source-over'}
    g.restore();
    // well front lip shadow
    g.save();ell(CX,WY,WRX,WRY);g.clip();g.strokeStyle='rgba(40,100,85,.25)';g.lineWidth=8;g.beginPath();g.ellipse(CX,WY,WRX+2,WRY+2,0,Math.PI*1.02,Math.PI*1.7);g.stroke();g.restore();

    /* ---------- pudding geometry ---------- */
    const H2=PH*(1+z),wf=1-.7*z,xt=xb+lean,yt=yb-H2;
    const w=s=>(R0+(R1-R0)*s)*wf+9*Math.sin(Math.PI*s);
    const cxs=s=>xb+lean*s*s,ys=s=>yb+(yt-yb)*s;
    const w0=w(0),wt=w(1),ryb=RYK*w0,ryt=RYK*wt;
    const bodyPath=()=>{
      g.beginPath();
      for(let i=0;i<=24;i++){const th=Math.PI*i/24;g.lineTo(xb+w0*Math.cos(th),yb+ryb*Math.sin(th))}
      for(let i=1;i<=20;i++){const s=i/20;g.lineTo(cxs(s)-w(s),ys(s))}
      for(let i=1;i<=24;i++){const th=Math.PI+Math.PI*i/24;g.lineTo(xt+wt*Math.cos(th),yt+ryt*Math.sin(th))}
      for(let i=19;i>=0;i--){const s=i/20;g.lineTo(cxs(s)+w(s),ys(s))}
      g.closePath();
    };

    /* shadows on dish */
    const hk=1-air/AIR*.6;                                // lighter and wider while airborne
    soft(xb+50,YB+28,w0*1.28+air,ryb*1.55+air*.3,'80,45,10',.30*hk);
    soft(xb+10,YB+8,w0*1.04,ryb*1.12,'70,35,5',.58*hk);soft(xb,YB+ryb*.55,w0*.98,ryb*.5,'40,20,0',.35*hk);

    /* body */
    g.save();bodyPath();g.clip();
    q=g.createLinearGradient(xb-w0,0,xb+w0,0);q.addColorStop(0,'#FFEBAE');q.addColorStop(.32,'#FAD873');q.addColorStop(.74,'#F0BE4B');q.addColorStop(1,'#D69A31');
    g.fillStyle=q;g.fillRect(xb-w0-40,yt-ryt-10,2*w0+80+Math.abs(lean),PH*1.3);
    let sg=g.createRadialGradient(xb,yb-6,0,xb,yb-6,w0*1.15);sg.addColorStop(0,'rgba(255,140,40,.42)');sg.addColorStop(1,'rgba(255,140,40,0)');
    g.fillStyle=sg;g.fillRect(xb-w0-20,yt-ryt,2*w0+40+Math.abs(lean),PH*1.3);
    q=g.createLinearGradient(xb+.15*w0,0,xb+w0,0);q.addColorStop(0,'rgba(150,80,10,0)');q.addColorStop(1,'rgba(150,80,10,.30)');g.fillStyle=q;g.fillRect(xb,yt-ryt,w0+40,PH*1.3);
    if(L>0){g.fillStyle='rgba(255,170,70,'+(.13*L)+')';g.fillRect(xb-w0-20,yt-ryt,2*w0+60,PH*1.3)}
    // translucent bottom edge (light passes through the jelly)
    g.strokeStyle='rgba(255,236,170,.55)';g.lineWidth=5;g.beginPath();g.ellipse(xb,yb-3,w0-6,ryb-3,0,.1,Math.PI-.1);g.stroke();
    g.restore();
    // body soft outline
    g.strokeStyle='rgba(160,95,20,.30)';g.lineWidth=2;bodyPath();g.stroke();

    // specular streak (follows the form, left side)
    g.save();bodyPath();g.clip();
    g.beginPath();
    for(let i=0;i<=14;i++){const s=.06+.72*i/14,tp=Math.sin(Math.PI*i/14)*10+2;g.lineTo(cxs(s)-.74*w(s)-tp*.5,ys(s))}
    for(let i=14;i>=0;i--){const s=.06+.72*i/14,tp=Math.sin(Math.PI*i/14)*10+2;g.lineTo(cxs(s)-.74*w(s)+tp,ys(s))}
    g.closePath();
    q=g.createLinearGradient(0,yb,0,yt);q.addColorStop(0,'rgba(255,255,255,0)');q.addColorStop(.25,'rgba(255,255,255,.75)');q.addColorStop(.8,'rgba(255,255,255,.6)');q.addColorStop(1,'rgba(255,255,255,0)');
    g.fillStyle=q;g.fill();
    g.fillStyle='rgba(255,255,255,.7)';ell(cxs(.9)-.74*w(.9)-4,ys(.9)+6,6,9);g.fill();
    g.restore();

    /* caramel cap with drips */
    g.save();bodyPath();g.clip();
    const edge=xn=>{let d=34;for(let k=0;k<6;k++){const cc=-.8+.32*k+(R[k]-.5)*.1,ww=.11+.05*R[6+k],D=22+80*R[12+k],u=(xn-cc)/ww;if(Math.abs(u)<1)d=Math.max(d,D*Math.pow(1-u*u,.6)+22)}return d};
    const ex=xn=>xt+xn*wt*1.0, ey=xn=>yt+ryt*Math.sqrt(Math.max(0,1-xn*xn))+edge(xn)*(1-.35*Math.abs(xn)*Math.abs(xn));
    g.beginPath();g.moveTo(xt-1.3*wt,yt);
    for(let xn=-1.3;xn<=1.3001;xn+=.02)g.lineTo(ex(xn),ey(xn));
    g.lineTo(xt+1.3*wt,yt);g.closePath();
    q=g.createLinearGradient(0,yt-ryt,0,yt+ryt+90);q.addColorStop(0,'#E9A64D');q.addColorStop(.5,'#C77A25');q.addColorStop(1,'#9A4C12');
    g.fillStyle=q;
    g.beginPath();g.moveTo(xt-1.3*wt,yt);for(let xn=-1.3;xn<=1.3001;xn+=.02)g.lineTo(ex(xn),ey(xn));g.lineTo(xt+1.3*wt,yt);g.closePath();g.fill();
    g.fillStyle='#D58A30';ell(xt,yt,wt,ryt);g.fill();g.strokeStyle='rgba(255,226,150,.55)';g.lineWidth=5;g.beginPath();g.ellipse(xt,yt,wt-3,ryt-2,0,Math.PI*.5,Math.PI-.12);g.stroke();
    // glossy top surface
    sg=g.createRadialGradient(xt-.18*wt,yt-.15*ryt,0,xt-.18*wt,yt-.15*ryt,wt*.95);sg.addColorStop(0,'rgba(255,214,120,.95)');sg.addColorStop(.6,'rgba(214,134,40,.35)');sg.addColorStop(1,'rgba(150,70,10,0)');
    g.save();g.translate(0,0);ell(xt,yt,wt,ryt);g.clip();g.fillStyle=sg;g.fillRect(xt-wt,yt-ryt,2*wt,2*ryt);
    g.strokeStyle='rgba(255,236,170,.75)';g.lineWidth=4;g.beginPath();g.ellipse(xt,yt+1,wt-6,ryt-4,0,Math.PI*1.02,Math.PI*1.42);g.stroke();
    // ON sweep: one highlight band crossing the caramel
    if(sweep>0&&sweep<1){const bx=xt-1.2*wt+2.4*wt*Film.ease.eo(sweep),ga=Math.sin(Math.PI*sweep);
      const bg=g.createLinearGradient(bx-70,yt-20,bx+70,yt+20);bg.addColorStop(0,'rgba(255,250,225,0)');bg.addColorStop(.5,'rgba(255,250,225,'+(.8*ga)+')');bg.addColorStop(1,'rgba(255,250,225,0)');
      g.fillStyle=bg;g.fillRect(xt-wt,yt-ryt,2*wt,2*ryt)}
    g.restore();
    // drip rim + drip gloss
    g.strokeStyle='rgba(100,45,5,.38)';g.lineWidth=2;g.beginPath();for(let xn=-1.0;xn<=1.0001;xn+=.02){const x=ex(xn),y=ey(xn);xn<=-.9999?g.moveTo(x,y):g.lineTo(x,y)}g.stroke();
    for(let k=0;k<6;k++){const cc=-.8+.32*k+(R[k]-.5)*.1,D=22+80*R[12+k];if(Math.abs(cc)>.9)continue;const x=ex(cc-.03),y=ey(cc)-D*.45;g.fillStyle='rgba(255,230,160,.5)';ell(x,y,4,Math.max(5,D*.28));g.fill()}
    g.restore();
    // hero halo on the caramel (local, <=325 px, <=25 %, fades in 0.3 s)
    if(halo>0){g.save();g.globalCompositeOperation='screen';const hg=g.createRadialGradient(xt,yt,0,xt,yt,320);hg.addColorStop(0,'rgba(255,225,150,'+(.25*halo)+')');hg.addColorStop(1,'rgba(255,225,150,0)');g.fillStyle=hg;g.fillRect(xt-330,yt-330,660,660);g.restore()}

    /* ---------- cherry ---------- */
    const cq=Film.cue(c,'cherry')[0];
    let cherry=forced,lift=0,sink=0;
    if(cq&&cq.started){cherry=true;const ta=cq.age;if(ta<CFALL){const u=ta/CFALL;lift=190*(1-u*u)}else{const tb=ta-CFALL;sink=tb>1.2?0:7*Math.exp(-tb/.13)*Math.sin(2*Math.PI*tb/.34)}}
    if(cherry){
      const r=46,cx=xt,cy=yt-36+sink-lift;
      soft(cx+12,yt+6,r*1.05,r*.34,'60,20,0',.45*(1-Math.min(1,lift/120)));
      g.strokeStyle='#5C3A1C';g.lineWidth=5;g.lineCap='round';g.beginPath();g.moveTo(cx+2,cy-r+6);g.quadraticCurveTo(cx+10,cy-r-34,cx+40,cy-r-54);g.stroke();
      const cg=g.createRadialGradient(cx-.35*r,cy-.4*r,2,cx-.1*r,cy-.1*r,r*1.2);cg.addColorStop(0,'#F0485C');cg.addColorStop(.5,'#C8102E');cg.addColorStop(1,'#6E0818');
      g.fillStyle=cg;g.beginPath();g.moveTo(cx,cy-r+4);g.bezierCurveTo(cx+r*1.05,cy-r*.9,cx+r*1.0,cy+r*.95,cx,cy+r);g.bezierCurveTo(cx-r*1.0,cy+r*.95,cx-r*1.05,cy-r*.9,cx,cy-r+4);g.fill();
      g.fillStyle='rgba(255,255,255,.85)';g.beginPath();g.ellipse(cx-.42*r,cy-.38*r,r*.2,r*.32,-.55,0,Math.PI*2);g.fill();
      g.strokeStyle='rgba(255,120,120,.35)';g.lineWidth=3;g.beginPath();g.arc(cx,cy,r-4,.25,1.1);g.stroke();
      g.fillStyle='rgba(60,0,10,.25)';g.beginPath();g.ellipse(cx,cy-r+8,9,4,0,0,Math.PI*2);g.fill();
    }

    /* ---------- touch ring (last) ---------- */
    Film.cue(c,'touch').forEach((tq,i)=>{
      const px=XL+(XR-XL)*posAt(sl,tq.e.lt),dir=i%2===0?-1:1;
      Film.touch(g,px+dir*(R0*.78),YB-110,tq.age);
    });
  }
});
})();
