/* s09 Refresh · 卷帘 — linen roller blind, pull-tab, roll-up reveals a morning sky. All motion = f(c). */
(function(){
const OX0=500,OX1=1420,OY0=160,OY1=830;           // window opening
const FX0=460,FX1=1460,FY0=120,FY1=870;            // frame outer
const CX0=512,CX1=1408,CY=206;                     // cloth span / roller axis
const HEMH=16,SKIRT=74,LEN=502,R0=20,TH=6;         // hem band, skirt left when rolled, cloth length, wood radius, wrap thickness
const TABX=960;
const clamp=Film.clamp,lerp=Film.lerp,sio=Film.ease.sio,eo=Film.ease.eo;
let cv,g,linen,plate,sky;               // sky = {m,d} offscreens built once the plate is loaded
let staticL,pat=null,patImg=null;

function mk(w,h){const o=document.createElement('canvas');o.width=w;o.height=h;return o}
function rr(x,y,w,h,r){const p=new Path2D();p.roundRect(x,y,w,h,r);return p}
const mix=(a,b,t)=>a+(b-a)*t;
function mixC(a,b,t){return 'rgb('+Math.round(mix(a[0],b[0],t))+','+Math.round(mix(a[1],b[1],t))+','+Math.round(mix(a[2],b[2],t))+')'}

function buildStatic(W,H){
  const o=mk(W,H),s=o.getContext('2d');
  // wall
  let gr=s.createLinearGradient(0,0,0,H);gr.addColorStop(0,'#69778D');gr.addColorStop(1,'#4C586A');
  s.fillStyle=gr;s.fillRect(0,0,W,H);
  gr=s.createRadialGradient(W/2,H*.46,300,W/2,H*.46,1150);gr.addColorStop(0,'rgba(0,0,0,0)');gr.addColorStop(1,'rgba(8,12,24,.38)');
  s.fillStyle=gr;s.fillRect(0,0,W,H);
  // frame cast shadow on wall
  s.save();s.shadowColor='rgba(0,0,0,.45)';s.shadowBlur=40;s.shadowOffsetY=18;s.fillStyle='#3B3A36';s.fillRect(FX0,FY0,FX1-FX0,FY1-FY0);s.restore();
  // frame (with hole)
  const fp=new Path2D();fp.rect(FX0,FY0,FX1-FX0,FY1-FY0);fp.rect(OX0,OY0,OX1-OX0,OY1-OY0);
  gr=s.createLinearGradient(FX0,FY0,FX1,FY1);gr.addColorStop(0,'#4A4943');gr.addColorStop(1,'#33322E');
  s.fillStyle=gr;s.fill(fp,'evenodd');
  s.strokeStyle='rgba(255,250,235,.16)';s.lineWidth=2;s.strokeRect(FX0+1,FY0+1,FX1-FX0-2,FY1-FY0-2);  // outer bevel
  s.strokeStyle='rgba(0,0,0,.5)';s.lineWidth=2;s.strokeRect(OX0-1,OY0-1,OX1-OX0+2,OY1-OY0+2);          // inner edge
  s.strokeStyle='rgba(255,250,235,.10)';s.strokeRect(FX0+14,FY0+14,FX1-FX0-28,FY1-FY0-28);              // moulding line
  // sill
  s.save();s.shadowColor='rgba(0,0,0,.45)';s.shadowBlur=30;s.shadowOffsetY=14;
  gr=s.createLinearGradient(0,FY1,0,FY1+44);gr.addColorStop(0,'#55534C');gr.addColorStop(1,'#3A3935');
  s.fillStyle=gr;s.fillRect(FX0-40,FY1,FX1-FX0+80,44);s.restore();
  s.fillStyle='rgba(255,250,235,.22)';s.fillRect(FX0-40,FY1,FX1-FX0+80,2);
  return o;
}
function buildSky(){
  const w=OX1-OX0,h=OY1-OY0,sc=Math.max(w/plate.naturalWidth,h/plate.naturalHeight);
  const dw=plate.naturalWidth*sc,dh=plate.naturalHeight*sc,dx=-(dw-w)*.62,dy=0;
  const m=mk(w,h),d=mk(w,h),a=m.getContext('2d'),b=d.getContext('2d');
  a.drawImage(plate,dx,dy,dw,dh);
  b.drawImage(plate,dx,dy,dw,dh);
  b.globalCompositeOperation='saturation';b.fillStyle='rgba(110,115,130,1)';b.globalAlpha=.55;b.fillRect(0,0,w,h);
  b.globalAlpha=1;b.globalCompositeOperation='multiply';
  const gr=b.createLinearGradient(0,0,0,h);gr.addColorStop(0,'#53628A');gr.addColorStop(1,'#8E8AA2');
  b.fillStyle=gr;b.fillRect(0,0,w,h);
  b.globalCompositeOperation='source-over';b.fillStyle='rgba(54,66,98,.34)';b.fillRect(0,0,w,h);
  return {m,d};
}

/* all geometry from c */
function state(c){
  const p=clamp(c.p,0,1.2),xr=clamp(p*1.45),pc=1-(1-xr)*(1-xr);          // fast roll-up
  const drag=clamp(c.drag,0,1);
  const rel=Film.since(c,'release');
  const relax=rel===Infinity?(c.forced?1:0):eo(clamp(rel/.28));           // pull relaxes right after release
  const pull=drag*(1-relax);
  const fl=c.ev.find(e=>e.type==='flip');
  const D=fl?(fl.D||.7):.7;
  const a=c.flipAge-D*.62;                                               // time since the roll arrived (p*1.45 reaches 1)
  const rebound=(c.flipAge<90&&a>0)?20*(1-sio(clamp((a-1.0)/.4)))*Math.exp(-2.4*a)*Math.sin(2*Math.PI*a/.5):0;
  const fa=Film.since(c,'flap');
  const env=1-sio(clamp((fa-.6)/.3));const flapW=fa<20?env*11*Math.exp(-4.6*fa)*Math.sin(2*Math.PI*fa/.8):0;
  const sway=fa<20?env*15*Math.exp(-4.0*fa)*Math.sin(2*Math.PI*fa/1.15):0;
  const R=Math.sqrt(R0*R0+TH*LEN*pc/Math.PI);
  const Lc=SKIRT+LEN*(1-pc)+rebound;
  const m=sio(pc);
  return {pc,pull,R,Lc,flapW,sway,m,mE:Math.max(m,.24*drag),yH:CY+Lc};
}
function hemY(st,x){
  const u=(x-CX0)/(CX1-CX0);
  const dip=44*st.pull*Math.exp(-Math.pow((x-TABX)/230,2));
  return st.yH+38*st.pull+dip+st.flapW*Math.sin(Math.PI*u)*(.55+.45*u);
}

function drawSkyLayer(m,alpha,t){
  if(sky){g.globalAlpha=alpha;g.drawImage(sky.d,OX0,OY0);g.globalAlpha=alpha*m;g.drawImage(sky.m,OX0,OY0);g.globalAlpha=1}
  else{const gr=g.createLinearGradient(0,OY0,0,OY1);gr.addColorStop(0,mixC([84,100,140],[150,196,232],m));gr.addColorStop(1,mixC([140,136,160],[247,212,181],m));g.globalAlpha=alpha;g.fillStyle=gr;g.fillRect(OX0,OY0,OX1-OX0,OY1-OY0);g.globalAlpha=1}
}

Film.scene('s09',{
  mount(root,{W,H}){
    cv=document.createElement('canvas');cv.width=W;cv.height=H;cv.style.cssText='position:absolute;left:0;top:0';root.appendChild(cv);g=cv.getContext('2d');
    linen=Film.img('assets/linen_tile.png');plate=Film.img('assets/sky_morning_plate.png');
    staticL=buildStatic(W,H);
  },
  render(c){
    const W=c.W,H=c.H,st=state(c),m=st.m;
    if(!sky&&plate.complete&&plate.naturalWidth)sky=buildSky();
    if(!pat&&linen.complete&&linen.naturalWidth){pat=g.createPattern(linen,'repeat')}
    g.globalCompositeOperation='source-over';g.globalAlpha=1;
    g.drawImage(staticL,0,0);

    // warm daylight spilling onto the wall (colour/brightness only)
    const breath=1+.035*Math.sin(c.t*1.4);
    if(m>0){
      let gr=g.createRadialGradient(W/2,560,200,W/2,560,980);
      gr.addColorStop(0,'rgba(255,214,160,'+(.27*m*breath).toFixed(4)+')');gr.addColorStop(1,'rgba(255,214,160,0)');
      g.fillStyle=gr;g.fillRect(0,0,W,H);
    }

    // ---- sky in the opening
    g.save();g.beginPath();g.rect(OX0,OY0,OX1-OX0,OY1-OY0);g.clip();
    drawSkyLayer(st.mE,1,c.t);
    if(m>0){ // low sun: soft glow + disc (real light source), rises slightly as the blind clears
      const sx=OX0+640,sy=OY1-80-26*m;
      let gr=g.createRadialGradient(sx,sy,0,sx,sy,620);
      gr.addColorStop(0,'rgba(255,244,220,'+(1*m*breath).toFixed(4)+')');gr.addColorStop(.15,'rgba(255,238,204,'+(.62*m*breath).toFixed(4)+')');gr.addColorStop(.5,'rgba(255,224,180,'+(.18*m).toFixed(4)+')');gr.addColorStop(1,'rgba(255,220,180,0)');
      g.fillStyle=gr;g.fillRect(OX0,OY0,OX1-OX0,OY1-OY0);
      g.fillStyle='rgba(255,248,232,'+(m*m*m).toFixed(3)+')';g.beginPath();g.arc(sx,sy,40,0,7);g.fill();
    }
    // reveal depth: frame reveal shadow (top/left) over the sky
    let rg=g.createLinearGradient(0,OY0,0,OY0+60);rg.addColorStop(0,'rgba(10,14,26,.40)');rg.addColorStop(1,'rgba(10,14,26,0)');g.fillStyle=rg;g.fillRect(OX0,OY0,OX1-OX0,60);
    rg=g.createLinearGradient(OX0,0,OX0+40,0);rg.addColorStop(0,'rgba(10,14,26,.16)');rg.addColorStop(1,'rgba(10,14,26,0)');g.fillStyle=rg;g.fillRect(OX0,OY0,40,OY1-OY0);
    g.restore();

    // ---- cloth
    const N=56,xs=[],ys=[];
    for(let i=0;i<=N;i++){const x=CX0+(CX1-CX0)*i/N;xs.push(x);ys.push(hemY(st,x))}
    const cloth=new Path2D();cloth.moveTo(CX0,CY);cloth.lineTo(CX1,CY);
    for(let i=N;i>=0;i--)cloth.lineTo(xs[i],ys[i]);cloth.closePath();
    // hem shadow onto frame rail / sill reveal where blind overhangs the opening
    g.save();g.filter='none';
    g.shadowColor='rgba(0,0,0,.35)';g.shadowBlur=22;g.shadowOffsetY=8;g.fillStyle='#CFC3AC';g.fill(cloth);g.restore();
    g.save();g.clip(cloth);
    const tone0=[176,174,192],tone1=[255,247,232];
    g.fillStyle='#D8CDB8';g.fillRect(CX0,CY,CX1-CX0,900-CY);
    if(pat){
      try{pat.setTransform(new DOMMatrix([.62,0,0,.62*(1+.07*st.pull),0,st.yH]))}catch(e){}
      g.globalAlpha=.62+.12*st.pull;g.fillStyle=pat;g.fillRect(CX0,CY,CX1-CX0,900-CY);g.globalAlpha=1;
    }
    // backlit translucency: sky bleeds through
    g.globalCompositeOperation='screen';drawSkyLayer(st.mE,.17,c.t);g.globalCompositeOperation='source-over';
    // light tone (dusk -> morning)
    g.globalCompositeOperation='multiply';g.fillStyle=mixC(tone0,tone1,st.mE);g.fillRect(CX0,CY,CX1-CX0,900-CY);g.globalCompositeOperation='source-over';
    // horizontal pleat memory (very soft)
    for(let y=CY+30,k=0;y<900;y+=34,k++){g.fillStyle='rgba(70,56,34,'+(k%2?.025:.045)+')';g.fillRect(CX0,y,CX1-CX0,2)}
    // roller shadow cast onto the cloth, and falloff toward the hem
    let sg=g.createLinearGradient(0,CY,0,CY+70+st.R);sg.addColorStop(0,'rgba(40,32,20,.30)');sg.addColorStop(1,'rgba(40,32,20,0)');g.fillStyle=sg;g.fillRect(CX0,CY,CX1-CX0,70+st.R);
    if(st.pull>.01){ // taut cloth: darker band under the roller, brighter stretched centre
      const tg2=g.createLinearGradient(0,CY,0,CY+150);tg2.addColorStop(0,'rgba(40,30,16,'+(.22*st.pull).toFixed(3)+')');tg2.addColorStop(1,'rgba(40,30,16,0)');g.fillStyle=tg2;g.fillRect(CX0,CY,CX1-CX0,150);
      const tc=g.createRadialGradient(TABX,hemY(st,TABX)-120,10,TABX,hemY(st,TABX)-120,380);tc.addColorStop(0,'rgba(255,248,230,'+(.16*st.pull).toFixed(3)+')');tc.addColorStop(1,'rgba(255,248,230,0)');g.fillStyle=tc;g.fillRect(CX0,CY,CX1-CX0,700);
    }
    // tension folds around the pulled tab
    if(st.pull>.01){
      g.lineCap='round';
      for(let k=-3;k<=3;k++){
        const hx=TABX+k*46,hy=hemY(st,hx);
        const lg=g.createLinearGradient(0,hy-200,0,hy);lg.addColorStop(0,'rgba(60,46,26,0)');lg.addColorStop(1,'rgba(60,46,26,'+(.24*st.pull*(1-Math.abs(k)/4)).toFixed(4)+')');
        g.strokeStyle=lg;g.lineWidth=24;g.beginPath();g.moveTo(TABX+k*16,hy-200);g.lineTo(hx,hy);g.stroke();
      }
    }
    // side edges
    g.fillStyle='rgba(60,46,26,.22)';g.fillRect(CX0,CY,2,900);g.fillRect(CX1-2,CY,2,900);
    g.restore();

    // hem band
    const hem=new Path2D();
    for(let i=0;i<=N;i++){i?hem.lineTo(xs[i],ys[i]):hem.moveTo(xs[i],ys[i])}
    for(let i=N;i>=0;i--)hem.lineTo(xs[i],ys[i]+HEMH);hem.closePath();
    g.save();g.shadowColor='rgba(0,0,0,.30)';g.shadowBlur=14;g.shadowOffsetY=6;g.fillStyle='#BFB095';g.fill(hem);g.restore();
    g.save();g.clip(hem);
    g.fillStyle='#C9BBA0';g.fillRect(CX0,CY,CX1-CX0,900);
    if(pat){g.globalAlpha=.8;g.fillStyle=pat;g.fillRect(CX0,CY,CX1-CX0,900);g.globalAlpha=1}
    g.globalCompositeOperation='multiply';g.fillStyle=mixC([160,170,200],[255,238,214],m);g.fillRect(CX0,CY,CX1-CX0,900);g.globalCompositeOperation='source-over';
    g.strokeStyle='rgba(255,250,235,.45)';g.lineWidth=2;g.beginPath();for(let i=0;i<=N;i++){i?g.lineTo(xs[i],ys[i]+1):g.moveTo(xs[i],ys[i]+1)}g.stroke();
    g.strokeStyle='rgba(50,38,20,.38)';g.lineWidth=2;g.beginPath();for(let i=0;i<=N;i++){i?g.lineTo(xs[i],ys[i]+HEMH-1):g.moveTo(xs[i],ys[i]+HEMH-1)}g.stroke();
    g.setLineDash([9,7]);g.strokeStyle='rgba(90,72,46,.5)';g.lineWidth=1.5;g.beginPath();for(let i=0;i<=N;i++){i?g.lineTo(xs[i],ys[i]+HEMH*.55):g.moveTo(xs[i],ys[i]+HEMH*.55)}g.stroke();g.setLineDash([]);
    g.restore();

    // ---- roller (wood core, then linen wrap growing with the roll)
    const R=st.R;
    // brackets
    g.fillStyle='#2D2C29';g.fill(rr(OX0,CY-30,12,60,3));g.fill(rr(OX1-12,CY-30,12,60,3));
    // wood core across the full span
    let wg=g.createLinearGradient(0,CY-R0,0,CY+R0);wg.addColorStop(0,'#9A744C');wg.addColorStop(.28,'#7C5836');wg.addColorStop(.65,'#6B4A2E');wg.addColorStop(1,'#3E2A19');
    g.fillStyle=wg;g.fillRect(OX0+12,CY-R0,OX1-OX0-24,R0*2);
    g.strokeStyle='rgba(30,18,8,.35)';g.lineWidth=1.2;
    for(let k=0;k<7;k++){const yy=CY-R0+4+k*5.6;g.beginPath();g.moveTo(OX0+12,yy);for(let x=OX0+12;x<=OX1-12;x+=40)g.lineTo(x,yy+Math.sin(x*.013+k*1.7)*1.3);g.stroke()}
    g.fillStyle='rgba(255,230,190,'+(.28+.3*st.pull).toFixed(3)+')';g.fillRect(OX0+12,CY-R0+3,OX1-OX0-24,2+2*st.pull);   // taut roller: sharper highlight
    g.fillStyle='rgba(20,10,4,'+(.25*st.pull).toFixed(3)+')';g.fillRect(OX0+12,CY+R0-6,OX1-OX0-24,6);
    // brass pins
    const bw=g.createRadialGradient(OX0+16,CY-4,1,OX0+16,CY,12);bw.addColorStop(0,'#F2D58A');bw.addColorStop(1,'#8D6A2B');
    g.fillStyle=bw;g.beginPath();g.arc(OX0+14,CY,9,0,7);g.fill();
    const bw2=g.createRadialGradient(OX1-12,CY-4,1,OX1-12,CY,12);bw2.addColorStop(0,'#F2D58A');bw2.addColorStop(1,'#8D6A2B');
    g.fillStyle=bw2;g.beginPath();g.arc(OX1-14,CY,9,0,7);g.fill();
    // linen wrap
    if(R>R0+.5){
      g.save();
      g.shadowColor='rgba(0,0,0,.4)';g.shadowBlur=20;g.shadowOffsetY=10;g.fillStyle='#CFC3AC';g.fillRect(CX0,CY-R,CX1-CX0,R*2);g.shadowColor='transparent';
      g.beginPath();g.rect(CX0,CY-R,CX1-CX0,R*2);g.clip();
      let lg=g.createLinearGradient(0,CY-R,0,CY+R);
      lg.addColorStop(0,'#F0E7D4');lg.addColorStop(.32,'#DDD2BC');lg.addColorStop(.7,'#B5A88D');lg.addColorStop(1,'#7F7258');
      g.fillStyle=lg;g.fillRect(CX0,CY-R,CX1-CX0,R*2);
      if(pat){try{pat.setTransform(new DOMMatrix([.62,0,0,.62,0,0]))}catch(e){}g.globalCompositeOperation='multiply';g.globalAlpha=.7;g.fillStyle=pat;g.fillRect(CX0,CY-R,CX1-CX0,R*2);g.globalAlpha=1;g.globalCompositeOperation='source-over'}
      g.globalCompositeOperation='multiply';g.fillStyle=mixC([170,178,205],[255,245,230],m);g.fillRect(CX0,CY-R,CX1-CX0,R*2);g.globalCompositeOperation='source-over';
      let eg=g.createLinearGradient(CX0,0,CX1,0);eg.addColorStop(0,'rgba(50,38,20,.28)');eg.addColorStop(.03,'rgba(50,38,20,0)');eg.addColorStop(.97,'rgba(50,38,20,0)');eg.addColorStop(1,'rgba(50,38,20,.28)');
      g.fillStyle=eg;g.fillRect(CX0,CY-R,CX1-CX0,R*2);
      g.fillStyle='rgba(255,252,240,.35)';g.fillRect(CX0,CY-R+4,CX1-CX0,2);
      g.restore();
    }

    // ---- cord + tab
    const hc=hemY(st,TABX)+HEMH,swx=st.sway,tabY0=hc+54;
    g.lineCap='round';
    g.strokeStyle='rgba(30,22,10,.55)';g.lineWidth=11;g.beginPath();g.moveTo(TABX,hc-2);g.lineTo(TABX+swx*.5,hc+28);g.lineTo(TABX+swx,tabY0);g.stroke();
    g.strokeStyle='#EADFC4';g.lineWidth=7;g.beginPath();g.moveTo(TABX,hc-2);g.lineTo(TABX+swx*.5,hc+28);g.lineTo(TABX+swx,tabY0);g.stroke();
    g.strokeStyle='rgba(120,98,62,.5)';g.lineWidth=1.5;g.beginPath();g.moveTo(TABX+2,hc);g.lineTo(TABX+swx+2,tabY0);g.stroke();
    const tx=TABX+swx,ty=tabY0;
    g.save();g.shadowColor="rgba(0,0,0,.22)";g.shadowBlur=10;g.shadowOffsetY=5;
    let tg=g.createLinearGradient(tx-15,0,tx+15,0);tg.addColorStop(0,'#8A6540');tg.addColorStop(.5,'#6B4A2E');tg.addColorStop(1,'#43301E');
    g.fillStyle=tg;g.fill(rr(tx-15,ty,30,62,12));g.restore();
    g.fillStyle='rgba(255,230,190,.26)';g.fillRect(tx-10,ty+6,3,44);
    // brass cap + ring
    const bc=g.createRadialGradient(tx-4,ty-4,1,tx,ty,13);bc.addColorStop(0,'#FFE7A5');bc.addColorStop(.6,'#C79B45');bc.addColorStop(1,'#7D5C22');
    g.fillStyle=bc;g.beginPath();g.arc(tx,ty+2,12,0,7);g.fill();
    g.strokeStyle='rgba(60,40,10,.5)';g.lineWidth=1.5;g.beginPath();g.arc(tx,ty+2,12,0,7);g.stroke();
    // glint on arrival (light only)
    const ia=Film.since(c,'impact');
    if(ia<.3){
      const k=ia/.3,gx=tx-12+24*k;
      const gg=g.createRadialGradient(gx,ty-2,0,gx,ty-2,18);gg.addColorStop(0,'rgba(255,252,235,'+(.85*(1-k)).toFixed(3)+')');gg.addColorStop(1,'rgba(255,252,235,0)');
      g.fillStyle=gg;g.beginPath();g.arc(tx,ty+2,13,0,7);g.fill();
    }

    // ---- morning light grazing the frame's inner edge (colour only)
    if(m>0){
      // warm wash on the frame itself
      g.save();g.globalCompositeOperation='screen';g.fillStyle='rgba(255,196,130,'+(.16*m).toFixed(3)+')';
      const fp2=new Path2D();fp2.rect(FX0,FY0,FX1-FX0,FY1-FY0);fp2.rect(OX0,OY0,OX1-OX0,OY1-OY0);g.fill(fp2,'evenodd');g.restore();
      const fl2=g.createLinearGradient(0,OY1,0,OY1+40);fl2.addColorStop(0,'rgba(255,226,176,'+(.30*m).toFixed(3)+')');fl2.addColorStop(1,'rgba(255,226,176,0)');g.fillStyle=fl2;g.fillRect(OX0,OY1,OX1-OX0,40);
      const fl3=g.createLinearGradient(OX1,0,OX1+40,0);fl3.addColorStop(0,'rgba(255,226,176,'+(.22*m).toFixed(3)+')');fl3.addColorStop(1,'rgba(255,226,176,0)');g.fillStyle=fl3;g.fillRect(OX1,OY0,40,OY1-OY0);
    }
    // ---- sill light patch (colour only)
    if(m>0){const sl=g.createLinearGradient(0,FY1,0,FY1+44);sl.addColorStop(0,'rgba(255,224,170,'+(.55*m*breath).toFixed(3)+')');sl.addColorStop(1,'rgba(255,224,170,'+(.12*m).toFixed(3)+')');g.fillStyle=sl;g.fillRect(FX0-40,FY1,FX1-FX0+80,44);
      const wp=g.createRadialGradient(OX0+640,FY1+120,10,OX0+640,FY1+120,420);wp.addColorStop(0,'rgba(255,214,160,'+(.30*m).toFixed(3)+')');wp.addColorStop(1,'rgba(255,214,160,0)');g.fillStyle=wp;g.fillRect(FX0-200,FY1+44,FX1-FX0+400,260)}

    // ---- one caption
    const ca=c.forced?9:Film.since(c,'flap');
    const cs=c.forced?1:(c.flipIdx<0)?0:sio(clamp((c.flipAge-.3)/.5));
    if(cs>0){g.globalAlpha=cs;g.fillStyle='#3A3A46';g.font='700 62px Inter,"SF Pro Display","Segoe UI","PingFang SC","Microsoft YaHei",sans-serif';g.textAlign='center';g.textBaseline='alphabetic';g.shadowColor='rgba(255,240,215,.7)';g.shadowBlur=18;g.shadowOffsetY=0;g.fillText('Refreshed  ·  just now',W/2-50,808);g.shadowColor='transparent';g.globalAlpha=1}

    Film.cue(c,'touch').forEach(q=>Film.touch(g,TABX,CY+LEN+SKIRT+HEMH+54+26,q.age));
  }
});
function D0(c){const f=c.ev.find(e=>e.type==='flip');return f?(f.D||.7):.7}
})();
