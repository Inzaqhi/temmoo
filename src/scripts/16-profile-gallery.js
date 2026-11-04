
(()=>{
  const tones=['tone-coral','tone-indigo','tone-teal','tone-gold','tone-mix'];
  let activeView='photos',query='',selection=new Set();
  // Foto Saya tersimpan di perangkat (temmoo_my_photos_v1): unggahan (file di IndexedDB lewat photoFiles), album buatan sendiri,
  // tanda Favorit/Arsip/Sampah/Dibagikan untuk semua foto (termasuk contoh & foto yang dibeli), dan foto yang dihapus permanen.
  const STORE='temmoo_my_photos_v1',FLAGS=['favorite','archived','trashed','shared'];
  const stored=(()=>{try{return JSON.parse(localStorage.getItem(STORE))||{}}catch{return {}}})();
  const flags=stored.flags||{},deleted=new Set(stored.deleted||[]),moved=stored.moved||{};
  const srcOf=p=>p.file?window.photoFiles?.url(p.file)||'':(p.src||'');
  const longDate=iso=>new Date(iso).toLocaleDateString('id-ID',{day:'numeric',month:'long',year:'numeric'});
  const applyFlags=photo=>{if(flags[photo.id])for(const f of FLAGS)photo[f]=!!flags[photo.id][f];return photo};
  const seedPhotos=[
    {id:'p1',name:'Bareng teman sebelum konser',date:'24 Agustus 2026',album:'LaLaLa Fest',tone:'tone-coral',favorite:true},
    {id:'p2',name:'Panggung utama',date:'24 Agustus 2026',album:'LaLaLa Fest',tone:'tone-indigo'},
    {id:'p3',name:'Circle pertama',date:'12 Juli 2025',album:'Hindia Live 2025',tone:'tone-teal',shared:true},
    {id:'p4',name:'Menunggu gate dibuka',date:'12 Juli 2025',album:'Hindia Live 2025',tone:'tone-gold'},
    {id:'p5',name:'Coffee corner',date:'10 Oktober 2025',album:'Coffee Fest',tone:'tone-mix',archived:true},
    {id:'p6',name:'Foto bersama komunitas',date:'10 Oktober 2025',album:'Coffee Fest',tone:'tone-coral',favorite:true}
  ];
  const uploads=(stored.uploads||[]).map(u=>({...u,date:longDate(u.at),upload:true}));
  const photos=[...uploads,...seedPhotos.map(p=>moved[p.id]?{...p,album:moved[p.id]}:p)].filter(p=>!deleted.has(p.id)).map(applyFlags);
  const seedAlbums=[
    {id:'a1',name:'LaLaLa Fest 2026',count:14,privacy:'Pribadi',tone:'tone-coral'},
    {id:'a2',name:'Hindia Live 2025',count:9,privacy:'Publik',tone:'tone-teal'},
    {id:'a3',name:'Circle Coffee Fest',count:6,privacy:'Dibagikan',tone:'tone-gold'}
  ];
  const albums=[...(stored.albums||[]).map(a=>({...a,custom:true})),...seedAlbums];
  const albumCount=a=>a.custom?allPhotos().filter(p=>p.album===a.name&&!p.trashed).length:a.count;
  function save(){
    const data={uploads:photos.filter(p=>p.upload).map(({id,name,at,album,tone,file,src})=>file?{id,name,at,album,tone,file}:{id,name,at,album,tone,src}),
      albums:albums.filter(a=>a.custom).map(({id,name,privacy,description,collaborative,tone})=>({id,name,privacy,description,collaborative,tone})),
      moved,flags:Object.fromEntries(allPhotos().map(p=>[p.id,Object.fromEntries(FLAGS.filter(f=>p[f]).map(f=>[f,true]))])),deleted:[...deleted]};
    try{localStorage.setItem(STORE,JSON.stringify(data));return true}catch{return false}
  }
  const esc=value=>String(value||'').replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
  const nav=[['photos','Foto'],['bought','Dibeli'],['albums','Album'],['favorites','Favorit'],['shared','Dibagikan'],['archive','Arsip'],['trash','Sampah']];

  const boughtCache=new Map(),TONE={'photo-0':'tone-coral','photo-1':'tone-indigo','photo-2':'tone-teal','photo-3':'tone-gold'};
  function boughtPhotos(){return (window.photoPurchases?.list()||[]).map(p=>{if(!boughtCache.has(p.key))boughtCache.set(p.key,applyFlags({id:'buy-'+p.key,name:`${p.label} · ${p.event}`,date:longDate(p.at),album:p.event,tone:TONE[p.tone]||'tone-indigo',src:p.src,file:p.file,bought:true,order:p.order}));return boughtCache.get(p.key)}).filter(p=>!deleted.has(p.id))}
  const allPhotos=()=>[...boughtPhotos(),...photos];
  function visiblePhotos(){
    return allPhotos().filter(photo=>{
      if(activeView==='bought'&&!photo.bought)return false;
      if(activeView==='favorites'&&!photo.favorite)return false;
      if(activeView==='shared'&&!photo.shared)return false;
      if(activeView==='archive'&&!photo.archived)return false;
      if(activeView==='trash'&&!photo.trashed)return false;
      if(['photos','bought','favorites','shared'].includes(activeView)&&(photo.archived||photo.trashed))return false;
      return !query||`${photo.name} ${photo.album} ${photo.date}`.toLowerCase().includes(query);
    });
  }
  function photoCard(photo){
    const src=srcOf(photo),style=src?`style="background-image:url('${src}')"`:'';
    return `<article class="user-photo-card ${photo.tone}" data-user-photo="${photo.id}" ${style}><button class="photo-select ${selection.has(photo.id)?'selected':''}" data-select-user-photo="${photo.id}" aria-label="Pilih foto">${selection.has(photo.id)?'✓':'○'}</button>${photo.favorite?'<span class="photo-favorite">♥</span>':''}${photo.bought?'<span class="photo-bought">Dibeli</span>':''}<div><b>${esc(photo.name)}</b><small>${esc(photo.album)}</small></div></article>`;
  }
  function albumCard(album){return `<button class="user-album-card ${album.tone}" data-user-album="${album.id}"><div class="album-cover-stack"><i></i><i></i><i></i></div><b>${esc(album.name)}</b><span>${albumCount(album)} foto · ${esc(album.privacy)}</span></button>`}
  function content(){
    if(activeView==='albums')return `<div class="user-album-grid">${albums.filter(a=>!query||a.name.toLowerCase().includes(query)).map(albumCard).join('')}</div>`;
    const list=visiblePhotos();
    if(!list.length)return activeView==='bought'?`<div class="photo-empty"><i>▧</i><h3>Belum ada foto yang dibeli</h3><p>Foto yang kamu beli dari album resmi event akan tersimpan di sini tanpa watermark.</p></div>`:`<div class="photo-empty"><i>▧</i><h3>Belum ada foto</h3><p>${activeView==='trash'?'Foto yang kamu hapus akan muncul di sini sebelum dihapus permanen.':'Upload foto atau pilih tampilan lain.'}</p></div>`;
    return `<p class="photo-date-label">Terbaru</p><div class="user-photo-grid">${list.map(photoCard).join('')}</div>`;
  }
  function bulkButtons(){
    if(activeView==='trash')return '<button data-photo-bulk="restore">Pulihkan</button><button class="is-danger" data-photo-bulk="delete">Hapus permanen</button>';
    if(activeView==='archive')return '<button data-photo-bulk="restore">Keluarkan dari Arsip</button><button data-photo-bulk="trash">Hapus</button>';
    return '<button data-photo-bulk="favorite">♥ Favorit</button><button data-photo-bulk="archive">Arsipkan</button><button data-photo-bulk="trash">Hapus</button>';
  }
  function libraryMarkup(){return `<section class="user-photo-library"><header class="photo-library-head"><div><h3>Foto Saya</h3><p>Foto dan album yang kamu unggah.</p></div><div class="photo-head-actions"><button data-create-user-album>＋ Buat album</button><button class="primary" data-upload-user-photo>↑ Upload</button><input type="file" id="userPhotoUpload" accept="image/*" multiple hidden></div></header><div class="photo-search-row"><label><span>⌕</span><input id="userPhotoSearch" value="${esc(query)}" placeholder="Cari foto, album, atau event"></label></div><nav class="photo-library-nav">${nav.map(([id,label])=>`<button class="${activeView===id?'active':''}" data-photo-view="${id}">${label}</button>`).join('')}</nav><div class="photo-selection-bar ${selection.size?'show':''}"><b>${selection.size} dipilih</b>${bulkButtons()}<button data-photo-clear aria-label="Batalkan pilihan">×</button></div><div class="photo-library-content">${content()}</div></section>`}
  window.openPhotoLibraryView=view=>{activeView=view;query='';selection.clear();window.renderOwnPhotoLibrary()};
  window.renderOwnPhotoLibrary=function(){const target=document.querySelector('#profilePost');if(target)target.innerHTML=libraryMarkup()};
  window.renderPublicPhotoLibrary=function(){
    const target=document.querySelector('#publicProfileContent');if(!target)return;
    target.innerHTML=`<section class="user-photo-library public-user-gallery"><header class="photo-library-head"><div><h3>Album Publik</h3><p>Album yang dibagikan pengguna ini.</p></div></header><div class="user-album-grid">${seedAlbums.filter(a=>a.privacy!=='Pribadi').map(albumCard).join('')}</div></section>`;
  };
  function rerender(){window.renderOwnPhotoLibrary()}
  function createAlbumDialog(){
    document.querySelector('#createUserAlbumDialog')?.remove();
    document.body.insertAdjacentHTML('beforeend',`<div class="user-gallery-modal" id="createUserAlbumDialog"><form class="user-gallery-dialog" id="createUserAlbumForm"><header><b>Buat album</b><button type="button" data-close-gallery-modal>×</button></header><label>Nama album<input name="name" required maxlength="60" placeholder="Contoh: LaLaLa Fest 2026"></label><label>Deskripsi<textarea name="description" maxlength="180" placeholder="Ceritakan isi album"></textarea></label><label>Privasi<select name="privacy"><option>Pribadi</option><option>Pengikut</option><option>Publik</option><option>Tautan khusus</option></select></label><label class="gallery-check"><input type="checkbox" name="collaborative"> Izinkan orang yang diundang menambahkan foto</label><footer><button type="button" data-close-gallery-modal>Batal</button><button class="primary" type="submit">Buat album</button></footer></form></div>`);
  }
  function albumPicker(photo){
    const own=albums.filter(a=>a.custom);if(photo.bought||photo.trashed||!own.length)return '';
    const names=[...new Set([photo.album,...own.map(a=>a.name)])];
    return `<label class="photo-album-pick">Album<select data-photo-album="${photo.id}">${names.map(n=>`<option value="${esc(n)}" ${n===photo.album?'selected':''}>${esc(n)}</option>`).join('')}</select></label>`;
  }
  function previewActions(photo){
    const id=photo.id;
    if(photo.trashed)return `<button data-photo-restore="${id}">Pulihkan</button><button class="is-danger" data-photo-delete="${id}">Hapus permanen</button>`;
    const src=srcOf(photo),download=src?`<a class="button-link" href="${src}" download="${esc(photo.name)}.jpg">Unduh</a>`:'';
    if(photo.archived)return `${download}<button data-photo-restore="${id}">Keluarkan dari Arsip</button><button data-photo-trash="${id}">Hapus</button>`;
    return `<button data-toggle-favorite="${id}" aria-pressed="${!!photo.favorite}">${photo.favorite?'♥ Favorit':'♡ Favorit'}</button><button data-toggle-shared="${id}" aria-pressed="${!!photo.shared}">${photo.shared?'Berhenti bagikan':'Bagikan'}</button>${download}<button data-move-archive="${id}">Arsipkan</button><button data-photo-trash="${id}">Hapus</button>`;
  }
  function previewPhoto(photo){
    document.querySelector('#userPhotoPreview')?.remove();
    const src=srcOf(photo),style=src?`style="background-image:url('${src}')"`:'';
    document.body.insertAdjacentHTML('beforeend',`<div class="user-gallery-modal" id="userPhotoPreview"><div class="user-photo-preview"><header><div><b>${esc(photo.name)}</b><span>${esc(photo.date)} · ${esc(photo.album)}${photo.order?` · pesanan ${esc(photo.order)}`:''}</span></div><button data-close-gallery-modal>×</button></header><div class="preview-user-image ${photo.tone}" ${style}></div>${albumPicker(photo)}<footer>${previewActions(photo)}</footer></div></div>`);
  }
  document.addEventListener('click',e=>{
    const profileAlbum=e.target.closest('[data-profile-tab="album"]');if(profileAlbum)setTimeout(()=>{activeView='photos';renderOwnPhotoLibrary()},0);
    const publicAlbum=e.target.closest('[data-public-tab="album"]');if(publicAlbum)setTimeout(renderPublicPhotoLibrary,0);
    const view=e.target.closest('[data-photo-view]');if(view){activeView=view.dataset.photoView;selection.clear();rerender();return}
    if(e.target.closest('[data-upload-user-photo]')){document.querySelector('#userPhotoUpload')?.click();return}
    if(e.target.closest('[data-create-user-album]')){createAlbumDialog();return}
    if(e.target.closest('[data-close-gallery-modal]')||e.target.classList.contains('user-gallery-modal')){e.target.closest('.user-gallery-modal')?.remove();return}
    const select=e.target.closest('[data-select-user-photo]');if(select){e.stopPropagation();const id=select.dataset.selectUserPhoto;selection.has(id)?selection.delete(id):selection.add(id);rerender();return}
    const card=e.target.closest('[data-user-photo]');if(card){const photo=allPhotos().find(p=>p.id===card.dataset.userPhoto);if(photo)previewPhoto(photo);return}
    const one=(attr,fn)=>{const el=e.target.closest(`[${attr}]`);if(!el)return false;const photo=allPhotos().find(p=>p.id===el.getAttribute(attr));if(photo)fn(photo);return true};
    const done=msg=>{document.querySelector('#userPhotoPreview')?.remove();save();rerender();toast(msg)};
    if(one('data-toggle-favorite',p=>{p.favorite=!p.favorite;done(p.favorite?'Ditambahkan ke Favorit':'Dihapus dari Favorit')}))return;
    if(one('data-toggle-shared',p=>{p.shared=!p.shared;done(p.shared?'Foto dibagikan ke pengikut':'Foto tidak lagi dibagikan')}))return;
    if(one('data-move-archive',p=>{p.archived=true;done('Foto dipindahkan ke Arsip')}))return;
    if(one('data-photo-trash',p=>{p.trashed=true;done('Foto dipindahkan ke Sampah')}))return;
    if(one('data-photo-restore',p=>{const msg=p.trashed?'Foto dipulihkan':'Foto dikeluarkan dari Arsip';p.trashed=false;p.archived=false;done(msg)}))return;
    if(one('data-photo-delete',p=>deleteForever([p])))return;
    const bulk=e.target.closest('[data-photo-bulk]');if(bulk){const list=allPhotos().filter(p=>selection.has(p.id)),act=bulk.dataset.photoBulk;
      if(act==='delete'){deleteForever(list);return}
      list.forEach(p=>{if(act==='favorite')p.favorite=true;if(act==='archive')p.archived=true;if(act==='trash')p.trashed=true;if(act==='restore'){p.trashed=false;p.archived=false}});
      selection.clear();save();rerender();toast({trash:'Foto dipindahkan ke Sampah',archive:'Foto dipindahkan ke Arsip',restore:'Foto dipulihkan'}[act]||'Koleksi diperbarui');return}
    if(e.target.closest('[data-photo-clear]')){selection.clear();rerender();return}
    const album=e.target.closest('[data-user-album]');if(album){activeView='photos';query=(albums.find(a=>a.id===album.dataset.userAlbum)?.name||'').replace(/ 2026$/,'').toLowerCase();rerender();return}
  },true);
  async function deleteForever(list){
    if(!list.length)return;
    const ok=await askConfirm({title:list.length>1?`Hapus ${list.length} foto permanen?`:'Hapus foto permanen?',text:'Foto akan dihapus dari Foto Saya dan tidak bisa dipulihkan.',confirm:'Hapus permanen',danger:true});
    if(!ok)return;
    window.photoFiles?.remove(list.filter(p=>p.upload&&p.file).map(p=>p.file));
    for(const p of list){deleted.add(p.id);delete moved[p.id];const i=photos.indexOf(p);if(i>=0)photos.splice(i,1);delete flags[p.id];selection.delete(p.id)}
    document.querySelector('#userPhotoPreview')?.remove();save();rerender();toast(list.length>1?`${list.length} foto dihapus permanen`:'Foto dihapus permanen');
  }
  document.addEventListener('change',e=>{const pick=e.target.closest('[data-photo-album]');if(!pick)return;const photo=photos.find(p=>p.id===pick.dataset.photoAlbum);if(!photo)return;photo.album=pick.value;
    if(!photo.upload)moved[photo.id]=photo.album;
    document.querySelector('#userPhotoPreview')?.remove();save();rerender();toast(`Dipindahkan ke album ${photo.album}`)});
  document.addEventListener('input',e=>{if(e.target.id==='userPhotoSearch'){query=e.target.value.trim().toLowerCase();document.querySelector('.photo-library-content').innerHTML=content()}});
  // Foto diperkecil ke sisi terpanjang 1600 px (JPEG) lalu disimpan di IndexedDB.
  const EDGE=1600,MAX_FILES=50;
  function shrink(file){return new Promise((resolve,reject)=>{const r=new FileReader();r.onerror=reject;r.onload=()=>{const img=new Image();img.onerror=reject;img.onload=()=>{const k=Math.min(1,EDGE/Math.max(img.width,img.height)),c=document.createElement('canvas');c.width=Math.round(img.width*k);c.height=Math.round(img.height*k);c.getContext('2d').drawImage(img,0,0,c.width,c.height);window.photoFiles.fromCanvas(c,.82,'photo').then(resolve,reject)};img.src=r.result};r.readAsDataURL(file)})}
  document.addEventListener('change',async e=>{if(e.target.id!=='userPhotoUpload')return;
    const files=[...e.target.files].filter(f=>f.type.startsWith('image/'));e.target.value='';
    if(!files.length){toast('Pilih file gambar (JPG, PNG, atau WebP)');return}
    const take=files.slice(0,MAX_FILES),added=[],now=new Date().toISOString();let full=false;
    await window.photoFiles.ready;
    for(const [index,file] of take.entries()){if(full)break;let fileId;try{fileId=await shrink(file)}catch{continue}
      if(!fileId){full=true;break}
      added.push({id:`upload-${Date.now().toString(36)}-${index}`,name:file.name.replace(/\.[^.]+$/,''),at:now,date:longDate(now),album:'Upload terbaru',tone:tones[index%tones.length],file:fileId,upload:true})}
    if(!added.length){toast(full?'Penyimpanan perangkat penuh. Hapus beberapa foto lalu coba lagi.':'Foto tidak bisa dibaca');return}
    photos.unshift(...added);
    if(!save()){photos.splice(0,added.length);window.photoFiles.remove(added.map(p=>p.file));rerender();toast('Penyimpanan perangkat penuh. Hapus beberapa foto lalu coba lagi.');return}
    activeView='photos';rerender();
    toast(full?`${added.length} foto diunggah · penyimpanan perangkat penuh, sisanya dilewati`:`${added.length} foto berhasil diunggah`+(files.length>take.length?` (maksimal ${MAX_FILES} sekaligus)`:''))});
  // Saat file foto selesai dimuat: pindahkan unggahan lama (data URL di localStorage) ke IndexedDB, lalu tampilkan ulang.
  window.photoFiles?.ready.then(async()=>{
    let changed=false;
    for(const p of photos)if(p.upload&&!p.file&&p.src?.startsWith('data:')){const id=await window.photoFiles.adopt(p.src,'photo');if(id){p.file=id;delete p.src;changed=true}}
    if(changed)save();
    if(document.querySelector('#profilePost .user-photo-library'))rerender();
  });
  document.addEventListener('submit',e=>{if(e.target.id!=='createUserAlbumForm')return;e.preventDefault();const data=new FormData(e.target),name=data.get('name').trim();if(albums.some(a=>a.name.toLowerCase()===name.toLowerCase())){toast('Nama album sudah dipakai');return}albums.unshift({id:`album-${Date.now()}`,name,privacy:data.get('privacy'),description:String(data.get('description')||'').trim(),collaborative:data.get('collaborative')==='on',tone:tones[albums.length%tones.length],custom:true});save();document.querySelector('#createUserAlbumDialog')?.remove();activeView='albums';rerender();toast('Album berhasil dibuat')});
})();
