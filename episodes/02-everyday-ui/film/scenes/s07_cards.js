/* s07 Tabs -> walnut index-card box. Five upright cards in a row; the pulled card STAYS up (persistent selection),
   the previous one drops back. Everything is a pure function of c.ev / c.t. No global transform of any kind. */
(function(){
const W=1920,H=1080;
const PAPER='#F3EDE0',INK='#2B2E33',BGC='#15110F';
const TABC=['#D9452B','#F2A33A','#3FBF9F','#2F5BD6','#8E5BD6'];
const CW=262,CG=18,CH=540,TAB_W=190,TAB_H=52,N=5;
const X0=(W-(N*CW+(N-1)*CG))/2;               // 269
const WALL_TOP=700,WALL_BOT=824,BOX_L=200,BOX_R=1720,BACK_TOP=526,REST_TOP=570;
const lift_of=v=>190+170*v;                     // pulled height from rest (px)
let cv,g,wood,paper,layers=null,faces=null;
const cl=Film.clamp,lerp=Film.lerp,eo=Film.ease.eo;

function hex(c){return[parseInt(c.substr(1,2),16),parseInt(c.substr(3,2),16),parseInt(c.substr(5,2),16)]}
function mix(a,b,t){const A=hex(a),B=hex(b);return[0,1,2].map(i=>Math.round(A[i]+(B[i]-A[i])*t))}
function rgb(a,al){return'rgba('+a[0]+','+a[1]+','+a[2]+','+(al==null?1:al)+')'}
function rrect(x,X,Y,w,h,r){x.beginPath();x.moveTo(X+r,Y);x.arcTo(X+w,Y,X+w,Y+h,r);x.arcTo(X+w,Y+h,X,Y+h,r);x.arcTo(X,Y+h,X,Y,r);x.arcTo(X,Y,X+w,Y,r);x.closePath()}
function mk(w,h){const c=document.createElement('canvas');c.width=w;c.height=h;return c}
function pat(x,img,s){const p=x.createPattern(img,'repeat');if(p&&p.setTransform)p.setTransform(new DOMMatrix().scale(s));return p}
const ok=im=>im&&im.complete&&im.naturalWidth>0;

/* ---------- ink drawings, local origin = art centre ---------- */
function art(x,k){
  x.save();x.translate(CW/2,240);x.scale(1.1,1.1);x.lineCap='round';x.lineJoin='round';x.strokeStyle=INK;x.lineWidth=3.4;
  const tc=hex(TABC[k]);
  x.fillStyle=rgb(tc,.2);x.beginPath();x.arc(0,0,88,0,Math.PI*2);x.fill();
  x.fillStyle=rgb(tc,.55);
  if(k===0){                                  // mountains + sun
    x.beginPath();x.moveTo(-74,54);x.lineTo(-22,-34);x.lineTo(6,8);x.lineTo(34,-20);x.lineTo(76,54);x.closePath();x.fill();x.stroke();
    x.beginPath();x.moveTo(-36,-10);x.lineTo(-22,-34);x.lineTo(-8,-10);x.lineTo(-16,-4);x.lineTo(-24,-12);x.lineTo(-30,-4);x.closePath();x.fillStyle='#FBF7EC';x.fill();x.stroke();
    x.beginPath();x.arc(46,-46,12,0,6.3);x.fillStyle=rgb(tc,.9);x.fill();x.stroke();
    x.beginPath();x.moveTo(-82,54);x.lineTo(82,54);x.stroke();
  }else if(k===1){                            // boat
    x.beginPath();x.moveTo(4,-60);x.lineTo(4,8);x.lineTo(52,8);x.closePath();x.fill();x.stroke();
    x.beginPath();x.moveTo(-3,-66);x.lineTo(-3,22);x.stroke();
    x.beginPath();x.moveTo(-64,20);x.lineTo(64,20);x.quadraticCurveTo(44,54,0,54);x.quadraticCurveTo(-44,54,-64,20);x.closePath();x.fillStyle='#FBF7EC';x.fill();x.stroke();
    for(let i=0;i<3;i++){x.beginPath();x.moveTo(-70+i*50,72);x.quadraticCurveTo(-58+i*50,62,-46+i*50,72);x.quadraticCurveTo(-34+i*50,82,-22+i*50,72);x.stroke()}
  }else if(k===2){                            // leaf
    x.beginPath();x.moveTo(0,72);x.bezierCurveTo(-62,34,-58,-34,0,-74);x.bezierCurveTo(58,-34,62,34,0,72);x.closePath();x.fill();x.stroke();
    x.lineWidth=2.6;x.beginPath();x.moveTo(0,98);x.lineTo(0,-52);x.stroke();
    for(let i=0;i<4;i++){const y=34-i*24,w=34-i*5;x.beginPath();x.moveTo(0,y);x.lineTo(-w,y-18);x.moveTo(0,y);x.lineTo(w,y-18);x.stroke()}
  }else if(k===3){                            // moon
    x.save();x.beginPath();x.arc(0,0,62,0,6.3);x.clip();x.fillStyle=INK;x.beginPath();x.rect(-100,-100,200,200);x.arc(26,-12,52,0,6.3);x.fill('evenodd');x.restore();
    x.lineWidth=3;
    [[48,-48,9],[62,6,6],[30,56,7]].forEach(s=>{x.beginPath();x.moveTo(s[0]-s[2],s[1]);x.lineTo(s[0]+s[2],s[1]);x.moveTo(s[0],s[1]-s[2]);x.lineTo(s[0],s[1]+s[2]);x.stroke()});
    x.beginPath();x.moveTo(-76,70);x.quadraticCurveTo(-40,56,-4,70);x.stroke();
  }else{                                      // fish
    x.beginPath();x.moveTo(40,0);x.lineTo(76,-28);x.quadraticCurveTo(66,0,76,28);x.closePath();x.fill();x.stroke();
    x.beginPath();x.ellipse(-8,0,54,32,0,0,6.3);x.fill();x.stroke();
    x.beginPath();x.moveTo(-14,-30);x.quadraticCurveTo(-2,-52,22,-40);x.quadraticCurveTo(12,-34,10,-26);x.stroke();
    x.lineWidth=2.4;for(let r=0;r<2;r++)for(let i=0;i<3;i++){x.beginPath();x.arc(4+i*14,-8+r*16,9,-1.2,1.2);x.stroke()}
    x.lineWidth=3.4;x.beginPath();x.arc(-34,-6,4.5,0,6.3);x.fillStyle=INK;x.fill();
    x.beginPath();x.arc(-70,-26,6,0,6.3);x.stroke();x.beginPath();x.arc(-58,-50,9,0,6.3);x.stroke();
  }
  x.restore();
}

/* ---------- static layers (built once the textures are ready) ---------- */
function build(){
  // back layer: floor + box back wall / interior / side walls
  const b=mk(W,H),x=b.getContext('2d');
  x.fillStyle=BGC;x.fillRect(0,0,W,H);
  let rg=x.createRadialGradient(900,520,60,960,600,1000);rg.addColorStop(0,'#2E2119');rg.addColorStop(.55,'#1D1511');rg.addColorStop(1,BGC);
  x.fillStyle=rg;x.fillRect(0,0,W,H);
  x.save();x.filter='blur(34px)';x.fillStyle='rgba(0,0,0,.62)';x.beginPath();x.ellipse(960,WALL_BOT+8,780,44,0,0,6.3);x.fill();x.restore();
  // box block (back + sides), walnut
  const wood0='#5A3A22';
  x.fillStyle=wood0;x.fillRect(BOX_L,BACK_TOP,BOX_R-BOX_L,WALL_BOT-BACK_TOP);
  if(ok(wood)){x.save();x.globalCompositeOperation='overlay';x.globalAlpha=.55;x.fillStyle=pat(x,wood,.7);x.fillRect(BOX_L,BACK_TOP,BOX_R-BOX_L,WALL_BOT-BACK_TOP);x.restore()}
  // top lip (light from upper left)
  let lg=x.createLinearGradient(BOX_L,0,BOX_R,0);lg.addColorStop(0,'rgba(255,214,160,.34)');lg.addColorStop(1,'rgba(255,214,160,.08)');
  x.fillStyle=lg;x.fillRect(BOX_L,BACK_TOP,BOX_R-BOX_L,14);
  x.fillStyle='rgba(0,0,0,.28)';x.fillRect(BOX_L,BACK_TOP+14,BOX_R-BOX_L,2);
  // interior recess
  const ix=BOX_L+38,iw=BOX_R-BOX_L-76,iy=BACK_TOP+16;
  let ig=x.createLinearGradient(0,iy,0,WALL_TOP);ig.addColorStop(0,'#1A0F08');ig.addColorStop(1,'#33200F');
  x.fillStyle=ig;x.fillRect(ix,iy,iw,WALL_TOP-iy);
  if(ok(wood)){x.save();x.globalCompositeOperation='overlay';x.globalAlpha=.35;x.fillStyle=pat(x,wood,.7);x.fillRect(ix,iy,iw,WALL_TOP-iy);x.restore()}
  let sg=x.createLinearGradient(ix,0,ix+120,0);sg.addColorStop(0,'rgba(0,0,0,.5)');sg.addColorStop(1,'rgba(0,0,0,0)');x.fillStyle=sg;x.fillRect(ix,iy,120,WALL_TOP-iy);
  sg=x.createLinearGradient(ix+iw,0,ix+iw-120,0);sg.addColorStop(0,'rgba(0,0,0,.4)');sg.addColorStop(1,'rgba(0,0,0,0)');x.fillStyle=sg;x.fillRect(ix+iw-120,iy,120,WALL_TOP-iy);
  // overall light falloff on the box block
  let fg=x.createLinearGradient(BOX_L,BACK_TOP,BOX_R,WALL_BOT);fg.addColorStop(0,'rgba(255,200,140,.10)');fg.addColorStop(1,'rgba(0,0,0,.18)');
  x.fillStyle=fg;x.fillRect(BOX_L,BACK_TOP,BOX_R-BOX_L,WALL_BOT-BACK_TOP);
  // ambient occlusion where cards enter the box (drawn later over cards, see front layer)
  // front layer: AO over cards + front wall + brass corners
  const f=mk(W,H),y=f.getContext('2d');
  let ao=y.createLinearGradient(0,WALL_TOP-16,0,WALL_TOP);ao.addColorStop(0,"rgba(20,10,4,0)");ao.addColorStop(1,"rgba(20,10,4,.3)");
  y.fillStyle=ao;y.fillRect(ix,WALL_TOP-16,iw,16);
  const fh=WALL_BOT-WALL_TOP;
  y.save();y.shadowColor='rgba(0,0,0,.45)';y.shadowBlur=22;y.shadowOffsetY=-4;y.fillStyle=wood0;y.fillRect(BOX_L,WALL_TOP,BOX_R-BOX_L,fh);y.restore();
  y.fillStyle='#6A4528';y.fillRect(BOX_L,WALL_TOP,BOX_R-BOX_L,fh);
  if(ok(wood)){y.save();y.globalCompositeOperation='overlay';y.globalAlpha=.6;y.fillStyle=pat(y,wood,.85);y.fillRect(BOX_L,WALL_TOP,BOX_R-BOX_L,fh);y.restore()}
  let wg=y.createLinearGradient(0,WALL_TOP,0,WALL_BOT);wg.addColorStop(0,'rgba(255,214,160,.30)');wg.addColorStop(.12,'rgba(255,214,160,.06)');wg.addColorStop(1,'rgba(0,0,0,.34)');
  y.fillStyle=wg;y.fillRect(BOX_L,WALL_TOP,BOX_R-BOX_L,fh);
  let hg=y.createLinearGradient(BOX_L,0,BOX_R,0);hg.addColorStop(0,'rgba(255,225,180,.16)');hg.addColorStop(.5,'rgba(255,225,180,0)');hg.addColorStop(1,'rgba(0,0,0,.14)');
  y.fillStyle=hg;y.fillRect(BOX_L,WALL_TOP,BOX_R-BOX_L,fh);
  y.fillStyle='rgba(255,226,186,.55)';y.fillRect(BOX_L,WALL_TOP,BOX_R-BOX_L,2);          // lip highlight
  y.fillStyle='rgba(0,0,0,.45)';y.fillRect(BOX_L,WALL_TOP+16,BOX_R-BOX_L,2);                 // bevel groove
  y.fillStyle='rgba(0,0,0,.35)';y.fillRect(BOX_L,WALL_BOT-3,BOX_R-BOX_L,3);
  // brass corner caps (the scene's single decoration)
  [[BOX_L,1],[BOX_R-56,0]].forEach(([bx,left])=>{
    const bg=y.createLinearGradient(bx,WALL_TOP,bx+56,WALL_BOT);bg.addColorStop(0,'#E6C98A');bg.addColorStop(.35,'#B08D57');bg.addColorStop(1,'#6D5530');
    rrect(y,bx,WALL_TOP-2,56,fh+2,6);y.fillStyle=bg;y.fill();
    y.fillStyle='rgba(255,246,214,.45)';y.fillRect(bx+(left?2:4),WALL_TOP,2,fh);
    y.fillStyle='rgba(0,0,0,.28)';y.fillRect(bx+(left?52:2),WALL_TOP,2,fh);
    [WALL_TOP+30,WALL_BOT-30].forEach(py=>{y.beginPath();y.arc(bx+28,py,5.5,0,6.3);y.fillStyle='#6D5530';y.fill();y.beginPath();y.arc(bx+27,py-1,3,0,6.3);y.fillStyle='#E8D199';y.fill()})
  });
  layers={back:b,front:f};
  // card faces
  faces=[];
  for(let k=0;k<N;k++){
    const c=mk(CW,CH),z=c.getContext('2d');
    rrect(z,0,0,CW,CH+20,7);z.save();z.clip();
    z.fillStyle=PAPER;z.fillRect(0,0,CW,CH);
    if(ok(paper)){z.globalCompositeOperation='multiply';z.globalAlpha=.7;z.fillStyle=pat(z,paper,.5);z.fillRect(0,0,CW,CH);z.globalCompositeOperation='source-over';z.globalAlpha=1}
    // faint ruling (index card), only the lower part shows when pulled high
    z.strokeStyle='rgba(120,150,190,.45)';z.lineWidth=1.6;
    for(let ly=396;ly<CH;ly+=30){z.beginPath();z.moveTo(14,ly);z.lineTo(CW-14,ly);z.stroke()}
    z.strokeStyle='rgba(217,69,43,.35)';z.beginPath();z.moveTo(14,376);z.lineTo(CW-14,376);z.stroke();
    art(z,k);
    // lighting: left lit, right falls off; paper thickness on right edge
    let sh=z.createLinearGradient(0,0,CW,0);sh.addColorStop(0,'rgba(255,255,255,.22)');sh.addColorStop(.55,'rgba(255,255,255,0)');sh.addColorStop(1,'rgba(60,40,20,.12)');
    z.fillStyle=sh;z.fillRect(0,0,CW,CH);
    z.fillStyle=rgb(hex(TABC[k]),.9);z.fillRect(0,0,CW,14);z.fillStyle='rgba(255,255,255,.7)';z.fillRect(0,0,CW,2);
    z.fillStyle='rgba(150,130,100,.55)';z.fillRect(CW-4,0,4,CH);
    z.restore();
    faces.push(c);
  }
}

/* ---------- selection timeline: pure function of the cue list ---------- */
function evalSt(s,t){const u=cl((t-s.t)/s.dur);return s.from+(s.to-s.from)*(s.up?eo(u):u*u)}
function liftState(k,tt,evl){
  let s={t:-1e3,from:0,to:0,dur:.01,up:true},sel=-1;
  for(const e of evl){
    if(e.lt>tt+1e-9)break;
    const cur=evalSt(s,e.lt);
    if(e.card===k&&sel!==k){s={t:e.lt,from:cur,to:lift_of(e.v),dur:.16,up:true};sel=k}
    else if(e.card!==k&&sel===k){s={t:e.lt,from:cur,to:0,dur:.12,up:false};sel=-1}
  }
  const u=cl((tt-s.t)/s.dur);
  return{lift:evalSt(s,tt),rising:s.up&&u<1&&s.from<s.to?u:1,t0:s.t,sel:sel===k};
}
function pullList(c){
  if(c.forced||!c.ev.some(e=>e.type==='pull'))return[{lt:-99,card:4,v:1,hero:true}];
  const flips=c.ev.filter(e=>e.type==='flip'&&typeof e.card==='number');
  const list=[{lt:-99,card:0,v:.4}];
  c.ev.filter(e=>e.type==='pull'&&typeof e.card==='number').forEach(e=>{
    const f=flips.find(q=>q.card===e.card&&Math.abs(q.b-e.b)<1e-6);
    list.push({lt:e.lt,card:e.card-1,v:f&&typeof f.v==='number'?f.v:.5})});
  let hi=0;list.forEach(e=>{if(e.lt>-50&&e.v>hi)hi=e.v});list.forEach(e=>{e.hero=e.lt>-50&&e.v>=hi});
  return list;
}

const LBL=["山","舟","叶","月","鱼"];
function tab(x,k,cx,top,col,s,glow,pulse){
  const TW=TAB_W+40*s,TH=TAB_H+14*s,tx=cx+(CW-TW)/2,base=mix(col,'#4A3A2C',.34*(1-s)),lit=mix(col,'#FFFFFF',.10+.16*s+pulse);
  const y=top+TAB_H-TH,h=TH+3;
  x.beginPath();x.moveTo(tx,y+h);x.lineTo(tx,y+14);x.arcTo(tx,y,tx+14,y,14);x.lineTo(tx+TW-14,y);x.arcTo(tx+TW,y,tx+TW,y+14,14);x.lineTo(tx+TW,y+h);x.closePath();
  let tg=x.createLinearGradient(0,y,0,y+h);tg.addColorStop(0,rgb(lit));tg.addColorStop(1,rgb(base));
  x.fillStyle=tg;x.fill();x.lineWidth=2;x.strokeStyle='rgba(30,12,4,.35)';x.stroke();
  x.save();x.font='800 '+Math.round(40+16*s)+'px "PingFang SC","Microsoft YaHei",Inter,sans-serif';x.textAlign='center';x.textBaseline='middle';x.fillStyle='rgba(40,16,4,.35)';x.fillText(LBL[k],tx+TW/2+1,y+TH/2+3);x.fillStyle='#FFFFFF';x.fillText(LBL[k],tx+TW/2,y+TH/2+2);x.restore();
  x.fillStyle='rgba(255,255,255,.35)';x.fillRect(tx+10,y+3,TW-20,2);
  if(s>.5){                                   // persistent selected marker: brass pin clip on the tab
    const a=cl((s-.5)*2),px=tx+TW-46,py=y-8;
    x.save();x.globalAlpha=a;
    x.fillStyle='rgba(0,0,0,.25)';x.fillRect(px+3,py+4,30,TH*.55+8);
    const bg=x.createLinearGradient(px,py,px+30,py);bg.addColorStop(0,'#F0D9A0');bg.addColorStop(.45,'#B08D57');bg.addColorStop(1,'#6D5530');
    rrect(x,px,py,30,TH*.55+8,5);x.fillStyle=bg;x.fill();x.strokeStyle='rgba(60,40,10,.5)';x.lineWidth=1.5;x.stroke();
    x.beginPath();x.arc(px+15,py+9,4,0,6.3);x.fillStyle='#6D5530';x.fill();x.beginPath();x.arc(px+14,py+8,2,0,6.3);x.fillStyle='#F6E6B4';x.fill();
    x.restore();
  }
}

Film.scene('s07',{
  mount(root,{W:w,H:h}){
    cv=document.createElement('canvas');cv.width=w;cv.height=h;cv.style.cssText='position:absolute;left:0;top:0';root.appendChild(cv);g=cv.getContext('2d');
    wood=Film.img('assets/wood_walnut_tile.png');paper=Film.img('assets/paper_fiber_tile.png');
  },
  render(c){
    if(!layers&&ok(wood)&&ok(paper))build();
    if(!layers)build();                       // textures missing -> procedural fallback (still deterministic)
    const evl=pullList(c);
    g.drawImage(layers.back,0,0);
    // card order: resting first, higher lift on top
    const st=[];for(let k=0;k<N;k++)st.push(Object.assign({k},liftState(k,c.t,evl)));
    g.save();g.beginPath();g.rect(0,0,W,WALL_BOT-2);g.clip();
    const ord=st.slice().sort((a,b)=>a.lift-b.lift||a.k-b.k);
    const sinceImpact=Film.since(c,'impact');
    ord.forEach(s=>{
      const x=X0+s.k*(CW+CG),top=REST_TOP-s.lift,sel=cl(s.lift/120);
      // last pull event that targeted this card -> tab light sweep
      let age=99;evl.forEach(e=>{if(e.card===s.k&&e.lt>-50&&c.t>=e.lt)age=Math.min(age,c.t-e.lt)});
      const sweep=0;
      const pulse=s.sel&&!c.forced?0.035*Math.sin(2*Math.PI*c.t/1.6):(s.sel?0.035*Math.sin(2*Math.PI*c.t/1.6):0);
      g.save();
      const sh=Math.tan(2.2*Math.PI/180)*(s.rising<1?Math.sin(Math.PI*s.rising):0);
      if(sh>0)g.transform(1,0,-sh,1,sh*WALL_TOP,0);       // card-local soft bend, contact (wall) fixed
      g.drawImage(faces[s.k],x,top);
      tab(g,s.k,x,top-TAB_H,TABC[s.k],sel,sweep,pulse);
      g.restore();
    });
    g.restore();
    // cast shadow of pulled cards onto the right-hand neighbour's face
    st.forEach(s=>{
      if(s.lift<8||s.k>=N-1)return;
      const nx=X0+(s.k+1)*(CW+CG),ntop=REST_TOP-st[s.k+1].lift,y0=Math.max(REST_TOP-s.lift+30,ntop+4);
      if(y0>=WALL_TOP)return;
      const sg=g.createLinearGradient(nx,0,nx+44,0);sg.addColorStop(0,'rgba(40,24,10,'+(.32*cl(s.lift/80))+')');sg.addColorStop(1,'rgba(40,24,10,0)');
      g.fillStyle=sg;g.fillRect(nx,y0,44,WALL_TOP-y0);
    });
    g.drawImage(layers.front,0,0);
    {const a=.01*(1+Math.sin(2*Math.PI*c.t/3)),rg=g.createRadialGradient(1100,420,40,1100,420,620);rg.addColorStop(0,'rgba(255,236,200,'+a+')');rg.addColorStop(1,'rgba(255,236,200,0)');g.fillStyle=rg;g.fillRect(480,0,1240,860)}
    // light: arrival glint along the lip, per-pull coloured bloom around the tab
    if(sinceImpact<.15){const u=sinceImpact/.15,gx=lerp(BOX_L,BOX_R,u);
      const gg=g.createLinearGradient(gx-160,0,gx+160,0);gg.addColorStop(0,'rgba(255,236,200,0)');gg.addColorStop(.5,'rgba(255,236,200,.28)');gg.addColorStop(1,'rgba(255,236,200,0)');
      g.fillStyle=gg;g.fillRect(BOX_L,WALL_TOP,BOX_R-BOX_L,18)}
    evl.forEach(e=>{
      if(e.lt<-50)return;const age=c.t-e.lt,life=e.hero?.3:.2;if(age<0||age>life)return;
      const k=e.card,cx=X0+k*(CW+CG)+CW/2,cy=REST_TOP-lift_of(e.v)-TAB_H/2,a=(e.hero?.14:0)*Math.pow(1-age/life,2),r=e.hero?560:300;
      g.save();g.globalCompositeOperation='screen';
      const rg=g.createRadialGradient(cx,cy,0,cx,cy,r);const col=hex(TABC[k]);
      rg.addColorStop(0,rgb(col,a));rg.addColorStop(1,rgb(col,0));g.fillStyle=rg;g.fillRect(cx-r,cy-r,2*r,2*r);g.restore();
    });
    // touch markers (the only operation marker)
    if(!c.forced){
      const t0=Film.cue(c,'impact')[0];if(t0)Film.touch(g,X0+CW/2,REST_TOP-lift_of(.4)-TAB_H/2,t0.age);
      evl.forEach(e=>{if(e.lt>-50)Film.touch(g,X0+e.card*(CW+CG)+CW/2,REST_TOP-lift_of(e.v)-TAB_H/2,c.t-e.lt)});
    }
  }
});
})();
