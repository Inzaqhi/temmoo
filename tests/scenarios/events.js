// Siklus event: label Selesai, sidebar Event mendatang, mode kenangan, status kehadiran per ID event,
// event promotor di katalog, dan data contoh (Hindia Live 2025 vs 2026). Tanggal dikunci di 3 Nov 2026.
const {chromium,APP}=require('../helpers');
(async()=>{const b=await chromium.launch();const p=await b.newPage({viewport:{width:1440,height:900}});
const errs=[];p.on('pageerror',e=>errs.push(e.message));p.on('console',m=>{if(m.type()==='error'&&!/ERR_FAILED|net::/.test(m.text()))errs.push(m.text())});
await p.route(/^https?:/,r=>r.abort());
const text=sel=>p.evaluate(s=>document.querySelector(s)?.innerText.replace(/\n+/g,' | ')||'(tidak ada)',sel);
const fresh=async(storage={})=>{await p.goto(APP);await p.evaluate(s=>{localStorage.clear();localStorage.setItem('temmoo_onboarded','1');for(const [k,v] of Object.entries(s))localStorage.setItem(k,v)},storage);await p.reload();await p.waitForTimeout(250)};
const open=async(name,n)=>{await p.evaluate(([name,n])=>{activeEvent=events.findIndex(e=>e[0]===name);openFlow(n)},[name,n]);await p.waitForTimeout(150)};

// 1. Data contoh
await fresh();
console.log('sidebar Event mendatang:',await p.$$eval('.normal-rail .mini.event-link b',x=>x.map(b=>b.textContent)));
await p.evaluate(()=>show('events'));
console.log('katalog:',await p.$$eval('#eventsList .catalog-card',x=>x.map(c=>c.querySelector('h4').textContent+(c.classList.contains('is-ended')?' [Selesai]':''))));
await p.evaluate(()=>render());console.log('katalog tetap terkategori setelah render():',await p.$$eval('#eventsList .catalog-card',x=>x.length));
await p.evaluate(()=>openFlow(13));console.log('kalender berlabel Selesai:',await p.$$eval('.history-item',x=>x.filter(i=>i.querySelector('.event-ended')).map(i=>i.querySelector('b').textContent)));
await p.evaluate(()=>openFlow(44));console.log('riwayat:',await p.$$eval('.history-card',x=>x.map(c=>(c.querySelector('h3')?.textContent)+' · '+c.querySelector('.history-status')?.textContent)));

// 2. Ruang Event per kondisi
await open('Hindia Live 2026',46);console.log('Hindia 2026 (akan datang):',await text('.event-status-strip'),'||',await text('.hub-countdown'));
await open('LaLaLa Fest 2026',46);console.log('LaLaLa (hadir):',await text('.event-status-strip'),'||',await text('.hub-countdown'));
await open('+62 Coffee R-I Fest 2026',46);console.log('Coffee (selesai, tidak hadir):',await text('.event-status-strip'),'||',await text('.hub-countdown'),'||',await text('.event-over'));
console.log('  tombol ajakan datang:',await p.$$eval('.event-hub [data-set-attendance],.event-hub [data-go="21"],.event-hub [data-go="26"]',x=>x.length),'| pengumuman:',await text('.hub-announcement p'));
for(const n of [21,22,26])await open('+62 Coffee R-I Fest 2026',n).then(async()=>console.log(`  layar ${n}:`,(await text('.flow-body')).slice(0,90)));
await open('+62 Coffee R-I Fest 2026',46);
await p.evaluate(()=>{const b=document.createElement('button');b.dataset.setAttendance='going';document.querySelector('.event-hub').append(b);b.click()});
console.log('  paksa ubah status ->',await p.$eval('#toast',x=>x.textContent),'| status:',await p.evaluate(()=>currentAttendance().status));
await open('Indie Night Vol. 4',20);console.log('Indie Night tahun di detail:',await text('.info-card p'));

// 3. Migrasi status dari format nomor urut (termasuk event promotor di nomor 9)
await fresh({temmoo_sample_hindia_v2:'1',temmoo_attendance_v1:JSON.stringify({0:{status:'going',reason:''},5:{status:'considering',reason:'Harga tiket'},9:{status:'going',reason:''}}),
  temmoo_promoter_app_v1:JSON.stringify({status:'approved',org:'Ruang Kolektif',tier:'full',type:'Komunitas'}),
  temmoo_promoter_v1:JSON.stringify({organization:'Ruang Kolektif',activeEventId:'a',events:[{id:'a',name:'Malam Puisi',category:'Seni & Budaya',date:'12 Des 2026',dateShort:'12 DES',venue:'Balai Pemuda, Surabaya',ticketUrl:'',capacity:400,status:'published',announcements:[]}]})});
console.log('status setelah migrasi:',await p.evaluate(()=>Object.keys(JSON.parse(localStorage.getItem('temmoo_attendance_v1'))).sort()));
await open('Malam Puisi',46);console.log('Malam Puisi (promotor) status:',await p.evaluate(()=>currentAttendance().status),'||',await text('.hub-countdown'));

// 4. Event promotor di katalog, label Selesai, dan ganti nama setelah terbit
await p.evaluate(()=>show('events'));
console.log('kartu Malam Puisi:',await p.$$eval('#eventsList .catalog-card',x=>x.filter(c=>c.querySelector('h4').textContent==='Malam Puisi').map(c=>c.querySelector('.event-info').innerText.replace(/\n+/g,' | '))));
const renamed=await p.evaluate(()=>{const before=promoterState.event.publishedIndex;promoterState.event={...promoterState.event,name:'Malam Puisi Kota'};syncPublishedEvent();renderCategorizedEvents();activeEvent=promoterState.event.publishedIndex;return {before,after:promoterState.event.publishedIndex,dobel:events.filter(e=>e[0].startsWith('Malam Puisi')).length,status:currentAttendance().status}});
console.log('ganti nama setelah terbit:',renamed);
const past=await p.evaluate(()=>{promoterState.event={...promoterState.event,date:'18 Oktober 2026',dateShort:'18 OKT'};syncPublishedEvent();return eventEnded(promoterState.event.publishedIndex)});
console.log('event promotor 18 Okt dianggap selesai:',past);

console.log('errors',errs);await b.close()})();
