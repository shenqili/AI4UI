/* s04 Dropdown -> folding fan (ink mountain; choosing 'snow' leaves the same mountain as white-space snow peak).
   Everything is a pure function of c (cues). No own clock, no randomness. Pivot/geometry fixed => no global motion. */
(function(){
const S=.56, PX=960, PY=800, R=1200*S, RIN=420*S, NF=19, D=Math.PI/180, WF=150/NF*D, TILT=-8*D;
const AW=Math.round(2400*S), AH=Math.round(1300*S), APX=1200*S, APY=1250*S;
const LABELS=['山','水','风','月','雪'], LF=[1,4,7,11,16], LR=600;
const INK='#1B2F5B', PAPER='#F0E6D2', VERM='#A83A2E';
const clamp=Film.clamp, lerp=Film.lerp, eo=Film.ease.eo, sio=Film.ease.sio;
const mixc=(a,b,t)=>'rgb('+[0,1,2].map(i=>Math.round(a[i]+(b[i]-a[i])*t)).join(',')+')';
const BGA=[[183,206,191],[157,185,169]], BGB=[[228,237,239],[203,218,224]];
let cv,g,img,inkC=null,snowC=null,built=false;

function sstep(a,b,x){x=clamp((x-a)/(b-a));return x*x*(3-2*x)}

/* one-time derivation of the two paintings at working resolution (pure function of the asset) */
function build(){
  const mk=()=>{const c=document.createElement('canvas');c.width=AW;c.height=AH;return c};
  const src=mk(),sg=src.getContext('2d');sg.drawImage(img,0,0,AW,AH);
  const im=sg.getImageData(0,0,AW,AH),a=im.data,N=AW*AH;
  const d=new Float32Array(N);
  for(let i=0;i<N;i++){const L=(.299*a[i*4]+.587*a[i*4+1]+.114*a[i*4+2])/255;d[i]=clamp((.9-L)/.62)}
  // blurred darkness (body mask) via box blur on a 1/6 grid
  const q=6,bw=Math.ceil(AW/q),bh=Math.ceil(AH/q),sm=new Float32Array(bw*bh);
  for(let y=0;y<bh;y++)for(let x=0;x<bw;x++){let s=0,n=0;for(let yy=y*q;yy<Math.min(AH,y*q+q);yy+=2)for(let xx=x*q;xx<Math.min(AW,x*q+q);xx+=2){s+=d[yy*AW+xx];n++}sm[y*bw+x]=s/n}
  const tmp=new Float32Array(bw*bh),rad=4;
  for(let y=0;y<bh;y++)for(let x=0;x<bw;x++){let s=0,n=0;for(let k=-rad;k<=rad;k++){const xx=x+k;if(xx>=0&&xx<bw){s+=sm[y*bw+xx];n++}}tmp[y*bw+x]=s/n}
  for(let y=0;y<bh;y++)for(let x=0;x<bw;x++){let s=0,n=0;for(let k=-rad;k<=rad;k++){const yy=y+k;if(yy>=0&&yy<bh){s+=tmp[yy*bw+x];n++}}sm[y*bw+x]=s/n}
  const samp=(x,y)=>{const fx=Math.min(bw-1.001,Math.max(0,x/q-.5)),fy=Math.min(bh-1.001,Math.max(0,y/q-.5)),x0=fx|0,y0=fy|0,tx=fx-x0,ty=fy-y0;
    return (sm[y0*bw+x0]*(1-tx)+sm[y0*bw+x0+1]*tx)*(1-ty)+(sm[(y0+1)*bw+x0]*(1-tx)+sm[(y0+1)*bw+x0+1]*tx)*ty};
  inkC=mk();snowC=mk();
  const io=inkC.getContext('2d').createImageData(AW,AH),so=snowC.getContext('2d').createImageData(AW,AH),ia=io.data,sa=so.data;
  const pr=240,pg=230,pb=210, SP=[221,230,234], SW=[255,255,255], SH=[52,82,120];
  for(let y=0;y<AH;y++)for(let x=0;x<AW;x++){const i=y*AW+x,o=i*4,al=a[o+3];
    // toned-down ink: pull towards paper
    ia[o]=pr+(a[o]-pr)*.8;ia[o+1]=pg+(a[o+1]-pg)*.8;ia[o+2]=pb+(a[o+2]-pb)*.8;ia[o+3]=al;
    const dd=d[i],mb=samp(x,y);
    const body=sstep(.05,.26,mb);
    let r=SP[0]+(SW[0]-SP[0])*body,gg=SP[1]+(SW[1]-SP[1])*body,b=SP[2]+(SW[2]-SP[2])*body;
    const xn=x/AW,bias=.2+.8*clamp((xn-.42)/.3),sh=Math.min(.95,(Math.pow(sstep(.26,.9,dd),1.1)*bias+sstep(.16,.45,dd)*.16)*1.5);
    r+=(SH[0]-r)*sh;gg+=(SH[1]-gg)*sh;b+=(SH[2]-b)*sh;
    sa[o]=r;sa[o+1]=gg;sa[o+2]=b;sa[o+3]=al}
  inkC.getContext('2d').putImageData(io,0,0);snowC.getContext('2d').putImageData(so,0,0);
  built=true;
}

function foldPath(ctx,hw,eps){ctx.beginPath();ctx.arc(0,0,R,-Math.PI/2-hw,-Math.PI/2+hw+eps,false);ctx.arc(0,0,RIN,-Math.PI/2+hw+eps,-Math.PI/2-hw,true);ctx.closePath()}
function ribPath(ctx,w0,w1,L,ext){ctx.moveTo(-w0/2,ext);ctx.lineTo(-w0/2,0);ctx.lineTo(-w1/2,-L);ctx.lineTo(w1/2,-L);ctx.lineTo(w0/2,0);ctx.lineTo(w0/2,ext);ctx.closePath()}

Film.scene('s04',{
  mount(root,{W,H}){
    cv=document.createElement('canvas');cv.width=W;cv.height=H;cv.style.cssText='position:absolute;left:0;top:0';root.appendChild(cv);g=cv.getContext('2d');
    img=Film.img('assets/fan_ink_artwork.png');
  },
  render(c){
    const W=c.W,H=c.H,F=c.forced;
    if(!built&&img.complete&&img.naturalWidth)build();
    const uf=Film.cue(c,'unfold')[0],fd=Film.cue(c,'fold')[0],fl=Film.cue(c,'flip');
    const UL=uf?uf.e.lenSec:.375, FL=fd?fd.e.lenSec:.25, ua=F?99:(uf?uf.age:-1), fa=F?-1:(fd&&fd.started?fd.age:-1);
    const f1=fl[0]?fl[0].age:-1, f2=fl[1]?fl[1].age:-1;
    const sa=F?99:f2;                                   // snow flip age
    /* ---- per-fold state ---- */
    const o=[],sn=[];
    for(let i=0;i<NF;i++){
      let a=F?1:eo(clamp((ua-i/18*(UL-.22))/.22));
      if(fa>=0)a=1-eo(clamp((fa-(18-i)/18*(FL-.15))/.15));
      o.push(a);
      sn.push(sa<0?0:eo(clamp((sa-Math.abs(i-9)/9*.08)/.24)));
    }
    const ov=(F||fa>=0||ua<UL)?0:1.6*D*Math.sin(Math.PI*clamp((ua-UL)/.45));
    const RA=[lerp(TILT-9.5*.35*D,-75*D,o[0])];
    for(let j=0;j<NF;j++)RA.push(RA[j]+lerp(.35*D,WF,o[j])+(j===NF-1?ov:0));
    const ribA=j=>RA[j];
    const geo=i=>({th:(RA[i]+RA[i+1])/2,hw:(RA[i+1]-RA[i])/2+.3*D});
    /* ---- background (celadon -> cool) ---- */
    const bgT=sa<0?0:sio(clamp(sa/1.3));
    const grd=g.createRadialGradient(760,380,60,960,560,1350);
    grd.addColorStop(0,mixc(BGA[0],BGB[0],bgT));grd.addColorStop(1,mixc(BGA[1],BGB[1],bgT));
    g.fillStyle=grd;g.fillRect(0,0,W,H);
    /* ---- contact shadow (single pass, shape drawn off-canvas, only its shadow lands) ---- */
    const imp=Film.since(c,'impact'),sb=50+(F?0:20*(1-eo(clamp(imp/.15))));
    g.save();g.translate(-4000,0);g.shadowColor='rgba(20,45,40,.30)';g.shadowBlur=sb;g.shadowOffsetX=4000+26;g.shadowOffsetY=34;g.fillStyle='#000';
    g.beginPath();
    for(let i=0;i<NF;i++){const {th,hw}=geo(i);g.save();g.translate(PX,PY);g.rotate(th);
      g.arc(0,0,R,-Math.PI/2-hw,-Math.PI/2+hw,false);g.arc(0,0,RIN,-Math.PI/2+hw,-Math.PI/2-hw,true);g.closePath();g.restore()}
    g.fill();g.restore();
    /* ---- ribs (under the paper) ---- */
    for(let j=1;j<NF;j++){const a=ribA(j);g.save();g.translate(PX,PY);g.rotate(a);
      const gr=g.createLinearGradient(-5,0,5,0);gr.addColorStop(0,'#E4D09A');gr.addColorStop(.5,'#C9B07A');gr.addColorStop(1,'#A38A54');
      g.beginPath();ribPath(g,9,14,RIN+10,0);g.fillStyle=gr;g.fill();g.strokeStyle='rgba(70,50,20,.35)';g.lineWidth=.8;g.stroke();g.restore()}
    /* ---- highlight state ---- */
    let hlPos=-9,hlA=0,selA=0;
    if(F){hlPos=4;hlA=1}
    else{
      const stops=[];c.ev.forEach(e=>{if(e.type==='hover')stops.push({lt:e.lt,i:e.i});});
      const lastH=stops.length?stops[stops.length-1].lt:-1;
      c.ev.forEach(e=>{if(e.type==='touch'&&e.lt>lastH&&stops.length)stops.push({lt:e.lt,i:4})});
      let k=-1;stops.forEach((s,n)=>{if(c.t>=s.lt)k=n});
      if(k>=0){const s=stops[k],pv=k>0?stops[k-1].i:s.i;hlPos=lerp(pv,s.i,sio((c.t-s.lt)/.25));hlA=k>0?1:clamp((c.t-s.lt)/.15);if(s.i===4)selA=clamp((c.t-s.lt)/.2)}
    }
    const glow=k=>hlA*clamp(1-Math.abs(hlPos-k));
    /* ---- paper folds ---- */
    const order=[...Array(NF).keys()].sort((a,b)=>Math.abs(b-9)-Math.abs(a-9));
    const tmpGlow={};LF.forEach((f,k)=>tmpGlow[f]=glow(k));
    for(const i of order){
      const {th,hw}=geo(i),phi=(-75+(i+.5)*150/NF)*D;
      g.save();g.translate(PX,PY);g.rotate(th);
      foldPath(g,hw,0);g.clip();
      g.fillStyle=PAPER;g.fillRect(-R,-R,2*R,R);
      if(built){
        g.save();g.rotate(-phi);
        g.drawImage(inkC,-APX,-APY);
        const s=sn[i];
        if(s>=1)g.drawImage(snowC,-APX,-APY);
        else if(s>0){const rf=lerp(RIN-6,R+100,s),B=7;
          for(let b=0;b<B;b++){const r=rf-b*14;if(r<=RIN-40)break;
            g.save();g.globalAlpha=1/(B-b);g.beginPath();g.arc(0,0,r,0,Math.PI*2);g.clip();g.rotate(0);g.drawImage(snowC,-APX,-APY);g.restore()}}
        g.restore();
      }
      // pleat shading
      const hx=Math.max(3,.5*(RIN+R)/2*hw*2),gr=g.createLinearGradient(-hx,0,hx,0);
      if(i%2===0){gr.addColorStop(0,'rgba(255,250,235,.05)');gr.addColorStop(1,'rgba(55,42,22,.09)')}
      else{gr.addColorStop(0,'rgba(55,42,22,.09)');gr.addColorStop(1,'rgba(255,250,235,.05)')}
      g.fillStyle=gr;g.fillRect(-R,-R,2*R,R);
      const gl=tmpGlow[i]||0;if(gl>0){g.fillStyle='rgba(27,47,91,'+(.05*gl*o[i]).toFixed(3)+')';g.fillRect(-R,-R,2*R,R)}
      g.restore();
      // paper rim
      g.save();g.translate(PX,PY);g.rotate(th);g.strokeStyle='rgba(255,252,240,.45)';g.lineWidth=1.4;g.beginPath();g.arc(0,0,R-1,-Math.PI/2-hw,-Math.PI/2+hw);g.stroke();g.restore();
    }
    /* ---- option labels on the outer edge of folds ---- */
    LF.forEach((f,k)=>{const al=clamp((o[f]-.75)/.25);if(al<=0)return;
      const th=geo(f).th,gl=glow(k);
      g.save();g.translate(PX,PY);g.rotate(th);g.translate(0,-LR+30*gl);g.scale(1+gl,1+gl);g.globalAlpha=al;
      g.beginPath();g.arc(0,0,36,0,Math.PI*2);
      if(gl>0){g.fillStyle='rgba(240,230,210,'+(.88*gl).toFixed(3)+')';g.fill();g.strokeStyle='rgba(27,47,91,'+(.95*gl).toFixed(3)+')';g.lineWidth=3;g.stroke()}
      g.fillStyle=INK;g.globalAlpha=al*lerp(.7,1,gl);
      g.font='700 46px "KaiTi","STKaiti","Kaiti SC","SimSun","Microsoft YaHei",serif';g.textAlign='center';g.textBaseline='middle';g.fillText(LABELS[k],0,2);
      g.restore()});
    /* ---- guard sticks, handle stubs, rivet ---- */
    for(const j of [0,NF]){const a=ribA(j);g.save();g.translate(PX,PY);g.rotate(a);
      const gr=g.createLinearGradient(-13,0,13,0);gr.addColorStop(0,'#F0DDA8');gr.addColorStop(.35,'#CDB47C');gr.addColorStop(1,'#9C8250');
      g.beginPath();g.moveTo(-6,74);g.lineTo(-6,0);g.lineTo(-13,-R+6);g.arc(0,-R+6,13,Math.PI,0,false);g.lineTo(6,0);g.lineTo(6,74);g.arc(0,74,6,0,Math.PI,false);g.closePath();
      g.fillStyle=gr;g.fill();g.strokeStyle='rgba(70,50,20,.45)';g.lineWidth=1;g.stroke();
      g.strokeStyle='rgba(255,246,214,.55)';g.lineWidth=1.6;g.beginPath();g.moveTo(-3,60);g.lineTo(-3,0);g.lineTo(-8,-R+14);g.stroke();
      g.restore()}
    g.beginPath();g.arc(PX,PY,12,0,Math.PI*2);g.fillStyle='#6E5A33';g.fill();
    g.beginPath();g.arc(PX-2.5,PY-2.5,4,0,Math.PI*2);g.fillStyle='#E8D6A2';g.fill();
    /* ---- tassel (soft body: tiny damped swing after unfold, otherwise still) ---- */
    const sw=F?1.2*D*Math.sin(c.t*1.1):(ua>UL&&fa<0?2.4*D*Math.exp(-(ua-UL)*1.4)*Math.sin((ua-UL)*2*Math.PI/.9):0);
    g.save();g.translate(PX,PY+6);g.rotate(sw);
    g.strokeStyle=VERM;g.lineWidth=3;g.lineCap='round';g.beginPath();g.moveTo(0,0);g.lineTo(0,58);g.stroke();
    const bg=g.createRadialGradient(-3,64,1,0,68,12);bg.addColorStop(0,'#D9695A');bg.addColorStop(1,'#8C2A21');
    g.beginPath();g.arc(0,68,11,0,Math.PI*2);g.fillStyle=bg;g.fill();
    for(let n=-5;n<=5;n++){g.strokeStyle=n%2?'#B84A3C':'#9A3126';g.lineWidth=2.6;g.beginPath();g.moveTo(n*1.6,78);g.quadraticCurveTo(n*3.2,104,n*4.6,138);g.stroke()}
    g.fillStyle='#8C2A21';g.fillRect(-9,76,18,6);

    g.restore();
    /* ---- seal 雪 stamped on the table beside the closed fan (fixed position) ---- */
    const sl=selA*(1-o[9]);if(sl>0){g.save();g.globalAlpha=sl;g.translate(1088,716);

      g.fillStyle='#A83A2E';g.beginPath();g.roundRect?g.roundRect(0,0,72,72,5):g.rect(0,0,72,72);g.fill();
      g.strokeStyle='rgba(240,230,210,.55)';g.lineWidth=2;g.strokeRect(6,6,60,60);
      g.fillStyle='#F0E6D2';g.font='700 46px "KaiTi","STKaiti","Kaiti SC","SimSun",serif';g.textAlign='center';g.textBaseline='middle';g.fillText('雪',36,39);g.restore()}
    /* ---- light: hero glows (<=25%, radius<=600, 0.3 s) ---- */
    const glowAt=(age,col,cx,cy)=>{if(age<0||age>.3)return;const k=1-age/.3,gg=g.createRadialGradient(cx,cy,0,cx,cy,600);
      gg.addColorStop(0,'rgba('+col+','+(.22*k).toFixed(3)+')');gg.addColorStop(1,'rgba('+col+',0)');g.fillStyle=gg;g.fillRect(cx-600,cy-600,1200,1200)};
    if(!F){glowAt(f1,'255,246,222',973,400);glowAt(f2,'232,246,255',973,400)}
    /* ---- touch ring ---- */
    if(!F)Film.cue(c,'touch').forEach(q=>{
      const first=!uf||q.e.lt<uf.e.lt;
      if(first)Film.touch(g,PX+430*Math.sin(TILT),PY-430*Math.cos(TILT),q.age);
      else{const a=(-75+(LF[4]+.5)*150/NF)*D;Film.touch(g,PX+LR*Math.sin(a),PY-LR*Math.cos(a),q.age)}});
  }
});
})();
