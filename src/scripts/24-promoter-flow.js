
// Alur peran Promotor: daftar → ditinjau admin → disetujui. Promotor Studio (layar 64–67) hanya untuk promotor yang disetujui.
// Catatan: di prototipe ini pembatasan hanya di sisi tampilan; pembatasan yang aman memerlukan backend.
(()=>{
  const KEY='temmoo_promoter_app_v1',esc=escapeText;
  const read=()=>{try{return JSON.parse(localStorage.getItem(KEY))||{status:'none'}}catch{return {status:'none'}}};
  let app=read();
  const save=()=>{try{localStorage.setItem(KEY,JSON.stringify(app))}catch{}};
  window.isPromoter=()=>app.status==='approved';
  const STUDIO=[64,65,66,67],APPLY=69,STATUS=70;
  const statusText={none:'Belum mendaftar',review:'Sedang ditinjau',changes:'Perlu perbaikan',approved:'Disetujui'};

  function setStatus(status,note=''){
    app={...app,status,note,updatedAt:Date.now()};
    if(status==='approved'){promoterState.organization=app.org;promoterState.verified=true;savePromoter();
      pushNotif({kind:'meet',icon:'✓',who:'Tim Temmoo',av:'T',tone:'',text:`menyetujui ${app.org} sebagai promotor. Promotor Studio sudah bisa dipakai.`,go:{screen:64}})}
    if(status==='changes')pushNotif({kind:'event',icon:'!',who:'Tim Temmoo',av:'T',tone:'gold',text:'meminta perbaikan pada pengajuan promotormu',quote:note,go:{screen:STATUS}});
    save();syncChrome(true);
  }

  /* ---------- Layar ---------- */
  function applyScreen(){
    const a=app,v=(k,d='')=>esc(a[k]??d);
    return `<div class="pro-page">
      <section class="pro-hero"><small>TEMMOO UNTUK PROMOTOR</small><h2>Buat event resmi dan bangun komunitasmu</h2><p>Promotor terverifikasi bisa menerbitkan event, membuka grup resmi, mengirim pengumuman, dan menjual album foto resmi.</p></section>
      <div class="pro-benefits"><div><b>▣ Event resmi</b><span>Tampil di Temukan Event dengan label promotor</span></div><div><b>◎ Grup resmi</b><span>Ruang koordinasi peserta sebelum hingga sesudah event</span></div><div><b>♢ Pengumuman</b><span>Kabari peserta yang tertarik dan hadir</span></div><div><b>▧ Album resmi</b><span>Jual foto event langsung ke peserta</span></div></div>
      ${a.status==='changes'?`<div class="pro-note bad"><b>Perlu perbaikan:</b> ${esc(a.note||'Lengkapi data pengajuan.')}</div>`:''}
      <form class="pro-form" data-promoter-apply>
        <h3>Data organisasi</h3>
        <label>Nama organisasi / brand<input name="org" required maxlength="60" value="${v('org')}" placeholder="Contoh: Langit Production"></label>
        <div class="pro-grid">
          <label>Jenis penyelenggara<select name="type">${['Perorangan','Komunitas','Perusahaan / EO'].map(t=>`<option ${a.type===t?'selected':''}>${t}</option>`).join('')}</select></label>
          <label>Kota<input name="city" required maxlength="40" value="${v('city','Surabaya')}"></label>
        </div>
        <div class="pro-grid">
          <label>Email bisnis<input name="email" type="email" required value="${v('email')}" placeholder="halo@organisasi.id"></label>
          <label>Nomor WhatsApp<input name="phone" type="tel" required pattern="[0-9+ \\-]{9,16}" value="${v('phone')}" placeholder="0812 3456 7890"></label>
        </div>
        <label>Instagram atau website <small>Opsional, membantu proses verifikasi</small><input name="link" maxlength="80" value="${v('link')}" placeholder="@organisasi atau organisasi.id"></label>
        <label>Pengalaman menyelenggarakan event<small>Sebutkan 1–3 event yang pernah kamu adakan</small><textarea name="experience" required maxlength="400" placeholder="Contoh: Pasar Seni Surabaya 2025 (±800 pengunjung)">${v('experience')}</textarea></label>
        <h3>Dokumen</h3>
        <label class="pro-file">▧ KTP penanggung jawab ${a.ktp?`<small>(tersimpan: ${esc(a.ktp)})</small>`:''}<input type="file" name="ktp" accept="image/*,.pdf" ${a.ktp?'':'required'}></label>
        <label class="pro-file">▤ Legalitas usaha (NIB / akta) <small>Wajib untuk Perusahaan / EO</small>${a.legal?`<small>(tersimpan: ${esc(a.legal)})</small>`:''}<input type="file" name="legal" accept="image/*,.pdf"></label>
        <label class="pro-check"><input type="checkbox" name="agree" required ${a.status==='changes'?'checked':''}> Saya menjamin data ini benar dan menyetujui Ketentuan Promotor Temmoo, termasuk larangan event fiktif dan penjualan tiket palsu.</label>
        <button class="pro-btn" type="submit">${a.status==='changes'?'Kirim ulang pengajuan':'Kirim pengajuan'}</button>
      </form></div>`;
  }
  function statusScreen(){
    const a=app,st=a.status,steps=[['Pengajuan dikirim',a.submittedAt?new Date(a.submittedAt).toLocaleDateString('id-ID',{day:'numeric',month:'long'}):''],['Ditinjau Tim Temmoo','Biasanya 1–2 hari kerja'],['Promotor Studio aktif','Mulai buat event resmi']];
    const doneUntil=st==='approved'?3:st==='review'||st==='changes'?1:0;
    const head={review:['◷','Pengajuan sedang ditinjau','Tim Temmoo sedang memeriksa data dan dokumenmu. Kamu akan mendapat notifikasi setelah ada keputusan.'],
      changes:['!','Pengajuan perlu diperbaiki',a.note||'Lengkapi data lalu kirim ulang.'],approved:['✓',`${esc(a.org)} sudah terverifikasi`,'Selamat! Kamu sekarang bisa membuat dan mengelola event resmi lewat Promotor Studio.']}[st];
    if(!head)return applyScreen();
    return `<div class="pro-page"><section class="pro-status ${st}"><div class="orb">${head[0]}</div><h2>${head[1]}</h2><p>${head[2]}</p>
      <div class="pro-steps">${steps.map((x,i)=>`<div class="${i<doneUntil?'done':i===doneUntil?'now':''}"><i>${i<doneUntil?'✓':i+1}</i><span><b>${x[0]}</b><small>${x[1]}</small></span></div>`).join('')}</div>
      <div class="pro-summary"><div><span>Organisasi</span><b>${esc(a.org)}</b></div><div><span>Jenis</span><b>${esc(a.type)}</b></div><div><span>Kota</span><b>${esc(a.city)}</b></div><div><span>Kontak</span><b>${esc(a.email)}</b></div></div>
      <div class="pro-actions">${st==='approved'?'<button class="pro-btn" data-go="64">Buka Promotor Studio</button>':st==='changes'?`<button class="pro-btn" data-go="${APPLY}">Perbaiki pengajuan</button>`:''}<button class="pro-btn secondary" data-go="56">Kembali ke Pusat Akun</button></div>
      ${st==='review'?'<div class="pro-demo"><small>FITUR UJI COBA PROTOTIPE: simulasikan keputusan admin</small><div><button data-promoter-sim="approved">✓ Setujui</button><button data-promoter-sim="changes">! Minta perbaikan</button></div></div>':''}
    </section></div>`;
  }
  function lockedScreen(){
    const st=app.status;
    return `<div class="pro-locked"><div class="orb">▣</div><h2>Promotor Studio khusus promotor terverifikasi</h2><p>${st==='review'?'Pengajuanmu sedang ditinjau. Promotor Studio akan terbuka otomatis setelah disetujui.':st==='changes'?'Pengajuanmu perlu diperbaiki sebelum bisa disetujui.':'Daftarkan organisasimu untuk menerbitkan event resmi, membuka grup resmi, dan menjual album foto.'}</p>
      <button class="pro-btn" data-go="${st==='none'?APPLY:STATUS}">${st==='none'?'Daftar sebagai promotor':'Lihat status pengajuan'}</button><button class="pro-btn secondary" data-go="56">Kembali ke Pusat Akun</button></div>`;
  }
  function accountSection(){
    const st=app.status,go=st==='approved'?64:st==='none'?APPLY:STATUS;
    const label=st==='approved'?`Promotor Studio<small>${esc(app.org)} · Kelola event resmi</small>`:st==='none'?'Daftar sebagai promotor<small>Buat event resmi, grup resmi, dan album foto</small>':`Pengajuan promotor<small>${esc(app.org)}</small>`;
    return `<section><h3>Promotor</h3><button data-go="${go}"><span>${label}</span>${st==='none'?'<b>›</b>':`<em class="pro-row-status ${st}">${statusText[st]}</em>`}</button></section>
      <section><h3>Uji coba prototipe</h3><button data-go="63"><span>Portal tim Temmoo<small>Masuk ke Admin Console: gunakan email apa pun berakhiran @temmoo.id</small></span><b>›</b></button></section>`;
  }

  const baseTemplate=template;
  template=function(n){
    const flowEl=document.querySelector('#flowLayer'),title=document.querySelector('#flowTitle'),sub=document.querySelector('#flowIndex');
    const embed=()=>{if(innerWidth>620)flowEl.classList.add('embedded')};
    if(n===APPLY){embed();title.textContent='Daftar sebagai Promotor';sub.textContent='Verifikasi oleh Tim Temmoo';return app.status==='review'||app.status==='approved'?statusScreen():applyScreen()}
    if(n===STATUS){embed();title.textContent='Status Pengajuan Promotor';sub.textContent=statusText[app.status];return statusScreen()}
    if(STUDIO.includes(n)&&!isPromoter()){embed();title.textContent='Promotor Studio';sub.textContent='Akses terbatas';return lockedScreen()}
    let html=baseTemplate(n);
    if(n===56){html=html.replace('<button class="account-logout"',accountSection()+'<button class="account-logout"');title.textContent='Pusat Akun';sub.textContent='Profil, keamanan, dan peran akun'}
    if(n===66&&['submitted','review'].includes(promoterState.event.status)){
      const box='<div class="pro-demo"><small>FITUR UJI COBA PROTOTIPE: simulasikan keputusan Admin Temmoo</small><div><button data-event-sim="publish">✓ Setujui & terbitkan</button><button data-event-sim="changes">! Minta revisi</button></div></div>';
      const i=html.lastIndexOf('</section>');if(i>0)html=html.slice(0,i)+box+html.slice(i);
    }
    if(n===61&&app.status==='review')html=html.replace('<div class="admin-list-row"><i class="event-admin-icon">P</i>',`<div class="admin-list-row"><i class="event-admin-icon">P</i><div><b>${esc(app.org)}</b><span>Pengajuan akun promotor · ${esc(app.type)} · ${esc(app.city)} · oleh ${esc(accountState.handle)}</span></div><div class="pro-admin-actions"><button data-promoter-admin="changes">Minta revisi</button><button data-promoter-admin="approved">Setujui</button></div></div><div class="admin-list-row"><i class="event-admin-icon">P</i>`);
    return html;
  };

  /* ---------- Menu samping & label profil ---------- */
  const svg='<svg viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="16" rx="2"/><path d="M3 9h18M8 14h3M8 17h6"/></svg>';
  document.querySelector('.nav[data-open-screen="11"]')?.insertAdjacentHTML('afterend',`<button class="nav nav-extra" data-open-screen="64" data-promoter-nav hidden>${svg}<span>Promotor Studio</span></button>`);
  function syncChrome(rerender){
    const nav=document.querySelector('[data-promoter-nav]');if(nav)nav.hidden=!isPromoter();
    document.querySelectorAll('#profile .profile h2').forEach(h=>{const pill=h.querySelector('.promoter-pill');if(isPromoter()&&!pill)h.insertAdjacentHTML('beforeend','<span class="promoter-pill">▣ Promotor</span>');if(!isPromoter()&&pill)pill.remove()});
    if(rerender&&[56,61,APPLY,STATUS,...STUDIO].includes(flowCurrent)&&document.querySelector('#flowLayer').classList.contains('open'))openFlow(flowCurrent,false);
  }

  /* ---------- Event ---------- */
  document.addEventListener('submit',e=>{
    const f=e.target.closest('[data-promoter-apply]');if(!f)return;e.preventDefault();
    const d=new FormData(f),type=d.get('type'),legalFile=f.elements.legal.files[0]?.name||app.legal||'';
    if(type==='Perusahaan / EO'&&!legalFile){toast('Perusahaan / EO wajib melampirkan legalitas usaha');f.elements.legal.focus();return}
    app={...app,org:d.get('org').trim(),type,city:d.get('city').trim(),email:d.get('email').trim(),phone:d.get('phone').trim(),link:d.get('link').trim(),experience:d.get('experience').trim(),
      ktp:f.elements.ktp.files[0]?.name||app.ktp,legal:legalFile,status:'review',note:'',submittedAt:Date.now()};
    save();syncChrome();toast('Pengajuan promotor terkirim');openFlow(STATUS);
  });
  // "Kembali ke aplikasi" dari login admin. Tanpa ini, href di preview Claude (iframe srcdoc) membuka halaman lain.
  document.addEventListener('click',e=>{if(!e.target.closest('[data-back-home]'))return;e.preventDefault();closeFlow();show('home')});
  document.addEventListener('click',e=>{
    const ev=e.target.closest('[data-event-sim]');if(!ev)return;e.preventDefault();e.stopPropagation();
    const name=promoterState.event.name;
    if(ev.dataset.eventSim==='publish'){
      promoterState.event.status='published';promoterState.event.reviewNote='';savePromoter();syncPublishedEvent();render();adminLog(`${name} disetujui dan diterbitkan`);
      pushNotif({kind:'event',icon:'★',who:'Tim Temmoo',av:'T',tone:'',text:`menerbitkan ${name}. Event Hub dan grup resmi sudah aktif.`,go:{screen:66}});toast('Event terbit dan tampil di Temukan Event');
    }else{
      promoterState.event.status='changes';promoterState.event.reviewNote='Tambahkan rundown acara dan pastikan tautan tiket mengarah ke partner resmi.';savePromoter();adminLog(`Revisi diminta untuk ${name}`);
      pushNotif({kind:'event',icon:'!',who:'Tim Temmoo',av:'T',tone:'gold',text:`meminta revisi untuk ${name}`,quote:promoterState.event.reviewNote,go:{screen:66}});toast('Permintaan revisi dikirim');
    }
    openFlow(66,false);
  },true);
  document.addEventListener('click',e=>{
    const sim=e.target.closest('[data-promoter-sim],[data-promoter-admin]');if(!sim)return;e.preventDefault();e.stopPropagation();
    const decision=sim.dataset.promoterSim||sim.dataset.promoterAdmin;
    if(decision==='approved'){setStatus('approved');if(sim.dataset.promoterAdmin)adminLog(`Akun promotor ${app.org} disetujui`);toast('Pengajuan promotor disetujui')}
    else{setStatus('changes','Foto KTP kurang jelas. Unggah ulang foto KTP yang terbaca dan sertakan tautan Instagram/website organisasi.');if(sim.dataset.promoterAdmin)adminLog(`Revisi diminta untuk pengajuan promotor ${app.org}`);toast('Permintaan perbaikan dikirim')}
  },true);
  // subtree: judul profil ditulis ulang oleh skrip lain (tanda verifikasi), jadi label harus dipasang ulang.
  new MutationObserver(()=>syncChrome()).observe(document.querySelector('#profile'),{childList:true,subtree:true});
  syncChrome();
})();
