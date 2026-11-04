// Info promotor sampai ke peserta: deskripsi event & tautan tiket di halaman Detail dan layar "Beli tiket".
// Hanya tautan http(s) yang ditampilkan; event gratis dan event tanpa tautan mendapat pesan yang jelas.
const {chromium,APP}=require('../helpers');
(async()=>{const b=await chromium.launch();const ctx=await b.newContext({viewport:{width:1440,height:1000}});const p=await ctx.newPage();
const errs=[];p.on('pageerror',e=>errs.push(e.message));p.on('console',m=>{if(m.type()==='error'&&!/ERR_FAILED|net::/.test(m.text()))errs.push(m.text())});
await ctx.route(/^https?:/,r=>r.abort());
const W=ms=>p.waitForTimeout(ms||200);
const text=sel=>p.evaluate(s=>[...document.querySelectorAll(s)].map(x=>x.innerText.replace(/\n+/g,' | ')).join(' || ')||'(tidak ada)',sel);
const open=async(name,n)=>{await p.evaluate(([name,n])=>{activeEvent=events.findIndex(e=>e[0]===name);openFlow(n)},[name,n]);await W()};
const ev=(id,name,extra)=>({id,name,category:'Musik',date:'20 Desember 2026',dateShort:'20 DES',time:'19.00',venue:'Ciputra Hall, Surabaya',capacity:800,status:'published',announcements:[],...extra});
await p.goto(APP);
await p.evaluate(events=>{localStorage.clear();localStorage.setItem('temmoo_onboarded','1');
  localStorage.setItem('temmoo_promoter_app_v1',JSON.stringify({status:'approved',org:'Ruang Kolektif',tier:'full',type:'Komunitas'}));
  localStorage.setItem('temmoo_promoter_v1',JSON.stringify({organization:'Ruang Kolektif',activeEventId:'a',events}))},
  [ev('a','Jazz di Taman',{ticketUrl:'https://www.loket.com/event/jazz-di-taman',description:'Konser jazz sore di taman kota.\nBawa tikar sendiri, ada area kuliner.'}),
   ev('b','Malam Puisi Kolektif',{ticketUrl:'',description:'Pembacaan puisi terbuka.'}),
   ev('c','Konser Jahil',{ticketUrl:'javascript:alert(1)',description:''})]);
await p.reload();await W(300);

// 1. Event promotor berbayar dengan tautan & deskripsi
await open('Jazz di Taman',20);
console.log('1 Detail:',await text('.event-about'),'||',await text('.event-ticket'),'| tombol Beli tiket:',await p.locator('button[data-go="21"]').count());
await p.click('button[data-go="21"]');await W();
console.log('  layar tiket:',await text('.ticket-out h2, .ticket-out .helper, .ticket-url'));
console.log('  tautan:',await p.$eval('[data-ticket-out]',a=>[a.href,a.target,a.rel,a.textContent]));
console.log('  teks hukum:',await p.$$eval('.ticket-terms .legal-text>span',x=>x.map(s=>s.lang+': '+s.textContent)));
const [tab]=await Promise.all([ctx.waitForEvent('page'),p.click('[data-ticket-out]')]);console.log('  klik -> tab baru terbuka:',!!tab);await tab.close();

// 2. Event promotor gratis (tanpa tautan)
await open('Malam Puisi Kolektif',20);
console.log('2 Detail gratis:',await text('.event-ticket'),'| tombol Beli tiket:',await p.locator('button[data-go="21"]').count());
await open('Malam Puisi Kolektif',21);console.log('  layar tiket:',await text('.ticket-out h2'));

// 3. Tautan berbahaya tidak ditampilkan
await open('Konser Jahil',20);console.log('3 javascript: ->',await text('.event-ticket'));
await open('Konser Jahil',21);console.log('  layar tiket:',await text('.ticket-out h2'),'| ada tautan:',await p.locator('[data-ticket-out]').count());

// 4. Event contoh: deskripsi; berbayar tanpa tautan
await open('Hindia Live 2026',20);console.log('4 Hindia:',await text('.event-about'),'||',await text('.event-ticket'));
await open('Hindia Live 2026',21);console.log('  layar tiket:',await text('.ticket-out h2'));
await open('Surabaya Food Market',20);console.log('  Food Market:',await text('.event-ticket'),'| tombol Beli tiket:',await p.locator('button[data-go="21"]').count());

// 5. Event kurasi dari Admin Console dengan tautan & deskripsi
await p.evaluate(()=>{accountState.accountType='temmoo_official';accountState.role='content_admin';openFlow(75)});await W();
await p.fill('[data-curate-form] [name=name]','Festival Rujak Uleg 2027');await p.fill('[data-curate-form] [name=date]','2027-03-14');await p.fill('[data-curate-form] [name=venue]','Jalan Kembang Jepun');
await p.selectOption('[data-curate-form] [name=price]','Berbayar');await p.fill('[data-curate-form] [name=ticket]','https://tiket.example.id/rujak-uleg');
await p.fill('[data-curate-form] [name=description]','Parade rujak uleg dan pasar jajanan khas Surabaya.');await p.fill('[data-curate-form] [name=source]','Kalender Disbudpar Surabaya');
await p.fill('[data-curate-form] [name=city]','Surabaya');await p.click('[data-curate-form] [type=submit]');await W();await p.evaluate(()=>{accountState.accountType='user'});
await open('Festival Rujak Uleg 2027',20);console.log('5 kurasi:',await text('.event-about'),'||',await text('.event-ticket'));
await p.reload();await W(300);await open('Festival Rujak Uleg 2027',21);console.log('  setelah reload, tautan:',await p.$eval('[data-ticket-out]',a=>a.href));

// 6. Event yang sudah selesai tetap menutup penjualan tiket
await open('+62 Coffee R-I Fest 2026',21);console.log('6 Coffee (selesai):',await text('.flow-body h3'));

await p.setViewportSize({width:390,height:844});await open('Jazz di Taman',21);console.log('HP geser horizontal:',(await p.evaluate(()=>document.documentElement.scrollWidth-innerWidth))>0?'ya':'tidak');
console.log('errors',errs);await b.close()})();
