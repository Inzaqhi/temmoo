const {chromium,APP,INDEX}=require('../helpers');
(async()=>{const b=await chromium.launch();const p=await b.newPage({viewport:{width:1440,height:1000}});const errs=[];p.on('pageerror',e=>errs.push(e.message));
await p.route(/^https?:/,r=>r.abort());await p.goto(APP+'');
// data format LAMA (satu event + pengumuman global), seperti di browser pengguna
await p.evaluate(()=>{localStorage.clear();localStorage.setItem('temmoo_onboarded','1');localStorage.setItem('temmoo_promoter_app_v1',JSON.stringify({status:'approved',org:'Mootiara Surabaya'}));localStorage.setItem('temmoo_promoter_v1',JSON.stringify({organization:'Mootiara Surabaya',verified:true,announcements:[{text:'Gate dibuka 09.00',at:Date.now()}],event:{name:'Surabaya Creative Week',category:'Seni & Budaya',date:'18 Oktober 2026',dateShort:'18 OKT',time:'10.00',venue:'Balai Pemuda, Surabaya',description:'x',ticketUrl:'https://x.id',capacity:1500,status:'published',publishedIndex:null}}))});
await p.reload();await p.waitForTimeout(400);
const W=ms=>p.waitForTimeout(ms||300);const main=()=>p.evaluate(()=>document.querySelector('.promoter-main h1')?.textContent+' | '+document.querySelector('#flowTitle').textContent+' ['+flowCurrent+']');
console.log('migrasi:',await p.evaluate(()=>JSON.stringify({n:promoterState.events.length,first:promoterState.events[0].name,ann:promoterState.events[0].announcements?.length,ptr:promoterState.event.name,stored:Object.keys(JSON.parse(localStorage.getItem('temmoo_promoter_v1')))})));
await p.click('[data-promoter-nav]');await W();console.log('Studio ->',await main());
console.log('  baris:',await p.$$eval('.pe-row',x=>x.map(r=>r.innerText.replace(/\s+/g,' ').slice(0,90))));await p.screenshot({path:'pe-1.png'});
// buat event baru
await p.click('.pe-new');await W();console.log('Buat baru ->',await main(),'| nama kosong:',await p.inputValue('[data-promoter-event-form] [name=name]')==='');
const fill=async(o)=>{for(const[k,v]of Object.entries(o))await p.fill(`[data-promoter-event-form] [name=${k}]`,v)};
await fill({name:'Jazz di Taman',date:'2026-12-05',time:'19:00',venue:'Taman Bungkul, Surabaya',description:'Konser jazz sore di taman kota.'});
await p.click('[data-promoter-event-form] button[value=submit]');await W();console.log('Ajukan ->',await main());
await p.click('[data-event-sim="publish"]');await W();console.log('Terbitkan ->',await p.evaluate(()=>promoterState.event.name+' '+promoterState.event.status));
// event ketiga: draft saja
await p.click('[data-pe-new]');await W();await fill({name:'Lari Pagi Komunitas'});await p.click('[data-promoter-event-form] button[value=draft]');await W();console.log('Simpan draft ->',await main());
await p.evaluate(()=>openFlow(64));await W();
console.log('Ringkasan KPI:',await p.$$eval('.ins-kpis article',x=>x.map(a=>a.querySelector('span').textContent+'='+a.querySelector('b').textContent)));
console.log('  tab:',await p.$$eval('.pe-tabs button',x=>x.map(b=>b.textContent.trim())));
console.log('  urutan:',await p.$$eval('.pe-row .pe-main b',x=>x.map(b=>b.textContent)));await p.screenshot({path:'pe-2.png'});
await p.click('[data-pe-filter="active"]');await W();console.log('  filter Aktif:',await p.$$eval('.pe-row .pe-main b',x=>x.map(b=>b.textContent)));
await p.click('[data-pe-filter="all"]');await W();
// buka dashboard event, pindah lewat switcher
await p.click('.pe-row:has-text("Surabaya Creative Week") [data-pe-open]');await W();console.log('Buka SCW ->',await main(),'| KPI2:',await p.$eval('.ins-kpis article:nth-child(2) span',x=>x.textContent),'| pengumuman lama:',await p.$$eval('.ins-announce li',x=>x.length));
await p.selectOption('[data-pe-select]',{label:await p.$eval('[data-pe-select] option:nth-child(2)',o=>o.textContent)});await W();console.log('Switcher ->',await p.evaluate(()=>promoterState.event.name),await main());
// hapus draft
await p.evaluate(()=>openFlow(64));await W();await p.click('[data-pe-delete]');await W();console.log('Hapus 1x:',await p.$eval('[data-pe-delete]',x=>x.textContent));await p.click('[data-pe-delete]');await W();console.log('Hapus 2x, jumlah event:',await p.evaluate(()=>promoterState.events.length));
// katalog
await p.evaluate(()=>{closeFlow();show('events')});await W();console.log('Katalog memuat:',await p.evaluate(()=>['Surabaya Creative Week','Jazz di Taman','Lari Pagi Komunitas'].map(n=>n+'='+document.querySelector('#events').textContent.includes(n))));
// admin: dua event menunggu
await p.evaluate(()=>{const a=promoterState.events.find(e=>e.name==='Jazz di Taman');a.status='submitted';const c={...a,id:'x9',name:'Pasar Kreatif',status:'submitted',publishedIndex:null};promoterState.events.push(c);savePromoter();accountState.accountType='temmoo_official';openFlow(61)});await W();
console.log('Admin antrean:',await p.$$eval('.admin-panel .admin-list-row b',x=>x.map(b=>b.textContent)),'| menunggu',await p.$eval('.admin-stats article b',x=>x.textContent));
await p.click('.admin-list-row:has-text("Pasar Kreatif") [data-admin-review-event]');await W();console.log('Periksa Pasar Kreatif ->',await p.evaluate(()=>promoterState.event.name+' / '+promoterState.event.status));
await p.click('[data-admin-publish-event]');await W();console.log('Terbit ->',await p.evaluate(()=>promoterState.events.map(e=>e.name+':'+e.status).join(', ')));
// reload: data tetap
await p.reload();await W(400);console.log('Setelah reload:',await p.evaluate(()=>promoterState.events.map(e=>e.name+':'+e.status).join(', ')),'| pointer',await p.evaluate(()=>promoterState.event.name));
await p.setViewportSize({width:390,height:844});await p.evaluate(()=>{accountState.accountType='user';openFlow(64)});await W();console.log('HP geser horizontal:',(await p.evaluate(()=>{const m=document.querySelector('.promoter-main');return m.scrollWidth-m.clientWidth}))>0?'ya':'tidak');await p.screenshot({path:'pe-mobile.png'});
console.log('errors',errs);await b.close()})();
