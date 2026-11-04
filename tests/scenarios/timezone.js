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
console.log('errors',errs);await b.close()})();
