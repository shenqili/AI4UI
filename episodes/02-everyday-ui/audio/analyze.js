/* numeric verification: duration, LUFS/TP, sfx onsets vs cues, per-section band energy. node analyze.js */
const fs=require('fs'),path=require('path'),{spawnSync}=require('child_process');
const OUT=path.join(__dirname,'out'),SR=44100;
function readWav(f){const b=fs.readFileSync(path.join(OUT,f));const d=b.indexOf('data')+8;const n=Math.floor((b.length-d)/4),L=new Float32Array(n),R=new Float32Array(n);for(let i=0;i<n;i++){L[i]=b.readInt16LE(d+i*4)/32768;R[i]=b.readInt16LE(d+2+i*4)/32768}return{L,R,n}}
const cues=JSON.parse(fs.readFileSync(path.join(OUT,'cues.json'))),led=JSON.parse(fs.readFileSync(path.join(OUT,'ledger.json')));
const probe=spawnSync('ffprobe',['-v','error','-show_entries','format=duration:stream=nb_samples,sample_rate','-of','default=nw=1',path.join(OUT,'mix.wav')],{encoding:'utf8'}).stdout;
console.log('ffprobe mix.wav:',probe.replace(/\n/g,' '));
for(const f of ['mix.wav','music.wav','sfx.wav']){const w=readWav(f);console.log(f,'samples',w.n,'sec',(w.n/SR).toFixed(4))}
const e=spawnSync('ffmpeg',['-nostats','-i',path.join(OUT,'mix.wav'),'-af','ebur128=peak=true','-f','null','-'],{encoding:'utf8'}).stderr;
const sm=e.slice(e.lastIndexOf('Summary:'));console.log(sm.replace(/\n\s*\n/g,'\n').trim().split('\n').filter(l=>/I:|LRA:|Peak:/.test(l)).join(' | '));
/* biquad bands */
function bq(x,type,f0,Q=.7071){const w=2*Math.PI*f0/SR,c=Math.cos(w),s=Math.sin(w),a=s/(2*Q);let b0,b1,b2;if(type==='lp'){b0=(1-c)/2;b1=1-c;b2=b0}else{b0=(1+c)/2;b1=-(1+c);b2=b0}const a0=1+a,a1=-2*c/a0,a2=(1-a)/a0;b0/=a0;b1/=a0;b2/=a0;const y=new Float32Array(x.length);let x1=0,x2=0,y1=0,y2=0;for(let i=0;i<x.length;i++){const v=b0*x[i]+b1*x1+b2*x2-a1*y1-a2*y2;x2=x1;x1=x[i];y2=y1;y1=v;y[i]=v}return y}
const mono=w=>{const m=new Float32Array(w.n);for(let i=0;i<w.n;i++)m[i]=.5*(w.L[i]+w.R[i]);return m};
const SEC=[['intro 1-2',0,8],['build 3-8',8,32],['break 9-12 (radio)',32,48],['  break lo 32-41.5',32,41.5],['  break hi 46-47.5',46,47.5],['gap 47.75-48',47.75,48],['drop1 13-19',48,76],['ebb 20-21',76,84],['breakdn 22-24',84,96],['drop2 25-29',96,116],['final 30',116,120]];
const db=v=>(10*Math.log10(v+1e-12)).toFixed(1);
for(const [name,file] of [['MUSIC stem','music.wav'],['MIX','mix.wav']]){
  const x=mono(readWav(file));const lo=bq(bq(x,'lp',250),'lp',250),mid=bq(bq(bq(x,'hp',250),'hp',250),'lp',2800),hi=bq(bq(x,'hp',2800),'hp',2800);
  console.log('\n'+name+'  band power dB (lo<250 | mid 250-2800 | hi>2800 | total)');
  const nrm=file==='music.wav'?1:1;
  for(const [n,b0,b1] of SEC){const i0=Math.floor(b0*.5*SR),i1=Math.floor(b1*.5*SR);const p=a=>{let s=0;for(let i=i0;i<i1;i++)s+=a[i]*a[i];return s/(i1-i0)};
    const pl=p(lo),pm=p(mid),ph=p(hi),pt=p(x);console.log(n.padEnd(22),db(pl).padStart(7),db(pm).padStart(7),db(ph).padStart(7),db(pt).padStart(7))}}
