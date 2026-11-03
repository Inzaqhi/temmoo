const {chromium,APP,INDEX}=require('../helpers');const fs=require('fs');
fs.writeFileSync('ktp.png',Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==','base64'));
(async()=>{const b=await chromium.launch();const p=await b.newPage({viewport:{width:1440,height:900}});const errs=[];p.on('pageerror',e=>errs.push(e.message));
await p.route(/^https?:/,r=>r.abort());await p.goto(APP+'');await p.evaluate(()=>{localStorage.clear();localStorage.setItem('temmoo_onboarded','1');sessionStorage.clear()});await p.goto(APP+'#/home');await p.waitForTimeout(300);
const W=ms=>p.waitForTimeout(ms||250);const title=()=>p.evaluate(()=>document.querySelector('#flowTitle').textContent);
console.log('menu Promotor terlihat (awal):',await p.locator('[data-promoter-nav]').isVisible());
await p.evaluate(()=>openFlow(64));await W();console.log('buka studio tanpa izin ->',await title(),'|',await p.$eval('#flowContent',x=>x.textContent.slice(0,60)));await p.screenshot({path:'pr-locked.png'});
await p.evaluate(()=>openFlow(56));await W();console.log('Pusat Akun bagian promotor:',await p.$eval('.account-center section:last-of-type',x=>x.textContent));await p.screenshot({path:'pr-account.png'});
await p.click('.account-center [data-go="69"]');await W();console.log('->',await title());await p.screenshot({path:'pr-apply.png',fullPage:false});
// kirim kosong
await p.click('[data-promoter-apply] button[type=submit]');await W();console.log('kirim kosong, masih di form:',await p.locator('[data-promoter-apply]').count());
await p.fill('[name=org]','Ruang Kolektif');await p.selectOption('[name=type]','Perusahaan / EO');await p.fill('[name=email]','halo@ruangkolektif.id');await p.fill('[name=phone]','0812 3456 7890');await p.fill('[name=experience]','Pasar Seni Surabaya 2025');
await p.fill('[name=link]','@ruangkolektif');await p.check('[name=agree]');await p.click('[data-promoter-apply] button[type=submit]');await W();
console.log('EO tingkat Dasar tanpa legalitas -> terkirim:',await p.locator('.pro-status').count()===1);
console.log('terkirim ->',await title(),'|',await p.$eval('.pro-status h2',x=>x.textContent));await p.screenshot({path:'pr-review.png'});
await p.evaluate(()=>openFlow(64));await W();console.log('studio saat ditinjau ->',await p.$eval('.pro-locked p',x=>x.textContent.slice(0,50)));
// admin melihat antrean
await p.evaluate(()=>{accountState.accountType='temmoo_official';openFlow(61)});await W();console.log('admin antrean:',await p.$$eval('.admin-list-row b',x=>x.map(b=>b.textContent)));await p.screenshot({path:'pr-admin.png'});
await p.click('[data-promoter-admin="changes"]');await W();await p.evaluate(()=>{accountState.accountType='user'});
await p.evaluate(()=>openFlow(70));await W();console.log('revisi ->',await p.$eval('.pro-status h2',x=>x.textContent),'| notif',await p.$eval('.nav [data-notif-count]',x=>x.textContent));
await p.click('.pro-actions [data-go="69"]');await W();console.log('form terisi ulang:',await p.inputValue('[name=org]'),'| catatan',await p.$eval('.pro-note',x=>x.textContent.slice(0,40)));
await p.click('[data-promoter-apply] button[type=submit]');await W();console.log('kirim ulang ->',await p.$eval('.pro-status h2',x=>x.textContent));
await p.click('[data-promoter-sim="approved"]');await W(400);console.log('disetujui ->',await p.$eval('.pro-status h2',x=>x.textContent),'| menu promotor terlihat',await p.locator('[data-promoter-nav]').isVisible());await p.screenshot({path:'pr-approved.png'});
await p.click('[data-promoter-nav]');await W(400);console.log('menu -> studio:',await p.evaluate(()=>!!document.querySelector('.promoter-shell')),await p.$eval('.promoter-main header',x=>x.textContent.slice(0,80)));await p.screenshot({path:'pr-studio.png'});
await p.evaluate(()=>{closeFlow();openFlow(11)});await W();console.log('notif teratas:',await p.$eval('.notif-item',x=>x.textContent.replace(/\s+/g,' ').slice(0,90)));
await p.reload();await W(400);await p.evaluate(()=>{closeFlow();show('profile')});await W();console.log('setelah reload: menu',await p.locator('[data-promoter-nav]').isVisible(),'| label profil',await p.$eval('#profile .profile h2',x=>x.textContent));
console.log('errors',errs);await b.close()})();
