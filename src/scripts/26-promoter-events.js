// Satu akun promotor bisa mengelola banyak event.
// Data: promoterState.events (daftar) + promoterState.activeEventId. promoterState.event tetap ada sebagai
// penunjuk ke event yang sedang dipilih, sehingga kode lama (Kelola event, status, admin, Event Hub) tetap jalan.
(()=>{
  const esc=escapeText,nf=n=>Number(n).toLocaleString('id-ID');
  const blank=()=>({id:'e'+Date.now().toString(36)+Math.random().toString(36).slice(2,5),name:'',category:'Musik',date:'',dateShort:'',time:'',venue:'',description:'',ticketUrl:'',capacity:500,status:'draft',submittedAt:'',reviewNote:'',publishedIndex:null,announcements:[]});

  /* ---------- Migrasi dari format satu event ---------- */
  if(!Array.isArray(promoterState.events)){
    const first={...promoterState.event,id:promoterState.event?.id||'e1'};
    if(promoterState.announcements?.length&&!first.announcements)first.announcements=promoterState.announcements;
    promoterState.events=[first];promoterState.activeEventId=first.id;delete promoterState.announcements;
  }
  promoterState.events.forEach(e=>{if(!e.id)e.id=blank().id});
  if(!promoterState.events.some(e=>e.id===promoterState.activeEventId))promoterState.activeEventId=promoterState.events[0]?.id;
  delete promoterState.event;
  Object.defineProperty(promoterState,'event',{enumerable:false,configurable:true,
    get(){return promoterState.events.find(e=>e.id===promoterState.activeEventId)||promoterState.events[0]},
    set(v){const i=promoterState.events.findIndex(e=>e.id===promoterState.activeEventId);const next={...v,id:promoterState.activeEventId};if(i<0)promoterState.events.push(next);else promoterState.events[i]=next}});
  savePromoter();

  const select=id=>{if(promoterState.events.some(e=>e.id===id)){promoterState.activeEventId=id;savePromoter()}};
  window.selectPromoterEvent=select;

  // Semua event yang terbit harus masuk katalog, bukan hanya event yang sedang dipilih.
  const baseSync=syncPublishedEvent;
  syncPublishedEvent=function(){const keep=promoterState.activeEventId;promoterState.events.filter(e=>e.status==='published').forEach(e=>{promoterState.activeEventId=e.id;baseSync()});promoterState.activeEventId=keep};
  syncPublishedEvent();try{render()}catch{}

  /* ---------- Ringkasan semua event (layar 64) ---------- */
  const STATUS={draft:['Draft','draft'],changes:['Perlu revisi','changes'],submitted:['Diajukan','review'],review:['Ditinjau','review'],published:['Terbit','published']};
  let filter='all',confirmDelete=null;
  const groupOf=e=>{if(e.status!=='published')return ['submitted','review'].includes(e.status)?'waiting':'draft';const ph=window.promoterInsights?.phase(e);return ph?.key==='finished'?'finished':'active'};
  const sortKey=e=>{const d=window.promoterInsights?.eventDate(e);return d?d.getTime():Infinity};
  function row(e){
    const st=STATUS[e.status]||STATUS.draft,g=groupOf(e),ph=window.promoterInsights?.phase(e),s=e.status==='published'?window.promoterInsights.stats(e):null;
    const when=!e.date?'Tanggal belum diisi':ph?.days==null?e.date:ph.key==='finished'?`${e.date} · selesai`:ph.key==='today'?`${e.date} · hari ini`:`${e.date} · ${ph.days} hari lagi`;
    const metrics=s?`<div class="pe-metrics"><span><b>${nf(s.people)}</b> peminat</span><span><b>${nf(g==='finished'?s.attended:s.going)}</b> ${g==='finished'?'hadir':'mau datang'}</span></div>`:`<div class="pe-metrics muted">${e.status==='changes'?esc(e.reviewNote||'Perlu perbaikan'):['submitted','review'].includes(e.status)?'Menunggu Tim Temmoo':'Belum diajukan'}</div>`;
    const go=e.status==='draft'||e.status==='changes'?65:71,label=e.status==='draft'?'Lanjutkan':e.status==='changes'?'Perbaiki':'Buka';
    const del=e.status==='draft'?`<button type="button" class="pe-del" data-pe-delete="${e.id}">${confirmDelete===e.id?'Yakin hapus?':'Hapus'}</button>`:'';
    return `<article class="pe-row"><div class="pe-date">${esc(e.dateShort||'—').replace(' ','<br>')}</div><div class="pe-main"><b>${esc(e.name||'Event tanpa nama')}</b><span>${esc(when)}${e.venue?' · '+esc(e.venue):''}</span>${metrics}</div><em class="status-chip ${st[1]}">${st[0]}</em><div class="pe-actions">${del}<button type="button" class="pe-open" data-pe-open="${e.id}" data-pe-go="${go}">${label}</button></div></article>`;
  }
  function portfolio(){
    const list=[...promoterState.events].sort((a,b)=>sortKey(a)-sortKey(b));
    const counts={all:list.length,active:0,waiting:0,draft:0,finished:0};list.forEach(e=>counts[groupOf(e)]++);
    const published=list.filter(e=>e.status==='published').map(e=>window.promoterInsights.stats(e));
    const people=published.reduce((a,s)=>a+s.people,0),going=published.reduce((a,s)=>a+s.going,0);
    const shown=list.filter(e=>filter==='all'||groupOf(e)===filter);
    const tabs=[['all','Semua'],['active','Aktif'],['waiting','Menunggu'],['draft','Draft & revisi'],['finished','Selesai']];
    return `<div class="ins-kpis"><article><span>Event aktif</span><b>${counts.active}</b><small>Terbit & belum berlangsung</small></article><article><span>Menunggu tinjauan</span><b>${counts.waiting}</b><small>Diperiksa Tim Temmoo</small></article><article><span>Total peminat</span><b>${nf(people)}</b><small>Dari ${published.length} event terbit</small></article><article><span>Mau datang</span><b>${nf(going)}</b><small>Event yang akan datang</small></article></div>
      <section class="pe-list"><header><div><h2>Event saya</h2><p>${counts.all} event · ${esc(promoterState.organization)}</p></div><button type="button" class="pe-new" data-pe-new>＋ Buat event baru</button></header>
      <div class="pe-tabs">${tabs.map(([k,l])=>`<button type="button" class="${filter===k?'active':''}" data-pe-filter="${k}">${l} <span>${counts[k]}</span></button>`).join('')}</div>
      ${shown.length?shown.map(row).join(''):`<div class="ins-empty"><b>${counts.all?'Tidak ada event di kategori ini':'Belum ada event'}</b><span>${counts.all?'Pilih tab lain atau buat event baru.':'Buat event pertamamu untuk mulai mengumpulkan peserta.'}</span></div>`}
      <p class="pe-note">Angka peserta pada event terbit adalah data contoh prototipe.</p></section>`;
  }
  // Pemilih event di atas halaman per event (dashboard, kelola, status).
  function switcher(){
    const opts=promoterState.events.map(e=>`<option value="${e.id}" ${e.id===promoterState.activeEventId?'selected':''}>${esc(e.name||'Event tanpa nama')} · ${(STATUS[e.status]||STATUS.draft)[0]}</option>`).join('');
    return `<div class="pe-switch"><button type="button" data-go="64">← Semua event</button><label><span>Event</span><select data-pe-select aria-label="Pilih event">${opts}</select></label></div>`;
  }

  const baseTemplate=template;
  template=function(n){
    const promoter=typeof isPromoter==='function'&&isPromoter();
    if(n===64&&promoter){
      let html=baseTemplate(64);
      html=html.replace(/(<main class="promoter-main">[\s\S]*?<\/header>)[\s\S]*(<\/main>)/,(m,head,end)=>head.replace(/<h1>[^<]*<\/h1><p>[^<]*<\/p>/,`<h1>Ringkasan</h1><p>Semua event yang kamu kelola di satu tempat</p>`)+portfolio()+end);
      return nav(html,64);
    }
    let html=baseTemplate(n);
    if(promoter&&[65,66,71].includes(n))html=html.replace('<main class="promoter-main">','<main class="promoter-main">'+switcher());
    if(promoter&&[65,66,67,71].includes(n))html=nav(html,n);
    if(promoter&&n===71)html=html.replace(/<h1>Dashboard Promotor<\/h1><p>[^<]*<\/p>/,'<h1>Dashboard event</h1><p>Pantau peserta, rencana kehadiran, dan pengumuman untuk event ini</p>');
    if(n===61)html=adminQueue(html);
    return html;
  };
  // Menu Promotor Studio: "Kelola event" diganti "Buat event baru" (event dipilih dari Ringkasan).
  function nav(html,n){
    html=html.replace(/<button class="(?:active)?" data-go="64">Ringkasan<\/button>/,`<button class="${[64,71].includes(n)?'active':''}" data-go="64">Ringkasan</button>`);
    html=html.replace(/<button class="(?:active)?" data-go="65">Kelola event<\/button>/,`<button class="${n===65&&!promoterState.event.name?'active':''}" data-pe-new>＋ Buat event</button>`);
    if(n===64)html=html.replace('<button data-promoter-preview>Pratinjau publik</button>','');
    return html;
  }

  /* ---------- Admin: tinjau semua event yang menunggu ---------- */
  function adminQueue(html){
    const pending=promoterState.events.filter(e=>['submitted','review','changes'].includes(e.status));
    const rows=pending.length?pending.map(e=>`<div class="admin-list-row"><i class="event-admin-icon">E</i><div><b>${esc(e.name)}</b><span>${esc(promoterState.organization)} · ${esc(e.date)} · ${(STATUS[e.status]||STATUS.draft)[0]}</span></div><button data-admin-review-event data-pe-id="${e.id}">Periksa</button></div>`).join('')
      :'<div class="approval-empty"><i>✓</i><h3>Tidak ada event menunggu</h3><p>Semua pengajuan event sudah ditinjau.</p></div>';
    html=html.replace(/<section class="admin-panel">(?:<div class="admin-list-row"><i class="event-admin-icon">E<\/i>[\s\S]*?<\/button><\/div>|<div class="approval-empty">[\s\S]*?<\/div>)/,'<section class="admin-panel">'+rows);
    const live=promoterState.events.filter(e=>e.status==='published').length;
    return html.replace(/(<span>Menunggu event<\/span><b>)\d+/,`$1${pending.length}`).replace(/(<span>Event aktif<\/span><b>)\d+/,`$1${46+live}`);
  }

  /* ---------- Event ---------- */
  document.addEventListener('click',e=>{
    const pick=e.target.closest('[data-admin-review-event][data-pe-id]');if(pick){select(pick.dataset.peId);return}
    if(e.target.closest('[data-pe-new]')){e.preventDefault();e.stopPropagation();const ev=blank();promoterState.events.push(ev);select(ev.id);openFlow(65);toast('Draft event baru dibuat');return}
    const open=e.target.closest('[data-pe-open]');if(open){e.stopPropagation();confirmDelete=null;select(open.dataset.peOpen);openFlow(+open.dataset.peGo);return}
    const f=e.target.closest('[data-pe-filter]');if(f){filter=f.dataset.peFilter;confirmDelete=null;openFlow(64,false);return}
    const del=e.target.closest('[data-pe-delete]');if(del){e.stopPropagation();const id=del.dataset.peDelete;
      if(confirmDelete!==id){confirmDelete=id;openFlow(64,false);return}
      confirmDelete=null;promoterState.events=promoterState.events.filter(x=>x.id!==id||x.status!=='draft');
      if(!promoterState.events.length){const ev=blank();promoterState.events.push(ev)}
      if(!promoterState.events.some(x=>x.id===promoterState.activeEventId))promoterState.activeEventId=promoterState.events[0].id;
      savePromoter();toast('Draft dihapus');openFlow(64,false);return}
  },true);
  document.addEventListener('change',e=>{const s=e.target.closest('[data-pe-select]');if(!s)return;select(s.value);
    const ev=promoterState.event,target=flowCurrent===65&&!['draft','changes'].includes(ev.status)?71:flowCurrent;openFlow(target,false)});
})();