/* onsets: sfx.wav, detect first rise in [t-40ms, t+150ms]: energy of 1 ms hop (high-passed 150 Hz) exceeds max(thr, 12% of window peak) */
const sf=readWav('sfx.wav'),sx=mono(sf),hp=bq(sx,'hp',120);
const hopF=SR*.001,env=new Float32Array(Math.floor(sx.length/hopF)-2);for(let k=0;k<env.length;k++){let s=0;const a=Math.round(k*hopF),z=Math.round((k+1)*hopF);for(let i=a;i<z;i++)s+=Math.abs(hp[i]);env[k]=s/(z-a)}
const PERC=new Set(['press','stamp','impact','flip','fold','hover','tick','overshoot','fly','lid','clank','receipt','seal','show','final','bell','tray','cherry','pulse','stop','loaded','drop','sub']);
const rows=[];let maxE=0,sumE=0,nE=0;
for(const l of led){if(l.first==null||!PERC.has(l.type))continue;if(l.type==='flip'&&!['s01','s05','s06','s08'].includes(l.scene))continue;
  const k0=Math.max(0,Math.floor((l.t-.01)*1000)),k1=Math.floor((l.t+.08)*1000);let pkv=0;for(let k=k0;k<=k1;k++)pkv=Math.max(pkv,env[k]);
  let mr=0;for(let k=k0;k<=k1-3;k++)mr=Math.max(mr,env[k+3]-env[k]);if(mr<1e-4)continue;let on=-1;for(let k=k0;k<=k1-3;k++)if(env[k+3]-env[k]>=.4*mr&&env[k+3]>2e-4){on=k;break}
  if(on<0)continue;const err=on-l.t*1000;rows.push([l.type+'@'+l.b,err]);const a=Math.abs(err);if(a>maxE)maxE=a;sumE+=a;nE++}
console.log('\nonset check (sfx.wav, 1 ms hop, thr 12% of local peak) n='+nE+'  max |err| = '+maxE.toFixed(1)+' ms, mean = '+(sumE/nE).toFixed(2)+' ms');
console.log('worst 6:',rows.sort((a,b)=>Math.abs(b[1])-Math.abs(a[1])).slice(0,6).map(r=>r[0]+':'+r[1].toFixed(0)+'ms').join('  '));
const lm=led.filter(l=>l.first!=null&&l.type!=='spin');console.log('ledger (synth voice start vs cue): max |err| = '+Math.max(...lm.map(l=>Math.abs(l.errMs))).toFixed(3)+' ms over '+lm.length+' sounding cues; late/early offenders:',lm.filter(l=>Math.abs(l.errMs)>.03).map(l=>l.type+'@'+l.b+':'+l.errMs).join(' ')||'none');
/* mix-level onset at 0 and 116 */
const mx=mono(readWav('mix.wav'));let f0=-1;for(let i=0;i<mx.length;i++)if(Math.abs(mx[i])>.02){f0=i;break}console.log('mix.wav first |x|>0.02 at',(f0/SR*1000).toFixed(1),'ms (stamp at 0)');

/* stereo width (side/mid power dB, music stem) */
{const w=readWav('music.wav');console.log('width S/M dB (music):');for(const [n,b0,b1] of SEC){if(n.startsWith(' ')||n.startsWith('gap'))continue;const i0=Math.floor(b0*.5*SR),i1=Math.floor(b1*.5*SR);let s=0,m=0;for(let i=i0;i<i1;i++){const M=w.L[i]+w.R[i],S=w.L[i]-w.R[i];m+=M*M;s+=S*S}console.log(n.padEnd(22),db(s/m))}}
