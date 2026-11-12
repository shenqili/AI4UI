/* s00 — opener: one seal pressed once. Same ink/rubber language as s03 (vermilion #C8321E, rough edge, wet->dry). Times come from c.ev only. */
(function(){
const E=Film.ease,cl=Film.clamp,lerp=Film.lerp;
const INK='#C8321E',WET='#E8603A',CX=960,CY=476,FW=1200,FH=360;
const CH='一物一控',PITCH=272,FS=236;
let cv,g,tile,rnd,mask,gray,wet,bg=null,bgTile=null;

function fontStack(){return '900 '+FS+'px "Noto Serif CJK SC","Source Han Serif SC","Songti SC","SimSun","Microsoft YaHei",serif'}

function drawSeal(d,dx,dy){
  d.save();d.translate(dx,dy);
  d.strokeStyle='#000';d.fillStyle='#000';
  d.lineWidth=12;d.strokeRect(CX-FW/2,CY-FH/2,FW,FH);
  d.lineWidth=3.5;d.strokeRect(CX-FW/2+26,CY-FH/2+26,FW-52,FH-52);
  d.font=fontStack();d.textAlign='center';d.textBaseline='middle';
  for(let i=0;i<4;i++){d.fillText(CH[i],CX+(i-1.5)*PITCH,CY+6);d.lineWidth=5;d.strokeText(CH[i],CX+(i-1.5)*PITCH,CY+6)}
  d.restore();
}
function build(W,H){
  mask=document.createElement('canvas');mask.width=W;mask.height=H;
  const d=mask.getContext('2d');
  // rough edge: union of seeded 1.2 px jittered copies
  for(let j=0;j<9;j++)drawSeal(d,(rnd[j*2]-.5)*3,(rnd[j*2+1]-.5)*3);
  // ink starvation (density only, shape untouched): few small flecks + slightly dry top-right
  d.globalCompositeOperation='destination-out';
  for(let j=0;j<90;j++){
    const x=CX-FW/2+rnd[100+j]*FW,y=CY-FH/2+rnd[200+j]*FH,r=.7+rnd[300+j]*1.6;
    d.fillStyle='rgba(0,0,0,'+(.10+rnd[400+j]*.35)+')';d.beginPath();d.arc(x,y,r,0,7);d.fill();
  }
  const lg=d.createLinearGradient(CX-FW/2,CY+FH/2,CX+FW/2,CY-FH/2);lg.addColorStop(0,'rgba(0,0,0,0)');lg.addColorStop(1,'rgba(0,0,0,.16)');
  d.fillStyle=lg;d.fillRect(CX-FW/2-20,CY-FH/2-20,FW+40,FH+40);
  const tint=(col)=>{const c=document.createElement('canvas');c.width=W;c.height=H;const x=c.getContext('2d');x.drawImage(mask,0,0);x.globalCompositeOperation='source-in';x.fillStyle=col;x.fillRect(0,0,W,H);return c};
  wet=tint(WET);
  // dry ink: bake colour
  const dry=tint(INK);gray=tint('rgba(60,50,40,.07)');mask=dry;
}
function buildBg(W,H){
  if(!bg){bg=document.createElement('canvas');bg.width=W;bg.height=H}
  const s=bg.getContext('2d'),ok=tile&&tile.complete&&tile.naturalWidth;
  let gr=s.createRadialGradient(760,380,100,960,540,1250);gr.addColorStop(0,'#F8F3E8');gr.addColorStop(1,'#E9E1D0');
  s.fillStyle=gr;s.fillRect(0,0,W,H);
  if(ok){s.globalCompositeOperation='multiply';s.globalAlpha=.4;s.fillStyle=s.createPattern(tile,'repeat');s.fillRect(0,0,W,H);s.globalAlpha=1;s.globalCompositeOperation='source-over'}
  bgTile=ok?tile:null;
}

Film.scene('s00',{
  mount(root,{W,H}){
    cv=document.createElement('canvas');cv.width=W;cv.height=H;cv.style.cssText='position:absolute;left:0;top:0';root.appendChild(cv);g=cv.getContext('2d');
    rnd=Film.rand('s00',500);tile=Film.img('assets/paper_fiber_tile.png');build(W,H);
  },
  render(c){
    const W=c.W,H=c.H;
    if(!bg||bgTile!==((tile.complete&&tile.naturalWidth)?tile:null))buildBg(W,H);
    g.drawImage(bg,0,0);
    g.drawImage(gray,0,0);                                   // pre-set 6 % outline
    const ink=Film.cue(c,'ink')[0];
    const u=c.forced?1:(ink?(ink.age<0?0:cl(ink.age/ink.e.lenSec)):(c.t>0?1:0));
    const age=c.forced?9:(ink?ink.age:(c.t>0?c.t:-1));
    if(u>0){
      const top=CY-FH/2-12,hh=FH+24,y=top+hh*E.eo(u);
      g.save();g.beginPath();g.moveTo(0,0);g.lineTo(W,0);
      if(u<1){for(let x=W;x>=0;x-=16){g.lineTo(x,y+Math.sin(x*.021+rnd[(x>>4)%400]*3)*4*(1-u*.5)+(rnd[(x>>4)%400]-.5)*2)}}
      else{g.lineTo(W,H);g.lineTo(0,H)}
      g.closePath();g.clip();
      g.drawImage(mask,0,0);
      const wa=cl(1-(age-.1)/.4)*.8;                         // fresh ink is brighter, dries in colour
      if(wa>0){g.globalAlpha=wa;g.drawImage(wet,0,0)}
      g.restore();
    }
    // thump light: warm local halo, <=650 px, <=25 %, gone in 0.3 s
    if(!c.forced&&age>=0&&age<.3){
      const a=.16*(1-E.eo(age/.3));
      g.save();g.globalCompositeOperation='multiply';
      const hg=g.createRadialGradient(CX,CY,60,CX,CY,620);hg.addColorStop(0,'rgba(255,205,160,'+a+')');hg.addColorStop(1,'rgba(255,205,160,0)');
      g.fillStyle=hg;g.fillRect(0,0,W,H);g.restore();
    }
    // sub line
    const sub=c.ev.find(e=>e.type==='sub');
    const sa=c.forced?1:(sub?E.sio(cl((c.t-sub.lt)/.25)):0);
    if(sa>0){
      const txt='ONE THING, ONE CONTROL';
      g.save();g.globalAlpha=sa;g.fillStyle='#6B6258';g.font='600 30px Inter,"SF Pro Display","Segoe UI",sans-serif';g.textBaseline='alphabetic';g.textAlign='left';
      const sp=30*.22;let w=0;for(const ch of txt)w+=g.measureText(ch).width+sp;w-=sp;
      let x=CX-w/2;for(const ch of txt){g.fillText(ch,x,CY+FH/2+92);x+=g.measureText(ch).width+sp}
      g.restore();
    }
  }
});
})();
