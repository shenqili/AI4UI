/* prop-ui film engine — deterministic, time-driven, ANTI-SHAKE (global transform = identity).
   Film.renderAt(T) draws the whole 60 s film for global time T (seconds). No scene keeps its own clock:
   everything visual is a pure function of the context object `c` handed to scene.render(c).
   Scene contract:  Film.scene('s05', { mount(root,{W,H}), render(c) })   — design at 1920x1080.
   c = { id, T (global s), t (s since scene start), beat (beats since scene start), SPB, dur (scene seconds),
         p        CONTROL VALUE (0..1, may exceed 1 for overshoot): chained from numeric drags + value events (flip/stamp/pull/...), eased,
         flipAge  seconds since the last value event (flip/stamp/pull/...) — reactions, flipIdx = its index (-1 before the first), nextFlipIn s to the next (or null),
         drag     value of the last-started drag segment (numeric from→to, or 0..1 sio progress if the segment has no numeric `to`), dragSegs [{e,u,v}] for all segments,
         ev       this scene's cues {type,b,t,lb,lt,len(beats),lenSec,...}  (lb/lt = beats/seconds since scene start),
         barBeat  global beat position inside the bar 0..4, forced (finale tile / hero result mode: ev=[], p=1, drag=1, flipAge=9), W,H }
   Helpers: Film.cue(c,type) · Film.since(c,type) · Film.touch(target,x,y,age) · Film.rand(id,n) · Film.prng(seed) · Film.img(src) · Film.assertNoShake(id,frames,T0) */
