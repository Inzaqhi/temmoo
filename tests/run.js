#!/usr/bin/env node
// Menjalankan semua skenario di tests/scenarios dan membandingkan keluarannya dengan tests/snapshots.
//   node tests/run.js              jalankan semua skenario
//   node tests/run.js otp kyc      hanya skenario yang namanya mengandung "otp" atau "kyc"
//   node tests/run.js --update     tulis ulang snapshot (periksa dulu diff-nya sebelum commit!)
// Skenario gagal kalau: proses keluar dengan error, ada error JavaScript di halaman, atau keluarannya beda dari snapshot.
const fs=require('fs'),path=require('path'),{spawn}=require('child_process');
const ROOT=path.resolve(__dirname,'..'),SCEN=path.join(__dirname,'scenarios'),SNAP=path.join(__dirname,'snapshots'),OUT=path.join(__dirname,'.output'),FIX=path.join(__dirname,'fixtures');
const args=process.argv.slice(2),update=args.includes('--update'),filters=args.filter(a=>!a.startsWith('--'));
const jobs=Math.max(1,Number(process.env.TEST_JOBS)||4),timeout=Number(process.env.TEST_TIMEOUT)||180000;
const names=fs.readdirSync(SCEN).filter(f=>f.endsWith('.js')).map(f=>f.slice(0,-3)).filter(n=>!filters.length||filters.some(q=>n.includes(q))).sort();
if(!names.length){console.error('Tidak ada skenario yang cocok.');process.exit(1)}

// Error JavaScript dicetak skenario sebagai "errors [...]" atau "errors: 2 [...]"; array kosong berarti bersih.
const pageErrors=out=>out.split('\n').filter(l=>/\berrors?:?\s*(\d+\s*)?\[\s*\S/.test(l)&&!/\berrors?:?\s*(0\s*)?\[\s*\]/.test(l));
const normalize=out=>out.split(ROOT).join('<repo>').replace(/[ \t]+$/gm,'').trimEnd()+'\n';

function run(name){return new Promise(resolve=>{
  const dir=path.join(OUT,name);fs.rmSync(dir,{recursive:true,force:true});fs.mkdirSync(dir,{recursive:true});
  for(const f of fs.readdirSync(FIX))fs.copyFileSync(path.join(FIX,f),path.join(dir,f));
  const started=Date.now(),child=spawn(process.execPath,[path.join(SCEN,name+'.js')],{cwd:dir,env:process.env});
  let out='';child.stdout.on('data',d=>out+=d);child.stderr.on('data',d=>out+=d);
  const timer=setTimeout(()=>{out+=`\n[runner] waktu habis setelah ${timeout/1000} detik\n`;child.kill('SIGKILL')},timeout);
  child.on('close',code=>{clearTimeout(timer);resolve({name,code,out:normalize(out),ms:Date.now()-started})});
})}

function firstDiff(expected,actual){
  const a=expected.split('\n'),b=actual.split('\n');
  for(let i=0;i<Math.max(a.length,b.length);i++)if(a[i]!==b[i])return `  baris ${i+1}\n  - snapshot: ${a[i]??'(tidak ada)'}\n  + sekarang: ${b[i]??'(tidak ada)'}`;
  return '';
}

(async()=>{
  fs.mkdirSync(SNAP,{recursive:true});
  const queue=[...names],results=[];
  await Promise.all(Array.from({length:Math.min(jobs,queue.length)},async()=>{while(queue.length){const r=await run(queue.shift());results.push(r);report(r)}}));
  const failed=results.filter(r=>r.fail);
  console.log(`\n${results.length-failed.length}/${results.length} skenario lolos${failed.length?` · gagal: ${failed.map(r=>r.name).join(', ')}`:''}`);
  process.exit(failed.length?1:0);

  function report(r){
    const file=path.join(SNAP,r.name+'.txt'),errs=pageErrors(r.out),secs=(r.ms/1000).toFixed(1)+'s';
    if(r.code!==0||errs.length){r.fail=true;console.log(`✗ ${r.name} (${secs})${r.code!==0?` keluar dengan kode ${r.code}`:''}\n${(errs.length?errs:r.out.trim().split('\n').slice(-8)).map(l=>'  '+l).join('\n')}`);return}
    if(update||!fs.existsSync(file)){fs.writeFileSync(file,r.out);console.log(`✎ ${r.name} (${secs}) snapshot ditulis`);return}
    const expected=fs.readFileSync(file,'utf8');
    if(expected===r.out){console.log(`✓ ${r.name} (${secs})`);return}
    r.fail=true;fs.writeFileSync(path.join(OUT,r.name,'actual.txt'),r.out);
    console.log(`✗ ${r.name} (${secs}) keluaran beda dari snapshot\n${firstDiff(expected,r.out)}\n  keluaran lengkap: tests/.output/${r.name}/actual.txt`);
  }
})();
