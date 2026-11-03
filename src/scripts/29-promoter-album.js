// Album resmi promotor (layar 76): unggah foto event, atur harga per foto, terbitkan ke tab Album (layar 59).
// Foto disimpan terpisah dari data promotor (temmoo_album_v1) supaya penyimpanan yang penuh tidak merusak data organisasi.
(()=>{
  const ALBUM=76,KEY='temmoo_album_v1',MAX=30,MAX_MB=10,EDGE=640;
  const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const rp=n=>'Rp'+Number(n||0).toLocaleString('id-ID');
  let store={};try{store=JSON.parse(localStorage.getItem(KEY))||{}}catch{}
  const persist=()=>{try{localStorage.setItem(KEY,JSON.stringify(store));return true}catch{toast('Penyimpanan browser penuh. Hapus beberapa foto lalu coba lagi.');return false}};
  const photos=ev=>store[ev.id]||(store[ev.id]=[]);
  const meta=ev=>ev.album||(ev.album={status:'draft',defaultPrice:10000});
  const can=a=>!!window.promoterTeam?.can(a);
  const full=()=>window.promoterApp?.get?.().tier==='full';
  const started=ev=>{const ph=window.promoterInsights?.phase(ev);return !!ph&&ph.key!=='upcoming'};
  const ownAt=i=>(promoterState.events||[]).find(e=>e.status==='published'&&e.publishedIndex===i);
  let busy=false;

  function resize(file){return new Promise((resolve,reject)=>{
    const r=new FileReader();r.onerror=reject;
    r.onload=()=>{const img=new Image();img.onerror=reject;img.onload=()=>{const k=Math.min(1,EDGE/Math.max(img.width,img.height)),c=document.createElement('canvas');c.width=Math.round(img.width*k);c.height=Math.round(img.height*k);c.getContext('2d').drawImage(img,0,0,c.width,c.height);resolve({src:c.toDataURL('image/jpeg',.72),w:img.width,h:img.height})};img.src=r.result};
    r.readAsDataURL(file);
  })}

  function page(){
    const ev=promoterState.event,m=meta(ev),list=photos(ev),pub=m.status==='published',edit=can('edit');
    if(!full())return `<section class="team-card album-locked"><div class="ins-empty"><b>Penjualan album butuh Promotor Penuh</b><span>Tingkatkan akun dengan verifikasi identitas untuk menjual foto resmi event.</span></div><div class="pro-actions"><button class="pro-btn" data-tier-upgrade>Tingkatkan ke Promotor Penuh</button></div></section>`;
    const total=list.reduce((a,p)=>a+Number(p.price||0),0),sold=ev.publishedIndex!=null&&window.photoPurchases?window.photoPurchases.forEvent(eventId(ev.publishedIndex)):{count:0,total:0};
    const publish=!pub&&can('submit')?`<button class="pro-btn" data-album-publish ${list.length&&started(ev)?'':'disabled'}>Terbitkan album</button>`:'';
    return `<section class="team-card album-manager">
      <header class="album-head"><div><em class="status-chip ${pub?'published':'draft'}">${pub?'Terbit':'Draft'}</em><b>${list.length} foto</b><span>${list.length?`Total harga semua foto ${rp(total)}`:'Belum ada foto'}${pub&&m.publishedAt?` · terbit ${new Date(m.publishedAt).toLocaleDateString('id-ID',{day:'numeric',month:'long'})}`:''}</span>${sold.count?`<span class="album-sold">Terjual ${sold.count} foto · ${rp(sold.total)}</span>`:''}</div>
        <div class="pro-actions">${pub?`<button class="pro-btn secondary" data-album-view>Lihat sebagai peserta</button>${can('submit')?'<button class="pro-btn secondary" data-album-unpublish>Tarik dari publik</button>':''}`:publish}</div></header>
      ${!started(ev)?`<p class="pro-hint">Event belum berlangsung. Kamu sudah bisa menyiapkan foto; album bisa diterbitkan mulai hari event.</p>`:''}
      ${!pub&&!can('submit')?'<p class="pro-hint">Pemilik atau Admin tim yang menerbitkan album.</p>':''}
      ${edit?`<label class="album-drop ${busy?'busy':''}"><input type="file" accept="image/jpeg,image/png,image/webp" multiple data-album-upload ${list.length>=MAX||busy?'disabled':''}><b>${busy?'Memproses foto…':list.length>=MAX?`Batas ${MAX} foto tercapai`:'▧ Pilih foto untuk diunggah'}</b><small>JPG, PNG, atau WebP · maks ${MAX_MB} MB per foto · hingga ${MAX} foto. Peserta melihat versi ber-watermark; file asli dikirim setelah pembayaran.</small></label>
      <div class="album-price"><label>Harga default per foto<input type="number" min="0" step="1000" value="${m.defaultPrice}" data-album-default></label><button class="pro-btn secondary" data-album-apply ${list.length?'':'disabled'}>Terapkan ke semua foto</button></div>`:''}
      ${list.length?`<div class="album-grid">${list.map((p,i)=>`<figure><div class="album-thumb" style="background-image:url(${p.src})"><span>${String(i+1).padStart(2,'0')}</span></div><figcaption><small title="${esc(p.name)}">${esc(p.name)}</small>${edit?`<label>Rp<input type="number" min="0" step="1000" value="${p.price}" data-album-price="${p.id}" aria-label="Harga ${esc(p.name)}"></label><button data-album-remove="${p.id}" aria-label="Hapus ${esc(p.name)}">Hapus</button>`:`<b>${rp(p.price)}</b>`}</figcaption></figure>`).join('')}</div>`:`<div class="ins-empty"><b>Belum ada foto</b><span>Unggah foto terbaik dari ${esc(ev.name)}. Peserta yang hadir akan mendapat kabar saat album terbit.</span></div>`}
    </section>`;
  }

  // Tab Album untuk peserta: event milik promotor ini memakai foto yang diunggah, bukan foto contoh.
  function publicAlbum(ev){
    const m=meta(ev),list=photos(ev);
    if(m.status!=='published'||!list.length)return `<section class="official-event-album"><div class="ins-empty album-empty"><b>Album resmi belum tersedia</b><span>Promotor akan mengunggah foto setelah event berlangsung.</span>${can('edit')?`<button class="pro-btn" data-go="${ALBUM}">Unggah album</button>`:''}</div></section>`;
    return `<section class="official-event-album"><div class="album-shop-head"><div><span class="official-label">ALBUM RESMI</span><h2>Foto dari ${esc(ev.name)}</h2><p>Diunggah oleh ${esc(promoterState.organization)}. Klik foto untuk melihat pratinjau besar, lalu gunakan tombol centang untuk memilih.</p></div><button data-album-help aria-label="Informasi pembelian foto">?</button></div><div class="album-toolbar"><span><b>${list.length} foto</b> · kamu bisa memilih beberapa foto</span><button data-album-select-all>Pilih semua</button></div><div class="official-photo-grid">${list.map((p,i)=>`<button class="official-photo-card has-photo" style="background-image:url(${p.src})" data-src="${p.src}" data-photo-key="${p.id}" data-price="${Number(p.price)||0}" data-paid-photo="${i+1}" aria-label="Lihat pratinjau ${esc(p.name)}"><span class="photo-watermark">TEMMOO PREVIEW</span><i data-select-photo role="checkbox" aria-label="Pilih foto ${i+1}" aria-checked="false">✓</i><small>Foto ${String(i+1).padStart(2,'0')}</small><b>${rp(p.price)}</b></button>`).join('')}</div><div class="album-purchase-bar"><div><small id="albumSelectionText">Belum ada foto dipilih</small><b id="albumSelectionPrice">Rp0</b></div><button data-buy-event-photos disabled>Beli & download</button></div></section>`;
  }

  const base=template;
  template=function(n){
    if(n===ALBUM){
      if(!(typeof isPromoter==='function'&&isPromoter()))return base(64);
      return window.promoterNav(promoterPage('Album resmi',`${esc(promoterState.event.name)} · ${esc(promoterState.event.date||'')}`,page()),71)
        .replace(/(<small>[^<]*) · TERVERIFIKASI<\/small>/,`$1 · ${window.promoterApp?window.promoterApp.tierLabel().toUpperCase():'TERVERIFIKASI'}</small>`); // sama seperti halaman Studio lain
    }
    if(n===59){const ev=ownAt(activeEvent);if(ev)return eventHero()+eventTabs(59)+publicAlbum(ev)}
    return base(n);
  };
  const rerender=()=>openFlow(ALBUM,false);

  document.addEventListener('change',async e=>{
    const input=e.target.closest('[data-album-upload]');
    if(input){
      const ev=promoterState.event,list=photos(ev),m=meta(ev),files=[...input.files];input.value='';
      const ok=files.filter(f=>/^image\/(jpeg|png|webp)$/.test(f.type)&&f.size<=MAX_MB*1048576),room=MAX-list.length,take=ok.slice(0,room);
      const skipped=files.length-take.length;
      if(!take.length){toast(files.length?'Foto harus JPG, PNG, atau WebP dan maksimal 10 MB':'Tidak ada foto dipilih');return}
      busy=true;rerender();
      for(const f of take){try{const r=await resize(f);list.push({id:'f'+Date.now().toString(36)+Math.random().toString(36).slice(2,6),name:f.name,price:m.defaultPrice,...r})}catch{}}
      busy=false;
      if(!persist())list.splice(list.length-take.length);
      window.promoterTeam?.log(`mengunggah ${take.length} foto ke album “${ev.name}”`);
      toast(`${take.length} foto ditambahkan${skipped?` · ${skipped} dilewati (format, ukuran, atau batas ${MAX} foto)`:''}`);rerender();return;
    }
    const price=e.target.closest('[data-album-price]');
    if(price){const p=photos(promoterState.event).find(x=>x.id===price.dataset.albumPrice);if(p){p.price=Math.max(0,Math.round(Number(price.value)||0));persist();rerender()}return}
    const def=e.target.closest('[data-album-default]');
    if(def){meta(promoterState.event).defaultPrice=Math.max(0,Math.round(Number(def.value)||0));savePromoter();return}
  });
  document.addEventListener('click',e=>{
    const ev=promoterState.event;
    if(e.target.closest('[data-album-apply]')){const m=meta(ev),d=document.querySelector('[data-album-default]');if(d)m.defaultPrice=Math.max(0,Math.round(Number(d.value)||0));photos(ev).forEach(p=>p.price=m.defaultPrice);savePromoter();persist();toast(`Semua foto ${rp(m.defaultPrice)}`);rerender();return}
    const rm=e.target.closest('[data-album-remove]');if(rm){const list=photos(ev),i=list.findIndex(p=>p.id===rm.dataset.albumRemove);if(i>=0)list.splice(i,1);if(!list.length&&meta(ev).status==='published'){meta(ev).status='draft';savePromoter()}persist();toast('Foto dihapus');rerender();return}
    if(e.target.closest('[data-album-publish]')){const m=meta(ev);if(!photos(ev).length||!started(ev)||!can('submit'))return;m.status='published';m.publishedAt=Date.now();savePromoter();syncPublishedEvent();
      window.promoterTeam?.log(`menerbitkan album resmi “${ev.name}” (${photos(ev).length} foto)`);
      pushNotif({kind:'event',icon:'▧',who:promoterState.organization,av:promoterState.organization.split(/\s+/).slice(0,2).map(w=>w[0]).join('').toUpperCase(),tone:'gold',text:`menerbitkan album resmi ${ev.name}`,quote:`${photos(ev).length} foto sudah bisa dibeli`,go:ev.publishedIndex!=null?{event:ev.publishedIndex}:{screen:64}});
      toast('Album terbit di tab Album event');rerender();return}
    if(e.target.closest('[data-album-unpublish]')){meta(ev).status='draft';savePromoter();window.promoterTeam?.log(`menarik album resmi “${ev.name}” dari publik`);toast('Album ditarik dari publik');rerender();return}
    if(e.target.closest('[data-album-view]')){syncPublishedEvent();activeEvent=ev.publishedIndex??0;openFlow(59);return}
  });
})();
