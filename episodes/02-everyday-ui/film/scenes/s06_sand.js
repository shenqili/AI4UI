/* s06 Progress -> sand mountain in a glass frame. Three fine streams build a ridge; the last grain closes the etched silhouette. */
(function(){
const FX=340,FY=200,FW=1240,FH=640;                 // brass frame outer
const WX0=374,WX1=1546,WY0=260,WY1=784,FLOOR=780;   // glass window
const NOZ_Y=298, D=0.14;                            // nozzle tip, fall time (s)
const X=[715,960,1230], P=[200,320,185], QE=[.8,1,.9];
const COL=[[217,160,102],[180,85,58],[95,168,160]];
const SR=0.66, ST=0.72, R=34, KB=18, NC=(WX1-WX0)/2;
const PMAX=320;
const AKT=[0,1,2].map(i=>{const a=[];for(let k=0;k<=18;k++)a.push(P[i]*Math.pow(Math.min((k/18+(k>0&&k<18?Math.sin(k*2.7+i*1.9)*.012:0))/QE[i],1),.6));return a});
const BT=19;let TT,TB,BJ,bgc,fgc,g,cv,tile,pat=null,NZ,EN,GR,SP,SK;
const cl=(v,a=0,b=1)=>v<a?a:v>b?b:v;
const ff=d=>Math.sqrt(d*d+R*R)-R;
const fr=v=>v-Math.floor(v);
const rr=(k,x,y,w,h,r)=>{k.moveTo(x+r,y);k.arcTo(x+w,y,x+w,y+h,r);k.arcTo(x+w,y+h,x,y+h,r);k.arcTo(x,y+h,x,y,r);k.arcTo(x,y,x+w,y,r);k.closePath()};
function target(x){let m=0;for(let i=0;i<3;i++){const v=P[i]-ST*ff(x-X[i]);if(v>m)m=v}return m}

// colour tables [stream][parity][lit 0..8]
const CT=COL.map(c=>[0,1].map(par=>{const a=[];for(let L=0;L<9;L++){const m=(1+.15*(L-4)/4)*(par?0.94:1);a.push('rgb('+Math.round(cl(c[0]*m,0,255))+','+Math.round(cl(c[1]*m,0,255))+','+Math.round(cl(c[2]*m,0,255))+')')}return a}));

function buildStatic(W,H){
  bgc=document.createElement('canvas');bgc.width=W;bgc.height=H;
  const b=bgc.getContext('2d');
  // field + soft key light from upper left (fixed)
  b.fillStyle='#EADBC4';b.fillRect(0,0,W,H);
  let gr=b.createRadialGradient(560,220,60,760,420,1500);gr.addColorStop(0,'#F4E8D2');gr.addColorStop(1,'#E3D0B0');
  b.fillStyle=gr;b.fillRect(0,0,W,H);
  // tabletop
  gr=b.createLinearGradient(0,800,0,H);gr.addColorStop(0,'#D8C4A0');gr.addColorStop(1,'#CDB68F');
  b.fillStyle=gr;b.fillRect(0,800,W,H-800);
  b.fillStyle='rgba(255,246,226,.55)';b.fillRect(0,800,W,2);
  b.fillStyle='rgba(90,60,25,.10)';b.fillRect(0,802,W,3);
  // contact shadow
  b.save();b.shadowColor='rgba(60,40,15,.28)';b.shadowBlur=44;b.shadowOffsetY=18;
  b.fillStyle='#8a6a3a';b.beginPath();rr(b,FX+40,FY+80,FW-80,FH-60,10);b.fill();
  b.shadowColor='rgba(60,40,15,.35)';b.shadowBlur=14;b.shadowOffsetY=6;
  b.fillRect(FX+60,845,120,12);b.fillRect(FX+FW-180,845,120,12);
  b.restore();
  // back panel
  gr=b.createLinearGradient(0,WY0,0,WY1);gr.addColorStop(0,'#F6EDDC');gr.addColorStop(1,'#E8D6B8');
  b.fillStyle=gr;b.fillRect(WX0,WY0,WX1-WX0,WY1-WY0);
  gr=b.createLinearGradient(0,WY0,0,WY0+60);gr.addColorStop(0,'rgba(80,55,25,.22)');gr.addColorStop(1,'rgba(80,55,25,0)');
  b.fillStyle=gr;b.fillRect(WX0,WY0,WX1-WX0,60);
  gr=b.createLinearGradient(WX0,0,WX0+70,0);gr.addColorStop(0,'rgba(80,55,25,.14)');gr.addColorStop(1,'rgba(80,55,25,0)');
  b.fillStyle=gr;b.fillRect(WX0,WY0,70,WY1-WY0);
  b.fillStyle='rgba(90,60,25,.35)';b.fillRect(WX0,FLOOR,WX1-WX0,WY1-FLOOR);

  // front layer: glass + brass
  fgc=document.createElement('canvas');fgc.width=W;fgc.height=H;
  const f=fgc.getContext('2d');
  // nozzles (behind glass)
  for(let i=0;i<3;i++){
    const x=X[i];
    let ng=f.createLinearGradient(x-26,0,x+26,0);ng.addColorStop(0,'#E4C98F');ng.addColorStop(.45,'#B08D57');ng.addColorStop(1,'#7E5F32');
    f.fillStyle=ng;f.beginPath();f.moveTo(x-30,WY0);f.lineTo(x+30,WY0);f.lineTo(x+7,NOZ_Y);f.lineTo(x-7,NOZ_Y);f.closePath();f.fill();
    f.fillStyle='rgba(0,0,0,.22)';f.fillRect(x-30,WY0,60,3);
    const c=COL[i];f.fillStyle='rgb('+c[0]+','+c[1]+','+c[2]+')';f.beginPath();rr(f,x-22,WY0+14,44,8,3);f.fill();
    f.fillStyle='rgba(255,255,255,.35)';f.fillRect(x-20,WY0+15,40,2);
    f.fillStyle='#5a4220';f.beginPath();f.ellipse(x,NOZ_Y,7,2.2,0,0,Math.PI*2);f.fill();
  }
  // gauge ticks on right side wall: 25/50/75/100 % of peak height
  f.strokeStyle='rgba(70,50,20,.55)';f.lineWidth=2;
  for(let k=1;k<=4;k++){const y=FLOOR-PMAX*k/4;f.beginPath();f.moveTo(WX1-4,y);f.lineTo(WX1-(k===4?46:30),y);f.stroke();f.strokeStyle='rgba(255,255,255,.55)';f.beginPath();f.moveTo(WX1-4,y+2);f.lineTo(WX1-(k===4?46:30),y+2);f.stroke();f.strokeStyle='rgba(70,50,20,.55)'}
  // glass tint + fixed reflections
  f.fillStyle='rgba(207,231,227,.16)';f.fillRect(WX0,WY0,WX1-WX0,WY1-WY0);
  f.save();f.beginPath();f.rect(WX0,WY0,WX1-WX0,WY1-WY0);f.clip();
  gr=f.createLinearGradient(WX0,WY0,WX0+520,WY0+320);gr.addColorStop(0,'rgba(255,255,255,.20)');gr.addColorStop(1,'rgba(255,255,255,0)');
  f.fillStyle=gr;f.beginPath();f.moveTo(WX0,WY0);f.lineTo(WX0+330,WY0);f.lineTo(WX0+60,WY1);f.lineTo(WX0,WY1);f.closePath();f.fill();
  f.fillStyle='rgba(255,255,255,.07)';f.beginPath();f.moveTo(WX0+380,WY0);f.lineTo(WX0+440,WY0);f.lineTo(WX0+170,WY1);f.lineTo(WX0+110,WY1);f.closePath();f.fill();
  f.fillStyle='rgba(255,255,255,.07)';f.beginPath();f.moveTo(WX1-300,WY0);f.lineTo(WX1-250,WY0);f.lineTo(WX1-480,WY1);f.lineTo(WX1-530,WY1);f.closePath();f.fill();
  f.restore();
  f.fillStyle='rgba(255,255,255,.5)';f.fillRect(WX0,WY0,WX1-WX0,2);f.fillRect(WX0,WY0,2,WY1-WY0);
  f.fillStyle='rgba(60,40,15,.22)';f.fillRect(WX0,WY1-2,WX1-WX0,2);f.fillRect(WX1-2,WY0,2,WY1-WY0);
  // brass frame ring (evenodd)
  const ring=new Path2D();
  const o=new Path2D();rr(o,FX,FY,FW,FH,22);ring.addPath(o);
  const iw=new Path2D();iw.rect(WX0,WY0,WX1-WX0,WY1-WY0);ring.addPath(iw);
  gr=f.createLinearGradient(FX,FY,FX+FW,FY+FH);
  gr.addColorStop(0,'#E9D09A');gr.addColorStop(.35,'#C7A266');gr.addColorStop(.62,'#B08D57');gr.addColorStop(1,'#7B5C30');
  f.fillStyle=gr;f.fill(ring,'evenodd');
  f.save();f.clip(ring,'evenodd');
  for(let i=0;i<260;i++){const y=FY+EN[i]*FH,x=FX+EN[i+260]*FW,w=60+EN[i+520]*360;f.fillStyle=(i&1)?'rgba(255,240,200,.06)':'rgba(70,45,10,.06)';f.fillRect(x,y,w,1)}
  // groove
  f.strokeStyle='rgba(60,40,10,.30)';f.lineWidth=2;f.beginPath();rr(f,FX+13,FY+13,FW-26,FH-26,14);f.stroke();
  f.strokeStyle='rgba(255,240,200,.35)';f.lineWidth=1;f.beginPath();rr(f,FX+15,FY+15,FW-30,FH-30,13);f.stroke();
  // bevel
  f.fillStyle='rgba(255,244,214,.7)';f.fillRect(FX+22,FY,FW-44,2);f.fillRect(FX,FY+22,2,FH-44);
  f.fillStyle='rgba(50,30,5,.45)';f.fillRect(FX+22,FY+FH-2,FW-44,2);f.fillRect(FX+FW-2,FY+22,2,FH-44);
  f.fillStyle='rgba(50,30,5,.42)';f.fillRect(WX0-3,WY0-3,WX1-WX0+6,3);f.fillRect(WX0-3,WY0-3,3,WY1-WY0+6);
  f.fillStyle='rgba(255,244,214,.55)';f.fillRect(WX0-3,WY1,WX1-WX0+6,3);f.fillRect(WX1,WY0-3,3,WY1-WY0+6);
  f.restore();
  // top bar screws (decor: none) / feet
  for(const fx of [FX+60,FX+FW-180]){
    gr=f.createLinearGradient(0,FY+FH,0,FY+FH+22);gr.addColorStop(0,'#B08D57');gr.addColorStop(1,'#6E5129');
    f.fillStyle=gr;f.beginPath();rr(f,fx,FY+FH-2,120,22,5);f.fill();
    f.fillStyle='rgba(255,244,214,.45)';f.fillRect(fx+4,FY+FH,112,1.5);
  }
}

Film.scene('s06',{
  mount(root,{W,H}){
    cv=document.createElement('canvas');cv.width=W;cv.height=H;cv.style.cssText='position:absolute;left:0;top:0';root.appendChild(cv);g=cv.getContext('2d');
    EN=Film.rand('s06',800,1);GR=Film.rand('s06',900,2);SP=Film.rand('s06',400,3);SK=Film.rand('s06',200,4);
    const r=Film.rand('s06',NC,5),ph=Film.rand('s06',4,6);
    NZ=new Float64Array(NC);
    for(let j=0;j<NC;j++){const x=j*2;NZ[j]=Math.sin(x*.021+ph[0]*6.28)*.5+Math.sin(x*.057+ph[1]*6.28)*.3+(r[j]-.5)*.5}
    tile=Film.img('assets/sand_grain_tile.png');
    TB=new Float64Array(NC+2);for(let j=0;j<NC+2;j++)TB[j]=Math.max(0,P[1]-ST*ff(WX0+2*j-X[1]));
    TT=new Float64Array(NC+2);for(let j=0;j<NC+2;j++)TT[j]=target(WX0+2*j);
    BJ=new Float64Array(64);for(let n=0;n<64;n++)BJ[n]=Math.sin(n*2.7)*3.2;
    buildStatic(W,H);
  },
  render(c){
    const W=c.W,H=c.H,t=c.t,forced=c.forced;
    const pour=c.ev.find(e=>e.type==='pour'),pause=c.ev.find(e=>e.type==='pause'),flip=c.ev.find(e=>e.type==='flip'),imp=c.ev.find(e=>e.type==='impact');
    // ---- timeline (all from cues) ----
    let q=forced?cl(c.p):1,sl=0,hasPour=!forced&&!!pour;
    let P0=0,Pl=0,Pn=0,T1=0,tot=1,LA=0;
    if(hasPour){
      P0=pour.lt;T1=flip?flip.lt:pour.lt+pour.lenSec;
      Pl=pause?pause.lt:T1;Pn=pause?pause.lenSec:0;
      LA=Math.max(Pl-(P0+D),1e-6);tot=LA+Math.max(T1-(Pl+Pn),0);
      const dep=cl(t-(P0+D),0,LA)+(T1>Pl+Pn?cl(t-(Pl+Pn),0,T1-Pl-Pn):0);
      q=cl(dep/tot);
      if(pause){const s=cl((t-Pl)/.22),e=cl((t-(Pl+Pn))/.5);sl=Film.ease.eo(s)*(1-Film.ease.eo(e))}
    }
    const tq=qq=>{const v=qq*tot;return v<=LA?P0+D+v:(Pl+Pn)+(v-LA)};
    // ---- apex per stream ----
    const lam=PMAX*(1-q);
    // ---- background ----
    g.globalAlpha=1;g.globalCompositeOperation='source-over';
    g.drawImage(bgc,0,0);
    // ---- sand ----
    const hs=new Float64Array(NC+2),own=new Int8Array(NC+2);
    for(let j=0;j<=NC+1;j++){const wq=Math.pow(cl((q-.3)/.7),1.4),hv=Math.max(0,TB[j]+wq*(TT[j]-TB[j])-lam);hs[j]=hv;const x=WX0+2*j,nz=NZ[Math.min(j,NC-1)]*22;own[j]=x<745+nz?0:(x>1195+nz?2:1)}
    const pts=new Path2D();pts.moveTo(WX0,FLOOR);
    for(let j=0;j<NC;j++){const x=WX0+2*j;pts.lineTo(x,FLOOR-hs[j]-(hs[j]>1?(EN[j]-.5)*2.4:0))}
    pts.lineTo(WX1,FLOOR);pts.closePath();
    for(let j=0;j<NC;j++){
      const h=hs[j];if(h<0.6)continue;
      const x=WX0+2*j,i=own[j],Tx=TT[j],ey=(EN[j]-.5)*2.4;
      const sp=(hs[j+1]-hs[Math.max(j-1,0)])/4;
      const Lq=Math.round(cl(sp/.7,-1,1)*4+4);
      const dTop=Tx-h;let n=Math.floor(dTop/BT);
      for(;n<=Math.ceil(Tx/BT);n++){
        const d0=Math.max(n*BT+BJ[n&63],dTop),d1=Math.min((n+1)*BT+BJ[(n+1)&63],Tx);
        if(d1<=d0)continue;
        const yt=Tx-d0,yb=Tx-d1; // heights above floor: top then bottom
        g.fillStyle=CT[i][n&1][Lq];
        const top=yt>=h-.01?ey:0;
        g.fillRect(x,FLOOR-yt-top,2,yt-yb+top+.5);
      }
      if(sp>0.05){g.fillStyle='rgba(255,244,220,'+(0.18+0.25*cl(sp/.7))+')';g.fillRect(x,FLOOR-h-ey,2,2)}
    }

    // grain texture (multiply) clipped to silhouette
    if(tile&&tile.complete&&tile.naturalWidth){
      if(!pat){pat=g.createPattern(tile,'repeat')}
      g.save();g.clip(pts);g.globalCompositeOperation='multiply';g.globalAlpha=.55;g.fillStyle=pat;g.fillRect(WX0,WY0,WX1-WX0,WY1-WY0);g.restore();
    }
    // floor contact darkening
    g.fillStyle='rgba(50,30,10,.12)';g.fillRect(WX0,FLOOR-3,WX1-WX0,3);
    // ---- streams ----
    const surfY=i=>FLOOR-hs[Math.round((X[i]-WX0)/2)];
    if(hasPour){
      for(let i=0;i<3;i++){
        const tEnd=tq(1);if(hs[Math.round((X[i]-WX0)/2)]<3)continue;
        const dep=[[P0+D,Math.min(Pl,tEnd)]];
        if(tEnd>Pl+Pn&&pause)dep.push([Pl+Pn,tEnd]);
        const col=COL[i],x0=X[i],ys=surfY(i);
        const thin=i===1?1-.55*cl((q-.9)/.1):.8;
        for(let n=0;n<dep.length;n++){
          const Is=dep[n][0]-D,Ie=dep[n][1]-D;if(Ie<=Is)continue;
          const fh=cl((t-Is)/D),ft=cl((t-Ie)/D);
          if(fh<=0||ft>=1)continue;
          const ya=NOZ_Y+ft*(ys-NOZ_Y),yb=NOZ_Y+fh*(ys-NOZ_Y);
          if(yb-ya<1)continue;
          g.fillStyle='rgba('+col[0]+','+col[1]+','+col[2]+',.55)';g.fillRect(x0-1.3*thin,ya,2.6*thin,yb-ya);
          for(let k=0;k<50;k++){
            const z=fr(GR[i*60+k]+t*2.4),yy=ya+z*(yb-ya),xx=x0+(GR[i*60+k+300]-.5)*3.6*thin*(0.6+z*.6);
            g.fillStyle=(k&1)?'rgb('+Math.min(col[0]+30,255)+','+Math.min(col[1]+30,255)+','+Math.min(col[2]+30,255)+')':'rgb('+col[0]*.8+','+col[1]*.8+','+col[2]*.8+')';
            g.fillRect(xx-.8,yy,1.7,1.9);
          }
          // last grain
          if(i===1&&n===dep.length-1&&t>=Ie&&t<Ie+D){
            g.fillStyle='rgba(255,236,190,.28)';g.beginPath();g.arc(x0,yb,9,0,6.283);g.fill();
            g.fillStyle='#C8664A';g.beginPath();g.arc(x0,yb,3.4,0,6.283);g.fill();
            g.fillStyle='rgba(255,255,255,.7)';g.fillRect(x0-1.5,yb-2,1.5,1.5);
          }
        }
        // splash while depositing
        let act=(t>=P0+D&&t<Math.min(Pl,tEnd))||(pause&&t>=Pl+Pn&&t<tEnd);
        if(act){
          const sx=x0,sy=FLOOR-hs[Math.round((sx-WX0)/2)];
          for(let k=0;k<9;k++){
            const u=fr(t/.34+SP[i*20+k]),tt=u*.3,vx=(SP[i*20+k+60]-.5)*150,vy=-(50+SP[i*20+k+120]*90);
            const gx=sx+vx*tt,gy=sy+vy*tt+450*tt*tt;
            g.fillStyle='rgba('+col[0]+','+col[1]+','+col[2]+','+(1-u)*.9+')';g.fillRect(gx-.9,gy-.9,1.8,1.8);
          }
        }
        // skidding grains during pause slump
        if(pause&&hs[Math.round((X[i]-WX0)/2)]>25){
          for(let k=0;k<10;k++){
            const side=(k&1)?1:-1,u=cl((t-Pl-SK[k]*.08)/.38);
            if(u<=0||u>=1)continue;
            const xs=x0+side*(12+SK[k+20]*46)+side*u*(60+SK[k+40]*70);
            const jj=cl(Math.round((xs-WX0)/2),0,NC);
            const gy=FLOOR-hs[jj]-1.5;
            g.fillStyle='rgba(255,244,220,'+(.85*(1-u))+')';g.fillRect(xs-1,gy,2.2,2.2);
          }
        }
      }
    }
    // ---- front: nozzles + glass + brass ----
    g.drawImage(fgc,0,0);
    // ---- etched silhouette (on glass) ----
    const since=forced?99:Film.since(c,'flip');
    const closed=forced?q>=.999:since<Infinity;
    const front=forced?2:Film.ease.eo(cl(since/.22))*1.4;
    const aIn=imp&&!forced?cl(1-(t-imp.lt)/.3):0;
    const pk=960;
    for(let x=WX0+2;x<WX1-2;x+=4){
      const y0=FLOOR-target(x),y1=FLOOR-target(x+4);
      if(FLOOR-y0<2&&FLOOR-y1<2)continue;
      const isB=closed&&Math.abs(x-pk)/520<front;
      if(isB){g.strokeStyle='rgba(120,84,30,.55)';g.lineWidth=5.5;g.beginPath();g.moveTo(x,y0+1.5);g.lineTo(x+4.4,y1+1.5);g.stroke();
        g.strokeStyle='#E2BC6C';g.lineWidth=3.4;g.beginPath();g.moveTo(x,y0);g.lineTo(x+4.4,y1);g.stroke()}
      else{
        g.strokeStyle='rgba(60,40,15,.28)';g.lineWidth=2;g.beginPath();g.moveTo(x,y0+1.4);g.lineTo(x+4.4,y1+1.4);g.stroke();
        g.strokeStyle='rgba(255,255,255,'+(.62+.3*aIn)+')';g.lineWidth=2.2;g.beginPath();g.moveTo(x,y0);g.lineTo(x+4.4,y1);g.stroke()}
    }
    // impact: one glint pass across the glass (<=0.15 s), clipped to window
    if(imp&&!forced){
      const age=t-imp.lt;
      if(age>=0&&age<.15){
        const u=age/.15,cx=WX0-120+u*(WX1-WX0+240);
        g.save();g.beginPath();g.rect(WX0,WY0,WX1-WX0,WY1-WY0);g.clip();
        const gg=g.createLinearGradient(cx-60,0,cx+60,0);gg.addColorStop(0,'rgba(255,255,255,0)');gg.addColorStop(.5,'rgba(255,255,255,.22)');gg.addColorStop(1,'rgba(255,255,255,0)');
        g.fillStyle=gg;g.beginPath();g.moveTo(cx-60,WY0);g.lineTo(cx+90,WY0);g.lineTo(cx+10,WY1);g.lineTo(cx-140,WY1);g.closePath();g.fill();g.restore();
      }
    }
    // closure light (local, <=650 px, <=25%, <0.3 s)
    if(closed&&!forced&&since<.3){
      const a=.24*Math.pow(1-since/.3,1.5),py=FLOOR-PMAX;
      const rg=g.createRadialGradient(pk,py,0,pk,py,420);rg.addColorStop(0,'rgba(255,232,180,'+a+')');rg.addColorStop(1,'rgba(255,232,180,0)');
      g.fillStyle=rg;g.fillRect(pk-420,py-420,840,840);
    }
    // ---- big % numeral (the only caption) + bottom progress rail ----
    const pct=closed?100:Math.min(99,Math.floor(100*q+1e-6));
    g.fillStyle=closed?'#7A5A22':'#3A2E22';g.textAlign='center';g.textBaseline='alphabetic';
    g.font='700 132px "SF Mono",Consolas,"Segoe UI",monospace';g.fillText(pct+'%',960,160);
    const rx=440,rw=1040,ry=806,rh=14,fillw=rw*(closed?1:q);
    g.fillStyle='rgba(40,25,5,.45)';g.beginPath();rr(g,rx-2,ry-2,rw+4,rh+4,9);g.fill();
    g.save();g.beginPath();rr(g,rx,ry,rw,rh,7);g.clip();
    g.fillStyle='rgba(20,10,0,.25)';g.fillRect(rx,ry,rw,rh);
    const cs=[[0,.3,0],[.3,.7,1],[.7,1,2]];
    for(const [u0,u1,i] of cs){const x0=rx+rw*u0,x1=Math.min(rx+rw*u1,rx+fillw);if(x1>x0){const c0=COL[i];g.fillStyle='rgb('+c0[0]+','+c0[1]+','+c0[2]+')';g.fillRect(x0,ry,x1-x0,rh);g.fillStyle='rgba(255,255,255,.25)';g.fillRect(x0,ry,x1-x0,3)}}
    g.restore();
    g.fillStyle='rgba(255,240,200,.7)';for(let k=1;k<=3;k++)g.fillRect(rx+rw*k/4-1,ry+rh+4,2,5);
    // touch ring (if any cue)
    Film.cue(c,'touch').forEach(qq=>Film.touch(g,960,520,qq.age));
  }
});
})();
