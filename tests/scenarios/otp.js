const {chromium,APP,INDEX}=require('../helpers');
(async()=>{const b=await chromium.launch();const ctx=await b.newContext({viewport:{width:1440,height:1400},permissions:['clipboard-read','clipboard-write']});const p=await ctx.newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));
await p.route(/^https?:/,r=>r.abort());await p.goto(APP+'');
const seed=async()=>{await p.evaluate(()=>{localStorage.clear();localStorage.setItem('temmoo_onboarded','1');localStorage.setItem('temmoo_promoter_app_v1',JSON.stringify({status:'approved',org:'Mootiara Surabaya'}));
localStorage.setItem('temmoo_promoter_v1',JSON.stringify({organization:'Mootiara Surabaya',activeEventId:'a',events:[{id:'a',name:'Jazz di Taman',date:'5 Desember 2026',dateShort:'5 DES',venue:'Taman Bungkul',capacity:900,status:'published',announcements:[]}],team:{selfId:'owner',activity:[],members:[{id:'owner',name:'iwang',email:'iwang@gmail.com',role:'owner',access:'all',status:'active',joinedAt:Date.now()},{id:'d',name:'Dina Pratama',email:'dina@mootiara.id',role:'admin',access:'all',status:'active',joinedAt:Date.now()}]}}))});await p.reload();await p.waitForTimeout(300);await p.evaluate(()=>openFlow(72));await p.waitForTimeout(200)};
const W=ms=>p.waitForTimeout(ms||200),toast=()=>p.$eval('#toast',x=>x.textContent),err=()=>p.$eval('[data-otp-error]',x=>x.textContent),code=()=>p.$eval('.team-otp-demo b',x=>x.textContent);
const toOtp=async()=>{await p.click('[data-transfer-toggle]');await W();await p.fill('[data-transfer-form] [name=confirm]','Mootiara Surabaya');await p.check('[data-transfer-form] [name=agree]');await p.click('[data-transfer-form] .danger-solid');await W(300)};
await seed();await toOtp();
console.log('langkah OTP:',await p.$eval('.team-otp>p',x=>x.textContent),'| fokus kotak 1:',await p.evaluate(()=>document.activeElement.matches('[data-otp-digit]')),'| belum ada permintaan:',await p.evaluate(()=>!promoterState.team.transfer));
console.log('kirim ulang:',await p.$eval('[data-otp-resend]',x=>x.textContent+(x.disabled?' (nonaktif)':'')),'| kedaluwarsa dalam',await p.$eval('[data-otp-expire]',x=>x.textContent));
await p.screenshot({path:'otp-step.png'});
// ketik salah -> auto submit
const real=await code();const wrong=real==='111111'?'222222':'111111';
await p.click('[data-otp-digit] >> nth=0');await p.keyboard.type(wrong);await W();console.log('salah ->',await err(),'| kotak dikosongkan:',await p.$$eval('[data-otp-digit]',x=>x.every(i=>!i.value)));
// backspace pindah ke kotak sebelumnya
await p.keyboard.type('12');await p.keyboard.press('Backspace');await p.keyboard.press('Backspace');console.log('backspace ->',await p.$$eval('[data-otp-digit]',x=>x.map(i=>i.value).join('|')),'| fokus kotak ke',await p.evaluate(()=>[...document.querySelectorAll('[data-otp-digit]')].indexOf(document.activeElement)+1));
// ganti saluran
await p.click('[data-otp-channel]',{force:true});await W();console.log('ganti saluran saat jeda ->',await toast().catch(()=>'-'),'| tombol nonaktif:',await p.$eval('[data-otp-channel]',x=>x.disabled));await p.evaluate(()=>{const n=Date.now;Date.now=()=>n()+61e3});await W(600);await p.click('[data-otp-channel]');await W();console.log('ganti saluran ->',await p.$eval('.team-otp>p',x=>x.textContent),'| kode baru beda:',(await code())!==real);
// kedaluwarsa
const c2=await code();await p.evaluate(()=>{});await p.evaluate(()=>{});
await p.evaluate(()=>{const now=Date.now;Date.now=()=>now()+6*60e3});await W(700);console.log('setelah 6 menit: label',await p.$eval('[data-otp-expire]',x=>x.textContent),'| kirim ulang aktif:',await p.$eval('[data-otp-resend]',x=>!x.disabled));
await p.click('[data-otp-digit] >> nth=0');await p.keyboard.type(c2);await W();console.log('kode lama setelah kedaluwarsa ->',await err());
await p.click('[data-otp-resend]');await W();const c3=await code();console.log('kirim ulang ->',await toast(),'| tombol:',await p.$eval('[data-otp-resend]',x=>x.textContent));
// tempel kode benar
await p.evaluate(c=>navigator.clipboard.writeText(c),c3);await p.click('[data-otp-digit] >> nth=0');await p.keyboard.press('Control+V');await W(400);
console.log('tempel kode benar ->',await toast(),'| permintaan dibuat:',await p.evaluate(()=>!!promoterState.team.transfer),'| log:',await p.$eval('.team-activity li',x=>x.innerText.replace(/\s+/g,' ').slice(0,80)));
// 5x salah
await p.evaluate(()=>{Date.now=Date.now});await seed();await toOtp();
for(let i=0;i<5;i++){await p.click('[data-otp-digit] >> nth=0').catch(()=>{});const r=await code().catch(()=>null);if(!r)break;await p.keyboard.type(r==='999999'?'888888':'999999');await W()}
console.log('5x salah ->',await toast(),'| kembali ke awal:',await p.locator('[data-otp-form]').count()===0,'| permintaan:',await p.evaluate(()=>!!promoterState.team.transfer),'| log:',await p.$eval('.team-activity li',x=>x.innerText.replace(/\s+/g,' ').slice(0,80)));
// kembali
await seed();await toOtp();await p.click('[data-otp-back]');await W();console.log('Kembali ->',await p.locator('[data-transfer-form]').count()?'form pemindahan':'kartu',await p.evaluate(()=>!promoterState.team.transfer));
// HP
await p.setViewportSize({width:390,height:844});await toOtp().catch(()=>{});await W();console.log('HP geser horizontal:',(await p.evaluate(()=>{const m=document.querySelector('.promoter-main');return m.scrollWidth-m.clientWidth}))>0?'ya':'tidak');
console.log('errors',errs);await b.close()})();
