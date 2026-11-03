const {chromium,APP,INDEX}=require('../helpers');const fs=require('fs');
(async()=>{const b=await chromium.launch();const p=await b.newPage({viewport:{width:1440,height:1600}});const errs=[];p.on('pageerror',e=>errs.push(e.message));
await p.route(/^https?:/,r=>r.abort());await p.goto(APP+'');
// gambar uji
for(const [f,w,h,c] of [['ktp-big.png',1000,630,'#3b82f6'],['ktp-small.png',320,200,'#ef4444'],['selfie.png',720,960,'#10b981']]){const d=await p.evaluate(([w,h,c])=>{const cv=document.createElement('canvas');cv.width=w;cv.height=h;const x=cv.getContext('2d');x.fillStyle=c;x.fillRect(0,0,w,h);x.fillStyle='#fff';x.font='40px sans-serif';x.fillText('KTP UJI',30,80);return cv.toDataURL('image/png').split(',')[1]},[w,h,c]);fs.writeFileSync(f,Buffer.from(d,'base64'))}
fs.writeFileSync('bukan.txt','halo');
const seed=async()=>{await p.evaluate(()=>{localStorage.clear();localStorage.setItem('temmoo_onboarded','1');localStorage.setItem('temmoo_promoter_app_v1',JSON.stringify({status:'approved',org:'Mootiara Surabaya'}));
localStorage.setItem('temmoo_promoter_v1',JSON.stringify({organization:'Mootiara Surabaya',activeEventId:'a',events:[{id:'a',name:'Jazz',date:'5 Desember 2026',dateShort:'5 DES',venue:'x',capacity:900,status:'draft',announcements:[]}],team:{selfId:'owner',activity:[],transfer:{to:'d',keepAs:'admin',at:Date.now(),expiresAt:Date.now()+6e8},members:[{id:'owner',name:'iwang',email:'iwang@gmail.com',role:'owner',access:'all',status:'active',joinedAt:Date.now()},{id:'d',name:'Dina Pratama',email:'dina@mootiara.id',role:'admin',access:'all',status:'active',joinedAt:Date.now()}]}}))});await p.reload();await p.waitForTimeout(300);await p.evaluate(()=>openFlow(72));await p.waitForTimeout(200)};
const W=ms=>p.waitForTimeout(ms||250),err=()=>p.$eval('.kyc-form .team-otp-error',x=>x.textContent),res=()=>p.$$eval('.kyc-results li',x=>x.map(l=>l.className+':'+l.textContent));
const submit=async()=>{await p.click('.kyc-form [type=submit]');await W(1700)};
await seed();await p.click('[data-transfer-accept]');await W();
console.log('langkah 1:',await p.$eval('.kyc-steps',x=>x.innerText.replace(/\s+/g,' ')),'| OTP belum muncul:',await p.locator('[data-otp-form]').count()===0);
await p.screenshot({path:'kyc-empty.png'});
await submit();console.log('kosong ->',await err());
await p.setInputFiles('[data-kyc-file="ktp"]','bukan.txt');await W(400);console.log('file teks ->',await err());
await p.setInputFiles('[data-kyc-file="ktp"]','ktp-small.png');await W(400);console.log('KTP kecil diunggah:',await p.$eval('.kyc-file small',x=>x.textContent));
await p.fill('.kyc-form [name=nik]','35780154080000');await p.fill('.kyc-form [name=fullName]','Dina Pratama');
await p.setInputFiles('[data-kyc-file="selfie"]','selfie.png');await W(400);console.log('isian tetap setelah unggah selfie:',await p.inputValue('.kyc-form [name=nik]'),await p.inputValue('.kyc-form [name=fullName]'));
await p.check('.kyc-form [name=consent]');await submit();console.log('NIK 14 digit + KTP kecil ->',await err(),'\n   ',await res());
// NIK tanggal salah
await p.fill('.kyc-form [name=nik]','3578013213000004');await p.setInputFiles('[data-kyc-file="ktp"]','ktp-big.png');await W(400);await submit();console.log('tanggal di NIK salah ->',await res());
// usia < 17
await p.fill('.kyc-form [name=nik]','3578011503150004');await submit();console.log('usia <17 ->',(await res()).filter(r=>r.startsWith('bad')));
// NIK huruf disaring
await p.fill('.kyc-form [name=nik]','35ab78');console.log('NIK disaring jadi:',await p.inputValue('.kyc-form [name=nik]'));
// nama beda -> warn tapi lolos
await p.fill('.kyc-form [name=nik]','3578015408000004');await p.fill('.kyc-form [name=fullName]','Andina Putri');await submit();
console.log('nama beda ->',await p.locator('[data-otp-form]').count()?'lanjut ke OTP':'masih KTP',await p.$eval('#toast',x=>x.textContent),'| header OTP:',await p.$eval('.team-accept header p',x=>x.textContent),'| stepper',await p.$eval('.kyc-steps',x=>x.innerText.replace(/\s+/g,' ')));
await p.screenshot({path:'kyc-otp.png'});
const c=(await p.$eval('.team-otp-demo',x=>x.textContent)).match(/\d{6}/)[0];await p.click('[data-otp-digit] >> nth=0');await p.keyboard.type(c);await W(400);
console.log('OTP benar ->',await p.evaluate(()=>promoterState.team.members.map(m=>m.name+':'+m.role).join(', ')),'| log:',await p.$eval('.team-activity li',x=>x.innerText.replace(/\s+/g,' ').slice(0,140)));
console.log('foto tidak tersimpan:',await p.evaluate(()=>!localStorage.getItem('temmoo_promoter_v1').includes('data:image')));
// contoh + nama cocok, lalu batal di tengah
await seed();await p.click('[data-transfer-accept]');await W();await p.click('[data-kyc-sample]');await W();console.log('isi contoh:',await p.inputValue('.kyc-form [name=nik]'),'/',await p.inputValue('.kyc-form [name=fullName]'));
await p.setInputFiles('[data-kyc-file="ktp"]','ktp-big.png');await p.setInputFiles('[data-kyc-file="selfie"]','selfie.png');await W(500);await p.check('.kyc-form [name=consent]');
await p.click('.kyc-form [type=submit]');await W(200);console.log('sedang memeriksa:',await p.$eval('.kyc-form [type=submit]',x=>x.textContent+(x.disabled?' (nonaktif)':'')));await p.screenshot({path:'kyc-checking.png'});
await W(1600);console.log('nama cocok ->',await p.$eval('#toast',x=>x.textContent));
await p.click('[data-otp-back]');await W();console.log('Kembali dari OTP ->',await p.locator('.kyc-form').count()?'KTP':'banner');await p.click('[data-transfer-accept]');await W();console.log('Terima lagi ->',await p.locator('[data-otp-form]').count()?'langsung OTP':'KTP ulang');await p.click('[data-otp-back]');await W();await p.evaluate(()=>{delete promoterState.team.transfer.kyc;promoterState.team.members.forEach(m=>delete m.kyc);savePromoter()});
// Kembali dari KTP & batalkan
await p.click('[data-transfer-accept]');await W();await p.click('[data-kyc-back]');await W();console.log('Kembali dari KTP ->',await p.locator('.team-transfer-pending').count()?'banner':'?');
await p.click('[data-transfer-accept]');await W();await p.evaluate(()=>{promoterState.team.transfer=null;savePromoter();openFlow(72,false)});await W();console.log('dibatalkan saat KTP -> form hilang:',await p.locator('.kyc-form').count()===0);
await p.setViewportSize({width:390,height:844});await seed();await p.click('[data-transfer-accept]');await W();console.log('HP geser horizontal:',(await p.evaluate(()=>{const m=document.querySelector('.promoter-main');return m.scrollWidth-m.clientWidth}))>0?'ya':'tidak');
console.log('errors',errs);await b.close()})();
