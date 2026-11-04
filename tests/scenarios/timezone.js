// Jam event mengikuti zona waktu perangkat pengguna (tanpa label zona). Jam di data event adalah waktu setempat lokasi
// event (WIB). Dalam English jam tampil 12 jam "07:00 PM"; Bahasa Indonesia tetap "19.00". Bila tanggal bergeser, ada tanda hari.
const {chromium,APP}=require('../helpers');
(async()=>{const b=await chromium.launch();const errs=[];
const run=async(zone,lang)=>{const p=await b.newPage({viewport:{width:1280,height:900},timezoneId:zone});p.on('pageerror',e=>errs.push(e.message));await p.route(/^https?:/,r=>r.abort());
  await p.goto(APP);await p.evaluate(l=>{localStorage.clear();localStorage.setItem('temmoo_onboarded','1');localStorage.setItem('temmoo_lang_v1',l)},lang);await p.reload();await p.waitForTimeout(300);
  const at=async(name,n,sel)=>{await p.evaluate(([name,n])=>{activeEvent=events.findIndex(e=>e[0]===name);openFlow(n)},[name,n]);await p.waitForTimeout(150);return p.$eval(sel,x=>x.innerText.replace(/\n+/g,' '))};
  const out={detail:await at('Hindia Live 2026',20,'.info-card p'),hub:await at('Hindia Live 2026',46,'.hub-countdown small'),gerbang:await at('Hindia Live 2026',46,'.hub-announcement p'),pagi:await at('+62 Coffee R-I Fest 2026',20,'.info-card p')};
  await p.close();return out};
for(const [zone,lang] of [['Asia/Jakarta','id'],['Asia/Makassar','id'],['Asia/Jakarta','en'],['Asia/Tokyo','en'],['America/Los_Angeles','en'],['America/Los_Angeles','id']])console.log(zone,lang,await run(zone,lang));

// Jam lain dalam English: chat, log admin, placeholder; harga & tanggal tidak berubah
const p=await b.newPage({viewport:{width:1280,height:900}});await p.route(/^https?:/,r=>r.abort());
await p.goto(APP);await p.evaluate(()=>{localStorage.clear();localStorage.setItem('temmoo_onboarded','1');localStorage.setItem('temmoo_lang_v1','en')});await p.reload();await p.waitForTimeout(300);
console.log('format:',await p.evaluate(()=>['19.00','Gate dibuka pukul 09.00.','00.30','12.15','23.59','Rp15.000','4.85','10.000 orang','03.11.2026','12.50%','24.00'].map(s=>s+' → '+t(s))));
await p.evaluate(()=>{accountState.accountType='temmoo_official';accountState.role='super_admin';openFlow(62)});await p.waitForTimeout(200);
console.log('audit log:',await p.$$eval('.admin-main article span, .admin-main time, .admin-main small',x=>x.map(s=>s.textContent).filter(s=>/\d:\d/.test(s)).slice(0,3)));

// Formulir promotor: zona terisi dari lokasi (Bali -> WITA), bisa diubah manual dan tidak tertimpa lagi
await p.evaluate(()=>{localStorage.setItem('temmoo_lang_v1','id');localStorage.setItem('temmoo_promoter_app_v1',JSON.stringify({status:'approved',org:'Ruang Kolektif',tier:'full',type:'Komunitas'}));
  localStorage.setItem('temmoo_promoter_v1',JSON.stringify({organization:'Ruang Kolektif',activeEventId:'a',events:[{id:'a',name:'Malam Puisi',category:'Seni & Budaya',date:'12 Desember 2026',dateShort:'12 DES',time:'19.00',venue:'Balai Pemuda, Surabaya',description:'Malam puisi',ticketUrl:'',capacity:400,status:'draft',announcements:[]}]}))});
await p.reload();await p.waitForTimeout(300);await p.evaluate(()=>{accountState.accountType='user';accountState.role='user';openFlow(65)});await p.waitForTimeout(200);
const tz=()=>p.$eval('[data-promoter-event-form] [data-event-tz]',x=>x.value);
console.log('promotor: zona awal (Surabaya):',await tz(),'| pilihan:',await p.$$eval('[data-event-tz] option',x=>x.map(o=>o.value)));
await p.fill('[data-promoter-event-form] [name=venue]','Pantai Kuta, Bali');console.log('  lokasi Pantai Kuta, Bali ->',await tz());
await p.fill('[data-promoter-event-form] [name=venue]','Lapangan Karang, Jayapura');console.log('  lokasi Jayapura ->',await tz());
await p.fill('[data-promoter-event-form] [name=venue]','Pantai Kuta, Bali');await p.click('[data-promoter-event-form] [value=draft]');await p.waitForTimeout(200);
console.log('  disimpan:',await p.evaluate(()=>promoterState.event.tz));
const live=await p.evaluate(()=>{promoterState.event={...promoterState.event,status:'published'};savePromoter();syncPublishedEvent();const i=promoterState.event.publishedIndex;return [eventMeta[i].tz,eventTime(i)]});
console.log('  terbit, 19.00 WITA dilihat dari Jakarta:',live);
await p.evaluate(()=>{promoterState.event={...promoterState.event,status:'draft'};openFlow(65)});await p.waitForTimeout(200);console.log('  dibuka lagi:',await tz());
await p.selectOption('[data-promoter-event-form] [data-event-tz]','WIB');await p.fill('[data-promoter-event-form] [name=venue]','Hotel di Makassar');console.log('  pilih WIB manual lalu ubah lokasi ke Makassar ->',await tz());
// Formulir kurasi admin
await p.evaluate(()=>{accountState.accountType='temmoo_official';accountState.role='super_admin';openFlow(75)});await p.waitForTimeout(200);
await p.fill('[data-curate-form] [name=venue]','GOR Sudiang, Makassar');console.log('kurasi: venue Makassar ->',await p.$eval('[data-curate-form] [data-event-tz]',x=>x.value));
await p.fill('[data-curate-form] [name=name]','Festival Pantai Losari');await p.fill('[data-curate-form] [name=date]','2027-02-20');await p.fill('[data-curate-form] [name=time]','19.00');await p.fill('[data-curate-form] [name=source]','Dinas Pariwisata Makassar').catch(()=>{});
await p.click('[data-curate-form] [type=submit]');await p.waitForTimeout(200);
console.log('  tersimpan:',await p.evaluate(()=>{const i=events.findIndex(e=>e[0]==='Festival Pantai Losari');return i<0?'(tidak ada)':[eventMeta[i].tz,eventTime(i)]}));

console.log('errors',errs);await b.close()})();
