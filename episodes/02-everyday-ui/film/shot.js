// node film/shot.js <T seconds> <out.png> [hud=1|0] [thumb]      -> headless 1920x1080 still of the film at global time T (+ <out>_thumb.png 460x259 if "thumb" is given)
// node film/shot.js solo:<id>:<p>[:<st>[:<drag>[:<age>]]] <out.png> [hud] [thumb] -> one scene in FORCED mode (p, scene clock st, drag, flipAge; defaults p=1, age=9)
// node film/shot.js shake:<id>[:frames[:T0]]                      -> ANTI-SHAKE dev check (Film.assertNoShake), prints JSON, exit code 1 if not ok
const {spawnSync}=require('child_process'),path=require('path');
const CHROME='C:/Program Files/Google/Chrome/Application/chrome.exe',URL0='file:///'+path.resolve(__dirname,'film.html').replace(/\\/g,'/');
const FLAGS=['--headless=new','--disable-gpu','--hide-scrollbars','--allow-file-access-from-files','--window-size=1920,1080','--virtual-time-budget=2500'];
let [t,out,hud='1',thumb]=process.argv.slice(2);
if(t.startsWith('shake:')){const [,id,frames='6',t0]=t.split(':');
  const r=spawnSync(CHROME,[...FLAGS,'--dump-dom',`${URL0}?shake=${id}&frames=${frames}`+(t0?`&t0=${t0}`:'')],{encoding:'utf8',maxBuffer:1<<26});
  const m=/<pre id="shakeout"[^>]*>([^<]*)<\/pre>/.exec(r.stdout||'');if(!m){console.log('no result (page error?)');process.exit(2)}
  console.log(m[1]);process.exit(JSON.parse(m[1]).ok?0:1)}
let query;
if(t.startsWith('solo:')){const [,id,p='1',st,drag,age='9']=t.split(':');query=`solo=${id}&p=${p}&age=${age}`+(st?`&st=${st}`:'')+(drag?`&drag=${drag}`:'')+'&hud=0'}else query=`t=${t}&hud=${hud}`;
const r=spawnSync(CHROME,[...FLAGS,'--screenshot='+path.resolve(out),`${URL0}?${query}`],{encoding:'utf8'});
console.log((r.stderr||'').split('\n').filter(l=>/written|ERROR/i.test(l)).join('\n')||'no output');
if(process.argv.slice(2).includes('thumb')){const o=path.resolve(out),tn=o.replace(/\.png$/i,'_thumb.png');
  const f=spawnSync('ffmpeg',['-y','-v','error','-i',o,'-vf','scale=460:259:flags=area',tn]);console.log(f.status===0?'thumb '+tn:'thumb failed')}
