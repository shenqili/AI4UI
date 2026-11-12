// node film/render_video.js [fps=30] [out=out/prop-ui-60s.mp4] [from=0] [to=60]   (paths resolve to D:/moyu/prop-ui)
// Deterministic frame export: Chrome (CDP) steps Film.renderAt(T) -> screenshot -> ffmpeg + audio/out/mix.wav (falls back to film/audio/mix.mp3, then silence)
const {spawn,execFileSync}=require('child_process'),fs=require('fs'),path=require('path'),http=require('http');
const ROOT=path.resolve(__dirname,'..');
const fps=+process.argv[2]||30,outFile=path.resolve(ROOT,process.argv[3]||'out/prop-ui-60s.mp4'),from=+process.argv[4]||0,to=process.argv[5]!=null?+process.argv[5]:60;
const frames=path.join(ROOT,'out/frames');fs.mkdirSync(frames,{recursive:true});fs.mkdirSync(path.dirname(outFile),{recursive:true});
fs.readdirSync(frames).filter(f=>/^f_\d+\.jpg$/.test(f)).forEach(f=>fs.unlinkSync(path.join(frames,f)));
const PORT=9333;const chrome=spawn('C:/Program Files/Google/Chrome/Application/chrome.exe',['--headless=new','--disable-gpu','--hide-scrollbars','--window-size=1920,1080',`--remote-debugging-port=${PORT}`,'--user-data-dir='+path.join(ROOT,'out/chrome-profile'),'--allow-file-access-from-files','about:blank'],{stdio:'ignore'});
const get=u=>new Promise((res,rej)=>http.get(u,r=>{let d='';r.on('data',c=>d+=c);r.on('end',()=>res(JSON.parse(d)))}).on('error',rej));
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
(async()=>{
  let tabs;for(let i=0;i<60;i++){try{tabs=await get(`http://127.0.0.1:${PORT}/json`);break}catch{await sleep(250)}}
  const page=tabs.find(t=>t.type==='page');const ws=new WebSocket(page.webSocketDebuggerUrl);await new Promise(r=>ws.onopen=r);
  let id=0;const pend=new Map();ws.onmessage=e=>{const m=JSON.parse(e.data);if(m.id&&pend.has(m.id)){pend.get(m.id)(m);pend.delete(m.id)}};
  const send=(method,params={})=>new Promise(res=>{const i=++id;pend.set(i,res);ws.send(JSON.stringify({id:i,method,params}))});
  await send('Page.enable');await send('Emulation.setDeviceMetricsOverride',{width:1920,height:1080,deviceScaleFactor:1,mobile:false});
  await send('Page.navigate',{url:'file:///'+path.join(ROOT,'film/film.html').replace(/\\/g,'/')+'?t=0&hud=2'});await sleep(2500);
  const ev=async expr=>(await send('Runtime.evaluate',{expression:expr,awaitPromise:true,returnByValue:true})).result.result.value;
  const total=Math.round((to-from)*fps);const t0=Date.now();
  for(let n=0;n<total;n++){
    const T=from+n/fps;
    for(let tries=0;tries<80;tries++){const ok=await ev(`(async()=>{Film.renderAt(${T});await new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)));return Film.ready()})()`);if(ok)break;await sleep(100)}
    const shot=await send('Page.captureScreenshot',{format:'jpeg',quality:94});
    fs.writeFileSync(path.join(frames,`f_${String(n).padStart(5,'0')}.jpg`),Buffer.from(shot.result.data,'base64'));
    if(n%60===0)console.log(`frame ${n}/${total}  ${((Date.now()-t0)/1000).toFixed(0)}s`);
  }
  ws.close();chrome.kill();
  const wav=path.join(ROOT,'audio/out/mix.wav'),mp3=path.join(ROOT,'film/audio/mix.mp3');
  const aIn=fs.existsSync(wav)?['-ss',String(from),'-t',String(to-from),'-i',wav]:fs.existsSync(mp3)?['-ss',String(from),'-t',String(to-from),'-i',mp3]:['-f','lavfi','-t',String(to-from),'-i','anullsrc=r=44100:cl=stereo'];
  console.log('audio source:',aIn[aIn.length-1]);
  execFileSync('ffmpeg',['-y','-v','error','-framerate',String(fps),'-i',path.join(frames,'f_%05d.jpg'),...aIn,'-c:v','libx264','-crf','16','-preset','medium','-pix_fmt','yuv420p','-c:a','aac','-b:a','256k','-shortest',outFile]);
  console.log('wrote',outFile,((Date.now()-t0)/1000).toFixed(0)+'s');process.exit(0);
})().catch(e=>{console.error(e);chrome.kill();process.exit(1)});
