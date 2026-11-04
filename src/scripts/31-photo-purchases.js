// Pembelian foto album resmi: checkout di dalam halaman, pembelian tersimpan (temmoo_purchases_v1),
// foto yang sudah dibeli ditandai "Dimiliki" di album dan muncul di Foto Saya → Dibeli. Promotor melihat penjualannya.
(()=>{
  const KEY='temmoo_purchases_v1';
  const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const rp=n=>'Rp'+Number(n||0).toLocaleString('id-ID');
  let list=[];try{list=JSON.parse(localStorage.getItem(KEY))||[]}catch{}
  const persist=()=>{try{localStorage.setItem(KEY,JSON.stringify(list));return true}catch{toast('Penyimpanan browser penuh. Pembelian tidak bisa disimpan.');return false}};
  // Kunci foto: event + foto. Foto unggahan promotor punya data-photo-key; foto album contoh memakai nomor urutnya.
  const keyOf=card=>`${eventId(activeEvent)}|${card.dataset.photoKey||'sample-'+card.dataset.paidPhoto}`;
  const owned=key=>list.some(p=>p.key===key);
  // Pembelian lama menyimpan foto sebagai data URL; pindahkan ke IndexedDB supaya localStorage tetap lega.
  window.photoFiles?.ready.then(async()=>{let changed=false;for(const p of list)if(!p.file&&p.src?.startsWith('data:')){const id=await window.photoFiles.adopt(p.src,'bought');if(id){p.file=id;p.src='';changed=true}}if(changed)persist()});
  const METHODS=[['qris','QRIS','Scan dari aplikasi bank atau e-wallet'],['ewallet','E-wallet','GoPay, OVO, DANA, ShopeePay'],['va','Transfer bank','Virtual account BCA, BNI, BRI, Mandiri']];

  window.photoPurchases={
    list:()=>list.slice(),
    forEvent:id=>{const xs=list.filter(p=>p.eventId===id);return {count:xs.length,total:xs.reduce((a,p)=>a+p.price,0)}},
  };

  // Tandai foto yang sudah dimiliki di tab Album (layar 59).
  const base=template;
  template=function(n){
    const html=base(n);
    if(n!==59||!list.length)return html;
    const box=document.createElement('div');box.innerHTML=html;let mine=0;
    box.querySelectorAll('.official-photo-card').forEach(card=>{if(!owned(keyOf(card)))return;mine++;card.classList.add('owned');card.querySelector('[data-select-photo]')?.remove();const b=card.querySelector('b');if(b)b.textContent='✓ Dimiliki'});
    const bar=box.querySelector('.album-toolbar span');if(bar&&mine)bar.insertAdjacentHTML('beforeend',` · <em class="album-owned-count">${mine} sudah kamu miliki</em>`);
    return box.innerHTML;
  };

  function checkoutHtml(items,method){
    const total=items.reduce((a,x)=>a+x.price,0);
    return `<header><div><small>CHECKOUT FOTO</small><h3>${esc(items[0].event)}</h3></div><button type="button" class="dialog-x" data-checkout-close aria-label="Tutup">×</button></header>
      <div class="checkout-items">${items.slice(0,6).map(x=>`<div class="checkout-thumb ${x.view?'':x.tone}" ${x.view?`style="background-image:url(${x.view})"`:''}><span>${esc(x.label)}</span></div>`).join('')}${items.length>6?`<div class="checkout-more">+${items.length-6}</div>`:''}</div>
      <div class="checkout-lines"><div><span>${items.length} foto resolusi penuh tanpa watermark</span><b>${rp(total)}</b></div><div><span>Biaya layanan</span><b>Rp0</b></div><div class="total"><span>Total</span><b>${rp(total)}</b></div></div>
      <fieldset class="checkout-methods"><legend>Metode pembayaran</legend>${METHODS.map(([v,t,s])=>`<label><input type="radio" name="checkout-method" value="${v}" ${v===method?'checked':''}><span><b>${t}</b><small>${s}</small></span></label>`).join('')}</fieldset>
      <p class="checkout-terms">${legalText('Dengan membayar, kamu menyetujui Ketentuan Pembelian Foto dan Kebijakan Privasi Temmoo.','By paying, you agree to the Temmoo Photo Purchase Terms and Privacy Policy.')}</p><p class="checkout-note">Prototipe: pembayaran disimulasikan, tidak ada uang yang ditarik.</p>
      <footer><button type="button" data-checkout-close>Batal</button><button type="button" class="primary" data-checkout-pay>Bayar ${rp(total)}</button></footer>`;
  }

  window.openPhotoCheckout=function(){
    const cards=[...document.querySelectorAll('.official-photo-card.selected:not(.owned)')];if(!cards.length)return;
    const event=events[activeEvent]?.[0]||'Event',eid=eventId(activeEvent);
    const items=cards.map(card=>({key:keyOf(card),eventId:eid,event,label:'Foto '+String(card.dataset.paidPhoto).padStart(2,'0'),price:albumPhotoPrice(card),src:card.dataset.file?'':card.dataset.src||'',from:card.dataset.file||'',view:card.dataset.src||'',tone:[...card.classList].find(c=>/^photo-\d$/.test(c))||'photo-0'}));
    let method='qris';
    const d=openAppDialog({label:'Checkout foto',className:'checkout',html:checkoutHtml(items,method)});
    const bind=()=>{
      d.box.querySelectorAll('[data-checkout-close]').forEach(b=>b.onclick=()=>d.close(false));
      d.box.querySelectorAll('[name=checkout-method]').forEach(r=>r.onchange=()=>{method=r.value});
      const pay=d.box.querySelector('[data-checkout-pay]');
      if(pay){pay.focus();pay.onclick=()=>{
        pay.disabled=true;pay.textContent='Memproses pembayaran…';
        setTimeout(async()=>{
          const order='TMO-'+Date.now().toString(36).toUpperCase().slice(-6),at=Date.now(),fresh=items.filter(x=>!owned(x.key));
          // Foto yang dibeli disalin jadi file sendiri, jadi tetap ada walau promotor menghapusnya dari album.
          for(const x of fresh)if(x.from)x.file=await window.photoFiles?.copy(x.from,'bought')||'';
          list.unshift(...fresh.map(({from,view,...x})=>({...x,order,method,at})));
          if(!persist()){window.photoFiles?.remove(list.splice(0,fresh.length).map(x=>x.file));d.close(false);return}
          const total=fresh.reduce((a,x)=>a+x.price,0);
          d.box.innerHTML=`<div class="checkout-done"><div class="success-mark">✓</div><h3>Pembayaran berhasil</h3><p>${fresh.length} foto dari ${esc(event)} sudah jadi milikmu, tanpa watermark.</p><div class="checkout-lines"><div><span>Nomor pesanan</span><b>${order}</b></div><div><span>Dibayar lewat ${METHODS.find(m=>m[0]===method)[1]}</span><b>${rp(total)}</b></div></div><footer><button type="button" data-checkout-close>Kembali ke album</button><button type="button" class="primary" data-checkout-gallery>Lihat di Foto Saya</button></footer></div>`;
          d.box.querySelectorAll('[data-checkout-close]').forEach(b=>b.onclick=()=>d.close(true));
          const go=d.box.querySelector('[data-checkout-gallery]');go.focus();
          go.onclick=()=>{d.close(true);closeFlow();show('profile');document.querySelector('[data-profile-tab="album"]')?.click();setTimeout(()=>window.openPhotoLibraryView?.('bought'),20)};
          openFlow(59,false);
        },700);
      }}
    };
    bind();
  };
})();
