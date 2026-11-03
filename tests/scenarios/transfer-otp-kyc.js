const {chromium,APP,INDEX}=require('../helpers');
const passKyc=async(p)=>{if(!(await p.locator('.kyc-form').count()))return;await p.click('[data-kyc-sample]');await p.waitForTimeout(150);await p.setInputFiles('[data-kyc-file="ktp"]','ktp-big.png');await p.waitForTimeout(300);await p.setInputFiles('[data-kyc-file="selfie"]','selfie.png');await p.waitForTimeout(300);await p.check('.kyc-form [name=consent]');await p.click('.kyc-form [type=submit]');await p.waitForTimeout(1700)};
(async()=>{const b=await chromium.launch();const p=await b.newPage({viewport:{width:1440,height:1300}});const errs=[];p.on('pageerror',e=>errs.push(e.message));
await p.route(/^https?:/,r=>r.abort());await p.goto(APP+'');
const seed=async(members)=>{await p.evaluate(members=>{localStorage.clear();localStorage.setItem('temmoo_onboarded','1');localStorage.setItem('temmoo_promoter_app_v1',JSON.stringify({status:'approved',org:'Mootiara Surabaya'}));
localStorage.setItem('temmoo_promoter_v1',JSON.stringify({organization:'Mootiara Surabaya',verified:true,activeEventId:'a',events:[{id:'a',name:'Jazz di Taman',date:'5 Desember 2026',dateShort:'5 DES',venue:'Taman Bungkul, Surabaya',capacity:900,status:'published',announcements:[]}],team:{selfId:'owner',activity:[],members:[{id:'owner',name:'iwang',email:'iwang@gmail.com',role:'owner',access:'all',status:'active',joinedAt:Date.now()-9e8},...members]}}))},members);await p.reload();await p.waitForTimeout(300);await p.evaluate(()=>openFlow(72));await p.waitForTimeout(250)};
const W=ms=>p.waitForTimeout(ms||250),toast=()=>p.$eval('#toast',x=>x.textContent),roles=()=>p.evaluate(()=>promoterState.team.members.map(m=>m.name+':'+m.role).join(', '));
const dina={id:'d',name:'Dina Pratama',email:'dina@mootiara.id',role:'admin',access:'all',status:'active',joinedAt:Date.now()-4e8};
// A. tanpa Admin aktif
await seed([{...dina,role:'editor'}]);await p.click('[data-transfer-toggle]');await W();console.log('A tanpa admin:',await p.$eval('.team-transfer-empty b',x=>x.textContent));
// B. validasi & kirim, batalkan
await seed([dina]);await p.click('[data-transfer-toggle]');await W();console.log('B pilihan pemilik baru:',await p.$$eval('[data-transfer-form] [name=to]',x=>x.length));
await p.fill('[data-transfer-form] [name=confirm]','mootiara');await p.check('[data-transfer-form] [name=agree]');await p.click('[data-transfer-form] .danger-solid');await W();if(await p.locator('[data-otp-form]').count()){const c=await p.$eval('.team-otp-demo b',x=>x.textContent);await p.click('[data-otp-digit] >> nth=0');await p.keyboard.type(c);await W(300)}console.log('  konfirmasi salah ->',await toast());
await p.fill('[data-transfer-form] [name=confirm]','Mootiara Surabaya');await p.click('[data-transfer-form] .danger-solid');await W();if(await p.locator('[data-otp-form]').count()){const c=await p.$eval('.team-otp-demo b',x=>x.textContent);await p.click('[data-otp-digit] >> nth=0');await p.keyboard.type(c);await W(300)}
console.log('  terkirim ->',await p.$eval('.team-transfer-pending b',x=>x.textContent),'| baris Dina:',await p.$eval('.team-row:nth-child(2) small',x=>x.textContent),'| kartu pindah disembunyikan:',await p.locator('[data-transfer-toggle]').count()===0);
await p.screenshot({path:'tr-pending.png'});
await p.click('[data-transfer-cancel]');await W();console.log('  batalkan ->',await toast(),'| pending:',await p.locator('.team-transfer-pending').count());
// C. ditolak
await p.click('[data-transfer-toggle]');await W();await p.fill('[data-transfer-form] [name=confirm]','Mootiara Surabaya');await p.check('[data-transfer-form] [name=agree]');await p.click('[data-transfer-form] .danger-solid');await W();if(await p.locator('[data-otp-form]').count()){const c=await p.$eval('.team-otp-demo b',x=>x.textContent);await p.click('[data-otp-digit] >> nth=0');await p.keyboard.type(c);await W(300)}
await p.click('[data-transfer-sim="decline"]');await W();console.log('C ditolak ->',await toast(),'|',await roles());
// D. calon pemilik turun peran saat menunggu
await p.click('[data-transfer-toggle]');await W();await p.fill('[data-transfer-form] [name=confirm]','Mootiara Surabaya');await p.check('[data-transfer-form] [name=agree]');await p.click('[data-transfer-form] .danger-solid');await W();if(await p.locator('[data-otp-form]').count()){const c=await p.$eval('.team-otp-demo b',x=>x.textContent);await p.click('[data-otp-digit] >> nth=0');await p.keyboard.type(c);await W(300)}
await p.selectOption('[data-team-role="d"]','editor');await W();console.log('D turun ke editor -> pending batal:',await p.evaluate(()=>promoterState.team.transfer===null||promoterState.team.transfer===undefined));
// E. diterima, tetap Admin
await seed([dina]);await p.click('[data-transfer-toggle]');await W();await p.fill('[data-transfer-form] [name=confirm]','Mootiara Surabaya');await p.check('[data-transfer-form] [name=agree]');await p.click('[data-transfer-form] .danger-solid');await W();if(await p.locator('[data-otp-form]').count()){const c=await p.$eval('.team-otp-demo b',x=>x.textContent);await p.click('[data-otp-digit] >> nth=0');await p.keyboard.type(c);await W(300)}
await p.click('[data-transfer-accept]');await W();await passKyc(p);{const c=(await p.$eval('.team-otp-demo',x=>x.textContent)).match(/\d{6}/)[0];await p.click('[data-otp-digit] >> nth=0');await p.keyboard.type(c);await W(300)}console.log('E diterima (tetap Admin) ->',await toast(),'|',await roles());
console.log('  iwang sekarang:',await p.evaluate(()=>window.promoterTeam.me().role),'| bisa kelola tim:',await p.evaluate(()=>window.promoterTeam.can('team')),'| kartu pindah (bukan pemilik):',await p.locator('.team-danger').count(),'| Lihat sebagai:',await p.locator('[data-team-act]').count());
console.log('  baris Dina bisa diubah iwang?',await p.locator('[data-team-role="d"]').count(),'| aktivitas:',await p.$eval('.team-activity li',x=>x.innerText.replace(/\s+/g,' ').slice(0,90)));
await p.screenshot({path:'tr-done.png'});
await p.reload();await W(300);console.log('  setelah reload:',await roles(),'| me',await p.evaluate(()=>window.promoterTeam.me().role));
// F. diterima, keluar dari tim
await seed([dina]);await p.click('[data-transfer-toggle]');await W();await p.check('[data-transfer-form] [name=keepAs][value=leave]');await p.fill('[data-transfer-form] [name=confirm]','Mootiara Surabaya');await p.check('[data-transfer-form] [name=agree]');await p.click('[data-transfer-form] .danger-solid');await W();if(await p.locator('[data-otp-form]').count()){const c=await p.$eval('.team-otp-demo b',x=>x.textContent);await p.click('[data-otp-digit] >> nth=0');await p.keyboard.type(c);await W(300)}
await p.click('[data-transfer-accept]');await W();await passKyc(p);{const c=(await p.$eval('.team-otp-demo',x=>x.textContent)).match(/\d{6}/)[0];await p.click('[data-otp-digit] >> nth=0');await p.keyboard.type(c);await W(400)}console.log('F keluar ->',await toast(),'|',await roles());
console.log('  halaman:',await p.$eval('#flowContent h2',x=>x.textContent),'| menu Promotor Studio terlihat:',await p.locator('[data-promoter-nav]').isVisible());
await p.evaluate(()=>openFlow(65));await W();console.log('  paksa buka Kelola event ->',await p.$eval('#flowContent h2',x=>x.textContent));
await p.screenshot({path:'tr-left.png'});
await p.click('[data-transfer-restore]');await W();console.log('  pulihkan ->',await roles(),'| menu',await p.locator('[data-promoter-nav]').isVisible());
console.log('errors',errs);await b.close()})();
