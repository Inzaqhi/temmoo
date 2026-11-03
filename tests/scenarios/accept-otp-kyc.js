const {chromium,APP,INDEX}=require('../helpers');
const passKyc=async(p)=>{if(!(await p.locator('.kyc-form').count()))return;await p.click('[data-kyc-sample]');await p.waitForTimeout(150);await p.setInputFiles('[data-kyc-file="ktp"]','ktp-big.png');await p.waitForTimeout(300);await p.setInputFiles('[data-kyc-file="selfie"]','selfie.png');await p.waitForTimeout(300);await p.check('.kyc-form [name=consent]');await p.click('.kyc-form [type=submit]');await p.waitForTimeout(1700)};
(async()=>{const b=await chromium.launch();const p=await b.newPage({viewport:{width:1440,height:1500}});const errs=[];p.on('pageerror',e=>errs.push(e.message));
await p.route(/^https?:/,r=>r.abort());await p.goto(APP+'');
const seed=async(keepAs='admin')=>{await p.evaluate(keepAs=>{localStorage.clear();localStorage.setItem('temmoo_onboarded','1');localStorage.setItem('temmoo_promoter_app_v1',JSON.stringify({status:'approved',org:'Mootiara Surabaya'}));
localStorage.setItem('temmoo_promoter_v1',JSON.stringify({organization:'Mootiara Surabaya',activeEventId:'a',events:[{id:'a',name:'Jazz',date:'5 Desember 2026',dateShort:'5 DES',venue:'x',capacity:900,status:'draft',announcements:[]}],team:{selfId:'owner',activity:[],transfer:{to:'d',keepAs,at:Date.now(),expiresAt:Date.now()+6e8},members:[{id:'owner',name:'iwang',email:'iwang@gmail.com',role:'owner',access:'all',status:'active',joinedAt:Date.now()},{id:'d',name:'Dina Pratama',email:'dina@mootiara.id',role:'admin',access:'all',status:'active',joinedAt:Date.now()}]}}))},keepAs);await p.reload();await p.waitForTimeout(300);await p.evaluate(()=>openFlow(72));await p.waitForTimeout(200)};
const W=ms=>p.waitForTimeout(ms||200),toast=()=>p.$eval('#toast',x=>x.textContent),roles=()=>p.evaluate(()=>promoterState.team.members.map(m=>m.name+':'+m.role).join(', '));
const typeCode=async c=>{await p.click('[data-otp-digit] >> nth=0');await p.keyboard.type(c);await W(300)};
const code=()=>p.$eval('.team-otp-demo',x=>x.textContent);
// 1. Pemilik: tombol simulasi -> OTP ke email Dina
await seed();console.log('banner pemilik:',await p.$eval('.team-transfer-pending b',x=>x.textContent),'| tombol',await p.$$eval('.team-transfer-actions button',x=>x.map(b=>b.textContent)));
await p.click('[data-transfer-accept]');await W();await passKyc(p);console.log('1 OTP:',await p.$eval('.team-otp>p',x=>x.textContent),'|',await code(),'| ganti saluran?',await p.locator('[data-otp-channel]').count());
await p.screenshot({path:'acc-otp.png'});
const c1=(await code()).match(/\d{6}/)[0];await typeCode(c1==='111111'?'222222':'111111');console.log('  salah ->',await p.$eval('[data-otp-error]',x=>x.textContent),'| belum pindah:',await roles());
await typeCode(c1);console.log('  benar ->',await toast(),'|',await roles(),'| log:',await p.$eval('.team-activity li',x=>x.innerText.replace(/\s+/g,' ').slice(0,80)));
// 2. Lihat sebagai Dina -> Terima
await seed();await p.click('[data-team-act="d"]');await W();await p.evaluate(()=>openFlow(72));await W();
console.log('2 banner Dina:',await p.$eval('.team-transfer-pending b',x=>x.textContent),'| tombol',await p.$$eval('.team-transfer-actions button',x=>x.map(b=>b.textContent)));
await p.screenshot({path:'acc-dina.png'});
await p.click('[data-transfer-accept]');await W();await passKyc(p);console.log('  judul:',await p.$eval('.team-accept h3',x=>x.textContent),'| teks',await p.$eval('.team-accept header p',x=>x.textContent.slice(0,45)));
await typeCode((await code()).match(/\d{6}/)[0]);console.log('  benar ->',await toast(),'|',await roles(),'| bertindak sebagai (setelah):',await p.evaluate(()=>window.promoterTeam.me().name+'/'+window.promoterTeam.me().role));
// 3. Salah 5x saat menerima -> permintaan tetap
await seed();await p.click('[data-transfer-accept]');await W();await passKyc(p);for(let i=0;i<5;i++){const c=(await code()).match(/\d{6}/)[0];await typeCode(c==='999999'?'888888':'999999')}
console.log('3 5x salah ->',await toast(),'| permintaan masih ada:',await p.evaluate(()=>!!promoterState.team.transfer),'| banner kembali:',await p.locator('.team-transfer-pending').count(),'| log:',await p.$eval('.team-activity li',x=>x.innerText.replace(/\s+/g,' ').slice(0,85)));
// 4. Tolak sebagai Dina
await seed();await p.click('[data-team-act="d"]');await W();await p.evaluate(()=>openFlow(72));await W();await p.click('.team-transfer-actions .danger');await W();console.log('4 Dina tolak ->',await toast(),'|',await roles());
// 5. Pemilik batalkan saat OTP penerimaan terbuka (pemilik di tab lain)
await seed();await p.click('[data-transfer-accept]');await W();await passKyc(p);await p.evaluate(()=>{promoterState.team.transfer=null;savePromoter();openFlow(72,false)});await W();console.log('5 dibatalkan saat OTP -> form OTP hilang:',await p.locator('[data-otp-form]').count()===0);
// 6. Pemilik lama keluar
await seed('leave');await p.click('[data-transfer-accept]');await W();await passKyc(p);await typeCode((await code()).match(/\d{6}/)[0]);console.log('6 keluar ->',await toast(),'|',await roles(),'| halaman',await p.$eval('#flowContent h2',x=>x.textContent).catch(()=>'-'));
console.log('errors',errs);await b.close()})();
