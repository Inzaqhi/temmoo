// Bahasa: semua layar dalam English (pengguna, promotor, admin) — teks antarmuka yang belum ada di kamus dicetak supaya
// terlihat di diff; teks hukum tampil dua bahasa dengan urutan sesuai bahasa; pindah bahasa dari Pusat Akun.
const {chromium,APP}=require('../helpers');
(async()=>{const b=await chromium.launch();const p=await b.newPage({viewport:{width:1440,height:1000}});
const errs=[];p.on('pageerror',e=>errs.push(e.message));p.on('console',m=>{if(m.type()==='error'&&!/ERR_FAILED|net::/.test(m.text()))errs.push(m.text())});
await p.route(/^https?:/,r=>r.abort());
const W=ms=>p.waitForTimeout(ms||150);
const PROMOTER={temmoo_promoter_app_v1:JSON.stringify({status:'approved',org:'Ruang Kolektif',tier:'full',type:'Komunitas',email:'halo@rk.id',link:'https://instagram.com/rk'}),
  temmoo_promoter_v1:JSON.stringify({organization:'Ruang Kolektif',activeEventId:'a',events:[{id:'a',name:'Malam Puisi',category:'Seni & Budaya',date:'18 Oktober 2026',dateShort:'18 OKT',time:'19.00',venue:'Balai Pemuda, Surabaya',ticketUrl:'',capacity:400,status:'published',announcements:[]},{id:'b',name:'Workshop Zine',category:'Komunitas',date:'12 Desember 2026',dateShort:'12 DES',venue:'Balai Pemuda, Surabaya',capacity:60,status:'draft',announcements:[]}]})};
const boot=async(lang,extra={})=>{await p.goto(APP);await p.evaluate(([lang,extra])=>{localStorage.clear();localStorage.setItem('temmoo_onboarded','1');localStorage.setItem('temmoo_lang_v1',lang);for(const [k,v] of Object.entries(extra))localStorage.setItem(k,v)},[lang,extra]);await p.reload();await W(300);};
const visit=async screens=>{for(const v of ['home','events','circle','chat','profile']){await p.evaluate(v=>{closeFlow();show(v)},v);await W()}
  for(const n of screens){await p.evaluate(n=>{try{activeEvent=3;openFlow(n)}catch(e){}},n);await W()}};

// 1. Pengguna
await boot('en');
console.log('1 html lang:',await p.evaluate(()=>document.documentElement.lang),'| menu:',await p.$$eval('.sidebar nav>*:not([hidden])',x=>x.map(e=>e.textContent.trim().replace(/\d+$/,''))));
console.log('  kartu event:',await p.evaluate(()=>{show('events');return document.querySelector('#eventsList .catalog-card .event-info').innerText.replace(/\n+/g,' | ')}));
// Pencarian kategori/minat dalam English (data tetap berbahasa Indonesia)
const catalog=async q=>{await p.evaluate(()=>{closeFlow();show('events')});await p.fill('#eventSearch',q);await W();return p.$$eval('#eventsList .catalog-card h4',x=>x.map(h=>h.textContent))};
for(const q of ['music','food','arts','musik'])console.log(`  cari katalog "${q}":`,await catalog(q));
await p.fill('#eventSearch','');
const global=async q=>{await p.evaluate(q=>{closeFlow();openSearch(q)},q);await W(250);return p.evaluate(()=>[...document.querySelectorAll('.search-section')].map(s=>s.querySelector('h3')?.textContent+': '+[...s.querySelectorAll('.search-row b, .search-row strong, [data-open-profile] b')].map(b=>b.textContent).join(', ')).join(' || '))};
for(const q of ['music','photography','concerts'])console.log(`  cari global "${q}":`,await global(q));
console.log('  saran pencarian:',await p.evaluate(()=>{closeFlow();openSearch('');return [...document.querySelectorAll('[data-search-term]')].map(b=>b.textContent)}));
await p.evaluate(()=>{activeEvent=1;openFlow(46)});await W();console.log('  Ruang Event Hindia:',await p.evaluate(()=>document.querySelector('.event-hub').innerText.replace(/\n+/g,' | ').slice(0,260)));
await p.evaluate(()=>{activeEvent=0;openFlow(46)});await W();console.log('  Ruang Event Coffee (selesai):',await p.evaluate(()=>document.querySelector('.event-hub').innerText.replace(/\n+/g,' | ').slice(0,200)));
await p.evaluate(()=>openFlow(44));await W();console.log('  Riwayat:',await p.evaluate(()=>document.querySelector('.history-summary').innerText.replace(/\n+/g,' ')));
await p.evaluate(()=>{activeEvent=8;openFlow(59)});await p.click('[data-paid-photo="3"] [data-select-photo]');await p.click('[data-buy-event-photos]');await W();
console.log('  checkout:',await p.evaluate(()=>document.querySelector('.app-dialog.checkout').innerText.replace(/\n+/g,' | ')));
console.log('  teks hukum (bahasa aktif di atas):',await p.evaluate(()=>[...document.querySelectorAll('.app-dialog .legal-text>span')].map(s=>s.lang+(getComputedStyle(s).order==='-1'?'↑':'')+': '+s.textContent)));
await p.keyboard.press('Escape');
await visit([1,2,3,4,5,6,7,8,9,11,13,14,18,19,20,21,22,24,25,26,27,28,29,32,33,35,36,37,38,40,41,44,45,46,47,48,49,50,51,52,53,54,55,56,59,63,69,70,73,74]);
await p.evaluate(()=>openFlow(3));await W();console.log('  daftar akun, teks hukum:',await p.$$eval('.legal-text',x=>x.map(l=>l.innerText.replace(/\n+/g,' / '))));

// 2. Promotor
await boot('en',PROMOTER);
await visit([64,65,66,67,71,72,73,74,76]);
await p.evaluate(()=>openFlow(64));await W();console.log('2 Studio:',await p.evaluate(()=>document.querySelector('.promoter-main').innerText.replace(/\n+/g,' | ').slice(0,300)));
await p.evaluate(()=>{activeEvent=3;openFlow(20)});await W();await p.click('[data-claim-start]');await W();console.log('  klaim, teks hukum:',await p.$$eval('.legal-text',x=>x.map(l=>l.innerText.replace(/\n+/g,' / '))));

// 3. Admin
await p.evaluate(()=>{accountState.accountType='temmoo_official';accountState.role='super_admin'});
await visit([57,58,59,60,61,62,68,75]);
await p.evaluate(()=>openFlow(75));await W();console.log('3 Admin kalender:',await p.evaluate(()=>document.querySelector('.admin-main header').innerText.replace(/\n+/g,' | ')),'|',await p.$$eval('.admin-stats article span',x=>x.map(s=>s.textContent)));

// 4. Teks antarmuka yang belum diterjemahkan (konten contoh: postingan, chat, nama, tempat, event — tidak dihitung)
const left=await p.evaluate(()=>{
  const content=[...posts.flatMap(x=>[x[0],x[5],x[6]]),...chats.flatMap(c=>[c[0],c[3]]),...events.flatMap(e=>[e[0],e[2]]),...circles.flatMap(c=>[c[0],c[4]]),...Object.values(publicProfiles).flatMap(x=>[x.name,x.bio]),
    'Ruang Kolektif','Mootiara Surabaya','OMD Event','Youth Lab Surabaya','iwang','Temmoo','Malam Puisi','Workshop Zine','Surabaya','Jakarta','Bandung','Malang','Sidoarjo','Gresik','Jakarta Selatan'].filter(Boolean).map(String);
  const isContent=t=>content.some(c=>c===t||c.includes(t)||t.includes(c))||/^[@#↺]|@\w|https?:|\.(png|jpe?g)$|^TMO-|^[A-Z0-9 .·,]+$/.test(t);
  return window.i18nMissing().map(([t])=>t).filter(t=>!isContent(t)).sort();
});
console.log('4 belum diterjemahkan:',left.length,left);

const switchLang=async l=>{const old=await p.evaluate(()=>window.__page=Math.random());await p.click(`[data-lang-set="${l}"]`);await p.waitForFunction(o=>window.__page!==o&&document.readyState==='complete',old,{timeout:5000});await W(300)};
// 5. Pindah bahasa dari Pusat Akun; teks hukum ikut urutan bahasa
await p.evaluate(()=>openFlow(56));await W();console.log('5 Pusat Akun:',await p.evaluate(()=>document.querySelector('.lang-setting').innerText.replace(/\n+/g,' | ')));
await switchLang('id');
console.log('  setelah pilih Bahasa Indonesia:',await p.evaluate(()=>[document.documentElement.lang,localStorage.getItem('temmoo_lang_v1')]),'| menu:',await p.$$eval('.sidebar nav>*:not([hidden])',x=>x.slice(0,6).map(e=>e.textContent.trim().replace(/\d+$/,''))));
await p.evaluate(()=>openFlow(3));await W();console.log('  teks hukum (id):',await p.evaluate(()=>[...document.querySelector('.legal-text').children].map(s=>s.lang+(getComputedStyle(s).order==='-1'?'↑':''))));
await p.evaluate(()=>openFlow(56));await W();await switchLang('en');console.log('  kembali ke English:',await p.evaluate(()=>document.documentElement.lang),'|',await p.$eval('.sidebar nav .nav',x=>x.textContent.trim()));

console.log('errors',errs);await b.close()})();
