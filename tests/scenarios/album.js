// Album resmi promotor: tombol "Unggah album resmi" membuka halaman unggah (bukan halaman beli), unggah & validasi file,
// harga per foto, terbitkan, tampilan peserta memakai foto unggahan, batasan tingkat & peran tim.
const {chromium,APP}=require('../helpers');
(async()=>{const b=await chromium.launch();const p=await b.newPage({viewport:{width:1440,height:1000}});
const errs=[];p.on('pageerror',e=>errs.push(e.message));p.on('console',m=>{if(m.type()==='error'&&!/ERR_FAILED|net::/.test(m.text()))errs.push(m.text())});
await p.route(/^https?:/,r=>r.abort());
const W=ms=>p.waitForTimeout(ms||250),toast=()=>p.$eval('#toast',x=>x.textContent);
const text=sel=>p.evaluate(s=>document.querySelector(s)?.innerText.replace(/\n+/g,' | ')||'(tidak ada)',sel);
const setup=async(tier,date)=>{await p.goto(APP);await p.evaluate(([tier,date])=>{localStorage.clear();localStorage.setItem('temmoo_onboarded','1');
  localStorage.setItem('temmoo_promoter_app_v1',JSON.stringify({status:'approved',org:'Ruang Kolektif',tier,type:'Komunitas'}));
  localStorage.setItem('temmoo_promoter_v1',JSON.stringify({organization:'Ruang Kolektif',activeEventId:'a',events:[{id:'a',name:'Surabaya Creative Week',category:'Seni & Budaya',date,dateShort:date.split(' ').slice(0,2).join(' ').toUpperCase().slice(0,6),venue:'Balai Pemuda, Surabaya',capacity:400,status:'published',announcements:[]}]}))},[tier,date]);await p.reload();await W(300)};

// 1. Tombol di dashboard event (sudah selesai) membuka halaman unggah
await setup('full','18 Oktober 2026');
await p.evaluate(()=>openFlow(71));await W();await p.click('[data-ins-action="album"]');await W();
console.log('1 klik Unggah album resmi -> layar',await p.evaluate(()=>flowCurrent),'|',await text('.promoter-main header h1'),'|',await text('.album-head'));
await p.evaluate(()=>{activeEvent=promoterState.event.publishedIndex;openFlow(59)});await W();console.log('  tab Album peserta sebelum terbit:',await text('.album-empty'));
await p.evaluate(()=>openFlow(76));await W();

// 2. Unggah: file bukan gambar ditolak, gambar diproses
await p.setInputFiles('[data-album-upload]','bukan.txt');await W();console.log('2 unggah .txt ->',await toast());
await p.setInputFiles('[data-album-upload]',['ktp-big.png','selfie.png','ktp-small.png','bukan.txt']);await p.waitForFunction(()=>!document.querySelector('.album-drop.busy'),null,{timeout:5000});await W();
console.log('  unggah 3 gambar + 1 txt ->',await toast(),'|',await text('.album-head>div'));
console.log('  thumbnail:',await p.$$eval('.album-thumb',x=>x.map(t=>t.style.backgroundImage.slice(0,10))),'| data di localStorage (KB):',await p.evaluate(()=>{const s=localStorage.getItem('temmoo_album_v1');return [Math.round(s.length/1024)<2,!s.includes('data:image'),Object.values(JSON.parse(s)).flat().every(x=>photoFiles.has(x.file))]}));

// 3. Harga
await p.fill('[data-album-default]','12000');await p.click('[data-album-apply]');await W();console.log('3 terapkan 12000 ->',await toast(),'|',await p.$$eval('[data-album-price]',x=>x.map(i=>i.value)));
await p.fill('[data-album-price] >> nth=1','25000');await p.press('[data-album-price] >> nth=1','Tab');await W();console.log('  ubah foto 2 ->',await text('.album-head>div'));
await p.click('[data-album-remove] >> nth=2');await W();console.log('  hapus foto 3 ->',await toast(),'|',await text('.album-head>div'));

// 4. Terbitkan & lihat sebagai peserta
await p.click('[data-album-publish]');await W();console.log('4 terbitkan ->',await toast(),'|',await text('.album-head'));
console.log('  notifikasi:',await p.evaluate(()=>{const n=JSON.parse(localStorage.getItem('temmoo_notif_extra_v1')||'[]')[0];return n&&n.who+' '+n.text+' · '+n.quote}));
await p.click('[data-album-view]');await W();
console.log('  peserta:',await p.evaluate(()=>[flowCurrent,document.querySelector('.album-toolbar span').innerText,[...document.querySelectorAll('.official-photo-card')].map(c=>c.querySelector('b').textContent+(c.style.backgroundImage.startsWith('url("blob:')?' (foto)':' (contoh)'))]));
await p.click('[data-album-select-all]');await W();console.log('  pilih semua ->',await text('.album-purchase-bar>div'));
await p.click('.official-photo-card >> nth=1');await W();console.log('  pratinjau:',await p.evaluate(()=>{const v=document.querySelector('#albumPhotoPreview');return [v.querySelector('.album-preview-image').classList.contains('has-photo'),v.querySelector('.album-preview-info b').textContent]}));
await p.keyboard.press('ArrowRight');await W();console.log('  panah kanan -> foto',await p.evaluate(()=>document.querySelector('#albumPhotoPreview').dataset.photoId));
await p.keyboard.press('Escape');

// 5. Bertahan setelah reload; album contoh event lain tidak berubah
await p.reload();await W(300);await p.evaluate(()=>{activeEvent=promoterState.event.publishedIndex;openFlow(59)});await W();
console.log('5 setelah reload:',await p.$$eval('.official-photo-card',x=>x.length),'foto');
await p.evaluate(()=>{activeEvent=events.findIndex(e=>e[0]==='LaLaLa Fest 2026');openFlow(59)});await W();console.log('  album contoh LaLaLa:',await text('.album-toolbar span'),'|',await p.$$eval('.official-photo-card',x=>x.length));
await p.evaluate(()=>openFlow(76));await W();await p.click('[data-album-unpublish]');await W();console.log('  tarik dari publik ->',await toast(),'|',await text('.album-head .status-chip'));

// 6. Event belum berlangsung: bisa menyiapkan, belum bisa menerbitkan
await setup('full','20 Desember 2026');await p.evaluate(()=>openFlow(76));await W();
await p.setInputFiles('[data-album-upload]','selfie.png');await p.waitForFunction(()=>!document.querySelector('.album-drop.busy'),null,{timeout:5000});await W();
console.log('6 akan datang:',await text('.album-manager>.pro-hint'),'| tombol terbit nonaktif:',await p.$eval('[data-album-publish]',x=>x.disabled));

// 7. Editor: boleh unggah, tidak boleh menerbitkan
await p.evaluate(()=>{promoterState.team.members.push({id:'m-ed',name:'Raka Editor',email:'raka@rk.id',role:'editor',access:'all',status:'active'});savePromoter()});
await p.reload();await W(300);await p.evaluate(()=>{const b=document.createElement('button');b.dataset.teamAct='m-ed';document.body.append(b);b.click()});await W();
await p.evaluate(()=>openFlow(76));await W();console.log('7 editor: area unggah',await p.locator('[data-album-upload]').count(),'| tombol terbit',await p.locator('[data-album-publish]').count(),'|',await text('.album-manager>.pro-hint:last-of-type'));

// 8. Promotor Dasar
await setup('basic','18 Oktober 2026');await p.evaluate(()=>openFlow(76));await W();console.log('8 Promotor Dasar:',await text('.album-locked .ins-empty'));

await p.setViewportSize({width:390,height:844});await setup('full','18 Oktober 2026');await p.evaluate(()=>openFlow(76));await W();
console.log('HP geser horizontal:',(await p.evaluate(()=>document.documentElement.scrollWidth-innerWidth))>0?'ya':'tidak');
console.log('errors',errs);await b.close()})();