(function(){
const C=window.CUES,SPB=C.beatSec,W=1920,H=1080;
C.scenes.forEach(s=>{if(s.id==='final')s.id='fin'});C.events.forEach(e=>{if(e.scene==='final')e.scene='fin'});   // finale id is normalised to 'fin' (cues may call it 'final')
const clamp=(v,a=0,b=1)=>Math.min(b,Math.max(a,v)),lerp=(a,b,t)=>a+(b-a)*t;
const eo=t=>1-Math.pow(1-t,3),sio=t=>.5-.5*Math.cos(Math.PI*clamp(t)),eio=t=>t<.5?4*t*t*t:1-Math.pow(-2*t+2,3)/2;
const Film=window.Film={scenes:{},C,W,H,SPB,ease:{eo,sio,eio},clamp,lerp};
Film.scene=(id,def)=>{Film.scenes[id]=def};

/* ---------- names (plan E2.5) ---------- */
const NAMES={s01:'01 — TOGGLE · 布丁',s02:'02 — VOLUME · 像素房间',s03:'03 — CHECKBOX · 图章',s04:'04 — DROPDOWN · 折扇',s05:'05 — KNOB · 旋钮',s06:'06 — PROGRESS · 沙山',s07:'07 — TABS · 卡盒',s08:'08 — COLOR · 透镜',s09:'09 — REFRESH · 卷帘',s10:'10 — SPINNER · 风车',s11:'11 — RATING · 萤火罐',s12:'12 — UPLOAD · 邮筒'};
const NOHUD=['s00','fin'];
const ORDER=C.scenes.map(s=>s.id);
const TILE_IDS=ORDER.filter(id=>/^s(0[1-9]|1[0-2])$/.test(id));
const HERO=['s02','s04','s08'];                       // finale 112–115 results (forced result state)

/* ---------- deterministic random (lookup-table style; never Math.random) ---------- */
const hashStr=s=>{let h=2166136261;for(let i=0;i<s.length;i++){h^=s.charCodeAt(i);h=Math.imul(h,16777619)}return h>>>0};
const mulberry32=a=>()=>{a=(a+0x6D2B79F5)|0;let t=Math.imul(a^(a>>>15),1|a);t=(t+Math.imul(t^(t>>>7),61|t))^t;return((t^(t>>>14))>>>0)/4294967296};
Film.prng=seed=>mulberry32(typeof seed==='string'?hashStr(seed):seed>>>0);
const _rc={};Film.rand=(id,n,salt=0)=>{const k=id+'|'+n+'|'+salt;if(_rc[k])return _rc[k];const r=Film.prng(hashStr(id)+salt*7919),a=new Float64Array(n);for(let i=0;i<n;i++)a[i]=r();return _rc[k]=a};

/* ---------- events ---------- */
const isDrag=e=>e.len>0&&(e.type==='drag'||e.type==='turn'||(e.type==='pull'&&e.v==null));
const isValue=e=>!e.dup&&!isDrag(e)&&(e.type==='flip'||typeof e.v==='number');
const VALUE_DRAG=['s02','s05'];                    // only these scenes' numeric drags drive p (volume / knob pointer); elsewhere drag only drives c.drag
const tgtOf=e=>typeof e.v==='number'?e.v:(e.to==='on'||e.to==='light'||e.to===1)?1:0;
const evs={};C.scenes.forEach(s=>{evs[s.id]=C.events.filter(e=>e.scene===s.id).map(e=>{const b=e.b!=null?e.b:e.t/SPB,lb=b-s.startBeat;
  return{...e,b,t:b*SPB,lb,lt:lb*SPB,lenSec:e.len!=null?e.len*SPB:undefined}}).sort((a,b)=>a.b-b.b);
  evs[s.id].forEach(e=>{if(e.type!=='flip'&&typeof e.v==='number'&&evs[s.id].some(f=>f.type==='flip'&&Math.abs(f.b-e.b)<1e-6))e.dup=true})});   // stamp/pull/seal + flip at the same beat count once (as the flip)
const SCN={};C.scenes.forEach(s=>SCN[s.id]=s);

/* value chain: segments {t,from,to,dur,ease}; later-starting segments override; value events falling inside a numeric drag are markers only */
function buildSegs(list){
  const segs=[],at=x=>{let s=null;for(const g of segs)if(g.t<=x+1e-9)s=g;return s?s.from+(s.to-s.from)*s.ease(clamp((x-s.t)/s.dur)):(segs.length?segs[0].from:0)};
  const nd=list.filter(e=>isDrag(e)&&typeof e.to==='number'&&VALUE_DRAG.includes(e.scene));
  for(const e of list){
    if(isDrag(e)){if(typeof e.to!=='number'||!VALUE_DRAG.includes(e.scene))continue;segs.push({t:e.t,from:typeof e.from==='number'?e.from:at(e.t),to:e.to,dur:Math.max(1e-3,e.lenSec),ease:sio})}
    else if(isValue(e)){if(nd.some(d=>e.t>d.t+1e-6&&e.t<d.t+d.lenSec-1e-6))continue;
      segs.push({t:e.t,from:at(e.t),to:tgtOf(e),dur:Math.max(1e-3,e.D!=null?e.D:e.soft?.7:.26),ease:eo})}}
  return{segs,at}}
const _segCache={};
function ctxFor(id,T,forced){
  const sc=SCN[id]||{start:0,startBeat:0,dur:1,beats:2},list=forced?[]:(evs[id]||[]);
  const key=forced?null:id;let bs=key&&_segCache[key];if(!bs){bs=buildSegs(list);if(key)_segCache[key]=bs}
  const p=bs.at(T);
  let lastT=-1e9,idx=-1,nextIn=null;
  for(const e of list){if(!isValue(e))continue;if(e.t<=T+1e-9){lastT=e.t;idx++}else{nextIn=e.t-T;break}}
  const dsegs=list.filter(isDrag).map(e=>{const u=sio((T-e.t)/e.lenSec),v=typeof e.to==='number'?lerp(typeof e.from==='number'?e.from:0,e.to,u):u;return{e,u:T>=e.t?u:0,v,started:T>=e.t-1e-9}});
  let drag=p,dragEv=null;
  if(dsegs.length){let cur=dsegs[0];for(const d of dsegs)if(d.started)cur=d;dragEv=cur.e;drag=cur.started?cur.v:(typeof cur.e.to==='number'&&typeof cur.e.from==='number'?cur.e.from:0)}
  const t=T-sc.start;
  return{id,T,t,beat:t/SPB,SPB,p,theme:p>.5?'on':'off',flipAge:idx<0?99:T-lastT,flipIdx:idx,nextFlipIn:nextIn,drag,dragEv,dragSegs:dsegs,ev:list,barBeat:(T/SPB)%4,forced:!!forced,W,H,dur:sc.dur}}
Film.ctxFor=ctxFor;
/* c.ev helpers: Film.cue(c,'touch') -> [{e,age,u,started}] ; Film.since(c,'touch') -> seconds since the latest started event of that type (Infinity if none) */
Film.cue=(c,type)=>c.ev.filter(e=>e.type===type).map(e=>{const age=c.t-e.lt;return{e,age,u:e.lenSec?clamp(age/e.lenSec):(age>=0?1:0),started:age>=0}});
Film.since=(c,type)=>{let a=Infinity;for(const e of c.ev)if(e.type===type&&c.t>=e.lt-1e-9)a=Math.min(a,c.t-e.lt);return a};

/* ---------- touch ring: white 2px ring r 28→84 px, 0.22 s, alpha .35→0, difference blend, + 10px centre dot. target = CanvasRenderingContext2D or DOM element (x,y relative to it) ---------- */
Film.touch=function(target,x,y,age){
  const on=age>=0&&age<.22,u=on?age/.22:1,r=lerp(28,84,eo(u)),a=.35*(1-u);
  if(target&&target.canvas){if(!on)return;const g=target;g.save();g.globalCompositeOperation='difference';g.globalAlpha=1;g.strokeStyle='rgba(255,255,255,'+a+')';g.fillStyle='rgba(255,255,255,'+a+')';g.lineWidth=2;
    g.beginPath();g.arc(x,y,r,0,Math.PI*2);g.stroke();g.beginPath();g.arc(x,y,5,0,Math.PI*2);g.fill();g.restore();return}
  let el=target.__touch;if(!el){el=target.__touch=document.createElement('div');el.style.cssText='position:absolute;pointer-events:none;mix-blend-mode:difference;display:none;z-index:50';
    el.innerHTML='<div style="position:absolute;inset:0;border:2px solid #fff;border-radius:50%;box-sizing:border-box"></div><div style="position:absolute;left:50%;top:50%;width:10px;height:10px;margin:-5px;border-radius:50%;background:#fff"></div>';target.appendChild(el)}
  if(!on){el.style.display='none';return}
  el.style.display='block';el.style.left=(x-r)+'px';el.style.top=(y-r)+'px';el.style.width=el.style.height=(2*r)+'px';el.style.opacity=a;
};

/* ---------- DOM ---------- */
const stage=document.getElementById('stage'),inner=document.getElementById('inner'),wraps={};
ORDER.forEach(id=>{const w=document.createElement('div');w.className='fscene';w.dataset.id=id;const root=document.createElement('div');root.className='froot';w.appendChild(root);inner.appendChild(w);wraps[id]={w,root,mounted:false}});
function mount(id){const o=wraps[id];if(o.mounted)return;o.mounted=true;const def=Film.scenes[id];if(def&&def.mount)def.mount(o.root,{W,H});else if(id!=='fin')o.root.innerHTML='<div class="missing">'+id+' — scene module missing</div>'}
const mountAll=()=>Object.keys(wraps).forEach(mount);
const hudLabel=document.getElementById('hud-label'),hudDots=[...document.querySelectorAll('#hud-dots i')],hudBar=document.getElementById('hud-bar');
function show(ids,tiles){for(const id in wraps){const o=wraps[id],on=ids.includes(id);o.w.style.display=on?'block':'none';if(!tiles){o.w.style.transform='';o.w.style.left=o.w.style.top='0';o.w.style.borderRadius='';o.w.style.boxShadow=''}}}
function renderScene(id,T,forced,over){const def=Film.scenes[id];if(!def||!def.render)return;const c=ctxFor(id,T,forced);if(over)Object.assign(c,over);def.render(c)}
const forcedOver=(id,T,t0)=>{const sc=SCN[id];return{p:1,drag:1,flipAge:9,flipIdx:0,nextFlipIn:null,theme:'on',t:sc.dur+1+(T-t0),beat:(sc.dur+1+(T-t0))/SPB,dragSegs:[],ev:[]}};

/* ---------- finale (plan B finale): 3 hero results (one beat each) then a STATIC 4/4/4 overview ---------- */
const fin=SCN.fin,finEv=evs.fin||[];
const resEv=finEv.filter(e=>e.type==='result'||e.type==='show'),resT=resEv.map(e=>e.t),results=resT.length?resT:[0,1,2].map(i=>fin.start+i*SPB),heroIds=resEv.map((e,i)=>e.id||HERO[i%HERO.length]);
const finalT=(finEv.find(e=>e.type==='final')||{t:fin.start+4*SPB}).t,titleEv=finEv.find(e=>e.type==='title'),titleLen=titleEv&&titleEv.lenSec||.6,subT=(finEv.find(e=>e.type==='sub')||{t:finalT+.5}).t;
const BG_FIN='#EEECE7',ZH={s02:'音量 · 像素房间',s04:'下拉选择 · 折扇',s08:'取色 · 透镜'},FONT='"PingFang SC","Microsoft YaHei","Noto Sans CJK SC",Inter,sans-serif';
const tcv=document.createElement('canvas');tcv.width=W;tcv.height=H;tcv.id='ftitle';tcv.style.cssText='position:absolute;left:0;top:0;width:1920px;height:1080px;display:none;pointer-events:none';inner.appendChild(tcv);
let T_cur=0;
/* hero phase (112–116): the current result is a framed panel (80% scale = 64% of the frame) with a caption; a 12-tile index strip appears from beat 114.
   overview phase (116+): the TITLE is the main visual; the 12 scenes shrink to a narrow bottom strip. Everything is static layout: no motion, no global transform. */
function strip(ids,y,tw,gap,skip,T,hl){const th=tw*H/W,x0=(W-(ids.length*tw+(ids.length-1)*gap))/2,sc=tw/W,slots=[];
  ids.forEach((id,i)=>{const o=wraps[id],x=x0+i*(tw+gap),isH=hl.includes(id);slots.push({id,x,y,tw,th});
    if(id===skip){o.w.style.display='none';return}
    o.w.style.display='block';const k=isH?1.06:1,off=isH?-tw*.03:0;o.w.style.left=(x+off)+'px';o.w.style.top=(y+off*th/tw)+'px';o.w.style.transformOrigin='0 0';o.w.style.transform='scale('+sc*k+')';
    o.w.style.borderRadius=(6/sc)+'px';o.w.style.boxShadow='0 '+(4/sc)+'px '+(12/sc)+'px rgba(0,0,0,.16)'+(isH?',0 0 0 '+(2/sc)+'px #C8321E':'');
    renderScene(id,T,true,forcedOver(id,T,finalT))});return slots}
function drawHero(id,k,slots){const g=tcv.getContext('2d');g.clearRect(0,0,W,H);g.textAlign='center';g.textBaseline='alphabetic';
  g.fillStyle='#14151A';g.font='700 32px '+FONT;g.fillText(ZH[id]||'',W/2,946);
  g.font='500 18px Consolas,monospace';g.fillStyle='rgba(20,21,26,.55)';g.fillText((k+1)+' / 3',W/2,972-2);
  slots.forEach(s=>{if(s.id===id){g.strokeStyle='#C8321E';g.lineWidth=2;g.strokeRect(s.x-1,s.y-1,s.tw+2,s.th+2)}})}
function drawTitle(age){
  const g=tcv.getContext('2d');g.clearRect(0,0,W,H);g.textAlign='center';g.textBaseline='alphabetic';
  const chars=['一','物','一','控'],gapX=250,x0=W/2-1.5*gapX,base=470;g.font='800 190px '+FONT;
  chars.forEach((ch,i)=>{g.fillStyle='rgba(20,21,26,.06)';g.fillText(ch,x0+i*gapX,base)});                  // pre-placed outline (6%)
  const u=eio(clamp(age/titleLen));                                                                          // ink shows inside the FIXED outline, top-down
  if(u>0){g.save();g.beginPath();g.rect(0,base-190*.95,W,190*1.15*u);g.clip();g.fillStyle='#14151A';chars.forEach((ch,i)=>g.fillText(ch,x0+i*gapX,base));g.restore()}
  const sa=clamp((T_cur-subT)/.4);g.fillStyle='rgba(107,98,88,'+sa+')';g.font='500 44px '+FONT;g.fillText('十二个控件 · 十二件东西',W/2,570);
  g.font='500 28px Inter,'+FONT;if('letterSpacing' in g)g.letterSpacing='10px';g.fillText('ONE THING, ONE CONTROL',W/2+5,632);if('letterSpacing' in g)g.letterSpacing='0px'}
function renderFinale(T){
  mountAll();inner.style.background=BG_FIN;
  if(T>=finalT-1e-9){
    const age=T-finalT;show(TILE_IDS,true);strip(TILE_IDS,880,130,14,null,T,heroIds);tcv.style.display='block';drawTitle(age);return}
  let k=0;for(let i=0;i<results.length;i++)if(results[i]<=T+1e-9)k=i;
  const id=heroIds[k]||HERO[k%HERO.length],showStrip=T>=results[2]-1e-9;
  show(TILE_IDS,true);for(const i of TILE_IDS)wraps[i].w.style.display='none';
  let slots=[];if(showStrip)slots=strip(TILE_IDS,978,88,10,id,T,[]);
  const o=wraps[id],sc=.8;o.w.style.display='block';o.w.style.left='192px';o.w.style.top='36px';o.w.style.transformOrigin='0 0';o.w.style.transform='scale('+sc+')';
  o.w.style.borderRadius=(16/sc)+'px';o.w.style.boxShadow='0 '+(18/sc)+'px '+(40/sc)+'px rgba(0,0,0,.2),0 0 0 '+(3/sc)+'px #14151A';
  renderScene(id,T,true,forcedOver(id,T,results[k]));
  tcv.style.display='block';drawHero(id,k,slots.filter(s=>s.id===id));
}

/* ---------- ghost control overlay (engine layer, all scenes s01–s12): the STANDARD UI widget this prop stands for, wired to c.p ---------- */
const gcv=document.createElement('canvas');gcv.width=W;gcv.height=H;gcv.id='fghost';gcv.style.cssText='position:absolute;left:0;top:0;width:1920px;height:1080px;pointer-events:none;display:none';stage.insertBefore(gcv,document.getElementById('hud-label'));
const GH={"s01":["Toggle","开关 · 布丁"],"s02":["Slider","滑块 · 像素房间"],"s03":["Checkbox","复选框 · 图章"],"s04":["Dropdown","下拉 · 折扇"],"s05":["Knob","旋钮 · 收音机"],"s06":["Progress","进度条 · 沙山"],"s07":["Tabs","标签页 · 卡盒"],"s08":["Color picker","取色器 · 透镜"],"s09":["Refresh","下拉刷新 · 卷帘"],"s10":["Spinner","加载 · 风车"],"s11":["Rating","星级 · 萤火罐"],"s12":["Upload","上传 · 邮筒"]};
const GX=1496,GY=20,GW=360,GFONT='"PingFang SC","Microsoft YaHei",Inter,sans-serif';
const sc0=id=>SCN[id].start;
function drawGhost(id,T){
  const g=gcv.getContext('2d');g.clearRect(0,0,W,H);if(!GH[id]){gcv.style.display='none';return}gcv.style.display='block';
  const c=ctxFor(id,T,false);{let sp=0,sd=0;for(let k=0;k<5;k++){const q=ctxFor(id,Math.max(sc0(id),T-k*.1),false);sp+=q.p;sd+=q.drag}c.p=sp/5;c.drag=sd/5}   // low-pass (0.4 s box) so the widget never snaps with the prop
  const a=sio(Math.min(clamp(c.t/SPB),clamp((c.dur-.3-c.t)/.2)))*.95;if(a<=0)return;
  const X=GX,Y=GY,cy=Y+30,p=c.p,LI='rgba(255,255,255,.92)',DK='rgba(14,16,24,.62)';
  g.save();g.translate(GX+GW,GY);g.scale(1.7,1.7);g.translate(-(GX+GW),-GY);g.globalAlpha=a;g.lineJoin='round';g.lineCap='round';
  const rr=(x,y,w,h,r)=>{g.moveTo(x+r,y);g.arcTo(x+w,y,x+w,y+h,r);g.arcTo(x+w,y+h,x,y+h,r);g.arcTo(x,y+h,x,y,r);g.arcTo(x,y,x+w,y,r);g.closePath()};
  const dual=(build,fill)=>{g.beginPath();build();if(fill){g.fillStyle=fill;g.fill()}g.strokeStyle=DK;g.lineWidth=5.5;g.stroke();g.strokeStyle=LI;g.lineWidth=2.5;g.stroke()};
  const fillOnly=(build,col)=>{g.beginPath();build();g.fillStyle=col;g.fill()};
  const check=(x,y,s)=>dual(()=>{g.moveTo(x-s*.5,y);g.lineTo(x-s*.12,y+s*.4);g.lineTo(x+s*.55,y-s*.4)});
  const text=(s,x,y,size,al)=>{g.font='700 '+size+'px '+GFONT;g.textAlign=al;g.textBaseline='alphabetic';g.lineWidth=5;g.strokeStyle=DK;g.strokeText(s,x,y);g.fillStyle='#fff';g.fillText(s,x,y)};
  const cl=clamp;
  if(id==='s01'){dual(()=>rr(X+250,cy-27,110,54,27),'rgba(255,255,255,'+(.12+.5*cl(p))+')');dual(()=>g.arc(X+250+27+cl(p)*56,cy,20,0,7),'rgba(255,255,255,.95)')}
  else if(id==='s02'){dual(()=>rr(X+10,cy-6,340,12,6),'rgba(255,255,255,.18)');if(p>0)dual(()=>rr(X+10,cy-6,Math.max(12,340*cl(p)),12,6),'rgba(255,255,255,.7)');dual(()=>g.arc(X+10+340*cl(p),cy,19,0,7),'rgba(255,255,255,.95)')}
  else if(id==='s03'){[.33,.67,1].forEach((th,i)=>{const x=X+188+i*64;dual(()=>rr(x,cy-22,44,44,8),'rgba(255,255,255,'+(p>=th-.02?.55:.12)+')');if(p>=th-.02)check(x+22,cy,26)})}
  else if(id==='s04'){dual(()=>rr(X+110,cy-26,250,52,10),'rgba(255,255,255,.2)');text(p<.4?'选择…':p<.9?'山':'雪',X+130,cy+9,28,'left');const up=p>.2&&p<.95;dual(()=>{if(up){g.moveTo(X+322,cy+6);g.lineTo(X+335,cy-6);g.lineTo(X+348,cy+6)}else{g.moveTo(X+322,cy-6);g.lineTo(X+335,cy+6);g.lineTo(X+348,cy-6)}})}
  else if(id==='s05'){const cx=X+322,r=26,v=cl(p,0,1.1),th=(-135+270*v)*Math.PI/180;dual(()=>g.arc(cx,cy,r+10,.75*Math.PI,2.25*Math.PI));dual(()=>g.arc(cx,cy,r,0,7),'rgba(255,255,255,.3)');dual(()=>{g.moveTo(cx+Math.sin(th)*8,cy-Math.cos(th)*8);g.lineTo(cx+Math.sin(th)*r,cy-Math.cos(th)*r)})}
  else if(id==='s06'){const pu=Film.cue(c,'pour')[0],v=Math.max(pu?pu.u:0,p);dual(()=>rr(X+10,cy-10,340,20,10),'rgba(255,255,255,.14)');if(v>0)dual(()=>rr(X+10,cy-10,Math.max(20,340*cl(v)),20,10),'rgba(255,255,255,.7)')}
  else if(id==='s07'){const ix=Math.round(cl(p)*4);for(let i=0;i<5;i++){const x=X+i*72,on=i===ix;dual(()=>rr(x,on?cy-26:cy-20,64,on?52:46,9),'rgba(255,255,255,'+(on?.65:.14)+')')}}
  else if(id==='s08'){const col=p<.25?null:p<.75?'#D9452B':'#2F7F86';text(col||'#------',X+280,cy+9,28,'right');dual(()=>g.arc(X+322,cy,26,0,7),col||'rgba(255,255,255,.15)')}
  else if(id==='s09'){const cx=X+322,r=24,d=p>.5?1:cl(c.drag);dual(()=>g.arc(cx,cy,r,-Math.PI/2,-Math.PI/2+Math.max(.15,d)*Math.PI*1.75));if(p>.5)check(cx,cy,24);else{dual(()=>{g.moveTo(cx,cy-8);g.lineTo(cx,cy+10);g.moveTo(cx-7,cy+3);g.lineTo(cx,cy+10);g.lineTo(cx+7,cy+3)})}}
  else if(id==='s10'){const cx=X+322,r=26;if(p>.5){dual(()=>g.arc(cx,cy,r,0,7));check(cx,cy,26)}else{const a0=c.t*7;dual(()=>g.arc(cx,cy,r,a0,a0+Math.PI*1.25))}}
  else if(id==='s11'){const n=c.forced?5:Film.cue(c,'fly').filter(q=>q.age>=.4).length;for(let i=0;i<5;i++){const x=X+34+i*73,lit=i<n;dual(()=>{for(let k=0;k<10;k++){const r=k%2?11:26,an=-Math.PI/2+k*Math.PI/5;g[k?'lineTo':'moveTo'](x+Math.cos(an)*r,cy+Math.sin(an)*r)}g.closePath()},'rgba(255,255,255,'+(lit?.85:.1)+')')}}
  else if(id==='s12'){dual(()=>{g.setLineDash([9,7]);rr(X+10,cy-27,340,54,10)});g.setLineDash([]);const done=p>.98;if(done)check(X+60,cy,26);else dual(()=>{g.moveTo(X+60,cy+14);g.lineTo(X+60,cy-14);g.moveTo(X+47,cy-4);g.lineTo(X+60,cy-16);g.lineTo(X+73,cy-4)});dual(()=>rr(X+110,cy-6,220,12,6),'rgba(255,255,255,.14)');if(p>0)dual(()=>rr(X+110,cy-6,Math.max(12,220*cl(p)),12,6),'rgba(255,255,255,.7)')}
  g.setTransform(1,0,0,1,0,0);text(GH[id][0],GX+GW,GY+100+40,41,'right');text(GH[id][1],GX+GW,GY+100+40+46,41,'right');
  g.restore()}

/* ---------- main render ---------- */
Film.renderAt=function(T){
  T=clamp(T,0,C.duration-1e-4);T_cur=T;const sc=C.scenes.slice().reverse().find(s=>s.start<=T+1e-9),id=sc.id;
  if(id==='fin'){mount('fin');renderFinale(T)}
  else{tcv.style.display='none';inner.style.background='';mount(id);show([id]);renderScene(id,T,false)}
  drawGhost(id,T);hudLabel.style.opacity=NOHUD.includes(id)?0:1;hudLabel.textContent=NAMES[id]||'';
  const bb=Math.floor((T/SPB)%4);hudDots.forEach((d,i)=>d.className=i===bb?'on':'');hudBar.style.transform='scaleX('+(T/C.duration)+')';
  document.body.dataset.scene=id;
};

/* ---------- image helper: Film.img('assets/x.png') in mount; frames are only captured once Film.ready() ---------- */
let lastT=0;const _r=Film.renderAt;Film.renderAt=function(T){lastT=T;return _r(T)};
Film._pending=0;Film.img=src=>{const im=new Image();Film._pending++;im.onload=im.onerror=()=>{Film._pending--;(Film._redraw||(()=>Film.renderAt(lastT)))()};im.src=src;return im};Film.ready=()=>Film._pending===0;
Film.whenReady=cb=>{const f=()=>Film.ready()?cb():setTimeout(f,40);f()};
window.renderAt=Film.renderAt;

/* ---------- dev check: Film.assertNoShake(sceneId, frames=6, T0) ----------
   Renders `frames` consecutive 1/30 s frames starting at T0 (default: last 0.3 s of the scene = the static result window)
   and reports (a) global transforms (must be none), (b) integer global shift of the composited canvases (SAD search ±3 px @ half-res),
   (c) edge-centroid drift in px, (d) share of changed pixels, (e) max DOM-rect movement. ok = transforms none && shift 0 && centroid drift <= 0.5 px.
   Page-side only; run it via `node film/shot.js shake:<id>[:frames[:T0]]`. */
Film.assertNoShake=function(id,frames,T0){
  frames=frames||6;const sc=SCN[id];if(T0==null)T0=Math.min(sc.start+sc.dur-.3,C.duration-frames/30-.01);
  const cw=960,ch=540,cv=document.createElement('canvas');cv.width=cw;cv.height=ch;const g=cv.getContext('2d',{willReadFrequently:true});
  const grays=[],rects=[],cents=[],s=cw/W;
  for(let f=0;f<frames;f++){
    Film.renderAt(T0+f/30);g.fillStyle='#000';g.fillRect(0,0,cw,ch);
    const vis=[...document.querySelectorAll('.fscene')].filter(w=>w.style.display!=='none'),sr=stage.getBoundingClientRect(),sf=cw/sr.width;
    [...vis.flatMap(w=>[...w.querySelectorAll('canvas')]),...document.querySelectorAll('#ftitle')].filter(c=>c.style.display!=='none').forEach(c=>{const r=c.getBoundingClientRect();g.drawImage(c,(r.left-sr.left)*sf,(r.top-sr.top)*sf,r.width*sf,r.height*sf)});
    const d=g.getImageData(0,0,cw,ch).data,gr=new Float32Array(cw*ch);for(let i=0;i<gr.length;i++)gr[i]=.299*d[i*4]+.587*d[i*4+1]+.114*d[i*4+2];grays.push(gr);
    let sx=0,sy=0,n=0;for(let y=1;y<ch-1;y++)for(let x=1;x<cw-1;x++){const i=y*cw+x,m=Math.abs(gr[i+1]-gr[i-1])+Math.abs(gr[i+cw]-gr[i-cw]);if(m>60){sx+=x;sy+=y;n++}}
    cents.push(n?[sx/n/s*1,sy/n/s*1,n]:[0,0,0]);
    const rr=[];vis.forEach(w=>w.querySelectorAll('*').forEach(e=>{const r=e.getBoundingClientRect();rr.push([r.left,r.top,r.width,r.height])}));rects.push(rr)}
  let maxShift=0,maxChanged=0,maxCent=0,maxRect=0;
  for(let f=1;f<frames;f++){
    const a=grays[f-1],b=grays[f];let ch0=0;for(let i=0;i<a.length;i+=3){if(Math.abs(a[i]-b[i])>10)ch0++}maxChanged=Math.max(maxChanged,ch0/(a.length/3));
    const sadAt=(dx,dy)=>{let sad=0;for(let y=8;y<ch-8;y+=3)for(let x=8;x<cw-8;x+=3)sad+=Math.abs(a[y*cw+x]-b[(y+dy)*cw+x+dx]);return sad};
    const sad0=sadAt(0,0);let best=sad0,bdx=0,bdy=0;
    if(sad0>0)for(let dy=-3;dy<=3;dy++)for(let dx=-3;dx<=3;dx++){if(!dx&&!dy)continue;const sad=sadAt(dx,dy);if(sad<best*.7){best=sad;bdx=dx;bdy=dy}}
    maxShift=Math.max(maxShift,Math.hypot(bdx,bdy)/s*1);
    maxCent=Math.max(maxCent,Math.hypot(cents[f][0]-cents[f-1][0],cents[f][1]-cents[f-1][1]));
    const r0=rects[f-1],r1=rects[f];if(r0.length===r1.length)for(let i=0;i<r0.length;i++)maxRect=Math.max(maxRect,Math.abs(r0[i][0]-r1[i][0]),Math.abs(r0[i][1]-r1[i][1]))}
  /* overlay (ghost widget) is measured separately: its label must not move while visible */
  let gMax=0;{const sc2=SCN[id];if(GH[id]){const Tg=sc2.start+Math.min(1.2,sc2.dur*.3);let bb=null;for(let f=0;f<frames;f++){Film.renderAt(Tg+f/30);const d=gcv.getContext('2d').getImageData(1500,130,420,110).data;let x0=1e9,y0=1e9,x1=-1,y1=-1;for(let i=0;i<d.length;i+=4)if(d[i+3]>60){const px=(i/4)%420,py=((i/4)/420)|0;x0=Math.min(x0,px);y0=Math.min(y0,py);x1=Math.max(x1,px);y1=Math.max(y1,py)}const b=[x0,y0,x1,y1];if(!bb)bb=b;else gMax=Math.max(gMax,...b.map((v,i)=>Math.abs(v-bb[i])))}}
  if(getComputedStyle(gcv).transform!=='none')gMax=999}
  const gt=[inner,...document.querySelectorAll('.fscene')].map(e=>getComputedStyle(e).transform).filter(t=>t&&t!=='none'&&t!=='matrix(1, 0, 0, 1, 0, 0)');
  const tileMode=id==='fin'; const transformsOk=tileMode?true:gt.every(t=>t==='matrix(1, 0, 0, 1, 0, 0)')||gt.length===0;
  const res={scene:id,T0:+T0.toFixed(3),frames,globalTransforms:gt.length?gt:'none',shiftPx:+maxShift.toFixed(2),centroidDriftPx:+maxCent.toFixed(2),changedFrac:+maxChanged.toFixed(5),maxDomRectDeltaPx:+maxRect.toFixed(2),ghostLabelShiftPx:gMax,
    ok:transformsOk&&maxShift===0&&maxCent<=.5&&gMax===0};
  return res};

/* ---------- playback / modes ---------- */
const q=new URLSearchParams(location.search);
if(q.get('hud')==='0')document.body.classList.add('nohud');
if(q.get('hud')==='2')document.body.classList.add('hudmin');
function fit(){const s=Math.min(innerWidth/W,innerHeight/H);if((innerWidth===W&&innerHeight===H)||q.has('shake')){stage.style.left=stage.style.top='0';stage.style.transform='none'}else{stage.style.left=stage.style.top='50%';stage.style.transform='translate(-50%,-50%) scale('+s+')'}}
addEventListener('resize',fit);fit();
function start(){
  if(q.has('shake')){document.body.classList.add('hasT');const id=q.get('shake');Film.whenReady(()=>{const r=Film.assertNoShake(id,+q.get('frames')||6,q.has('t0')?parseFloat(q.get('t0')):null);const pre=document.createElement('pre');pre.id='shakeout';pre.textContent=JSON.stringify(r);document.body.appendChild(pre)});return}
  if(q.has('solo')){document.body.classList.add('hasT');const id=q.get('solo'),p=parseFloat(q.get('p')||1),st=parseFloat(q.get('st')||(SCN[id]?SCN[id].dur+1:2));mountAll();show([id]);document.body.dataset.scene=id;
    Film._redraw=()=>{const def=Film.scenes[id];if(def&&def.render)def.render(Object.assign(ctxFor(id,0,true),{p,theme:p>.5?'on':'off',drag:parseFloat(q.get('drag')||p),flipAge:parseFloat(q.get('age')||9),t:st,beat:st/SPB,nextFlipIn:null,forced:true,T:(SCN[id]?SCN[id].start:0)+st}))};Film._redraw();return}
  if(q.has('t')){Film.renderAt(parseFloat(q.get('t')))}
  else{
    Film.renderAt(0);const audio=document.getElementById('audio'),btn=document.getElementById('play');let base=0;
    const clock=()=>audio.paused?base:audio.currentTime;
    const loop=()=>{Film.renderAt(clock());requestAnimationFrame(loop)};requestAnimationFrame(loop);
    const toggle=()=>{if(audio.paused){if(audio.currentTime>=C.duration-.05)audio.currentTime=0;audio.play();btn.style.display='none'}else{base=audio.currentTime;audio.pause();btn.style.display='flex'}};
    btn.onclick=toggle;addEventListener('keydown',e=>{if(e.code==='Space'){e.preventDefault();toggle()}else if(e.code==='ArrowRight'){audio.currentTime=Math.min(C.duration-.1,audio.currentTime+SPB*4);base=audio.currentTime}else if(e.code==='ArrowLeft'){audio.currentTime=Math.max(0,audio.currentTime-SPB*4);base=audio.currentTime}else if(e.code==='Home'){audio.currentTime=0;base=0}});
    audio.addEventListener('ended',()=>{btn.style.display='flex'});
  }
}
if(document.readyState=='complete')start();else addEventListener('load',start);
})();
