const {chromium,APP,INDEX}=require('../helpers');const fs=require('fs');
(async()=>{const b=await chromium.launch();const p=await b.newPage({viewport:{width:1440,height:900}});const errs=[];p.on('pageerror',e=>errs.push(e.message));
await p.route(/^https?:/,r=>r.request().url().startsWith('https://www.claudeusercontent.com/')?r.fulfill({contentType:'text/html',body:'<iframe id=f sandbox="allow-scripts allow-same-origin" style="width:1420px;height:880px;border:0"></iframe>'}):r.abort());
await p.goto('https://www.claudeusercontent.com/');await p.$eval('#f',(el,h)=>el.srcdoc=h,fs.readFileSync(INDEX,'utf8'));await p.waitForTimeout(800);let f=p.frames()[1];
await f.evaluate(()=>{localStorage.clear();localStorage.setItem('temmoo_onboarded','1');closeFlow();show('home')});
const W=ms=>f.waitForTimeout(ms||300);const at=()=>f.evaluate(()=>{const fl=document.querySelector('#flowLayer');return fl.classList.contains('open')?(document.querySelector('.promoter-shell .promoter-main h1, .admin-main h1')?.textContent||document.querySelector('#flowTitle').textContent):'view '+document.querySelector('.view.active').id});
const click=async t=>{const ok=await f.evaluate(t=>{const el=[...document.querySelectorAll('button,a,[data-go],[role=button]')].find(b=>b.offsetParent!==null&&b.textContent.trim().replace(/\s+/g,' ').includes(t));if(!el)return false;el.click();return true},t);await W();if(!ok)console.log('   !! tidak ketemu:',t);return ok};
const step=async(l,t)=>{await click(t);console.log(l.padEnd(34),'→',await at())};
// --- JALUR A: lewat simulasi
await step('Profil','Profil');await step('Akun & verifikasi','Akun & verifikasi');await step('Daftar sebagai promotor','Daftar sebagai promotor');
await f.fill('[name=org]','Ruang Kolektif');await f.fill('[name=email]','halo@ruangkolektif.id');await f.fill('[name=phone]','081234567890');await f.fill('[name=experience]','Pasar Seni 2025');await f.fill('[name=link]','@ruangkolektif');await f.check('[name=agree]');
await step('Kirim pengajuan','Kirim pengajuan');await step('Simulasi: Setujui','✓ Setujui');await step('Buka Promotor Studio','Buka Promotor Studio');
await step('Lanjutkan draft','Lanjutkan');await f.fill('[data-promoter-event-form] [name=name]','Malam Puisi Kolektif');await step('Simpan & kirim pengajuan','Simpan & kirim pengajuan');
console.log('   kotak simulasi event ada?',await f.locator('[data-event-sim]').count());
await step('Simulasi: Setujui & terbitkan','Setujui & terbitkan');console.log('   status:',await f.evaluate(()=>promoterState.event.status));
await step('Buka Event Hub aktif','Buka Event Hub aktif');
await f.evaluate(()=>{closeFlow();show('events')});await W();console.log('   di Temukan Event?',await f.evaluate(()=>document.querySelector('#events').textContent.includes('Malam Puisi Kolektif')));
// --- JALUR B: admin console sungguhan untuk event kedua
await f.evaluate(()=>{promoterState.event.status='draft';promoterState.event.name='Workshop Zine Surabaya';savePromoter();closeFlow();openFlow(65)});await W();
await step('Ajukan event kedua','Simpan & kirim pengajuan');
await f.evaluate(()=>{closeFlow();openFlow(56)});await W();await step('Portal tim Temmoo','Portal tim Temmoo');
const inputs=await f.$$eval('[data-official-login] input',x=>x.map(i=>i.name+':'+i.type+(i.required?'*':'')));console.log('   form admin:',inputs.join(', '));
await f.fill('[data-official-login] [name=email]','admin@temmoo.id');for(const n of await f.$$eval('[data-official-login] input',x=>x.filter(i=>i.name!=='email').map(i=>i.name))){await f.fill(`[data-official-login] [name=${n}]`,n.match(/otp|code|kode/i)?'123456':'rahasia123')}
await step('Masuk admin','Masuk');await step('Event & Promotor','Event & Promotor');await step('Periksa event','Periksa');
await step('Setujui & terbitkan (admin)','Setujui & terbitkan');console.log('   status:',await f.evaluate(()=>promoterState.event.status));
await step('Keluar admin','Keluar');console.log('   akun sekarang:',await f.evaluate(()=>accountState.name+' / '+accountState.accountType));
const back=await click('Kembali ke aplikasi');await W(500);f=p.frames()[1];console.log('Kembali ke aplikasi'.padEnd(34),'→',await at(),'| nama sidebar:',await f.$eval('.account b',x=>x.textContent));
console.log('errors',errs);await b.close()})();
