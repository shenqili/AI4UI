/* s12 · Upload/Drop -> blue enamel postbox + mechanical receipt. Separate parts: body, slot, lid, flag, letter, receipt. Pure function of c. */
(function(){
const BX=960, L=780, R=1140, DOMEY=350, DR=180, GY=906;     // body span, dome centre y, dome radius, ground contact y
const SLOT={x:830,y:400,w:260,h:36}, LID={x:820,y:392,w:280,h:54};
const RCP={x:810,w:300,h:272,slitY:762};
let cv,g;
const E=Film.ease, clamp=Film.clamp, lerp=Film.lerp, eo=E.eo, sio=E.sio, eio=E.eio;
const evT=(c,type,def)=>{ if(c.forced)return -9; const e=c.ev.find(e=>e.type===type); return e?e.lt:def; };

function rrect(x,y,w,h,r){g.beginPath();g.roundRect(x,y,w,h,r)}
function bodyPath(){g.beginPath();g.moveTo(L,GY-36);g.lineTo(L,DOMEY);g.arc(BX,DOMEY,DR,Math.PI,0);g.lineTo(R,GY-36);g.closePath()}
function glow(x,y,rx,ry,a,col){g.save();g.translate(x,y);g.scale(1,ry/rx);const gr=g.createRadialGradient(0,0,0,0,0,rx);gr.addColorStop(0,'rgba('+col+','+a+')');gr.addColorStop(1,'rgba('+col+',0)');g.fillStyle=gr;g.fillRect(-rx,-rx,rx*2,rx*2);g.restore()}

Film.scene('s12',{
  mount(root,{W,H}){cv=document.createElement('canvas');cv.width=W;cv.height=H;cv.style.cssText='position:absolute;left:0;top:0';root.appendChild(cv);g=cv.getContext('2d')},
  render(c){
    const W=c.W,H=c.H,t=c.t,F=c.forced;
    const tLid=evT(c,'lid',1e4), tIn=evT(c,'in',1e4), tClank=evT(c,'clank',1e4), tRcp=evT(c,'receipt',1e4), tSeal=evT(c,'seal',1e4);
    const dragV=F?1:clamp(c.drag);

    // ---- dusk sky + ground ----
    let gr=g.createLinearGradient(0,0,0,H*.8);
    gr.addColorStop(0,'#232850');gr.addColorStop(.5,'#4B3F6B');gr.addColorStop(.82,'#A9586A');gr.addColorStop(1,'#C56A5A');
    g.fillStyle=gr;g.fillRect(0,0,W,H);
    g.save();g.globalCompositeOperation='lighter';glow(960,830,900,200,.22,'226,137,106');g.restore();
    gr=g.createLinearGradient(0,830,0,H);gr.addColorStop(0,'#4A3548');gr.addColorStop(.12,'#352A40');gr.addColorStop(1,'#1E1930');
    g.fillStyle=gr;g.fillRect(0,830,W,H-830);
    g.fillStyle='rgba(226,137,106,.35)';g.fillRect(0,829,W,2);
    // street-lamp light pool on the pavement (+10% when the receipt pops)
    const pool=.12+.1*(F?1:eo(clamp((t-tRcp)/.3)));
    g.save();g.globalCompositeOperation='lighter';glow(940,GY+22,520,86,pool,'255,214,150');g.restore();
    // long soft shadow to the right
    g.save();gr=g.createLinearGradient(780,0,1560,0);gr.addColorStop(0,'rgba(10,8,24,.5)');gr.addColorStop(1,'rgba(10,8,24,0)');
    g.fillStyle=gr;g.shadowColor='rgba(10,8,24,.5)';g.shadowBlur=40;g.beginPath();g.moveTo(770,GY-6);g.lineTo(1160,GY-6);g.lineTo(1560,GY+50);g.lineTo(1200,GY+50);g.closePath();g.fill();g.restore();
    g.fillStyle='rgba(8,6,20,.45)';g.beginPath();g.ellipse(BX,GY-2,210,16,0,0,Math.PI*2);g.fill();

    // ---- plinth ----
    gr=g.createLinearGradient(0,GY-40,0,GY);gr.addColorStop(0,'#1B3F7C');gr.addColorStop(1,'#10285A');
    g.fillStyle=gr;rrect(L-18,GY-40,R-L+36,40,6);g.fill();
    g.fillStyle='rgba(255,255,255,.14)';g.fillRect(L-16,GY-40,R-L+32,2);

    // ---- body (blue enamel) ----
    g.save();bodyPath();
    gr=g.createLinearGradient(L,0,R,0);gr.addColorStop(0,'#2F6BC2');gr.addColorStop(.35,'#1F4E9A');gr.addColorStop(.8,'#173F80');gr.addColorStop(1,'#12326A');
    g.fillStyle=gr;g.fill();g.clip();
    // dusk bounce on the right edge, cool-warm gradient down the body
    gr=g.createLinearGradient(R-70,0,R,0);gr.addColorStop(0,'rgba(226,137,106,0)');gr.addColorStop(1,'rgba(226,137,106,.30)');g.fillStyle=gr;g.fillRect(R-70,150,70,760);
    gr=g.createLinearGradient(0,150,0,GY);gr.addColorStop(0,'rgba(150,180,255,.12)');gr.addColorStop(.5,'rgba(0,0,0,0)');gr.addColorStop(1,'rgba(0,0,30,.22)');g.fillStyle=gr;g.fillRect(L,150,R-L,760);
    // enamel gloss: tall rounded strip + thin companion, following the dome at the top
    g.lineCap='round';
    g.strokeStyle='rgba(255,255,255,.34)';g.lineWidth=18;g.beginPath();g.moveTo(L+36,470);g.lineTo(L+36,820);g.stroke();
    g.strokeStyle='rgba(255,255,255,.28)';g.lineWidth=12;g.beginPath();g.arc(BX,DOMEY,DR-34,Math.PI*1.02,Math.PI*1.36);g.stroke();
    // panel seams + rivets
    g.strokeStyle='rgba(8,24,60,.55)';g.lineWidth=3;g.beginPath();g.moveTo(L,DOMEY+4);g.lineTo(R,DOMEY+4);g.stroke();
    g.strokeStyle='rgba(120,160,230,.25)';g.lineWidth=1.5;g.beginPath();g.moveTo(L,DOMEY+7);g.lineTo(R,DOMEY+7);g.stroke();
    g.strokeStyle='rgba(8,24,60,.55)';g.lineWidth=3;g.beginPath();g.moveTo(L,688);g.lineTo(R,688);g.stroke();
    g.strokeStyle='rgba(120,160,230,.22)';g.lineWidth=1.5;g.beginPath();g.moveTo(L,691);g.lineTo(R,691);g.stroke();
    for(const y of [DOMEY+22,836]){for(let k=0;k<7;k++){const x=L+34+k*(R-L-68)/6;
      g.fillStyle='rgba(6,20,52,.5)';g.beginPath();g.arc(x+1,y+1.5,4.2,0,7);g.fill();
      g.fillStyle='#4C86DA';g.beginPath();g.arc(x,y,3.6,0,7);g.fill();g.fillStyle='rgba(255,255,255,.55)';g.beginPath();g.arc(x-1,y-1.2,1.3,0,7);g.fill()}}
    g.restore();
    // body edge line
    g.save();bodyPath();g.strokeStyle='rgba(6,20,52,.6)';g.lineWidth=2;g.stroke();g.restore();

    // ---- upload percentage, tied to how far the letter has gone in ----
    {
      let pr;
      if(F)pr=1;else{const dd=(t>=tIn)?eio(clamp((t-tIn)/.22)):0;pr=clamp(.62*sio(dragV)+.38*dd)}
      const pct=Math.floor(pr*100+1e-6),xr=1029;
      g.save();g.font='800 112px "SF Mono",Consolas,"Courier New",monospace';g.textBaseline='alphabetic';
      g.shadowColor='rgba(10,8,30,.45)';g.shadowBlur=18;g.shadowOffsetY=6;
      g.fillStyle=pct>=100?'#FFE6A8':'#F4EDDC';
      g.textAlign='right';g.fillText(String(pct),xr,128);
      g.textAlign='left';g.font='800 64px "SF Mono",Consolas,"Courier New",monospace';g.fillText('%',xr+6,128);
      g.restore();
    }

    // ---- slot frame + opening ----
    gr=g.createLinearGradient(0,LID.y-8,0,LID.y+LID.h+10);gr.addColorStop(0,'#D2D9E2');gr.addColorStop(.5,'#8C96A4');gr.addColorStop(1,'#59626F');
    g.fillStyle=gr;rrect(LID.x-14,LID.y-12,LID.w+28,LID.h+22,14);g.fill();
    g.fillStyle='rgba(8,10,20,.9)';rrect(SLOT.x,SLOT.y,SLOT.w,SLOT.h,10);g.fill();
    gr=g.createLinearGradient(0,SLOT.y,0,SLOT.y+SLOT.h);gr.addColorStop(0,'rgba(0,0,0,.6)');gr.addColorStop(1,'rgba(0,0,0,0)');g.fillStyle=gr;rrect(SLOT.x,SLOT.y,SLOT.w,SLOT.h,10);g.fill();

    // ---- letter (drawn after the lid so it passes in front of the open flap) ----
    const drawLetter=()=>{
      const x0=400,y0=480,x1=BX,y1=324, s=sio(dragV);
      let lx=lerp(x0,x1,s),ly=lerp(y0,y1,s),rot=lerp(-.14,0,s);
      let drop=0;
      if(F||t>=tIn)drop=F?1:eio(clamp((t-tIn)/.22));
      ly+=drop*190;
      if(drop<1){
        g.save();
        if(drop>0){g.beginPath();g.rect(0,0,W,SLOT.y+SLOT.h-6);g.clip();}
        g.translate(lx,ly);g.rotate(rot);
        g.shadowColor='rgba(0,0,0,.4)';g.shadowBlur=24;g.shadowOffsetY=14;
        g.fillStyle='#F4EDDC';g.beginPath();g.roundRect(-110,-70,220,140,5);g.fill();
        g.shadowColor='transparent';
        gr=g.createLinearGradient(0,-70,0,70);gr.addColorStop(0,'rgba(255,255,255,.35)');gr.addColorStop(1,'rgba(120,90,60,.12)');g.fillStyle=gr;g.fill();
        g.strokeStyle='rgba(120,100,80,.5)';g.lineWidth=2;g.beginPath();g.moveTo(-108,-68);g.lineTo(0,6);g.lineTo(108,-68);g.stroke();
        g.fillStyle='#C8321E';g.beginPath();g.moveTo(0,-12);g.bezierCurveTo(-4,-22,-18,-18,-12,-8);g.lineTo(0,6);g.lineTo(12,-8);g.bezierCurveTo(18,-18,4,-22,0,-12);g.fill();
        g.restore();
        if(drop>.04){ // slot throat swallows the leading edge: inner shadow gradient over the letter inside the opening
          const cy=SLOT.y+SLOT.h-6;g.save();g.beginPath();g.rect(lx-112,cy-40,224,40);g.clip();
          const sg=g.createLinearGradient(0,cy-40,0,cy);sg.addColorStop(0,'rgba(6,8,18,0)');sg.addColorStop(1,'rgba(6,8,18,.85)');
          g.fillStyle=sg;g.fillRect(lx-112,cy-40,224,40);g.restore();
        }
      }
    };

    // ---- lid (hinged at top, foreshortens as it swings out) ----
    let th=0;
    if(F)th=0;
    else if(t>=tLid&&t<tClank-.1)th=1.08*eo(clamp((t-tLid)/.12));
    else if(t>=tClank-.1&&t<tClank)th=1.08*(1-eio(clamp((t-(tClank-.1))/.1)));
    else if(t>=tClank&&t<tClank+.1){const u=(t-tClank)/.1;th=.34*Math.sin(Math.PI*u)*(1-u*.4)}
    const lh=LID.h*Math.cos(th);
    g.save();
    gr=g.createLinearGradient(LID.x,0,LID.x+LID.w,0);gr.addColorStop(0,'#2F6BC2');gr.addColorStop(.4,'#1F4E9A');gr.addColorStop(1,'#14378A');
    g.fillStyle=gr;rrect(LID.x,LID.y,LID.w,Math.max(lh,6),th>0.05?3:8);g.fill();
    g.fillStyle='rgba(255,255,255,.30)';rrect(LID.x+10,LID.y+6,LID.w-20,Math.min(5,lh*.2),2);g.fill();
    g.fillStyle='rgba(0,0,30,.28)';g.fillRect(LID.x+4,LID.y+lh-5,LID.w-8,4);
    if(lh>30){ // small steel pull
      g.fillStyle='#AEB7C3';g.beginPath();g.roundRect(BX-38,LID.y+lh-22,76,10,5);g.fill();g.fillStyle='rgba(255,255,255,.6)';g.fillRect(BX-34,LID.y+lh-21,68,2)}
    g.restore();
    // hinge barrel
    gr=g.createLinearGradient(0,LID.y-6,0,LID.y+5);gr.addColorStop(0,'#E2E8F0');gr.addColorStop(1,'#707A88');g.fillStyle=gr;rrect(LID.x-4,LID.y-6,LID.w+8,11,5);g.fill();
    drawLetter();
    g.fillStyle='rgba(255,255,255,.35)';g.fillRect(LID.x-10,SLOT.y+SLOT.h-2,LID.w+20,1.5);

    // ---- receipt (pops up from its slit, clipped by the slit; stops dead) ----
    const slitY=RCP.slitY, rx=RCP.x;
    gr=g.createLinearGradient(0,slitY-8,0,slitY+12);gr.addColorStop(0,'#C9D1DB');gr.addColorStop(1,'#5B6572');
    g.fillStyle=gr;rrect(rx-16,slitY-6,RCP.w+32,22,8);g.fill();
    g.fillStyle='#070A16';rrect(rx-2,slitY-1,RCP.w+4,9,4);g.fill();
    {
      const u=F?1:clamp((t-tRcp)/.2);
      if(F||t>=tRcp){
        const off=(1-eo(u))*RCP.h, top=slitY-RCP.h+off;
        g.save();g.beginPath();g.rect(0,0,W,slitY+3);g.clip();
        g.shadowColor='rgba(0,10,40,.45)';g.shadowBlur=18;g.shadowOffsetX=6;g.shadowOffsetY=8;
        g.fillStyle='#F7F2E6';g.beginPath();
        g.moveTo(rx,top+8);for(let k=0;k<=24;k++){const x=rx+k*RCP.w/24;g.lineTo(x,top+(k%2?0:8))}
        g.lineTo(rx+RCP.w,slitY+20);g.lineTo(rx,slitY+20);g.closePath();g.fill();
        g.shadowColor='transparent';
        gr=g.createLinearGradient(rx,0,rx+RCP.w,0);gr.addColorStop(0,'rgba(255,255,255,.4)');gr.addColorStop(1,'rgba(150,120,90,.12)');g.fillStyle=gr;g.fill();
        // content: header bar, big delivered text, rules, dotted rule
        g.fillStyle='#3A3F52';g.fillRect(rx+26,top+28,70,8);
        g.fillStyle='#1E7A4F';g.font='800 58px Inter,"PingFang SC","Microsoft YaHei","Segoe UI",sans-serif';g.textAlign='center';g.textBaseline='alphabetic';
        g.fillText('已送达 ✓',rx+RCP.w/2,top+98);
        g.fillStyle='rgba(58,63,82,.35)';g.fillRect(rx+26,top+122,170,6);g.fillRect(rx+26,top+138,130,6);
        g.fillStyle='rgba(58,63,82,.5)';for(let k=0;k<22;k++)g.fillRect(rx+26+k*11.5,top+160,6,2.4);
        // seal: red stamp appears in 0.1 s
        const sa=F?1:clamp((t-tSeal)/.1);
        if(sa>0){
          const sx=rx+RCP.w/2,sy=top+218;
          g.globalAlpha=sa;
          g.strokeStyle='#C8321E';g.lineWidth=5;g.beginPath();g.arc(sx,sy,34,0,Math.PI*2);g.stroke();
          g.lineWidth=1.8;g.beginPath();g.arc(sx,sy,27,0,Math.PI*2);g.stroke();
          g.lineWidth=8;g.lineCap='round';g.lineJoin='round';g.beginPath();g.moveTo(sx-16,sy+1);g.lineTo(sx-4,sy+14);g.lineTo(sx+18,sy-14);g.stroke();
          g.globalAlpha=1;
        }
        g.restore();
      }
    }

    // ---- the letter travels inside: a thin light runs from the slot down to the receipt slit ----
    {
      const u=F?9:(t-tClank)/Math.max(.05,tRcp-tClank);
      if(u>=0&&u<=1.25){
        const y0=LID.y+LID.h+14,y1=RCP.slitY-4,hy=lerp(y0,y1,clamp(u)),a=u>1?clamp(1-(u-1)/.25):1;
        g.save();g.globalCompositeOperation='lighter';g.lineCap='round';
        const lg=g.createLinearGradient(0,hy-120,0,hy);lg.addColorStop(0,'rgba(255,236,186,0)');lg.addColorStop(1,'rgba(255,236,186,'+.7*a+')');
        g.strokeStyle=lg;g.lineWidth=4;g.beginPath();g.moveTo(BX,Math.max(y0,hy-120));g.lineTo(BX,hy);g.stroke();g.restore();
      }
    }
    // ---- accepted: one thin light lap around the closed lid, 0.3 s ----
    {
      const u=F?9:(t-tClank)/.3;
      if(u>=0&&u<=1.15){
        const per=2*(LID.w+LID.h)-(8-2*Math.PI)*12, a=u>.85?clamp(1-(u-.85)/.3):1;
        g.save();g.globalCompositeOperation='lighter';g.lineCap='round';
        const pu=clamp(u,0,1);
        for(const [lw,al,len] of [[10,.18,200],[3,.9,130]]){
          g.setLineDash([len,per]);g.lineDashOffset=-(pu*per-len*.0);
          g.strokeStyle='rgba(255,236,186,'+al*a+')';g.lineWidth=lw;rrect(LID.x-4,LID.y-4,LID.w+8,LID.h+8,12);g.stroke();
        }
        g.setLineDash([]);
        glow(BX,SLOT.y+SLOT.h/2,200,50,.16*Math.sin(Math.PI*clamp(u)),'255,226,160');
        g.restore();
      }
    }
  }
});
})();
