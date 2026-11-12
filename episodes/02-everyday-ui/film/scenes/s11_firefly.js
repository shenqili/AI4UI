/* s11 · Rating -> open-mouth firefly jar. Procedural glass jar (back wall, fireflies, front wall, highlights, lip). Pure function of c. */
(function(){
const S=1.4, AX=960, AY=840, DX=960, DY=780;           // design->world: X=AX+(x-DX)*S, Y=AY+(y-DY)*S
const RIMY=318, RX=108, RY=24;                          // jar mouth (design space)
const FLY=.4;                                           // seconds of one flight
const SLOT=[[905,625],[1025,600],[930,540],[1020,505],[968,455]];
const LAB={x:960,y:704,w:322,h:92,r:28,gap:60};
let cv,g,plate,ctxk;
const E=Film.ease, clamp=Film.clamp, lerp=Film.lerp;
const eo=E.eo, sio=E.sio;
let rr, leaves;
const W2=(x,y)=>[AX+(x-DX)*S, AY+(y-DY)*S];
const toD=(X,Y)=>[DX+(X-AX)/S, DY+(Y-AY)/S];

function jarPath(){
  g.beginPath();
  g.moveTo(DX-RX,RIMY);
  g.lineTo(852,356);
  g.bezierCurveTo(852,398,795,396,795,444);
  g.lineTo(795,780);
  g.ellipse(DX,780,165,24,0,Math.PI,0,true);
  g.lineTo(1125,444);
  g.bezierCurveTo(1125,396,1068,398,1068,356);
  g.lineTo(DX+RX,RIMY);
  g.ellipse(DX,RIMY,RX,RY,0,0,Math.PI,true);
  g.closePath();
}
function leaf(x,y,len,w,ang){
  const c=Math.cos(ang),s=Math.sin(ang),px=(u,v)=>[x+u*c-v*s,y+u*s+v*c];
  const a=px(len*.35,-w),b=px(len*.8,-w*.7),t=px(len,0),d=px(len*.8,w*.7),e=px(len*.35,w);
  g.moveTo(x,y);g.bezierCurveTo(a[0],a[1],b[0],b[1],t[0],t[1]);g.bezierCurveTo(d[0],d[1],e[0],e[1],x,y);
}
function star(cx,cy,R,r){
  g.beginPath();
  for(let i=0;i<10;i++){const a=-Math.PI/2+i*Math.PI/5,q=i%2?r:R;g[i?'lineTo':'moveTo'](cx+Math.cos(a)*q,cy+Math.sin(a)*q)}
  g.closePath();
}
function glow(x,y,r,a,col){
  const gr=g.createRadialGradient(x,y,0,x,y,r);
  gr.addColorStop(0,'rgba('+col+','+a+')');gr.addColorStop(.35,'rgba('+col+','+a*.35+')');gr.addColorStop(1,'rgba('+col+',0)');
  g.fillStyle=gr;g.fillRect(x-r,y-r,r*2,r*2);
}

// firefly position (design space) at time t since fly start index i
function flyPos(i,u){
  const j=rr[i*4]-.5, k=rr[i*4+1]-.5, d0=toD(1800+j*120,980), d1=toD(1850+k*140,260), d2=toD(1040+j*140,150+k*80);
  const P0=d0,P1=d1,P2=d2,P3=SLOT[i];
  const m=1-u, a=m*m*m,b=3*m*m*u,cc=3*m*u*u,d=u*u*u;
  return [a*P0[0]+b*P1[0]+cc*P2[0]+d*P3[0], a*P0[1]+b*P1[1]+cc*P2[1]+d*P3[1]];
}
function drift(i,t){
  const A=20+rr[8+i]*10, w1=.32+rr[12+i]*.25, w2=.41+rr[16+i]*.25, p1=rr[20+i]*6.28, p2=rr[24+i]*6.28;
  return [Math.sin(w1*t+p1)*A, Math.sin(w2*t+p2)*A*.8];
}
function restPos(i,t,tl){
  const d=drift(i,t),d0=drift(i,tl);
  return [SLOT[i][0]+d[0]-d0[0], SLOT[i][1]+d[1]-d0[1]];
}
const PERCH_I=1, RIM=[1036,RIMY+RY*.97];

Film.scene('s11',{
  mount(root,{W,H}){
    cv=document.createElement('canvas');cv.width=W;cv.height=H;cv.style.cssText='position:absolute;left:0;top:0';root.appendChild(cv);g=cv.getContext('2d');
    plate=Film.img('assets/night_garden_plate.png');
    rr=Film.rand('s11',32);
    // near leaves (design space), left and right foreground
    leaves=[];
    const q=Film.rand('s11leaf',40);
    const L=[[300,950,300,56,-1.0],[330,960,340,60,-.62],[280,960,260,48,-1.35],[400,990,300,52,-.3],[450,960,230,44,-.9],
             [1630,950,320,58,-2.15],[1590,980,340,60,-2.5],[1660,970,260,50,-1.8],[1520,1000,300,52,-2.85],[1500,960,220,44,-2.25]];
    L.forEach((l,i)=>leaves.push({x:l[0],y:l[1],len:l[2],w:l[3],a:l[4]+(q[i]-.5)*.12}));
  },
  render(c){
    const W=c.W,H=c.H,t=c.t;
    const flies=c.forced?[-9,-9,-9,-9,-9]:c.ev.filter(e=>e.type==='fly').map(e=>e.lt);
    while(flies.length<5)flies.push(1e4);
    const perchT=c.forced?-9:(c.ev.find(e=>e.type==='perch')||{lt:1e4}).lt;
    const land=flies.map(f=>f+FLY);
    const lit=land.map(l=>c.forced?1:eo(clamp((t-l)/.3)));
    const lvl=lit.reduce((a,b)=>a+b,0);
    const imp=c.forced?9:Film.since(c,'impact');
    const hero=c.forced?9:Math.max(0,t-land[4]);

    // ---- world background ----
    g.fillStyle='#0B1424';g.fillRect(0,0,W,H);
    if(plate&&plate.complete&&plate.naturalWidth){g.globalAlpha=1;g.drawImage(plate,0,0,W,H)}
    else{const gr=g.createRadialGradient(960,540,100,960,540,1100);gr.addColorStop(0,'#10233A');gr.addColorStop(1,'#0B1424');g.fillStyle=gr;g.fillRect(0,0,W,H)}
    // ambient light on the plate (restrained, <= 1.3x jar height)
    g.save();g.globalCompositeOperation='lighter';
    const jc=W2(962,560),ia=.03+.26*(lvl/5)+(hero<.3?.12*(1-hero/.3):0);
    glow(jc[0],jc[1],640,ia,'110,170,60');
    g.restore();

    // ---- design-space content ----
    g.save();g.translate(AX,AY);g.scale(S,S);g.translate(-DX,-DY);
    const lf=clamp((lvl-3.2)/1.8), sl=.06+.94*Math.pow(lvl/5,1.15);

    // near leaves (lit by jar)
    leaves.forEach(l=>{
      g.beginPath();leaf(l.x,l.y,l.len,l.w,l.a);
      const lc=W2(0,0);
      const gr=g.createRadialGradient(DX,560,40,DX,560,720);
      const A=.15+.85*lf;
      gr.addColorStop(0,'rgba('+Math.round(70+90*A)+','+Math.round(100+110*A)+','+Math.round(50+20*A)+',1)');
      gr.addColorStop(.5,'rgb('+Math.round(22+30*lf)+','+Math.round(48+40*lf)+','+Math.round(40+10*lf)+')');
      gr.addColorStop(1,'#12281F');
      g.fillStyle=gr;g.fill();
      g.strokeStyle='rgba(8,18,16,.5)';g.lineWidth=1.5;g.stroke();
    });

    // stool legs
    const wood=(x0,x1)=>{const gr=g.createLinearGradient(x0,0,x1,0);gr.addColorStop(0,'#7A5636');gr.addColorStop(1,'#3F2A18');return gr};
    g.fillStyle=wood(720,800);
    g.beginPath();g.moveTo(745,820);g.lineTo(790,850);g.lineTo(745,960);g.lineTo(715,960);g.closePath();g.fill();
    g.fillStyle=wood(1120,1200);
    g.beginPath();g.moveTo(1175,820);g.lineTo(1130,850);g.lineTo(1175,960);g.lineTo(1205,960);g.closePath();g.fill();
    g.fillStyle='#2F1F12';
    g.beginPath();g.moveTo(930,845);g.lineTo(990,845);g.lineTo(1000,935);g.lineTo(920,935);g.closePath();g.fill();
    // stool top: side band + top ellipse
    const TX=DX,TY=770,TRX=280,TRY=46,TH=36;
    let gr=g.createLinearGradient(TX-TRX,0,TX+TRX,0);gr.addColorStop(0,'#7A5636');gr.addColorStop(.45,'#6B4A2E');gr.addColorStop(1,'#33220F');
    g.fillStyle=gr;
    g.beginPath();g.moveTo(TX-TRX,TY);g.lineTo(TX-TRX,TY+TH);g.ellipse(TX,TY+TH,TRX,TRY,0,Math.PI,0,true);g.lineTo(TX+TRX,TY);g.closePath();g.fill();
    g.fillStyle='#8A6440';g.beginPath();g.ellipse(TX,TY,TRX,TRY,0,0,Math.PI*2);g.fill();
    // top lighting + grain
    g.save();g.beginPath();g.ellipse(TX,TY,TRX,TRY,0,0,Math.PI*2);g.clip();
    gr=g.createLinearGradient(0,TY-TRY,0,TY+TRY);gr.addColorStop(0,'rgba(255,230,190,.22)');gr.addColorStop(1,'rgba(0,0,0,.25)');g.fillStyle=gr;g.fillRect(TX-TRX,TY-TRY,TRX*2,TRY*2);
    g.strokeStyle='rgba(60,36,16,.22)';g.lineWidth=1.4;
    for(let i=-5;i<=5;i++){g.beginPath();g.ellipse(TX+i*55,TY+4,190+i*5,38,0,.1,Math.PI-.1);g.stroke()}
    // firefly light pooling on wood
    g.globalCompositeOperation='lighter';
    const pg=g.createRadialGradient(TX,TY,0,TX,TY,300);pg.addColorStop(0,'rgba(215,242,90,'+(.05+.3*sl*sl)+')');pg.addColorStop(1,'rgba(215,242,90,0)');
    g.fillStyle=pg;g.fillRect(TX-TRX,TY-TRY,TRX*2,TRY*2);
    g.restore();
    g.strokeStyle='rgba(255,224,180,.35)';g.lineWidth=1.5;g.beginPath();g.ellipse(TX,TY,TRX,TRY,0,Math.PI*1.02,Math.PI*1.7);g.stroke();
    // contact shadow under the jar
    g.save();g.fillStyle='rgba(0,0,0,.5)';g.beginPath();g.ellipse(DX+14,782,182,30,0,0,Math.PI*2);g.fill();g.restore();
    // green light reflected through the glass onto the stool
    g.save();g.globalCompositeOperation='lighter';
    gr=g.createRadialGradient(DX,790,10,DX,790,220);gr.addColorStop(0,'rgba(215,242,90,'+(.55*sl)+')');gr.addColorStop(1,'rgba(215,242,90,0)');
    g.fillStyle=gr;g.beginPath();g.ellipse(DX,790,230,44,0,0,Math.PI*2);g.fill();g.restore();

    // ---- JAR: back wall ----
    g.save();jarPath();
    gr=g.createLinearGradient(0,RIMY,0,780);gr.addColorStop(0,'rgba(110,150,165,.10)');gr.addColorStop(1,'rgba(20,45,55,.34)');
    g.fillStyle=gr;g.fill();
    g.clip();
    // inside glass back-wall brightening from light
    g.globalCompositeOperation='lighter';
    const ic=(.04+.5*sl);
    glow(962,560,300,ic*.28,'180,225,80');
    // inner back rim of mouth seen through
    g.restore();
    g.save();
    g.strokeStyle='rgba(191,216,230,.28)';g.lineWidth=2;g.beginPath();g.ellipse(DX,RIMY,RX,RY,0,Math.PI,Math.PI*2);g.stroke();
    g.restore();

    // ---- fireflies helper ----
    const FF=(x,y,a,ang,sc,ph,body)=>{
      const bl=.9+.1*Math.sin(t*3.2+ph);
      g.save();g.globalCompositeOperation='lighter';
      glow(x,y,36*sc,.8*a*bl,'200,240,70');
      g.restore();
      g.save();g.translate(x,y);g.rotate(ang);
      if(body){
        g.fillStyle='rgba(18,24,18,'+a+')';g.beginPath();g.ellipse(-9*sc,0,12*sc,5*sc,0,0,Math.PI*2);g.fill();
        g.fillStyle='rgba(191,216,230,'+.35*a+')';g.beginPath();g.ellipse(-12*sc,-6*sc,12*sc,4.5*sc,-.35,0,Math.PI*2);g.fill();
        g.beginPath();g.ellipse(-8*sc,-8*sc,10*sc,3.5*sc,-.7,0,Math.PI*2);g.fill();
      }
      g.fillStyle='rgba(225,250,120,'+a+')';g.beginPath();g.ellipse(6*sc,0,8*sc,5.5*sc,0,0,Math.PI*2);g.fill();
      g.fillStyle='rgba(255,255,230,'+a*bl+')';g.beginPath();g.ellipse(7*sc,0,4.5*sc,3*sc,0,0,Math.PI*2);g.fill();
      g.restore();
    };
    const front=[];
    for(let i=0;i<5;i++){
      const dt=t-flies[i];
      if(dt<0)continue;
      let x,y,a=1,ang=0,sc=1;
      if(dt<FLY){
        const u=dt/FLY,uu=sio(u)*.35+u*.65;
        [x,y]=flyPos(i,uu);
        const [xb,yb]=flyPos(i,Math.min(1,uu+.02));
        ang=Math.atan2(yb-y,xb-x);
        a=clamp(dt/.08);
        // trail
        for(let k=1;k<=12;k++){const p=flyPos(i,Math.max(0,uu-k*.016));g.save();g.globalCompositeOperation='lighter';glow(p[0],p[1],34*(1-k/15),.2*(1-k/13)*a,'200,240,70');g.restore()}
      }else{
        [x,y]=restPos(i,t,land[i]);
        ang=-.5+.4*Math.sin(t*.7+i);
        if(i===PERCH_I&&t>=perchT){
          const s=sio((t-perchT)/.65);
          const mid=[1062,392];
          // up the inner wall to the lip
          const uu=s,p0=[x,y];
          const bx=(1-uu)*(1-uu)*p0[0]+2*(1-uu)*uu*mid[0]+uu*uu*RIM[0], by=(1-uu)*(1-uu)*p0[1]+2*(1-uu)*uu*mid[1]+uu*uu*RIM[1];
          x=bx;y=by;ang=lerp(ang,-.15,s);
        }
      }
      const item=[x,y,a,ang,sc,i*1.7,true];
      if(y<RIMY+4||(i===PERCH_I&&t>=perchT&&y<RIMY+10))front.push(item);else FF(...item);
    }

    // ---- JAR: front wall ----
    g.save();jarPath();
    gr=g.createLinearGradient(795,0,1125,0);
    gr.addColorStop(0,'rgba(191,216,230,.2)');gr.addColorStop(.12,'rgba(191,216,230,.03)');gr.addColorStop(.6,'rgba(191,216,230,.01)');gr.addColorStop(.9,'rgba(191,216,230,.04)');gr.addColorStop(1,'rgba(191,216,230,.22)');
    g.fillStyle=gr;g.fill();
    g.clip();
    // green internal tint from the light
    g.globalCompositeOperation='lighter';
    gr=g.createLinearGradient(795,0,1125,0);gr.addColorStop(0,'rgba(215,242,90,'+.16*sl+')');gr.addColorStop(.5,'rgba(215,242,90,0)');gr.addColorStop(1,'rgba(215,242,90,'+.12*sl+')');
    g.fillStyle=gr;g.fillRect(780,RIMY,360,480);
    g.globalCompositeOperation='source-over';
    // base thickness (heavy glass bottom)
    gr=g.createLinearGradient(0,742,0,806);gr.addColorStop(0,'rgba(191,216,230,0)');gr.addColorStop(1,'rgba(191,216,230,.22)');
    g.fillStyle=gr;g.fillRect(780,742,360,70);
    g.restore();
    // outline
    g.save();jarPath();g.strokeStyle='rgba(205,228,240,.5)';g.lineWidth=2.4;g.stroke();g.restore();
    // highlights: two vertical strips (left), one shoulder arc, thin right edge light
    g.save();
    g.lineCap='round';
    g.strokeStyle='rgba(235,247,255,.55)';g.lineWidth=11;g.beginPath();g.moveTo(822,480);g.lineTo(822,700);g.stroke();
    g.strokeStyle='rgba(235,247,255,.28)';g.lineWidth=5;g.beginPath();g.moveTo(842,500);g.lineTo(842,660);g.stroke();
    g.strokeStyle='rgba(235,247,255,.42)';g.lineWidth=5;g.beginPath();g.moveTo(823,444);g.bezierCurveTo(826,410,846,392,866,382);g.stroke();
    g.strokeStyle='rgba(215,240,255,.3)';g.lineWidth=3;g.beginPath();g.moveTo(1103,470);g.lineTo(1103,690);g.stroke();
    g.restore();
    // mouth: lip thickness, front arc brighter
    g.save();
    g.strokeStyle='rgba(215,236,248,.5)';g.lineWidth=2;g.beginPath();g.ellipse(DX,RIMY,RX,RY,0,0,Math.PI*2);g.stroke();
    g.strokeStyle='rgba(215,236,248,.28)';g.lineWidth=2;g.beginPath();g.ellipse(DX,RIMY+1,RX-8,RY-6,0,0,Math.PI*2);g.stroke();
    g.strokeStyle='rgba(235,247,255,.75)';g.lineWidth=6;g.lineCap='round';g.beginPath();g.ellipse(DX,RIMY+4,RX-1,RY-1,0,.25,1.5);g.stroke();
    g.strokeStyle='rgba(215,236,248,.35)';g.lineWidth=5;g.beginPath();g.ellipse(DX,RIMY+4,RX-1,RY-1,0,1.9,2.9);g.stroke();
    // glow spilling out of the open mouth
    g.globalCompositeOperation='lighter';
    glow(DX,RIMY-6,230,.04+.30*sl+(imp<.3?.2*(1-imp/.3):0),'200,235,90');
    g.restore();
    // exterior fireflies (in flight / on lip), in front of glass
    front.forEach(f=>FF(...f));

    // ---- label with five stars ----
    g.save();
    const lx=LAB.x-LAB.w/2,ly=LAB.y-LAB.h/2;
    g.shadowColor='rgba(0,0,0,.4)';g.shadowBlur=8;g.shadowOffsetY=3;
    g.fillStyle='#5E5A4A';g.beginPath();g.roundRect(lx,ly,LAB.w,LAB.h,7);g.fill();
    g.shadowColor='transparent';
    gr=g.createLinearGradient(0,ly,0,ly+LAB.h);gr.addColorStop(0,'#7F7860');gr.addColorStop(1,'#5F5A48');
    g.fillStyle=gr;g.beginPath();g.roundRect(lx,ly,LAB.w,LAB.h,7);g.fill();
    g.globalCompositeOperation='lighter';g.fillStyle='rgba(215,242,90,'+(.02+.04*sl)+')';g.fillRect(lx,ly,LAB.w,LAB.h);
    g.globalCompositeOperation='source-over';
    for(let k=0;k<5;k++){
      const sx=LAB.x+(k-2)*LAB.gap,sy=LAB.y,a=lit[k];
      star(sx,sy,LAB.r,LAB.r*.45);g.fillStyle='rgba(36,32,22,.7)';g.fill();
      if(a>0){
        g.save();g.globalCompositeOperation='lighter';glow(sx,sy,40,.5*a,'215,242,90');g.restore();
        star(sx,sy,LAB.r,LAB.r*.45);g.fillStyle='rgba(222,248,100,'+a+')';g.fill();
        star(sx,sy,LAB.r*.55,LAB.r*.25);g.fillStyle='rgba(255,255,225,'+.8*a+')';g.fill();
      }
    }
    g.restore();
    g.restore(); // end design-space transform

    // soft vignette on edges only (static)
    gr=g.createRadialGradient(960,540,520,960,540,1250);gr.addColorStop(0,'rgba(5,10,20,0)');gr.addColorStop(1,'rgba(5,10,20,.45)');
    g.fillStyle=gr;g.fillRect(0,0,W,H);

    // touch ring on the fifth star
    const tp=W2(LAB.x+2*LAB.gap,LAB.y);
    Film.cue(c,'touch').forEach(q=>Film.touch(g,tp[0],tp[1],q.age));
  }
});
})();
