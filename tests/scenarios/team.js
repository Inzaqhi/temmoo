const {chromium,APP,INDEX}=require('../helpers');
(async()=>{const b=await chromium.launch();const p=await b.newPage({viewport:{width:1440,height:1100}});const errs=[];p.on('pageerror',e=>errs.push(e.message));
await p.route(/^https?:/,r=>r.abort());await p.goto(APP+'');
await p.evaluate(()=>{localStorage.clear();localStorage.setItem('temmoo_onboarded','1');localStorage.setItem('temmoo_promoter_app_v1',JSON.stringify({status:'approved',org:'Mootiara Surabaya'}));const ev=(id,name,date,ds,status)=>({id,name,category:'Musik',date,dateShort:ds,time:'19.00',venue:'Balai Pemuda, Surabaya',description:'x',ticketUrl:'https://x.id',capacity:1200,status,submittedAt:'',reviewNote:'',publishedIndex:null,announcements:[]});
localStorage.setItem('temmoo_promoter_v1',JSON.stringify({organization:'Mootiara Surabaya',verified:true,activeEventId:'a',events:[ev('a','Surabaya Creative Week','18 Oktober 2026','18 OKT','published'),ev('b','Jazz di Taman','5 Desember 2026','5 DES','published'),ev('c','Lari Pagi Komunitas','','','draft')]}))});
await p.reload();await p.waitForTimeout(400);const W=ms=>p.waitForTimeout(ms||250);
await p.evaluate(()=>openFlow(64));await W();console.log('menu:',await p.$$eval('.promoter-nav button',x=>x.map(b=>b.textContent.trim())));
await p.click('.promoter-nav [data-go="72"]');await W();console.log('Tim ->',await p.$eval('.promoter-main h1',x=>x.textContent),'| anggota:',await p.$$eval('.team-row .team-who b',x=>x.map(b=>b.textContent)));
// undang Dina sebagai Editor, akses Jazz saja
await p.click('[data-team-invite-toggle]');await W();await p.fill('[data-team-invite] [name=email]','dina@mootiara.id');await p.fill('[data-team-invite] [name=name]','Dina Pratama');
await p.check('[data-team-invite] [value=editor]');await p.check('[data-team-invite] [name=scope][value=some]');await W(100);console.log('daftar event tampil:',await p.$eval('.team-events',x=>getComputedStyle(x).display));
await p.click('[data-team-invite] button[type=submit]');await W();console.log('tanpa pilih event ->',await p.$eval('#toast',x=>x.textContent));
await p.check('[data-team-invite] [name=events][value=b]');await p.click('[data-team-invite] button[type=submit]');await W();
// undang Raka sebagai Pengamat semua event; duplikat
await p.click('[data-team-invite-toggle]');await W();await p.fill('[data-team-invite] [name=email]','dina@mootiara.id');await p.click('[data-team-invite] button[type=submit]');await W();console.log('duplikat ->',await p.$eval('#toast',x=>x.textContent));
await p.fill('[data-team-invite] [name=email]','raka@mootiara.id');await p.check('[data-team-invite] [value=viewer]');await p.click('[data-team-invite] button[type=submit]');await W();
console.log('anggota:',await p.$$eval('.team-row',x=>x.map(r=>r.innerText.replace(/\s+/g,' ').slice(0,90))));
for(const id of await p.$$eval('[data-team-accept]',x=>x.map(b=>b.dataset.teamAccept))){await p.click(`[data-team-accept="${id}"]`);await W()}
console.log('setelah diterima:',await p.$$eval('.team-row small',x=>x.map(s=>s.textContent)));await p.screenshot({path:'team-page.png',fullPage:false});
// Lihat sebagai Dina (Editor, akses Jazz)
await p.click('.team-row:has-text("Dina") [data-team-act]');await W();
console.log('DINA ringkasan:',await p.$$eval('.pe-row .pe-main b',x=>x.map(b=>b.textContent)),'| menu',await p.$$eval('.promoter-nav button',x=>x.map(b=>b.textContent.trim())),'| banner',await p.$eval('.team-acting',x=>x.textContent.slice(0,60)));
await p.click('.pe-row [data-pe-open]');await W();console.log('  dashboard Jazz: tombol kirim tinjau?',await p.locator('[data-submit-event]').count(),'| pengumuman?',await p.locator('[data-ins-announce]').count());
await p.evaluate(()=>{promoterState.activeEventId='a';openFlow(71)});await W();console.log('  paksa buka event tanpa akses ->',await p.evaluate(()=>promoterState.event.name));
await p.evaluate(()=>openFlow(64));await W();await p.click('[data-pe-new]');await W();console.log('  Dina buat event -> form, tombol ajukan?',await p.locator('[data-promoter-event-form] button[value=submit]').count(),'| catatan',await p.$eval('.team-note',x=>x.textContent));
await p.fill('[data-promoter-event-form] [name=name]','Workshop Zine');await p.click('[data-promoter-event-form] button[value=draft]');await W();console.log('  setelah simpan, event Dina:',await p.$$eval('.pe-row .pe-main b',x=>x.map(b=>b.textContent)));
await p.evaluate(()=>openFlow(72));await W();console.log('  Dina buka Tim ->',await p.$eval('.promoter-main',x=>x.innerText.slice(0,120).replace(/\s+/g,' ')));
await p.click('[data-team-exit]');await W();
// Lihat sebagai Raka (Pengamat)
await p.click('.team-row:has-text("raka") [data-team-act]');await W();console.log('RAKA ringkasan:',await p.$$eval('.pe-row .pe-main b',x=>x.map(b=>b.textContent)),'| buat baru?',await p.locator('[data-pe-new]').count(),'| tombol',await p.$$eval('.pe-open',x=>x.map(b=>b.textContent)));
await p.click('.pe-row:has-text("Lari Pagi") [data-pe-open]');await W();console.log('  buka draft ->',await p.evaluate(()=>flowCurrent));
await p.evaluate(()=>openFlow(65));await W();console.log('  form: input nonaktif',await p.$$eval('[data-promoter-event-form] input',x=>x.every(i=>i.disabled)),'| switcher aktif',await p.$eval('[data-pe-select]',x=>!x.disabled),'| catatan',await p.$eval('.team-note',x=>x.textContent));
await p.click('[data-team-exit]');await W();
// ubah peran Raka -> Admin, hapus Dina
await p.selectOption('[data-team-role]:near(:text("raka"))','admin').catch(async()=>{const id=await p.evaluate(()=>promoterState.team.members.find(m=>m.email==='raka@mootiara.id').id);await p.selectOption(`[data-team-role="${id}"]`,'admin')});await W();
const dina=await p.evaluate(()=>promoterState.team.members.find(m=>m.name==='Dina Pratama').id);await p.click(`[data-team-remove="${dina}"]`);await W();await p.click(`[data-team-remove="${dina}"]`);await W();
console.log('akhir anggota:',await p.evaluate(()=>promoterState.team.members.map(m=>(m.name||m.email)+':'+m.role)));console.log('aktivitas:',await p.$$eval('.team-activity li',x=>x.slice(0,7).map(l=>l.innerText.replace(/\s+/g,' ').slice(0,80))));
await p.screenshot({path:'team-page2.png'});
await p.reload();await W(400);console.log('reload: anggota',await p.evaluate(()=>promoterState.team.members.length),'| bertindak sebagai',await p.evaluate(()=>window.promoterTeam.me().role));
await p.setViewportSize({width:390,height:844});await p.evaluate(()=>openFlow(72));await W();console.log('HP geser horizontal:',(await p.evaluate(()=>{const m=document.querySelector('.promoter-main');return m.scrollWidth-m.clientWidth}))>0?'ya':'tidak');await p.screenshot({path:'team-mobile.png',fullPage:false});
console.log('errors',errs);await b.close()})();
