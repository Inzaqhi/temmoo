// Dialog di dalam halaman (pengganti confirm) dan pembelian foto album, diuji di iframe sandbox seperti pratinjau Claude
// (allow-scripts allow-same-origin, tanpa allow-modals) lalu di halaman biasa untuk sisi promotor.
const {chromium,APP,INDEX}=require('../helpers');const fs=require('fs');
(async()=>{const b=await chromium.launch();const p=await b.newPage({viewport:{width:1440,height:900}});
const errs=[];p.on('pageerror',e=>errs.push(e.message));const blocked=[];p.on('console',m=>{if(m.type()!=='error'||/ERR_FAILED|net::/.test(m.text()))return;if(/Ignored call to 'confirm\(\)'/.test(m.text()))blocked.push(m.text());else errs.push(m.text())});
await p.route(/^https?:/,r=>r.request().url().startsWith('https://www.claudeusercontent.com/')?r.fulfill({contentType:'text/html',body:'<iframe id=f sandbox="allow-scripts allow-same-origin" style="width:1420px;height:880px;border:0"></iframe>'}):r.abort());
await p.goto('https://www.claudeusercontent.com/');await p.$eval('#f',(el,h)=>el.srcdoc=h,fs.readFileSync(INDEX,'utf8'));await p.waitForTimeout(800);const f=p.frames()[1];
await f.evaluate(()=>{localStorage.clear();localStorage.setItem('temmoo_onboarded','1')});
const W=ms=>f.waitForTimeout(ms||250),toast=()=>f.$eval('#toast',x=>x.textContent);
const text=sel=>f.evaluate(s=>document.querySelector(s)?.innerText.replace(/\n+/g,' | ')||'(tidak ada)',sel);

// 1. Di sandbox pratinjau, confirm() bawaan langsung "batal" — inilah kenapa tombolnya dulu diam saja
console.log('1 confirm() bawaan di sandbox:',await f.evaluate(()=>confirm('tes')));await W(100);console.log('  pesan Chrome:',blocked[0]);

// 2. Beli foto album contoh (LaLaLa Fest) di sandbox
await f.evaluate(()=>{activeEvent=events.findIndex(e=>e[0]==='LaLaLa Fest 2026');openFlow(59)});await W();
await f.click('[data-paid-photo="1"] [data-select-photo]');await f.click('[data-paid-photo="2"] [data-select-photo]');await W();
console.log('2 dipilih:',await text('.album-purchase-bar>div'));
await f.click('[data-buy-event-photos]');await W();
console.log('  checkout:',await text('.app-dialog.checkout .checkout-lines'),'| metode:',await f.$$eval('[name=checkout-method]',x=>x.map(r=>r.value+(r.checked?'*':''))));
await p.keyboard.press('Escape');await W();console.log('  Esc -> dialog tertutup:',await f.locator('.app-dialog').count()===0,'| pilihan tetap:',await text('#albumSelectionText'));
await f.click('[data-buy-event-photos]');await W();await f.check('[name=checkout-method][value=ewallet]');await f.click('[data-checkout-pay]');
console.log('  tombol saat proses:',await text('[data-checkout-pay]'));await W(900);
console.log('  selesai:',(await text('.checkout-done')).replace(/TMO-\w+/,'TMO-…'));
console.log('  tersimpan:',await f.evaluate(()=>JSON.parse(localStorage.getItem('temmoo_purchases_v1')).map(x=>[x.key,x.price,x.method].join(' '))));
console.log('  album di belakang:',await f.$$eval('.official-photo-card',x=>x.slice(0,3).map(c=>c.querySelector('b').textContent)),'|',await text('.album-toolbar span'));
await f.click('[data-checkout-gallery]');await W(300);
console.log('  Lihat di Foto Saya ->',await f.evaluate(()=>[document.querySelector('.view.active').id,document.querySelector('.photo-library-nav .active')?.textContent]),'|',await f.$$eval('.user-photo-card',x=>x.map(c=>c.querySelector('b').textContent+(c.querySelector('.photo-bought')?' [Dibeli]':''))));

// 3. Foto yang sudah dimiliki tidak bisa dibeli lagi
await f.evaluate(()=>{activeEvent=events.findIndex(e=>e[0]==='LaLaLa Fest 2026');openFlow(59)});await W();
await f.click('[data-album-select-all]');await W();console.log('3 pilih semua ->',await text('.album-purchase-bar>div'),'| foto dimiliki terpilih:',await f.locator('.official-photo-card.owned.selected').count());
await f.click('[data-paid-photo="1"]');await W();console.log('  pratinjau foto dimiliki:',await text('.album-preview-info'));await p.keyboard.press('Escape');

// 4. Dialog konfirmasi di sandbox: hapus grup & hentikan langganan
await f.evaluate(()=>{activeEvent=events.findIndex(e=>e[0]==='Surabaya Food Market');activeEventGroup=eventGroupData(0)});
const press=sel=>f.evaluate(s=>{const b=document.createElement('button');b.setAttribute(s,'');document.body.append(b);b.click();b.remove()},sel);
await press('data-delete-group');await W();console.log('4 hapus grup ->',await text('.app-dialog.confirm'));
console.log('  tombol Hapus terbaca (teks beda dari latar):',await f.$eval('[data-dialog-ok]',x=>{const c=getComputedStyle(x);return c.color!==c.backgroundColor&&c.color==='rgb(255, 255, 255)'}));
await f.click('[data-dialog-cancel]');await W();console.log('  Batal -> grup masih ada:',await f.evaluate(()=>!activeEventGroup.deleted));
await press('data-delete-group');await W();await f.click('[data-dialog-ok]');await W();console.log('  Hapus ->',await toast(),'| tersimpan terhapus:',await f.evaluate(()=>JSON.parse(localStorage.getItem('temmoo_group_info_v1'))[0].deleted));
await f.evaluate(()=>{accountState.subscriptionStatus='active'});await press('data-cancel-subscription');await W();console.log('  langganan ->',await text('.app-dialog.confirm h3'));
await f.click('.app-dialog-backdrop',{position:{x:10,y:10}});await W();console.log('  klik di luar -> status:',await f.evaluate(()=>accountState.subscriptionStatus));
await press('data-cancel-subscription');await W();await p.keyboard.press('Enter');await W();console.log('  Enter (tombol utama terfokus) ->',await f.evaluate(()=>accountState.subscriptionStatus));

// 5. Promotor melihat penjualan album yang diunggahnya
await p.goto(APP);
const px='data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
await p.evaluate(px=>{localStorage.clear();localStorage.setItem('temmoo_onboarded','1');
  localStorage.setItem('temmoo_promoter_app_v1',JSON.stringify({status:'approved',org:'Ruang Kolektif',tier:'full',type:'Komunitas'}));
  localStorage.setItem('temmoo_promoter_v1',JSON.stringify({organization:'Ruang Kolektif',activeEventId:'a',events:[{id:'a',name:'Surabaya Creative Week',category:'Seni & Budaya',date:'18 Oktober 2026',dateShort:'18 OKT',venue:'Balai Pemuda, Surabaya',capacity:400,status:'published',announcements:[],album:{status:'published',defaultPrice:10000,publishedAt:1}}]}));
  localStorage.setItem('temmoo_album_v1',JSON.stringify({a:[{id:'f1',name:'gate.jpg',price:20000,src:px},{id:'f2',name:'panggung.jpg',price:15000,src:px}]}))},px);
await p.reload();await p.waitForTimeout(300);
await p.evaluate(()=>{activeEvent=promoterState.event.publishedIndex;openFlow(59)});await p.waitForTimeout(200);
await p.click('[data-paid-photo="2"] [data-select-photo]');await p.click('[data-buy-event-photos]');await p.click('[data-checkout-pay]');await p.waitForTimeout(900);
console.log('5 beli foto promotor:',await p.evaluate(()=>document.querySelector('.checkout-done .checkout-lines').innerText.replace(/\n+/g,' | ').replace(/TMO-\w+/,'TMO-…')));
await p.click('.checkout-done [data-checkout-close]');
await p.evaluate(()=>openFlow(76));await p.waitForTimeout(200);console.log('  halaman album promotor:',await p.evaluate(()=>document.querySelector('.album-sold')?.textContent));
await p.reload();await p.waitForTimeout(300);await p.evaluate(()=>{activeEvent=promoterState.event.publishedIndex;openFlow(59)});await p.waitForTimeout(200);
console.log('  setelah reload:',await p.$$eval('.official-photo-card',x=>x.map(c=>c.querySelector('b').textContent)));

await p.setViewportSize({width:390,height:844});await p.click('[data-paid-photo="1"] [data-select-photo]');await p.click('[data-buy-event-photos]');await p.waitForTimeout(200);
console.log('HP checkout menempel di bawah:',await p.evaluate(()=>{const r=document.querySelector('.app-dialog').getBoundingClientRect();return Math.abs(r.bottom-innerHeight)<2&&r.left===0}));
console.log('confirm() lain yang diblokir:',blocked.length-1);console.log('errors',errs);await b.close()})();
