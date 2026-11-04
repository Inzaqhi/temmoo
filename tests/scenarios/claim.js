// Kalender kurasi & penyerahan halaman: promotor meminta lewat WhatsApp, Tim Temmoo memverifikasi lalu menyerahkan,
// menolak, atau mencabut dari Admin Console. Event yang diserahkan masuk Promotor Studio tanpa duplikat (status kehadiran tetap).
const {chromium,APP}=require('../helpers');
(async()=>{const b=await chromium.launch();const ctx=await b.newContext({viewport:{width:1440,height:1000}});const p=await ctx.newPage();
const errs=[];p.on('pageerror',e=>errs.push(e.message));p.on('console',m=>{if(m.type()==='error'&&!/ERR_FAILED|net::/.test(m.text()))errs.push(m.text())});
await ctx.route(/^https?:/,r=>r.abort());
const W=ms=>p.waitForTimeout(ms||200),toast=()=>p.$eval('#toast',x=>x.textContent);
const text=sel=>p.evaluate(s=>document.querySelector(s)?.innerText.replace(/\n+/g,' | ')||'(tidak ada)',sel);
const openEvent=async(name,n=20)=>{await p.evaluate(([name,n])=>{activeEvent=events.findIndex(e=>e[0]===name);openFlow(n)},[name,n]);await W()};
const admin=async()=>{await p.evaluate(()=>{accountState.accountType='temmoo_official';accountState.role='content_admin';openFlow(75)});await W()};
const asUser=()=>p.evaluate(()=>{accountState.accountType='user'});
const row=name=>p.locator('.claim-admin .admin-list-row',{has:p.locator('b',{hasText:name})});
const PROMOTER={temmoo_onboarded:'1',temmoo_promoter_app_v1:JSON.stringify({status:'approved',org:'Ruang Kolektif',tier:'full',type:'Komunitas',email:'halo@ruangkolektif.id'}),
  temmoo_promoter_v1:JSON.stringify({organization:'Ruang Kolektif',activeEventId:'a',events:[{id:'a',name:'Malam Puisi',category:'Seni & Budaya',date:'12 Desember 2026',dateShort:'12 DES',venue:'Balai Pemuda, Surabaya',ticketUrl:'',capacity:400,status:'draft',announcements:[]}]})};
const fresh=async(storage={temmoo_onboarded:'1'})=>{await p.goto(APP);await p.evaluate(s=>{localStorage.clear();for(const [k,v] of Object.entries(s))localStorage.setItem(k,v)},storage);await p.reload();await W(300)};

// 1. Pengguna biasa
await fresh();
await openEvent('Surabaya Food Market');console.log('1 banner kurasi:',await text('.claim-banner'));
await p.click('[data-claim-start]');await W();console.log('  "Ini event-mu?" (bukan promotor):',await text('.pro-locked h2'),'| tombol:',await text('.pro-locked .pro-btn'));
await openEvent('Youth Creative Festival');console.log('  banner dikelola pihak lain:',await text('.claim-banner'));
console.log('  form klaim mandiri sudah tidak ada:',await p.evaluate(()=>!document.querySelector('[data-claim-form]')));

// 2. Promotor meminta lewat WhatsApp
await fresh(PROMOTER);
await p.evaluate(()=>openFlow(64));await W();console.log('2 kartu di Studio:',await text('.claim-entry'));
await p.click('.claim-entry');await W();await p.fill('[data-claim-query]','food');await W();console.log('  cari "food":',await p.$$eval('.claim-list article b',x=>x.map(b=>b.textContent.trim())));
await p.click('.claim-list [data-claim-start]');await W();
console.log('  layar permintaan:',await text('.claim-request h2'),'|',await p.$$eval('.claim-request .pro-steps b',x=>x.map(b=>b.textContent)));
console.log('  tautan WhatsApp:',await p.$eval('[data-claim-request]',a=>decodeURIComponent(a.href)),'| target:',await p.$eval('[data-claim-request]',a=>a.target));
console.log('  teks hukum:',await p.$$eval('.claim-request .legal-text>span',x=>x.map(s=>s.lang)));
const [popup]=await Promise.all([ctx.waitForEvent('page'),p.click('[data-claim-request]')]);await popup.close();await W();
console.log('  setelah klik ->',await toast(),'|',await text('.pro-status h2'));
console.log('  tersimpan:',await p.evaluate(()=>{const c=JSON.parse(localStorage.getItem('temmoo_claims_v1'))['surabaya-food-market'];return [c.status,c.org]}));
await openEvent('Surabaya Food Market');console.log('  banner saat diverifikasi:',await text('.claim-banner'));

// 3. Tim Temmoo menyerahkan halaman
await admin();
console.log('3 admin statistik:',await p.$$eval('.admin-stats article',x=>x.map(a=>a.innerText.replace(/\n/g,'='))));
console.log('  permintaan:',await p.$$eval('.claim-admin:first-of-type .admin-list-row b',x=>x.map(b=>b.textContent)));
await row('Surabaya Food Market').first().locator('[data-claim-admin="assign"]').click();await W();
console.log('  form serahkan:',await p.$$eval('.claim-assign label',x=>x.map(l=>l.innerText.split('\n')[0])),'| organisasi terisi:',await p.$eval('.claim-assign [name=org]',x=>x.value));
await p.fill('.claim-assign [name=phone]','0812 3456 7890');await p.fill('.claim-assign [name=source]','bio Instagram @ruangkolektif');
await p.click('.claim-assign [type=submit]');await W();console.log('  tanpa centang verifikasi -> valid:',await p.$eval('.claim-assign [name=verified]',x=>x.validity.valid),'| form masih ada:',await p.locator('.claim-assign').count());
await p.check('.claim-assign [name=verified]');await p.click('.claim-assign [type=submit]');await W(300);console.log('  serahkan ->',await toast());
console.log('  daftar:',await row('Surabaya Food Market').first().innerText().then(t=>t.replace(/\n+/g,' | ')));
await asUser();
const after=()=>p.evaluate(()=>{const i=events.findIndex(e=>e[0]==='Surabaya Food Market');activeEvent=i;return {jumlah:events.filter(e=>e[0]==='Surabaya Food Market').length,id:eventId(i),harga:eventMeta[i].price,kehadiran:currentAttendance().status,studio:promoterState.events.filter(e=>e.claimedFrom).map(e=>e.name+' · '+e.status)}});
console.log('  data:',await after());
await openEvent('Surabaya Food Market');console.log('  banner resmi:',await text('.claim-banner'));
await p.evaluate(()=>openFlow(64));await W();console.log('  Studio:',await p.$$eval('.pe-row .pe-main>b',x=>x.map(b=>b.textContent)));
console.log('  notifikasi:',await p.evaluate(()=>{const n=JSON.parse(localStorage.getItem('temmoo_notif_extra_v1')||'[]')[0];return n&&n.who+' '+n.text}));
await p.reload();await W(300);console.log('  setelah reload:',await after());

// 4. Permintaan ditolak, bisa diminta lagi
await openEvent('Pasar Seni Surabaya');await p.click('[data-claim-start]');await W();
await Promise.all([ctx.waitForEvent('page').then(x=>x.close()),p.click('[data-claim-request]')]);await W();
await admin();await row('Pasar Seni Surabaya').first().locator('[data-claim-admin="decline"]').click();await W();
console.log('4 alasan penolakan:',await p.$$eval('[data-claim-decline-reason]',x=>x.map(b=>b.textContent)));
await p.click('[data-claim-decline-reason] >> nth=0');await W();console.log('  tolak ->',await toast());
await asUser();await openEvent('Pasar Seni Surabaya');await p.click('[data-claim-start]');await W();console.log('  promotor lihat:',await text('.claim-request .pro-note'),'| bisa minta lagi:',await p.locator('[data-claim-request]').count());

// 5. Serahkan langsung ke organisasi lain, lalu cabut
await admin();await row('Sunday Run Community').first().locator('[data-claim-admin="assign"]').click();await W();
await p.fill('.claim-assign [name=org]','Komunitas Lari SBY');await p.fill('.claim-assign [name=phone]','081299990000');await p.fill('.claim-assign [name=source]','website resmi');await p.check('.claim-assign [name=verified]');await p.click('.claim-assign [type=submit]');await W();
console.log('5 serahkan ke organisasi lain ->',await toast());
await asUser();await openEvent('Sunday Run Community');console.log('  banner:',await text('.claim-banner'));
await admin();await row('Surabaya Food Market').first().locator('[data-claim-admin="revoke"]').click();await W();
console.log('  alasan cabut:',await p.$$eval('[data-claim-revoke-reason]',x=>x.map(b=>b.textContent)));
await p.click('[data-claim-revoke-reason] >> nth=1');await W();console.log('  cabut Food Market ->',await toast());
await row('Youth Creative Festival').first().locator('[data-claim-admin="revoke"]').click();await W();await p.click('[data-claim-revoke-reason] >> nth=0');await W();
await p.evaluate(()=>openFlow(62));await W();console.log('  Audit log:',await p.$$eval('.admin-panel .admin-list-row b',x=>x.slice(0,5).map(b=>b.textContent)));
await asUser();
console.log('  setelah cabut:',await after());
await openEvent('Surabaya Food Market');console.log('  banner Food Market:',await text('.claim-banner'));
await p.reload();await W(300);await openEvent('Youth Creative Festival');console.log('  Youth Creative setelah reload:',await text('.claim-banner'));

// 6. Simulasi di layar status & tambah event kurasi
await openEvent('Hindia Live 2026');await p.click('[data-claim-start]');await W();await Promise.all([ctx.waitForEvent('page').then(x=>x.close()),p.click('[data-claim-request]')]);await W();
await p.click('[data-claim-sim="approve"]');await W(300);console.log('6 simulasi serahkan ->',await toast(),'|',await text('.pro-status h2'));
await admin();await p.fill('[data-curate-form] [name=name]','Festival Rujak Uleg 2027');await p.fill('[data-curate-form] [name=date]','2027-03-14');await p.fill('[data-curate-form] [name=venue]','Jalan Kembang Jepun');await p.fill('[data-curate-form] [name=source]','Kalender Disbudpar Surabaya');
await p.fill('[data-curate-form] [name=city]','Surabaya');await p.click('[data-curate-form] [type=submit]');await W();console.log('  tambah kurasi ->',await toast());
await asUser();await openEvent('Festival Rujak Uleg 2027');console.log('  event kurasi baru:',await text('.claim-banner'),'||',await text('.info-card p'));

// 7. Editor tidak bisa meminta
await p.evaluate(()=>{promoterState.team.members.push({id:'m-ed',name:'Raka Editor',email:'raka@rk.id',role:'editor',access:'all',status:'active'});savePromoter()});
await p.reload();await W(300);await p.evaluate(()=>{const b=document.createElement('button');b.dataset.teamAct='m-ed';document.body.append(b);b.click()});await W();
await openEvent('Nusantara Culture Week');await p.click('[data-claim-start]');await W();console.log('7 sebagai',await p.evaluate(()=>window.promoterTeam.me().role),'->',await text('.pro-locked h2'));

await p.setViewportSize({width:390,height:844});await openEvent('Indie Night Vol. 4');console.log('HP geser horizontal:',(await p.evaluate(()=>document.documentElement.scrollWidth-innerWidth))>0?'ya':'tidak');
console.log('errors',errs);await b.close()})();
