
(()=>{
  const tones=['tone-coral','tone-indigo','tone-teal','tone-gold','tone-mix'];
  let activeView='photos',query='',selection=new Set();
  const photos=[
    {id:'p1',name:'Bareng teman sebelum konser',date:'24 Agustus 2026',album:'LaLaLa Fest',tone:'tone-coral',favorite:true},
    {id:'p2',name:'Panggung utama',date:'24 Agustus 2026',album:'LaLaLa Fest',tone:'tone-indigo'},
    {id:'p3',name:'Circle pertama',date:'12 Juli 2025',album:'Hindia Live 2025',tone:'tone-teal',shared:true},
    {id:'p4',name:'Menunggu gate dibuka',date:'12 Juli 2025',album:'Hindia Live 2025',tone:'tone-gold'},
    {id:'p5',name:'Coffee corner',date:'10 Oktober 2025',album:'Coffee Fest',tone:'tone-mix',archived:true},
    {id:'p6',name:'Foto bersama komunitas',date:'10 Oktober 2025',album:'Coffee Fest',tone:'tone-coral',favorite:true}
  ];
  const albums=[
    {id:'a1',name:'LaLaLa Fest 2026',count:14,privacy:'Pribadi',tone:'tone-coral'},
    {id:'a2',name:'Hindia Live 2025',count:9,privacy:'Publik',tone:'tone-teal'},
    {id:'a3',name:'Circle Coffee Fest',count:6,privacy:'Dibagikan',tone:'tone-gold'}
  ];
  const esc=value=>String(value||'').replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
  const nav=[['photos','Foto'],['bought','Dibeli'],['albums','Album'],['favorites','Favorit'],['shared','Dibagikan'],['archive','Arsip'],['trash','Sampah']];

  const boughtCache=new Map(),TONE={'photo-0':'tone-coral','photo-1':'tone-indigo','photo-2':'tone-teal','photo-3':'tone-gold'};
  function boughtPhotos(){return (window.photoPurchases?.list()||[]).map(p=>{if(!boughtCache.has(p.key))boughtCache.set(p.key,{id:'buy-'+p.key,name:`${p.label} · ${p.event}`,date:new Date(p.at).toLocaleDateString('id-ID',{day:'numeric',month:'long',year:'numeric'}),album:p.event,tone:TONE[p.tone]||'tone-indigo',src:p.src,bought:true,order:p.order});return boughtCache.get(p.key)})}
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
    const style=photo.src?`style="background-image:url('${photo.src}')"`:'';
    return `<article class="user-photo-card ${photo.tone}" data-user-photo="${photo.id}" ${style}><button class="photo-select ${selection.has(photo.id)?'selected':''}" data-select-user-photo="${photo.id}" aria-label="Pilih foto">${selection.has(photo.id)?'✓':'○'}</button>${photo.favorite?'<span class="photo-favorite">♥</span>':''}${photo.bought?'<span class="photo-bought">Dibeli</span>':''}<div><b>${esc(photo.name)}</b><small>${esc(photo.album)}</small></div></article>`;
  }
  function albumCard(album){return `<button class="user-album-card ${album.tone}" data-user-album="${album.id}"><div class="album-cover-stack"><i></i><i></i><i></i></div><b>${esc(album.name)}</b><span>${album.count} foto · ${esc(album.privacy)}</span></button>`}
  function content(){
    if(activeView==='albums')return `<div class="user-album-grid">${albums.filter(a=>!query||a.name.toLowerCase().includes(query)).map(albumCard).join('')}</div>`;
    const list=visiblePhotos();
    if(!list.length)return activeView==='bought'?`<div class="photo-empty"><i>▧</i><h3>Belum ada foto yang dibeli</h3><p>Foto yang kamu beli dari album resmi event akan tersimpan di sini tanpa watermark.</p></div>`:`<div class="photo-empty"><i>▧</i><h3>Belum ada foto</h3><p>Upload foto atau pilih tampilan lain.</p></div>`;
    return `<p class="photo-date-label">Terbaru</p><div class="user-photo-grid">${list.map(photoCard).join('')}</div>`;
  }
  function libraryMarkup(){return `<section class="user-photo-library"><header class="photo-library-head"><div><h3>Foto Saya</h3><p>Foto dan album yang kamu unggah.</p></div><div class="photo-head-actions"><button data-create-user-album>＋ Buat album</button><button class="primary" data-upload-user-photo>↑ Upload</button><input type="file" id="userPhotoUpload" accept="image/*" multiple hidden></div></header><div class="photo-search-row"><label><span>⌕</span><input id="userPhotoSearch" value="${esc(query)}" placeholder="Cari foto, album, atau event"></label></div><nav class="photo-library-nav">${nav.map(([id,label])=>`<button class="${activeView===id?'active':''}" data-photo-view="${id}">${label}</button>`).join('')}</nav><div class="photo-selection-bar ${selection.size?'show':''}"><b>${selection.size} dipilih</b><button data-photo-bulk="favorite">♥ Favorit</button><button data-photo-bulk="archive">Arsipkan</button><button data-photo-bulk="trash">Hapus</button><button data-photo-clear>×</button></div><div class="photo-library-content">${content()}</div></section>`}
  window.openPhotoLibraryView=view=>{activeView=view;query='';selection.clear();window.renderOwnPhotoLibrary()};
  window.renderOwnPhotoLibrary=function(){const target=document.querySelector('#profilePost');if(target)target.innerHTML=libraryMarkup()};
  window.renderPublicPhotoLibrary=function(){
    const target=document.querySelector('#publicProfileContent');if(!target)return;
    target.innerHTML=`<section class="user-photo-library public-user-gallery"><header class="photo-library-head"><div><h3>Album Publik</h3><p>Album yang dibagikan pengguna ini.</p></div></header><div class="user-album-grid">${albums.filter(a=>a.privacy!=='Pribadi').map(albumCard).join('')}</div></section>`;
  };
  function rerender(){window.renderOwnPhotoLibrary()}
  function createAlbumDialog(){
    document.querySelector('#createUserAlbumDialog')?.remove();
    document.body.insertAdjacentHTML('beforeend',`<div class="user-gallery-modal" id="createUserAlbumDialog"><form class="user-gallery-dialog" id="createUserAlbumForm"><header><b>Buat album</b><button type="button" data-close-gallery-modal>×</button></header><label>Nama album<input name="name" required maxlength="60" placeholder="Contoh: LaLaLa Fest 2026"></label><label>Deskripsi<textarea name="description" maxlength="180" placeholder="Ceritakan isi album"></textarea></label><label>Privasi<select name="privacy"><option>Pribadi</option><option>Pengikut</option><option>Publik</option><option>Tautan khusus</option></select></label><label class="gallery-check"><input type="checkbox" name="collaborative"> Izinkan orang yang diundang menambahkan foto</label><footer><button type="button" data-close-gallery-modal>Batal</button><button class="primary" type="submit">Buat album</button></footer></form></div>`);
  }
  function previewPhoto(photo){
    document.querySelector('#userPhotoPreview')?.remove();
    const style=photo.src?`style="background-image:url('${photo.src}')"`:'';
    document.body.insertAdjacentHTML('beforeend',`<div class="user-gallery-modal" id="userPhotoPreview"><div class="user-photo-preview"><header><div><b>${esc(photo.name)}</b><span>${esc(photo.date)} · ${esc(photo.album)}${photo.order?` · pesanan ${esc(photo.order)}`:''}</span></div><button data-close-gallery-modal>×</button></header><div class="preview-user-image ${photo.tone}" ${style}></div><footer><button data-toggle-favorite="${photo.id}">${photo.favorite?'♥ Favorit':'♡ Favorit'}</button><button>Bagikan</button>${photo.src?`<a class="button-link" href="${photo.src}" download="${esc(photo.name)}.jpg">Unduh</a>`:'<button>Unduh</button>'}<button data-move-archive="${photo.id}">Arsipkan</button></footer></div></div>`);
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
    const favorite=e.target.closest('[data-toggle-favorite]');if(favorite){const photo=allPhotos().find(p=>p.id===favorite.dataset.toggleFavorite);if(photo){photo.favorite=!photo.favorite;document.querySelector('#userPhotoPreview')?.remove();rerender();toast(photo.favorite?'Ditambahkan ke Favorit':'Dihapus dari Favorit')}return}
    const archive=e.target.closest('[data-move-archive]');if(archive){const photo=allPhotos().find(p=>p.id===archive.dataset.moveArchive);if(photo){photo.archived=true;document.querySelector('#userPhotoPreview')?.remove();rerender();toast('Foto dipindahkan ke Arsip')}return}
    const bulk=e.target.closest('[data-photo-bulk]');if(bulk){allPhotos().filter(p=>selection.has(p.id)).forEach(p=>{if(bulk.dataset.photoBulk==='favorite')p.favorite=true;if(bulk.dataset.photoBulk==='archive')p.archived=true;if(bulk.dataset.photoBulk==='trash')p.trashed=true});selection.clear();rerender();toast('Koleksi diperbarui');return}
    if(e.target.closest('[data-photo-clear]')){selection.clear();rerender();return}
    const album=e.target.closest('[data-user-album]');if(album){activeView='photos';query=(albums.find(a=>a.id===album.dataset.userAlbum)?.name||'').replace(/ 2026$/,'').toLowerCase();rerender();return}
  },true);
  document.addEventListener('input',e=>{if(e.target.id==='userPhotoSearch'){query=e.target.value.trim().toLowerCase();document.querySelector('.photo-library-content').innerHTML=content()}});
  document.addEventListener('change',e=>{if(e.target.id!=='userPhotoUpload')return;const files=[...e.target.files];let remaining=files.length;files.forEach((file,index)=>{const reader=new FileReader();reader.onload=()=>{photos.unshift({id:`upload-${Date.now()}-${index}`,name:file.name.replace(/\.[^.]+$/,''),date:'Baru saja',album:'Upload terbaru',tone:tones[index%tones.length],src:reader.result});remaining-=1;if(!remaining){activeView='photos';rerender();toast(`${files.length} foto berhasil diunggah`)}};reader.readAsDataURL(file)})});
  document.addEventListener('submit',e=>{if(e.target.id!=='createUserAlbumForm')return;e.preventDefault();const data=new FormData(e.target),name=data.get('name').trim();albums.unshift({id:`album-${Date.now()}`,name,count:0,privacy:data.get('privacy'),tone:tones[albums.length%tones.length]});document.querySelector('#createUserAlbumDialog')?.remove();activeView='albums';rerender();toast('Album berhasil dibuat')});
})();
