// Kalender kurasi & klaim halaman event: tanda di halaman event, syarat promotor, form klaim, keputusan admin,
// event masuk Promotor Studio tanpa duplikat (status kehadiran tetap), event kurasi baru dari Admin Console.
const {chromium,APP}=require('../helpers');
(async()=>{const b=await chromium.launch();const p=await b.newPage({viewport:{width:1440,height:1000}});
const errs=[];p.on('pageerror',e=>errs.push(e.message));p.on('console',m=>{if(m.type()==='error'&&!/ERR_FAILED|net::/.test(m.text()))errs.push(m.text())});
await p.route(/^https?:/,r=>r.abort());
const W=ms=>p.waitForTimeout(ms||200),toast=()=>p.$eval('#toast',x=>x.textContent);
const text=sel=>p.evaluate(s=>document.querySelector(s)?.innerText.replace(/\n+/g,' | ')||'(tidak ada)',sel);
const openEvent=async(name,n=20)=>{await p.evaluate(([name,n])=>{activeEvent=events.findIndex(e=>e[0]===name);openFlow(n)},[name,n]);await W()};
const PROMOTER={temmoo_onboarded:'1',temmoo_promoter_app_v1:JSON.stringify({status:'approved',org:'Ruang Kolektif',tier:'full',type:'Komunitas',email:'halo@ruangkolektif.id',link:'https://instagram.com/ruangkolektif'}),
  temmoo_promoter_v1:JSON.stringify({organization:'Ruang Kolektif',activeEventId:'a',events:[{id:'a',name:'Malam Puisi',category:'Seni & Budaya',date:'12 Desember 2026',dateShort:'12 DES',venue:'Balai Pemuda, Surabaya',ticketUrl:'',capacity:400,status:'draft',announcements:[]}]})};
const fresh=async(storage={temmoo_onboarded:'1'})=>{await p.goto(APP);await p.evaluate(s=>{localStorage.clear();for(const [k,v] of Object.entries(s))localStorage.setItem(k,v)},storage);await p.reload();await W(300)};

// 1. Pengguna biasa
await fresh();
await openEvent('Surabaya Food Market');console.log('1 banner kurasi:',await text('.claim-banner'));
await p.click('[data-claim-start]');await W();console.log('  klik Klaim (bukan promotor):',await text('.pro-locked h2'),'| tombol:',await text('.pro-locked .pro-btn'));
await openEvent('Youth Creative Festival');console.log('  banner diklaim pihak lain:',await text('.claim-banner'));
await openEvent('Surabaya Food Market',18);console.log('  banner di tab Posts:',await p.locator('.claim-banner').count(),'| Ruang Event:',await openEvent('Surabaya Food Market',46).then(()=>p.locator('.claim-banner').count()));

// 2. Promotor terverifikasi mengajukan klaim
await fresh(PROMOTER);
await p.evaluate(()=>openFlow(64));await W();console.log('2 kartu klaim di Studio:',await text('.claim-entry'));
await p.click('.claim-entry');await W();console.log('  pemilih event:',await p.$$eval('.claim-list article b',x=>x.map(b=>b.textContent.trim())));
await p.fill('[data-claim-query]','food');await W();console.log('  cari "food":',await p.$$eval('.claim-list article b',x=>x.map(b=>b.textContent.trim())));
await p.click('.claim-list [data-claim-start]');await W();
console.log('  form:',await text('.claim-event'),'| tautan terisi:',await p.$eval('[name=link]',x=>x.value),'| email:',await p.$eval('[name=email]',x=>x.value));
await p.fill('[name=link]','bukan tautan');await p.check('[name=agree]');await p.click('[data-claim-form] [type=submit]');await W();console.log('  tautan salah -> valid:',await p.$eval('[name=link]',x=>x.validity.valid),'| masih form:',await p.locator('[data-claim-form]').count(),'| klaim tersimpan:',await p.evaluate(()=>Object.keys(JSON.parse(localStorage.getItem('temmoo_claims_v1')||'{}')).length));
await p.fill('[name=link]','https://instagram.com/ruangkolektif/p/foodmarket');await p.setInputFiles('[name=doc]','ktp-small.png');await p.click('[data-claim-form] [type=submit]');await W();
console.log('  kirim ->',await toast(),'|',await text('.pro-status h2'),'|',await text('.pro-summary'));
await openEvent('Surabaya Food Market');console.log('  banner saat ditinjau:',await text('.claim-banner'));

// 3. Disetujui: event masuk Studio, tanpa duplikat, status kehadiran tetap
await p.click('[data-claim-start]');await W();await p.click('[data-claim-sim="approve"]');await W(300);
console.log('3 setujui ->',await toast(),'|',await text('.pro-status h2'));
const after=async()=>p.evaluate(()=>{const i=events.findIndex(e=>e[0]==='Surabaya Food Market');activeEvent=i;return {jumlah:events.filter(e=>e[0]==='Surabaya Food Market').length,id:eventId(i),harga:eventMeta[i].price+' · '+eventMeta[i].amount,kehadiran:currentAttendance().status,studio:promoterState.events.filter(e=>e.claimedFrom).map(e=>e.name+' · '+e.status+' · '+e.date)}});
console.log('  data:',await after());
await openEvent('Surabaya Food Market');console.log('  banner resmi:',await text('.claim-banner'));
await p.evaluate(()=>openFlow(64));await W();console.log('  daftar Studio:',await p.$$eval('.pe-row .pe-main>b',x=>x.map(b=>b.textContent)));
await p.click('[data-pe-open] >> nth=0').catch(()=>{});
await p.reload();await W(300);console.log('  setelah reload:',await after());
await p.evaluate(()=>show('events'));console.log('  kartu katalog:',await p.$$eval('#eventsList .catalog-card h4',x=>x.filter(h=>h.textContent==='Surabaya Food Market').length));
await openEvent('Surabaya Food Market');await p.click('[data-claim-manage]');await W(300);console.log('  Kelola di Studio ->',await p.evaluate(()=>[flowCurrent,promoterState.event.name]));

// 4. Admin Temmoo: tolak klaim, tambah event kurasi
await openEvent('Pasar Seni Surabaya');await p.click('[data-claim-start]');await W();await p.check('[name=agree]');await p.click('[data-claim-form] [type=submit]');await W();
await p.evaluate(()=>{accountState.accountType='temmoo_official';accountState.role='content_admin';openFlow(75)});await W();
console.log('4 admin statistik:',await p.$$eval('.admin-stats article',x=>x.map(a=>a.innerText.replace(/\n/g,'='))));
console.log('  klaim menunggu:',await p.$$eval('.claim-admin:first-of-type .admin-list-row b',x=>x.map(b=>b.textContent)));
await p.click('[data-claim-admin="reject"]');await W();console.log('  pilihan alasan:',await p.$$eval('[data-claim-reject-reason]',x=>x.length));
await p.click('[data-claim-reject-reason] >> nth=0');await W();console.log('  tolak ->',await toast(),'| menunggu:',await p.$$eval('.claim-admin:first-of-type .admin-list-row',x=>x.length));
await p.fill('[data-curate-form] [name=name]','Festival Rujak Uleg 2027');await p.fill('[data-curate-form] [name=date]','2027-03-14');await p.fill('[data-curate-form] [name=venue]','Jalan Kembang Jepun');await p.fill('[data-curate-form] [name=source]','Kalender Disbudpar Surabaya');
await p.click('[data-curate-form] [type=submit]');await W();console.log('  tambah kurasi ->',await toast());
console.log('  status di daftar:',await p.$$eval('.claim-admin:last-of-type .admin-list-row',x=>x.map(r=>r.querySelector('b').textContent.trim()+' = '+r.querySelector('.claim-state').textContent)));
await p.evaluate(()=>{accountState.accountType='user'});
await openEvent('Pasar Seni Surabaya');console.log('  promotor lihat Pasar Seni:',await text('.claim-banner'));await p.click('[data-claim-start]');await W();console.log('  catatan penolakan:',await text('.pro-note'));
await openEvent('Festival Rujak Uleg 2027');console.log('  event kurasi baru:',await text('.claim-banner'),'||',await text('.info-card p'));

// 5. Event kurasi baru diklaim lalu reload: tetap satu, ID kurasi
await p.click('[data-claim-start]');await W();await p.check('[name=agree]');await p.click('[data-claim-form] [type=submit]');await W();await p.click('[data-claim-sim="approve"]');await W(300);
await p.reload();await W(300);
console.log('5 setelah klaim & reload:',await p.evaluate(()=>{const xs=events.map((e,i)=>[e[0],i]).filter(([n])=>n==='Festival Rujak Uleg 2027');return {jumlah:xs.length,id:eventId(xs[0][1]),harga:eventMeta[xs[0][1]].price,studio:promoterState.events.filter(e=>e.claimedFrom).map(e=>e.name)}}));
await p.evaluate(()=>show('events'));console.log('  di katalog:',await p.$$eval('#eventsList .catalog-card h4',x=>x.filter(h=>h.textContent==='Festival Rujak Uleg 2027').length));

// 6. Anggota tim tanpa izin membuat event tidak bisa mengklaim
await p.evaluate(()=>{const t=promoterState.team;t.members.push({id:'m-ed',name:'Raka Editor',email:'raka@rk.id',role:'editor',access:'all',status:'active'});savePromoter()});
await p.reload();await W(300);await p.evaluate(()=>{const b=document.createElement('button');b.dataset.teamAct='m-ed';document.body.append(b);b.click()});await W();
await openEvent('Sunday Run Community');await p.click('[data-claim-start]');await W();console.log('6 sebagai',await p.evaluate(()=>window.promoterTeam.me().role),'->',await text('.pro-locked h2'));

await p.setViewportSize({width:390,height:844});await openEvent('Hindia Live 2026');console.log('HP geser horizontal:',(await p.evaluate(()=>document.documentElement.scrollWidth-innerWidth))>0?'ya':'tidak');await p.screenshot({path:'claim-mobile.png'});
console.log('errors',errs);await b.close()})();
