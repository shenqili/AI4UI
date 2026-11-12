// node tools/build_assets.js  — copies the audio agent's output into film/: audio/out/cues.json -> film/cues.js, audio/out/mix.mp3 -> film/audio/mix.mp3
// Validates scene ids. Run after every gen_audio.js run.
const fs=require('fs'),path=require('path'),R=path.resolve(__dirname,'..');
const src=path.join(R,'audio/out/cues.json');
if(!fs.existsSync(src)){console.error('missing',src,'(keeping stub film/cues.js)');process.exit(1)}
const c=JSON.parse(fs.readFileSync(src,'utf8'));
const need=['s00','s01','s02','s03','s04','s05','s06','s07','s08','s09','s10','s11','s12','fin'];
const ids=c.scenes.map(s=>s.id==='final'?'fin':s.id),miss=need.filter(i=>!ids.includes(i));
if(miss.length){console.error('cues.json missing scene ids:',miss.join(','),'(have',ids.join(','),')');process.exit(2)}
const bad=c.events.filter(e=>!ids.includes(e.scene==='final'?'fin':e.scene));if(bad.length)console.warn('events with unknown scene:',bad.length);
fs.writeFileSync(path.join(R,'film/cues.js'),'window.CUES='+JSON.stringify(c,null,1)+';');
const mp3=path.join(R,'audio/out/mix.mp3');fs.mkdirSync(path.join(R,'film/audio'),{recursive:true});
if(fs.existsSync(mp3))fs.copyFileSync(mp3,path.join(R,'film/audio/mix.mp3'));else console.warn('no mix.mp3 yet');
console.log('assets ok:',c.scenes.length,'scenes,',c.events.length,'events, duration',c.duration);
