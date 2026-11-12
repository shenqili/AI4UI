/* s05 Knob - old radio: walnut body, dial glass + pointer, brass knurled knob, magic eye, cloth grille. THE DROP (lock = flip). */
(function(){
const BG='#1E2419';
const FONT='"SF Mono",Consolas,monospace';
const {clamp,lerp}=Film, eo=Film.ease.eo, sio=Film.ease.sio;
const D2R=Math.PI/180;
// layout
const BODY={x:350,y:190,w:1220,h:660,r:64};
const DIAL={x:424,y:236,w:1072,h:166,r:26};
const SPK={x:424,y:452,w:420,h:348,r:30};
const EYE={x:1004,y:630,R:92};
const KNOB={x:1322,y:632,R:150},KS=1.25;
const SC0=486, SC_PX=71.03;              // scale: x at 88.0 MHz and px per MHz
const F0=88, F_ST=98.7;
const XST=SC0+(F_ST-F0)*SC_PX;           // station x (pointer at drag=1)
const XPTR=d=>SC0+d*(F_ST-F0)*SC_PX;
const SCALE_Y=340;
let woodT,brassT,clothPat,sh_body,sh_knob,sh_eye,cv,g;

function rr(x,y,w,h,r){g.beginPath();g.moveTo(x+r,y);g.arcTo(x+w,y,x+w,y+h,r);g.arcTo(x+w,y+h,x,y+h,r);g.arcTo(x,y+h,x,y,r);g.arcTo(x,y,x+w,y,r);g.closePath()}
function mix(a,b,t){return[a[0]+(b[0]-a[0])*t,a[1]+(b[1]-a[1])*t,a[2]+(b[2]-a[2])*t]}
function rgb(a,al){return'rgba('+(a[0]|0)+','+(a[1]|0)+','+(a[2]|0)+','+(al==null?1:al)+')'}
function mkCanvas(w,h){const o=document.createElement('canvas');o.width=w;o.height=h;return o}
function ready(im){return im&&im.complete&&im.naturalWidth>0}

Film.scene('s05',{
  mount(root,{W,H}){
    cv=mkCanvas(W,H);cv.style.cssText='position:absolute;left:0;top:0';root.appendChild(cv);g=cv.getContext('2d');
    woodT=Film.img('assets/wood_walnut_tile.png');brassT=Film.img('assets/brass_brushed_tile.png');
    const ct=mkCanvas(16,16),cg=ct.getContext('2d');
    cg.fillStyle='#2a2115';cg.fillRect(0,0,16,16);
    for(let j=0;j<4;j++)for(let i=0;i<4;i++){
      const x=i*4,y=j*4,h=((i+j)&1)===0;
      const gr=cg.createLinearGradient(h?x:x,h?y:y,h?x:x+4,h?y+4:y);
      gr.addColorStop(0,h?'#6b5834':'#4d3e24');gr.addColorStop(.5,h?'#8b7447':'#6a5632');gr.addColorStop(1,h?'#3c2f1b':'#2b2013');
      cg.fillStyle=gr;cg.fillRect(x,y,4,4);
    }
    clothPat=g.createPattern(ct,'repeat');
    sh_body=mkCanvas(1500,260);{const s=sh_body.getContext('2d');s.filter='blur(30px)';s.fillStyle='rgba(0,0,0,.55)';s.beginPath();s.ellipse(750,130,610,40,0,0,7);s.fill()}
    sh_knob=mkCanvas(420,420);{const s=sh_knob.getContext('2d');s.filter='blur(16px)';s.fillStyle='rgba(0,0,0,.5)';s.beginPath();s.arc(210,210,152,0,7);s.fill()}
    sh_eye=mkCanvas(300,300);{const s=sh_eye.getContext('2d');s.filter='blur(10px)';s.fillStyle='rgba(0,0,0,.45)';s.beginPath();s.arc(150,150,94,0,7);s.fill()}
  },
  render(c){
    const W=c.W,H=c.H,t=c.t;
    const forced=c.forced;
    const locked=c.flipAge<90;
    const lkAge=locked?c.flipAge:-1;
    const lk=locked?sio(clamp(lkAge/.14)):0;
    const d=clamp(c.drag,0,1.2);
    const dist=Math.abs(d-1);
    const close=clamp(1-dist/.5);
    const enA=forced?99:t;
    const enFlick=enA<.15?(.72+.28*(Math.sin(2*Math.PI*7*enA)*.5+.5)):1;
    const breath=locked?1+.035*Math.sin(2*Math.PI*.5*t):1+.05*Math.sin(2*Math.PI*.9*t+1);
    let tkA=99;c.ev.forEach(e=>{if(e.type==='tick'&&e.i%4===0&&c.t>=e.lt)tkA=Math.min(tkA,c.t-e.lt)});
    const tick=(!locked&&tkA<.5)?Math.pow(Math.sin(Math.PI*tkA/.5),2):0;
    const lamp=clamp(lerp(.5+.3*close,1,lk)*enFlick*breath*(1+.04*tick),0,1.15);

    /* ---- background (static) ---- */
    g.globalCompositeOperation='source-over';g.globalAlpha=1;g.filter='none';
    g.fillStyle=BG;g.fillRect(0,0,W,H);
    let gr=g.createRadialGradient(780,380,60,960,560,1250);gr.addColorStop(0,'#2d3827');gr.addColorStop(.55,'#1E2419');gr.addColorStop(1,'#10150f');
    g.fillStyle=gr;g.fillRect(0,0,W,H);
    gr=g.createLinearGradient(0,810,0,H);gr.addColorStop(0,'#2a3325');gr.addColorStop(.35,'#202819');gr.addColorStop(1,'#141910');
    g.fillStyle=gr;g.fillRect(0,810,W,H-810);
    g.fillStyle='rgba(255,240,200,.07)';g.fillRect(0,809,W,2);
    g.drawImage(sh_body,210,780);

    /* ---- big frequency readout (the one caption) ---- */
    {const fr0=F0+d*(F_ST-F0);g.textAlign='center';g.textBaseline='alphabetic';
      g.font='700 104px '+FONT;g.fillStyle=rgb(mix([243,235,211],[110,240,160],locked?clamp(lkAge/.07):0));g.fillText(fr0.toFixed(1),940,150);
      g.font='600 34px '+FONT;g.fillStyle='rgba(243,235,211,.6)';g.textAlign='left';g.fillText('MHz',1110,150)}

    /* ---- feet ---- */
    [[470,560],[1360,1450]].forEach(f=>{
      const fg=g.createLinearGradient(0,850,0,884);fg.addColorStop(0,'#8a6a1e');fg.addColorStop(.5,'#4b3a0d');fg.addColorStop(1,'#1f1805');
      g.fillStyle=fg;rr(f[0],846,f[1]-f[0],36,8);g.fill();
    });

    /* ---- body ---- */
    g.save();rr(BODY.x,BODY.y,BODY.w,BODY.h,BODY.r);g.clip();
    g.fillStyle='#5A3A22';g.fillRect(BODY.x,BODY.y,BODY.w,BODY.h);
    if(ready(woodT)){g.globalAlpha=.9;g.fillStyle=g.createPattern(woodT,'repeat');g.fillRect(BODY.x,BODY.y,BODY.w,BODY.h);g.globalAlpha=1}
    gr=g.createLinearGradient(BODY.x,BODY.y,BODY.x+BODY.w*.9,BODY.y+BODY.h);
    gr.addColorStop(0,'rgba(255,205,140,.22)');gr.addColorStop(.45,'rgba(255,205,140,0)');gr.addColorStop(1,'rgba(8,4,0,.5)');
    g.fillStyle=gr;g.fillRect(BODY.x,BODY.y,BODY.w,BODY.h);
    gr=g.createLinearGradient(0,BODY.y,0,BODY.y+34);gr.addColorStop(0,'rgba(255,226,170,.32)');gr.addColorStop(1,'rgba(255,226,170,0)');
    g.fillStyle=gr;g.fillRect(BODY.x,BODY.y,BODY.w,34);
    gr=g.createLinearGradient(0,BODY.y+BODY.h-46,0,BODY.y+BODY.h);gr.addColorStop(0,'rgba(0,0,0,0)');gr.addColorStop(1,'rgba(0,0,0,.34)');
    g.fillStyle=gr;g.fillRect(BODY.x,BODY.y+BODY.h-46,BODY.w,46);
    const spill=mix([120,150,175],[255,184,92],lk);
    gr=g.createLinearGradient(0,DIAL.y+DIAL.h,0,DIAL.y+DIAL.h+190);gr.addColorStop(0,rgb(spill,.2*lamp*(.35+.65*lk)));gr.addColorStop(1,rgb(spill,0));
    g.globalCompositeOperation='screen';g.fillStyle=gr;g.fillRect(BODY.x,DIAL.y+DIAL.h,BODY.w,190);g.globalCompositeOperation='source-over';
    g.restore();
    g.lineWidth=2;rr(BODY.x+24,BODY.y+24,BODY.w-48,BODY.h-48,BODY.r-20);g.strokeStyle='rgba(20,8,0,.55)';g.stroke();
    g.save();g.translate(1.5,1.5);rr(BODY.x+24,BODY.y+24,BODY.w-48,BODY.h-48,BODY.r-20);g.strokeStyle='rgba(255,200,140,.16)';g.stroke();g.restore();
    g.lineWidth=3;rr(BODY.x+1.5,BODY.y+1.5,BODY.w-3,BODY.h-3,BODY.r);
    gr=g.createLinearGradient(BODY.x,BODY.y,BODY.x+BODY.w,BODY.y+BODY.h);gr.addColorStop(0,'rgba(255,225,170,.55)');gr.addColorStop(.35,'rgba(255,225,170,.08)');gr.addColorStop(.7,'rgba(0,0,0,.2)');gr.addColorStop(1,'rgba(0,0,0,.5)');
    g.strokeStyle=gr;g.stroke();

    /* ---- dial glass ---- */
    rr(DIAL.x-16,DIAL.y-16,DIAL.w+32,DIAL.h+32,DIAL.r+14);
    gr=g.createLinearGradient(DIAL.x,DIAL.y,DIAL.x+DIAL.w*.5,DIAL.y+DIAL.h*2);gr.addColorStop(0,'#F4DC8A');gr.addColorStop(.35,'#C9A227');gr.addColorStop(1,'#4b3a0b');
    g.fillStyle=gr;g.fill();
    g.save();rr(DIAL.x-16,DIAL.y-16,DIAL.w+32,DIAL.h+32,DIAL.r+14);g.clip();
    if(ready(brassT)){g.globalCompositeOperation='multiply';g.globalAlpha=.35;g.fillStyle=g.createPattern(brassT,'repeat');g.fillRect(DIAL.x-20,DIAL.y-20,DIAL.w+40,DIAL.h+40);g.globalAlpha=1;g.globalCompositeOperation='source-over'}
    g.restore();
    g.save();rr(DIAL.x,DIAL.y,DIAL.w,DIAL.h,DIAL.r);g.clip();
    const cold=[150,172,190],amber=[246,199,122];
    const base=mix(mix([36,44,52],cold,.5+.5*close),mix([190,128,52],amber,.9),lk);
    const bk=lerp(.55,.9,lk);g.fillStyle=rgb([base[0]*lamp*bk+10,base[1]*lamp*bk+10,base[2]*lamp*bk+12]);g.fillRect(DIAL.x,DIAL.y,DIAL.w,DIAL.h);
    gr=g.createLinearGradient(DIAL.x,0,DIAL.x+DIAL.w,0);
    const lc=mix(cold,amber,lk);
    gr.addColorStop(0,rgb(lc,0));gr.addColorStop(.5,rgb(lc,.62*lamp));gr.addColorStop(1,rgb(lc,0));
    g.fillStyle=gr;g.fillRect(DIAL.x,DIAL.y,DIAL.w,DIAL.h);
    gr=g.createRadialGradient(DIAL.x+DIAL.w/2,DIAL.y+DIAL.h*.55,10,DIAL.x+DIAL.w/2,DIAL.y+DIAL.h*.55,560);
    gr.addColorStop(0,rgb(mix([210,230,245],[255,226,160],lk),.5*lamp));gr.addColorStop(1,rgb(lc,0));
    g.fillStyle=gr;g.fillRect(DIAL.x,DIAL.y,DIAL.w,DIAL.h);
    // lit zone follows the pointer
    const pxz=XPTR(d);
    gr=g.createRadialGradient(pxz,SCALE_Y,4,pxz,SCALE_Y,170);
    gr.addColorStop(0,rgb(mix([225,240,250],[255,236,180],lk),.6));gr.addColorStop(1,rgb(lc,0));
    g.fillStyle=gr;g.fillRect(pxz-180,DIAL.y,360,DIAL.h);
    gr=g.createLinearGradient(0,DIAL.y,0,DIAL.y+DIAL.h);gr.addColorStop(0,'rgba(10,6,2,.38)');gr.addColorStop(.18,'rgba(10,6,2,0)');gr.addColorStop(.82,'rgba(10,6,2,0)');gr.addColorStop(1,'rgba(10,6,2,.42)');
    g.fillStyle=gr;g.fillRect(DIAL.x,DIAL.y,DIAL.w,DIAL.h);
    // scale printing (only the current point is emphasised)
    g.lineWidth=2;
    g.strokeStyle='rgba(28,20,12,.5)';
    g.beginPath();g.moveTo(SC0-18,SCALE_Y);g.lineTo(SC0+14*SC_PX+14,SCALE_Y);g.stroke();
    g.font='700 31px '+FONT;g.textAlign='center';g.textBaseline='alphabetic';
    for(let i=0;i<=27;i++){
      const f=F0+i*.5,x=SC0+i*.5*SC_PX,major=(i%4===0);const em=Math.exp(-Math.pow((x-pxz)/70,2));const ia=.3+.65*em;g.strokeStyle='rgba(28,20,12,'+ia+')';g.fillStyle='rgba(28,20,12,'+ia+')';
      g.lineWidth=major?5:3;g.beginPath();g.moveTo(x,SCALE_Y);g.lineTo(x,SCALE_Y-(major?50:(i%2===0?34:22)));g.stroke();
      if(major)g.fillText(String(f),x,SCALE_Y-62);
    }
    g.fillStyle='rgba(176,52,24,.9)';g.beginPath();g.moveTo(XST,SCALE_Y+6);g.lineTo(XST-9,SCALE_Y+22);g.lineTo(XST+9,SCALE_Y+22);g.closePath();g.fill();
    const px=XPTR(d);
    g.fillStyle=rgb([255,90,50],.16*lamp);g.fillRect(px-7,DIAL.y+6,14,DIAL.h-12);
    g.fillStyle='#E4572E';g.fillRect(px-2.5,DIAL.y+4,5,DIAL.h-8);
    g.fillStyle='#F3E9D0';g.fillRect(px-0.5,DIAL.y+4,1,DIAL.h-8);
    g.fillStyle='#E4572E';g.beginPath();g.moveTo(px,DIAL.y+4);g.lineTo(px-8,DIAL.y-4);g.lineTo(px+8,DIAL.y-4);g.closePath();g.fill();
    // arrival glint (fixed, <=0.15 s)
    if(!forced&&t>=0&&t<.15){const u=t/.15,bx=lerp(DIAL.x-160,DIAL.x+DIAL.w+60,u);
      g.globalCompositeOperation='screen';const gg=g.createLinearGradient(bx-60,0,bx+60,0);gg.addColorStop(0,'rgba(255,255,255,0)');gg.addColorStop(.5,'rgba(255,255,255,.3)');gg.addColorStop(1,'rgba(255,255,255,0)');
      g.fillStyle=gg;g.beginPath();g.moveTo(bx-60+50,DIAL.y);g.lineTo(bx+60+50,DIAL.y);g.lineTo(bx+60-50,DIAL.y+DIAL.h);g.lineTo(bx-60-50,DIAL.y+DIAL.h);g.closePath();g.fill();g.globalCompositeOperation='source-over'}
    // glass reflection (fixed)
    gr=g.createLinearGradient(0,DIAL.y,0,DIAL.y+DIAL.h*.46);gr.addColorStop(0,'rgba(255,255,255,.16)');gr.addColorStop(1,'rgba(255,255,255,0)');
    g.fillStyle=gr;g.fillRect(DIAL.x,DIAL.y,DIAL.w,DIAL.h*.46);
    g.beginPath();g.moveTo(DIAL.x+60,DIAL.y+DIAL.h);g.lineTo(DIAL.x+300,DIAL.y);g.lineTo(DIAL.x+372,DIAL.y);g.lineTo(DIAL.x+132,DIAL.y+DIAL.h);g.closePath();g.fillStyle='rgba(255,255,255,.055)';g.fill();
    g.restore();
    // glass rim
    g.lineWidth=2.5;rr(DIAL.x,DIAL.y,DIAL.w,DIAL.h,DIAL.r);gr=g.createLinearGradient(DIAL.x,DIAL.y,DIAL.x+DIAL.w,DIAL.y+DIAL.h);gr.addColorStop(0,'rgba(0,0,0,.65)');gr.addColorStop(1,'rgba(255,230,160,.4)');g.strokeStyle=gr;g.stroke();

    /* ---- speaker cloth grille ---- */
    rr(SPK.x-12,SPK.y-12,SPK.w+24,SPK.h+24,SPK.r+10);
    gr=g.createLinearGradient(SPK.x,SPK.y,SPK.x+SPK.w,SPK.y+SPK.h);gr.addColorStop(0,'#F0D77E');gr.addColorStop(.4,'#C9A227');gr.addColorStop(1,'#4a3a0d');
    g.fillStyle=gr;g.fill();
    g.save();rr(SPK.x,SPK.y,SPK.w,SPK.h,SPK.r);g.clip();
    g.fillStyle=clothPat;g.fillRect(SPK.x,SPK.y,SPK.w,SPK.h);
    gr=g.createRadialGradient(SPK.x+SPK.w*.35,SPK.y+SPK.h*.25,20,SPK.x+SPK.w*.5,SPK.y+SPK.h*.5,420);gr.addColorStop(0,'rgba(255,210,140,.12)');gr.addColorStop(1,'rgba(0,0,0,.55)');
    g.fillStyle=gr;g.fillRect(SPK.x,SPK.y,SPK.w,SPK.h);
    gr=g.createLinearGradient(0,SPK.y,0,SPK.y+120);gr.addColorStop(0,'rgba(0,0,0,.45)');gr.addColorStop(1,'rgba(0,0,0,0)');g.fillStyle=gr;g.fillRect(SPK.x,SPK.y,SPK.w,120);   // inner shadow under top frame
    // amber lamp light falls on cloth after lock
    gr=g.createLinearGradient(0,SPK.y,0,SPK.y+SPK.h*.7);gr.addColorStop(0,rgb(amber,.22*lk*lamp));gr.addColorStop(1,rgb(amber,0));g.globalCompositeOperation='screen';g.fillStyle=gr;g.fillRect(SPK.x,SPK.y,SPK.w,SPK.h);g.globalCompositeOperation='source-over';
    // three brass slats
    [.25,.5,.75].forEach(f=>{const y=SPK.y+SPK.h*f-5;const sg=g.createLinearGradient(0,y,0,y+10);sg.addColorStop(0,'#F4DC8A');sg.addColorStop(.5,'#B8941F');sg.addColorStop(1,'#3a2c08');g.fillStyle=sg;g.fillRect(SPK.x,y,SPK.w,10)});
    g.restore();
    g.lineWidth=2;rr(SPK.x,SPK.y,SPK.w,SPK.h,SPK.r);g.strokeStyle='rgba(0,0,0,.6)';g.stroke();

    /* ---- lock lamp (grey -> green on the click) ---- */
    g.drawImage(sh_eye,EYE.x-150+8,EYE.y-150+14);
    g.beginPath();g.arc(EYE.x,EYE.y,EYE.R,0,7);
    gr=g.createLinearGradient(EYE.x-EYE.R,EYE.y-EYE.R,EYE.x+EYE.R,EYE.y+EYE.R);gr.addColorStop(0,'#F7E39A');gr.addColorStop(.4,'#C9A227');gr.addColorStop(1,'#3f3008');g.fillStyle=gr;g.fill();
    const RT=EYE.R-17,sn=locked?clamp(lkAge/.07):0;
    g.beginPath();g.arc(EYE.x,EYE.y,RT+4,0,7);g.fillStyle='#050805';g.fill();
    const lc1=mix([118,124,120],[150,255,185],sn),lc2=mix([52,56,54],[40,190,105],sn);
    gr=g.createRadialGradient(EYE.x-14,EYE.y-18,4,EYE.x,EYE.y,RT);gr.addColorStop(0,rgb(lc1));gr.addColorStop(1,rgb(lc2));
    g.fillStyle=gr;g.beginPath();g.arc(EYE.x,EYE.y,RT,0,7);g.fill();
    g.lineCap='round';g.lineWidth=5;g.strokeStyle='rgba(255,255,255,.5)';g.beginPath();g.arc(EYE.x,EYE.y,RT-8,Math.PI*1.08,Math.PI*1.5);g.stroke();g.fillStyle='rgba(255,255,255,.65)';g.beginPath();g.ellipse(EYE.x-36,EYE.y-40,9,5,-.8,0,7);g.fill();g.lineCap='butt';
    g.lineWidth=2.5;g.strokeStyle='rgba(0,0,0,.7)';g.beginPath();g.arc(EYE.x,EYE.y,RT+4,0,7);g.stroke();
    if(sn>0){g.globalCompositeOperation='screen';const eg=.16+.1*Math.max(0,1-lkAge/.3);
      gr=g.createRadialGradient(EYE.x,EYE.y,RT*.6,EYE.x,EYE.y,140);gr.addColorStop(0,'rgba(91,227,138,'+eg+')');gr.addColorStop(1,'rgba(91,227,138,0)');g.fillStyle=gr;g.beginPath();g.arc(EYE.x,EYE.y,140,0,7);g.fill();
      if(lkAge<.25){const u=lkAge/.25;g.lineWidth=6;g.strokeStyle='rgba(91,227,138,'+(.25*(1-u))+')';g.beginPath();g.arc(EYE.x,EYE.y,RT+8+30*eo(u),0,7);g.stroke()}
      g.globalCompositeOperation='source-over'}

    /* ---- knob ---- */
    const th=(-135+d*270)*D2R;       // 0 = up, clockwise
    const kx=KNOB.x,ky=KNOB.y;
    // index dots on body (progress ring)
    for(let i=0;i<13;i++){
      const a=(-135+i*22.5)*D2R,x=kx+Math.sin(a)*206,y=ky-Math.cos(a)*206,on=a<=th+1e-6;
      const col=on?mix([150,118,52],[214,160,80],lk):[104,70,36];
      if(false){g.globalCompositeOperation='screen';const dg=g.createRadialGradient(x,y,1,x,y,16);dg.addColorStop(0,rgb([255,190,90],.35*(.5+.5*lk)));dg.addColorStop(1,'rgba(255,190,90,0)');g.fillStyle=dg;g.beginPath();g.arc(x,y,16,0,7);g.fill();g.globalCompositeOperation='source-over'}
      g.fillStyle=rgb(col);g.beginPath();g.arc(x,y,on?4:4,0,7);g.fill();
      if(!on){g.fillStyle='rgba(255,200,140,.18)';g.beginPath();g.arc(x+1,y+1.2,5,0.2,2.9);g.fill()}
    }
    g.save();g.translate(kx,ky);g.scale(KS,KS);g.translate(-kx,-ky);
    g.drawImage(sh_knob,kx-210+18,ky-210+30);
    // skirt
    g.beginPath();g.arc(kx,ky,KNOB.R,0,7);
    gr=g.createLinearGradient(kx-110,ky-120,kx+110,ky+120);gr.addColorStop(0,'#F4E6B8');gr.addColorStop(.3,'#C9AA48');gr.addColorStop(.65,'#7f6720');gr.addColorStop(1,'#33270a');g.fillStyle=gr;g.fill();
    // knurled band
    const R1=142,R0=118;
    g.beginPath();g.arc(kx,ky,R1,0,7);g.arc(kx,ky,R0,0,7,true);
    gr=g.createLinearGradient(kx-100,ky-110,kx+100,ky+110);gr.addColorStop(0,'#E8C84C');gr.addColorStop(.5,'#9c7b18');gr.addColorStop(1,'#4a3809');g.fillStyle=gr;g.fill('evenodd');
    for(let i=0;i<48;i++){
      const a=th+i*(Math.PI*2/48);                         // groove position rotates with the knob
      const sa=Math.sin(a),ca=Math.cos(a);
      // fixed light from upper-left: facing (-0.62,-0.78)
      const lit=(-sa*.62)*1+(ca*.78);                      // normal.dot(light), normal=(sa,-ca)
      const lv=clamp(lit*.5+.5);
      // groove (dark) + lit ridge edge; shade uses absolute orientation so highlight stays put
      g.lineWidth=2.6;g.strokeStyle='rgba(26,18,4,'+(.5+.25*(1-lv))+')';
      g.beginPath();g.moveTo(kx+sa*(R0+3),ky-ca*(R0+3));g.lineTo(kx+sa*(R1-3),ky-ca*(R1-3));g.stroke();
      const b=a+2.2*D2R,sb=Math.sin(b),cb=Math.cos(b);
      g.lineWidth=2;g.strokeStyle='rgba(255,238,170,'+(.1+.5*lv*lv)+')';
      g.beginPath();g.moveTo(kx+sb*(R0+3),ky-cb*(R0+3));g.lineTo(kx+sb*(R1-3),ky-cb*(R1-3));g.stroke();
    }
    // face
    const RF=114;
    g.save();g.beginPath();g.arc(kx,ky,RF,0,7);g.clip();
    let cg;
    if(g.createConicGradient){
      cg=g.createConicGradient(0,kx,ky);
      cg.addColorStop(0,'#AE9238');cg.addColorStop(.125,'#EFD36C');cg.addColorStop(.25,'#B8982C');cg.addColorStop(.375,'#6b5412');cg.addColorStop(.5,'#9a7e22');
      cg.addColorStop(.625,'#FFF3BE');cg.addColorStop(.75,'#C4A22E');cg.addColorStop(.875,'#6f5714');cg.addColorStop(1,'#AE9238');
    }else{cg=g.createLinearGradient(kx-100,ky-100,kx+100,ky+100);cg.addColorStop(0,'#FFF0B0');cg.addColorStop(1,'#6b5412')}
    g.fillStyle=cg;g.fillRect(kx-RF,ky-RF,RF*2,RF*2);
    if(ready(brassT)){g.globalCompositeOperation='multiply';g.globalAlpha=.3;g.save();g.translate(kx,ky);g.rotate(th);g.fillStyle=g.createPattern(brassT,'repeat');g.fillRect(-RF,-RF,RF*2,RF*2);g.restore();g.globalAlpha=1;g.globalCompositeOperation='source-over'}
    // spun rings (rotationally symmetric -> fixed)
    for(let r=14;r<RF;r+=6){g.strokeStyle=(r%12===2)?'rgba(255,240,180,.08)':'rgba(30,20,0,.08)';g.lineWidth=1;g.beginPath();g.arc(kx,ky,r,0,7);g.stroke()}
    // concave dish
    gr=g.createRadialGradient(kx+16,ky+20,6,kx,ky,70);gr.addColorStop(0,'rgba(255,230,150,.35)');gr.addColorStop(.7,'rgba(0,0,0,.18)');gr.addColorStop(1,'rgba(0,0,0,.35)');
    g.fillStyle=gr;g.beginPath();g.arc(kx,ky,66,0,7);g.fill();
    g.lineWidth=2;g.strokeStyle='rgba(30,20,0,.55)';g.beginPath();g.arc(kx,ky,66,0,7);g.stroke();
    g.strokeStyle='rgba(255,240,180,.45)';g.beginPath();g.arc(kx,ky,68.5,.1,1.7);g.stroke();
    // pointer groove (rotates)
    const sa=Math.sin(th),ca=Math.cos(th);
    g.lineCap='round';
    g.strokeStyle='rgba(255,236,170,.55)';g.lineWidth=9;g.beginPath();g.moveTo(kx+sa*42+1.5,ky-ca*42+2);g.lineTo(kx+sa*104+1.5,ky-ca*104+2);g.stroke();
    g.strokeStyle='#3a2a06';g.lineWidth=8;g.beginPath();g.moveTo(kx+sa*42,ky-ca*42);g.lineTo(kx+sa*104,ky-ca*104);g.stroke();
    g.strokeStyle='#F6EBCB';g.lineWidth=3;g.beginPath();g.moveTo(kx+sa*60,ky-ca*60);g.lineTo(kx+sa*100,ky-ca*100);g.stroke();
    g.lineCap='butt';
    g.restore();
    // fixed specular + rim lights (never rotate)
    gr=g.createRadialGradient(kx-52,ky-62,2,kx-52,ky-62,96);gr.addColorStop(0,'rgba(255,255,240,.36)');gr.addColorStop(1,'rgba(255,255,240,0)');
    g.fillStyle=gr;g.beginPath();g.arc(kx,ky,RF,0,7);g.fill();
    g.lineCap='round';
    g.lineWidth=4;g.strokeStyle='rgba(255,250,215,.9)';g.beginPath();g.arc(kx,ky,KNOB.R-2,Math.PI*1.02,Math.PI*1.62);g.stroke();
    g.lineWidth=2;g.strokeStyle='rgba(255,246,200,.45)';g.beginPath();g.arc(kx,ky,R1,Math.PI*1.05,Math.PI*1.6);g.stroke();
    g.beginPath();g.arc(kx,ky,KNOB.R-2,Math.PI*.05,Math.PI*.55);g.strokeStyle='rgba(20,10,0,.5)';g.stroke();
    g.lineWidth=2;g.strokeStyle='rgba(20,12,0,.6)';g.beginPath();g.arc(kx,ky,RF+1,0,7);g.stroke();
    g.lineCap='butt';
    // lock: brass catches the new amber lamp (rim only)
    if(lk>0){g.globalCompositeOperation='screen';g.lineWidth=5;g.strokeStyle='rgba(255,190,100,'+(.28*lk)+')';g.beginPath();g.arc(kx,ky-1,KNOB.R-4,Math.PI*.3,Math.PI*.8);g.stroke();g.globalCompositeOperation='source-over'}

    g.restore();
    /* ---- touch ring (last) ---- */
    Film.cue(c,'touch').forEach(q=>Film.touch(g,kx+Math.sin(-135*D2R)*96*KS,ky-Math.cos(-135*D2R)*96*KS,q.age));
  }
});
})();
