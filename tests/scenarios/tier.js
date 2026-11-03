const {chromium,APP,INDEX}=require('../helpers');
(async()=>{const b=await chromium.launch();const p=await b.newPage({viewport:{width:1440,height:1500}});const errs=[];p.on('pageerror',e=>errs.push(e.message));
await p.route(/^https?:/,r=>r.abort());await p.goto(APP+'');
const W=ms=>p.waitForTimeout(ms||250),toast=()=>p.$eval('#toast',x=>x.textContent),title=()=>p.evaluate(()=>document.querySelector('#flowTitle').textContent);
const fresh=async()=>{await p.evaluate(()=>{localStorage.clear();localStorage.setItem('temmoo_onboarded','1')});await p.reload();await W(300)};
const fillApp=async()=>{await p.fill('[name=org]','Ruang Kolektif');await p.fill('[name=email]','halo@rk.id');await p.fill('[name=phone]','081234567890');await p.fill('[name=experience]','Pasar Seni 2025');await p.check('[name=agree]')};
const passKyc=async()=>{await p.click('[data-kyc-sample]');await W(100);await p.setInputFiles('[data-kyc-file="ktp"]','ktp-big.png');await W(300);await p.setInputFiles('[data-kyc-file="selfie"]','selfie.png');await W(300);await p.check('.kyc-form [name=consent]');await p.click('.kyc-form [type=submit]');await W(1700)};
// 1. Dasar
await fresh();await p.evaluate(()=>openFlow(69));await W();console.log('1 default tingkat:',await p.$eval('[name=tier]:checked',x=>x.value),'| blok identitas tersembunyi:',await p.$eval('.pro-only-full',x=>getComputedStyle(x).display));
await p.screenshot({path:'tier-form.png'});
await fillApp();await p.click('[data-promoter-apply] button[type=submit]');await W();console.log('  tanpa tautan ->',await toast());
await p.fill('[name=link]','@ruangkolektif');await p.click('[data-promoter-apply] button[type=submit]');await W();console.log('  kirim ->',await title(),'|',await p.$eval('.pro-summary',x=>x.innerText.replace(/\s+/g,' ').slice(0,60)));
await p.click('[data-promoter-sim="approved"]');await W();await p.evaluate(()=>openFlow(64));await W();
console.log('  studio badge:',await p.$eval('.promoter-main header small',x=>x.textContent),'| kartu peningkatan:',await p.$eval('.tier-card b',x=>x.textContent));
await p.screenshot({path:'tier-upgrade.png'});
await p.evaluate(()=>{selectPromoterEvent(promoterState.events[0].id);openFlow(65)});await W();console.log('  tiket dikunci:',await p.$eval('[name=ticketUrl]',x=>x.disabled+' '+x.placeholder));
await p.evaluate(()=>{const e=promoterState.event;e.status='published';e.date='14 November 2026';savePromoter();syncPublishedEvent();openFlow(71)});await W();console.log('  aksi album diganti:',await p.locator('[data-ins-action="album"]').count(),'/',await p.$eval('[data-tier-upgrade] b',x=>x.textContent).catch(()=>'-'));
// transfer org Dasar: tanpa KTP
await p.evaluate(()=>{const t=promoterState.team;t.members.push({id:'d',name:'Dina Pratama',email:'dina@x.id',role:'admin',access:'all',status:'active',joinedAt:Date.now()});t.transfer={to:'d',keepAs:'admin',at:Date.now(),expiresAt:Date.now()+6e8};savePromoter();openFlow(72)});await W();
console.log('  transfer Dasar banner:',await p.$eval('.team-transfer-pending span',x=>x.textContent.slice(60,140)));await p.click('[data-transfer-accept]');await W();console.log('  terima ->',await p.locator('.kyc-form').count()?'KTP':'langsung OTP','|',await p.$eval('.team-accept header p',x=>x.textContent));
await p.click('[data-otp-back]');await W();await p.evaluate(()=>{promoterState.team.transfer=null;savePromoter()});
// 3. Upgrade
await p.evaluate(()=>openFlow(64));await W();console.log('3 tombol ajukan nonaktif:',await p.$eval('[data-upgrade-submit]',x=>x.disabled));
await p.click('.tier-card [data-id-verify]');await W();console.log('  ->',await title());await passKyc();console.log('  setelah KTP ->',await title(),'| checklist:',await p.$$eval('.tier-checks li',x=>x.map(l=>l.className+':'+l.innerText.replace(/\s+/g,' '))));
await p.click('[data-upgrade-submit]');await W();console.log('  ajukan ->',await p.$eval('.tier-card b',x=>x.textContent));await p.click('[data-upgrade-sim="approve"]');await W();
console.log('  disetujui -> badge',await p.$eval('.promoter-main header small',x=>x.textContent),'| kartu hilang:',await p.locator('.tier-card').count()===0);
await p.evaluate(()=>openFlow(65));await W();console.log('  tiket terbuka:',await p.$eval('[name=ticketUrl]',x=>!x.disabled));
// transfer org Penuh: Dina belum terverifikasi -> KTP; kedua kali -> lewati
await p.evaluate(()=>{promoterState.team.transfer={to:'d',keepAs:'admin',at:Date.now(),expiresAt:Date.now()+6e8};savePromoter();openFlow(72)});await W();
await p.click('[data-transfer-accept]');await W();console.log('  transfer Penuh ->',await p.locator('.kyc-form').count()?'KTP':'OTP');await passKyc();console.log('  setelah KTP ->',await p.locator('[data-otp-form]').count()?'OTP':'?');
await p.click('[data-otp-back]');await W();await p.evaluate(()=>{promoterState.team.transfer={to:'d',keepAs:'admin',at:Date.now(),expiresAt:Date.now()+6e8};savePromoter();openFlow(72)});await W();
await p.click('[data-transfer-accept]');await W();console.log('  permintaan baru ke Dina (sudah terverifikasi) ->',await p.locator('.kyc-form').count()?'KTP':'langsung OTP','|',await p.$eval('.team-accept header p',x=>x.textContent.slice(0,90)));
// 4. Penuh dari awal, tanpa identitas
await fresh();await p.evaluate(()=>openFlow(69));await W();await p.check('[name=tier][value=full]');await fillApp();await p.selectOption('[name=type]','Perusahaan / EO');
await p.click('[data-promoter-apply] button[type=submit]');await W();console.log('4 Penuh tanpa identitas ->',await toast());
await p.click('[data-id-verify]');await W();console.log('  ->',await title());await passKyc();console.log('  kembali ke',await title(),'| isian tetap:',await p.inputValue('[name=org]'),await p.$eval('[name=tier]:checked',x=>x.value),'| identitas:',await p.$eval('.pro-id b',x=>x.textContent));
await p.check('[name=agree]');await p.click('[data-promoter-apply] button[type=submit]');await W();console.log('  EO tanpa legalitas ->',await toast());
await p.setInputFiles('[name=legal]','ktp-big.png');await p.click('[data-promoter-apply] button[type=submit]');await W();console.log('  kirim ->',await p.$eval('.pro-summary',x=>x.innerText.replace(/\s+/g,' ').slice(0,70)));
await p.evaluate(()=>openFlow(56));await W();console.log('  Pusat Akun:',await p.$$eval('.account-center section h3',x=>x.map(h=>h.textContent)),'|',await p.$eval('.account-center [data-go="73"]',x=>x.innerText.replace(/\s+/g,' ')));
await p.evaluate(()=>openFlow(73));await W();console.log('  layar 73:',await p.$eval('.pro-status h2',x=>x.textContent));
// 5. data lama
await p.evaluate(()=>{localStorage.clear();localStorage.setItem('temmoo_onboarded','1');localStorage.setItem('temmoo_promoter_app_v1',JSON.stringify({status:'approved',org:'Lama',ktp:'ktp.jpg'}))});await p.reload();await W(300);console.log('5 data lama -> tingkat',await p.evaluate(()=>window.promoterApp.get().tier));
await p.setViewportSize({width:390,height:844});await p.evaluate(()=>openFlow(69));await W();console.log('HP geser horizontal:',(await p.evaluate(()=>document.documentElement.scrollWidth-innerWidth))>0?'ya':'tidak');
console.log('errors',errs);await b.close()})();
