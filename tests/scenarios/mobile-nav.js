// Menu Promotor Studio & Admin Console di HP: bilah bawah 4 tombol tetap, semua terlihat utuh (tidak perlu digeser).
// Studio: Ringkasan, Buat event, Tim, Akun (Pratinjau publik pindah ke kepala halaman). Admin: 3 menu + Lainnya (lembar bawah). Di desktop menu samping tetap lengkap dengan urutan aslinya.
const {chromium,APP}=require('../helpers');
(async()=>{const b=await chromium.launch();const p=await b.newPage({viewport:{width:390,height:844},isMobile:true,hasTouch:true});
const errs=[];p.on('pageerror',e=>errs.push(e.message));p.on('console',m=>{if(m.type()==='error'&&!/ERR_FAILED|net::/.test(m.text()))errs.push(m.text())});
await p.route(/^https?:/,r=>r.abort());
const W=ms=>p.waitForTimeout(ms||200);
await p.goto(APP);await p.evaluate(()=>{localStorage.clear();localStorage.setItem('temmoo_onboarded','1');localStorage.setItem('temmoo_promoter_app_v1',JSON.stringify({status:'approved',org:'Ruang Kolektif',tier:'full',type:'Komunitas'}));
  localStorage.setItem('temmoo_promoter_v1',JSON.stringify({organization:'Ruang Kolektif',activeEventId:'a',events:[{id:'a',name:'Malam Puisi',category:'Seni & Budaya',date:'12 Desember 2026',dateShort:'12 DES',venue:'Balai Pemuda, Surabaya',ticketUrl:'',capacity:400,status:'published',announcements:[]}]}))});
await p.reload();await W(300);
// Tombol yang tampil di bilah bawah: label, aktif, dan apakah utuh di dalam layar
const bar=sel=>p.evaluate(sel=>{const nav=document.querySelector(sel),r=nav.getBoundingClientRect();
  return {tombol:[...nav.querySelectorAll(':scope>button')].filter(x=>x.offsetParent).map(x=>{const q=x.getBoundingClientRect();return x.innerText.trim()+(x.classList.contains('active')?'*':'')+(q.left>=0&&q.right<=innerWidth&&q.height>=44?'':' [terpotong]')}),
    'di bawah layar':Math.abs(r.bottom-innerHeight)<2,'bisa digeser':nav.scrollWidth>nav.clientWidth+1}},sel);
const sheet=()=>p.$$eval('.nav-sheet [data-sheet-item]',x=>x.map(b=>b.textContent+(b.classList.contains('active')?'*':'')));

// 1. Promotor Studio
for(const n of [64,71,72]){await p.evaluate(n=>openFlow(n),n);await W();console.log(`1 Studio layar ${n}:`,await bar('.promoter-nav'))}
console.log('  tanpa tombol Lainnya:',!(await p.$('.promoter-nav [data-nav-more]')));
await p.evaluate(()=>openFlow(71));await W();console.log('  layar 71, tombol di kepala halaman:',await p.$$eval('.promoter-main .nav-inpage button',x=>x.map(b=>b.textContent)));
await p.click('.promoter-main .nav-inpage [data-promoter-preview]');await W();console.log('  ketuk Pratinjau publik ->',await p.evaluate(()=>[flowCurrent,events[activeEvent]?.[0]]));
await p.evaluate(()=>openFlow(64));await W();await p.click('.promoter-nav [data-go="56"]');await W();console.log('  ketuk Akun ->',await p.$eval('#flowTitle',x=>x.textContent));
await p.evaluate(()=>openFlow(64));await W();await p.click('.promoter-nav [data-go="72"]');await W();console.log('  ketuk Tim ->',(await bar('.promoter-nav')).tombol);

// 2. Admin Console
await p.evaluate(()=>{accountState.accountType='temmoo_official';accountState.role='super_admin';openFlow(57)});await W();
console.log('2 Admin:',await bar('.admin-nav'));
await p.click('.admin-nav [data-go="75"]');await W();console.log('  ketuk Kalender ->',await p.$eval('.admin-main h1',x=>x.textContent),'|',(await bar('.admin-nav')).tombol);
await p.click('[data-nav-more]');await W();console.log('  Lainnya:',await sheet());
await p.click('.nav-sheet [data-sheet-item] >> text=Audit log');await W();console.log('  Audit log ->',await p.$eval('.admin-main h1',x=>x.textContent),'|',(await bar('.admin-nav')).tombol,'| nama tombol Lainnya:',await p.$eval('[data-nav-more]',x=>x.getAttribute('aria-label')));
await p.click('[data-nav-more]');await W();console.log('  Lainnya (halaman aktif ditandai):',await sheet());
await p.keyboard.press('Escape');await W();console.log('  Esc menutup lembar:',!(await p.$('.nav-sheet')),'| fokus kembali ke:',await p.evaluate(()=>document.activeElement.matches('[data-nav-more]')));

// 3. Desktop: menu samping lengkap, urutan asli, tanpa ikon/label pendek/Lainnya
await p.setViewportSize({width:1280,height:800});await W();
console.log('3 desktop Admin:',await p.$$eval('.admin-nav>button',x=>x.filter(b=>b.offsetParent).map(b=>b.innerText.trim())),'| ikon tampil:',await p.$$eval('.admin-nav svg',x=>x.filter(s=>s.getBoundingClientRect().width).length));
await p.evaluate(()=>{accountState.accountType='user';accountState.role='user';openFlow(71)});await W();
console.log('  desktop Studio:',await p.$$eval('.promoter-nav>button',x=>x.filter(b=>b.offsetParent).map(b=>b.innerText.trim())));

// 4. English
await p.setViewportSize({width:390,height:844});await p.evaluate(()=>localStorage.setItem('temmoo_lang_v1','en'));await p.reload();await W(300);
await p.evaluate(()=>openFlow(71));await W();console.log('4 English Studio:',(await bar('.promoter-nav')).tombol);
await p.evaluate(()=>{accountState.accountType='temmoo_official';accountState.role='super_admin';openFlow(62)});await W();console.log('  English Admin:',(await bar('.admin-nav')).tombol);
await p.click('[data-nav-more]');await W();console.log('  More:',await p.$eval('.nav-sheet',x=>x.innerText.replace(/\n+/g,' | ')));

console.log('errors',errs);await b.close()})();
