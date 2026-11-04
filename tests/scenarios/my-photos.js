// Foto Saya tersimpan di perangkat: unggahan (diperkecil), album buatan sendiri, pindah album, Favorit, Dibagikan,
// Arsip, Sampah, pulihkan, dan hapus permanen — semuanya tetap ada setelah halaman dimuat ulang.
const {chromium,APP}=require('../helpers');
(async()=>{const b=await chromium.launch();const p=await b.newPage({viewport:{width:1440,height:1000}});
const errs=[];p.on('pageerror',e=>errs.push(e.message));p.on('console',m=>{if(m.type()==='error'&&!/ERR_FAILED|net::/.test(m.text()))errs.push(m.text())});
await p.route(/^https?:/,r=>r.abort());
const W=ms=>p.waitForTimeout(ms||200),toast=()=>p.$eval('#toast',x=>x.textContent);
const openLib=async(view='photos')=>{await p.evaluate(()=>{closeFlow();show('profile')});await p.click('[data-profile-tab="album"]');await W();if(view!=='photos'){await p.click(`[data-photo-view="${view}"]`);await W()}};
const cards=()=>p.$$eval('.user-photo-card',x=>x.map(c=>c.querySelector('b').textContent+' ['+c.querySelector('small').textContent+']'+(c.querySelector('.photo-favorite')?' ♥':'')));
const reload=async()=>{await p.reload();await W(300)};
await p.goto(APP);await p.evaluate(()=>{localStorage.clear();localStorage.setItem('temmoo_onboarded','1')});await reload();

// 1. Unggah 2 gambar besar + 1 file bukan gambar
const png=await p.evaluate(()=>{const c=document.createElement('canvas');c.width=3000;c.height=2000;const g=c.getContext('2d');g.fillStyle='#e85d3f';g.fillRect(0,0,3000,2000);return c.toDataURL('image/png').split(',')[1]});
await openLib();
await p.setInputFiles('#userPhotoUpload',[{name:'Gate dibuka.png',mimeType:'image/png',buffer:Buffer.from(png,'base64')},{name:'Teman baru.png',mimeType:'image/png',buffer:Buffer.from(png,'base64')},{name:'catatan.txt',mimeType:'text/plain',buffer:Buffer.from('halo')}]);
await W(800);console.log('1 unggah:',await toast(),'|',(await cards()).slice(0,3));
const saved=await p.evaluate(()=>{const d=JSON.parse(localStorage.getItem('temmoo_my_photos_v1'));const img=new Image();img.src=d.uploads[0].src;return new Promise(r=>img.onload=()=>r({jumlah:d.uploads.length,ukuran:img.width+'×'+img.height,jpeg:d.uploads[0].src.startsWith('data:image/jpeg'),tanggal:d.uploads[0].at.slice(0,10)}))});
console.log('  tersimpan:',saved);
await p.setInputFiles('#userPhotoUpload',[{name:'catatan.txt',mimeType:'text/plain',buffer:Buffer.from('halo')}]);await W(300);console.log('  hanya file bukan gambar:',await toast());

// 2. Album baru, pindahkan foto ke album, favorit, bagikan
await p.click('[data-create-user-album]');await p.fill('#createUserAlbumForm [name=name]','Malam Puisi');await p.selectOption('#createUserAlbumForm [name=privacy]','Pengikut');await p.click('#createUserAlbumForm [type=submit]');await W();
console.log('2 album:',await toast(),'|',await p.$$eval('.user-album-card',x=>x.slice(0,2).map(a=>a.innerText.replace(/\n+/g,' · '))));
await p.click('[data-create-user-album]');await p.fill('#createUserAlbumForm [name=name]','malam puisi');await p.click('#createUserAlbumForm [type=submit]');await W();console.log('  nama kembar:',await toast());await p.click('[data-close-gallery-modal]');
await openLib();await p.click('.user-photo-card >> nth=0');await W();
await p.selectOption('[data-photo-album]','Malam Puisi');await W();console.log('  pindah album:',await toast());
await p.click('.user-photo-card >> nth=0');await W();await p.click('#userPhotoPreview [data-toggle-favorite]');await W();console.log('  favorit:',await toast());
await p.click('.user-photo-card >> nth=1');await W();await p.click('#userPhotoPreview [data-toggle-shared]');await W();console.log('  bagikan:',await toast());
// Foto contoh: hapus tanda favorit p1, arsipkan p2, buang p3 ke Sampah
await p.evaluate(()=>document.querySelector('[data-user-photo="p1"]').click());await W();await p.click('#userPhotoPreview [data-toggle-favorite]');await W();
await p.evaluate(()=>document.querySelector('[data-user-photo="p2"]').click());await W();await p.click('#userPhotoPreview [data-move-archive]');await W();
await p.evaluate(()=>document.querySelector('[data-user-photo="p3"]').click());await W();await p.click('#userPhotoPreview [data-photo-trash]');await W();console.log('  hapus ke Sampah:',await toast());

// 3. Muat ulang: semuanya tetap
await reload();await openLib();
console.log('3 setelah reload, Foto:',await cards());
await openLib('albums');console.log('  Album:',await p.$$eval('.user-album-card',x=>x.slice(0,2).map(a=>a.innerText.replace(/\n+/g,' · '))));
await openLib('favorites');console.log('  Favorit:',await cards());
await openLib('shared');console.log('  Dibagikan:',await cards());
await openLib('archive');console.log('  Arsip:',await cards());
await openLib('trash');console.log('  Sampah:',await cards());

// 4. Sampah: pulihkan & hapus permanen (dengan konfirmasi)
await p.evaluate(()=>document.querySelector('[data-user-photo="p3"]').click());await W();console.log('4 tombol di Sampah:',await p.$$eval('#userPhotoPreview footer button',x=>x.map(b=>b.textContent)));
await p.click('#userPhotoPreview [data-photo-restore]');await W();console.log('  pulihkan:',await toast(),'| Sampah:',await cards());
await openLib('archive');await p.click('[data-select-user-photo="p2"]');await W();console.log('  bilah pilihan Arsip:',await p.$$eval('.photo-selection-bar button',x=>x.map(b=>b.textContent)));
await p.click('[data-photo-bulk="trash"]');await W();await openLib('trash');
await p.click('[data-select-user-photo="p2"]');await W();console.log('  bilah pilihan Sampah:',await p.$$eval('.photo-selection-bar button',x=>x.map(b=>b.textContent)));
await p.click('[data-photo-bulk="delete"]');await W();console.log('  konfirmasi:',await p.$eval('.app-dialog',x=>x.innerText.replace(/\n+/g,' | ')));
await p.click('.app-dialog .is-danger');await W();console.log('  hapus permanen:',await toast(),'| Sampah:',await cards());
await reload();await openLib();console.log('  setelah reload, p2 hilang:',await p.evaluate(()=>!document.querySelector('[data-user-photo="p2"]')),'| p3 kembali:',!!(await p.$('[data-user-photo="p3"]')));
// Hapus unggahan permanen membebaskan penyimpanan
const before=await p.evaluate(()=>localStorage.getItem('temmoo_my_photos_v1').length);
await p.click('.user-photo-card >> nth=1');await W();await p.click('#userPhotoPreview [data-photo-trash]');await W();await openLib('trash');await p.click('.user-photo-card >> nth=0');await W();await p.click('#userPhotoPreview [data-photo-delete]');await W();await p.click('.app-dialog .is-danger');await W();
console.log('  unggahan dihapus permanen, penyimpanan berkurang:',await p.evaluate(b=>localStorage.getItem('temmoo_my_photos_v1').length<b/1.5,before),'| sisa unggahan:',await p.evaluate(()=>JSON.parse(localStorage.getItem('temmoo_my_photos_v1')).uploads.map(u=>u.name)));

// 5. Penyimpanan penuh: unggahan dibatalkan dengan pesan
await p.evaluate(()=>{const set=Storage.prototype.setItem;Storage.prototype.setItem=function(k,v){if(k==='temmoo_my_photos_v1')throw new DOMException('full','QuotaExceededError');return set.call(this,k,v)}});
await openLib();const n=(await cards()).length;
await p.setInputFiles('#userPhotoUpload',[{name:'Terlalu besar.png',mimeType:'image/png',buffer:Buffer.from(png,'base64')}]);await W(600);
console.log('5 penyimpanan penuh:',await toast(),'| jumlah foto tetap:',(await cards()).length===n);

// 6. English
await p.evaluate(()=>localStorage.setItem('temmoo_lang_v1','en'));await reload();await openLib('trash');
await p.evaluate(()=>{show('profile')});await p.click('[data-profile-tab="album"]');await W();await p.click('[data-photo-view="trash"]');await W();
console.log('6 English, Sampah kosong:',await p.$eval('.photo-empty',x=>x.innerText.replace(/\n+/g,' | ')));
await p.click('[data-photo-view="photos"]');await W();await p.click('.user-photo-card >> nth=0');await W();console.log('  pratinjau:',await p.$eval('#userPhotoPreview',x=>x.innerText.replace(/\n+/g,' | ')));

console.log('errors',errs);await b.close()})();
