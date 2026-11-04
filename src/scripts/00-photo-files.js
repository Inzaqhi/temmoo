// Penyimpanan file foto di IndexedDB (temmoo_files). localStorage hanya muat ~5 MB per situs sehingga cepat penuh oleh
// foto; IndexedDB bisa ratusan MB. Data kecil (nama, album, harga, tanda) tetap di localStorage dan hanya menyimpan
// ID file. Semua file dimuat ke memori saat halaman dibuka (photoFiles.ready), lalu ditampilkan lewat URL blob.
// Kalau IndexedDB tidak tersedia, file hanya bertahan sampai halaman ditutup (photoFiles.persistent=false).
(()=>{
  const DB='temmoo_files',STORE='files';
  const blobs=new Map(),urls=new Map();
  let db=null;
  const keep=(id,blob)=>{if(urls.has(id))URL.revokeObjectURL(urls.get(id));blobs.set(id,blob);urls.set(id,URL.createObjectURL(blob))};
  const drop=id=>{if(urls.has(id))URL.revokeObjectURL(urls.get(id));blobs.delete(id);urls.delete(id)};
  const run=(mode,fn)=>new Promise((resolve,reject)=>{const t=db.transaction(STORE,mode);const out=fn(t.objectStore(STORE));t.oncomplete=()=>resolve(out);t.onerror=t.onabort=()=>reject(t.error)});
  function open(){return new Promise((resolve,reject)=>{
    let r;try{r=indexedDB.open(DB,1)}catch(e){reject(e);return}
    r.onupgradeneeded=()=>r.result.createObjectStore(STORE);r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error);r.onblocked=()=>reject(new Error('blocked'));
  })}
  let n=0;const newId=prefix=>`${prefix||'file'}-${Date.now().toString(36)}-${(++n).toString(36)}${Math.random().toString(36).slice(2,6)}`;
  function fromDataUrl(url){const [head,data]=url.split(',');const type=(head.match(/^data:([^;]+)/)||[])[1]||'image/jpeg';const bin=atob(data),bytes=new Uint8Array(bin.length);for(let i=0;i<bin.length;i++)bytes[i]=bin.charCodeAt(i);return new Blob([bytes],{type})}

  const api=window.photoFiles={
    persistent:false,
    url:id=>urls.get(id)||'',
    has:id=>blobs.has(id),
    // Simpan blob; false bila penyimpanan perangkat penuh (file tidak disimpan sama sekali).
    async put(id,blob){keep(id,blob);if(!db)return true;
      try{await run('readwrite',s=>s.put(blob,id));return true}catch{drop(id);return false}},
    async add(blob,prefix){const id=newId(prefix);return await api.put(id,blob)?id:null},
    async copy(from,prefix){const blob=blobs.get(from);return blob?api.add(blob,prefix):null},
    async remove(ids){ids=[].concat(ids).filter(Boolean);ids.forEach(drop);if(db&&ids.length)try{await run('readwrite',s=>ids.forEach(id=>s.delete(id)))}catch{}},
    // Pindahkan foto lama (data URL di localStorage) ke IndexedDB; mengembalikan ID file atau null.
    adopt:(dataUrl,prefix)=>{try{return api.add(fromDataUrl(dataUrl),prefix)}catch{return Promise.resolve(null)}},
    // Ubah kanvas jadi JPEG lalu simpan.
    async fromCanvas(canvas,quality,prefix){const blob=await new Promise(r=>canvas.toBlob(r,'image/jpeg',quality));return blob?api.add(blob,prefix):null},
    usage:()=>[...blobs.values()].reduce((a,b)=>a+b.size,0),
  };
  api.ready=(async()=>{
    try{db=await open();
      const all=await new Promise((resolve,reject)=>{const t=db.transaction(STORE),s=t.objectStore(STORE),k=s.getAllKeys(),v=s.getAll();t.oncomplete=()=>resolve(k.result.map((key,i)=>[key,v.result[i]]));t.onerror=()=>reject(t.error)});
      for(const [key,blob] of all)keep(key,blob);api.persistent=true;
    }catch{db=null}
  })();
})();
