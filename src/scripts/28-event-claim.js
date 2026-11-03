// Kalender kurasi & klaim halaman event.
// Tim Temmoo mengisi kalender (event contoh + event tambahan di layar 75). Event kurasi bisa diklaim promotor
// terverifikasi (layar 74); setelah disetujui, event itu masuk Promotor Studio sebagai event resmi dengan ID yang sama,
// sehingga peminat dan status kehadiran pengguna tetap tersambung.
(()=>{
  const CLAIM=74,CAL=75,CLAIMS='temmoo_claims_v1',CURATED='temmoo_curated_v1';
  const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const read=(k,d)=>{try{return JSON.parse(localStorage.getItem(k))??d}catch{return d}};
  const write=(k,v)=>{try{localStorage.setItem(k,JSON.stringify(v))}catch{}};
  const MONTHS=['Januari','Februari','Maret','April','Mei','Juni','Juli','Agustus','September','Oktober','November','Desember'];
  const longDate=iso=>{const [y,m,d]=String(iso||'').split('-').map(Number);return y?`${d} ${MONTHS[m-1]} ${y}`:''};
  const shortDate=iso=>{const [y,m,d]=String(iso||'').split('-').map(Number);return y?`${d} ${MONTHS[m-1].slice(0,3).toUpperCase()}`:''};

  // Contoh: satu event kurasi sudah diklaim penyelenggara lain, supaya tampilan "dikelola organisasi lain" terlihat.
  const SEED={'youth-creative-festival':{status:'approved',org:'Youth Lab Surabaya',external:true}};
  const claims={...SEED,...read(CLAIMS,{})};
  const curated=read(CURATED,[]); // event tambahan dari Tim Temmoo
  const save=()=>{write(CLAIMS,Object.fromEntries(Object.entries(claims).filter(([,c])=>!c.external)));write(CURATED,curated)};
  let target=null,query='',adminReject=null;

  function addToCatalog(c){
    if(eventIndexById(c.id)>=0)return; // sudah dimuat sebagai event promotor hasil klaim
    events.push([c.name,shortDate(c.date),c.venue,'0 orang tertarik',c.category]);
    const i=events.length-1;eventMeta[i]={id:c.id,date:c.date,time:c.time,city:c.city,price:c.price,amount:c.amount};eventEndDates[i]=c.date;
  }
  curated.forEach(addToCatalog);
  const refreshCatalog=()=>{try{renderCategorizedEvents()}catch{}try{renderUpcomingRail()}catch{}};
  refreshCatalog();

  const promoter=()=>typeof isPromoter==='function'&&isPromoter();
  const ownEvent=id=>(promoterState.events||[]).find(e=>e.status==='published'&&(e.claimedFrom===id||'promoter-'+e.id===id));
  // official: halaman dikelola promotor (milik sendiri atau organisasi lain); curated: diisi Tim Temmoo, bisa diklaim.
  function info(i){
    const id=eventId(i),own=ownEvent(id);
    if(own)return {id,kind:'official',org:promoterState.organization,own};
    const c=claims[id];
    if(c?.status==='approved')return {id,kind:'official',org:c.org};
    return {id,kind:'curated',claim:c};
  }
  const curatedEntry=id=>curated.find(c=>c.id===id);

  function banner(i){
    const x=info(i);
    if(x.kind==='official')return `<div class="claim-banner official"><span>✓</span><div><b>Halaman resmi</b><small>Dikelola ${esc(x.org)}${x.own?' · organisasimu':''}</small></div>${x.own?`<button data-claim-manage="${esc(x.own.id)}">Kelola di Studio</button>`:''}</div>`;
    const c=x.claim,pending=c?.status==='pending',src=curatedEntry(x.id)?.source;
    return `<div class="claim-banner curated"><span>◆</span><div><b>Dikurasi Tim Temmoo</b><small>${pending?`Klaim oleh ${esc(c.org)} sedang ditinjau`:`Info dikumpulkan dari ${src?esc(src):'sumber publik'}. Penyelenggara bisa mengklaim halaman ini.`}</small></div><button data-claim-start="${esc(x.id)}">${pending?'Lihat status klaim':c?.status==='rejected'?'Ajukan ulang':'Klaim halaman'}</button></div>`;
  }

  /* ---------- Layar 74: klaim halaman ---------- */
  function gate(){
    const app=window.promoterApp?.get?.()||{};
    if(!promoter())return `<section class="pro-locked"><div class="orb">◆</div><h2>Klaim halaman khusus promotor terverifikasi</h2><p>${app.status==='review'?'Pengajuan promotormu sedang ditinjau. Setelah disetujui, kamu bisa mengklaim halaman event yang kamu selenggarakan.':'Daftar sebagai promotor dulu. Tim Temmoo memastikan halaman event hanya dikelola penyelenggara aslinya.'}</p><div class="pro-actions">${app.status==='review'?'<button class="pro-btn" data-go="70">Lihat status pengajuan</button>':'<button class="pro-btn" data-go="69">Daftar sebagai promotor</button>'}</div></section>`;
    if(!window.promoterTeam?.can('submit'))return `<section class="pro-locked"><div class="orb">◆</div><h2>Hanya Pemilik atau Admin tim yang bisa mengklaim</h2><p>Minta Pemilik atau Admin ${esc(promoterState.organization)} mengajukan klaim untuk event ini.</p></section>`;
    return '';
  }
  function picker(){
    const q=query.toLowerCase(),rows=events.map((e,i)=>({e,i,x:info(i)})).filter(r=>r.x.kind==='curated'&&(!q||r.e.join(' ').toLowerCase().includes(q)));
    return `<section class="pro-hero"><small>KALENDER KURASI TEMMOO</small><h2>Event-mu sudah ada di Temmoo?</h2><p>Tim Temmoo mengisi kalender festival dari sumber publik. Klaim halamannya supaya kamu bisa mengelola info, grup resmi, pengumuman, dan album.</p></section>
      <label class="claim-search"><span>⌕</span><input data-claim-query value="${esc(query)}" placeholder="Cari nama event atau venue" aria-label="Cari event kurasi"></label>
      <div class="claim-list">${rows.length?rows.map(({e,i,x})=>`<article><div class="pe-date">${esc(e[1]).replace(' ','<br>')}</div><div><b>${esc(e[0])} ${endedBadge(i)}</b><span>${esc(e[2])} · ${esc(e[4])}</span>${x.claim?.status==='pending'?'<small class="claim-state pending">Klaim sedang ditinjau</small>':x.claim?.status==='rejected'?'<small class="claim-state rejected">Klaim ditolak · bisa diajukan ulang</small>':''}</div><button data-claim-start="${esc(x.id)}">${x.claim?.status==='pending'?'Status':'Klaim'}</button></article>`).join(''):'<div class="ins-empty"><b>Tidak ada event kurasi yang cocok</b><span>Kalau event-mu belum ada, buat event baru dari Promotor Studio.</span></div>'}</div>`;
  }
  function eventCard(i){const e=events[i],m=eventMeta[i]||{};return `<div class="claim-event"><div class="pe-date">${esc(e[1]).replace(' ','<br>')}</div><div><b>${esc(e[0])}</b><span>${esc(e[2])} · ${esc(e[4])} · ${esc(m.price||'')}</span></div></div>`}
  function claimForm(i,c){
    const app=window.promoterApp?.get?.()||{};
    return `${c?.status==='rejected'?`<div class="pro-note bad"><b>Klaim sebelumnya ditolak:</b> ${esc(c.note||'Bukti belum cukup.')}</div>`:''}
      <form class="pro-form" data-claim-form>
        <h3>Event yang diklaim</h3>${eventCard(i)}
        <h3>Peranmu</h3>
        <div class="pro-tiers claim-roles">${[['organizer','Penyelenggara / EO resmi','Organisasimu yang membuat dan menjalankan event ini.'],['venue','Pengelola venue','Kamu mengelola tempat dan jadwal acara ini.'],['partner','Mitra resmi','Kurator, komunitas, atau perwakilan artis yang ditunjuk penyelenggara.']].map(([v,t,s],k)=>`<label><input type="radio" name="role" value="${v}" ${(c?.role||'organizer')===v?'checked':''}><span><b>${t}</b><small>${s}</small></span></label>`).join('')}</div>
        <h3>Bukti</h3>
        <label>Tautan resmi yang menyebut ${esc(promoterState.organization)} sebagai penyelenggara<input name="link" type="url" required value="${esc(c?.link||app.link||'')}" placeholder="https://instagram.com/akunresmi/p/..."></label>
        <p class="pro-hint">Misalnya unggahan pengumuman event di Instagram resmi, halaman di website resmi, atau halaman penjualan tiket.</p>
        <label class="pro-file">▤ Dokumen pendukung (opsional) <small>Surat kerja sama, kontrak venue, atau surat penunjukan · mempercepat peninjauan</small><input type="file" name="doc" accept="image/*,.pdf"></label>
        <label>Email kerja untuk dihubungi Tim Temmoo<input name="email" type="email" required value="${esc(c?.email||app.email||'')}"></label>
        <label>Catatan untuk Tim Temmoo (opsional)<textarea name="note" rows="3" maxlength="300" placeholder="Contoh: info tanggal di halaman ini sudah berubah, gate dibuka jam 15.00">${esc(c?.message||'')}</textarea></label>
        <label class="pro-check"><input type="checkbox" name="agree" required> Saya berwenang mewakili ${esc(promoterState.organization)} untuk event ini. Klaim palsu dapat membuat akun promotor dinonaktifkan.</label>
        <div class="pro-actions"><button class="pro-btn" type="submit">Ajukan klaim</button><button class="pro-btn secondary" type="button" data-go="${CLAIM}" data-claim-pick>Pilih event lain</button></div>
      </form>`;
  }
  function claimStatus(i,c){
    const steps=[['Klaim diajukan',new Date(c.at).toLocaleDateString('id-ID',{day:'numeric',month:'long'})],['Ditinjau Tim Temmoo','Biasanya 1 hari kerja'],['Halaman resmi','Kelola dari Promotor Studio']];
    return `<section class="pro-status review"><div class="orb">◷</div><h2>Klaim sedang ditinjau</h2><p>Tim Temmoo memeriksa bukti bahwa ${esc(c.org)} menyelenggarakan event ini. Selama ditinjau, halaman tetap tampil sebagai event kurasi.</p>
      <div class="pro-steps">${steps.map((x,k)=>`<div class="${k<1?'done':k===1?'now':''}"><i>${k<1?'✓':k+1}</i><span><b>${x[0]}</b><small>${x[1]}</small></span></div>`).join('')}</div>
      ${eventCard(i)}
      <div class="pro-summary"><div><span>Organisasi</span><b>${esc(c.org)}</b></div><div><span>Peran</span><b>${{organizer:'Penyelenggara / EO',venue:'Pengelola venue',partner:'Mitra resmi'}[c.role]}</b></div><div><span>Bukti</span><b>${esc(c.link)}</b></div>${c.doc?`<div><span>Dokumen</span><b>${esc(c.doc)}</b></div>`:''}<div><span>Kontak</span><b>${esc(c.email)}</b></div></div>
      <div class="pro-actions"><button class="pro-btn secondary" data-claim-cancel="${esc(c.id)}">Batalkan klaim</button></div>
      <div class="pro-demo"><small>FITUR UJI COBA PROTOTIPE: simulasikan keputusan Admin Temmoo</small><div><button data-claim-sim="approve">✓ Setujui klaim</button><button data-claim-sim="reject">! Tolak klaim</button></div></div></section>`;
  }
  function claimScreen(){
    const locked=gate();if(locked)return `<div class="pro-page">${locked}</div>`;
    const i=target?eventIndexById(target):-1;
    if(i<0)return `<div class="pro-page">${picker()}</div>`;
    const x=info(i);
    if(x.kind==='official')return `<div class="pro-page"><section class="pro-status approved"><div class="orb">✓</div><h2>${x.own?'Halaman ini sudah dikelola organisasimu':`Halaman ini dikelola ${esc(x.org)}`}</h2><p>${x.own?'Kelola info event, grup resmi, pengumuman, dan album dari Promotor Studio.':'Kalau menurutmu klaim ini keliru, hubungi Tim Temmoo lewat Bantuan dengan bukti penyelenggaraan.'}</p>${eventCard(i)}<div class="pro-actions">${x.own?`<button class="pro-btn" data-claim-manage="${esc(x.own.id)}">Kelola di Studio</button>`:''}<button class="pro-btn secondary" data-claim-pick>Pilih event lain</button></div></section></div>`;
    return `<div class="pro-page">${x.claim?.status==='pending'?claimStatus(i,x.claim):claimForm(i,x.claim)}</div>`;
  }

  /* ---------- Keputusan klaim (Admin Temmoo) ---------- */
  function decide(id,approve,note){
    const c=claims[id],i=eventIndexById(id);if(!c||c.status!=='pending'||i<0)return;
    const e=events[i],m=eventMeta[i]||{},cur=curatedEntry(id);
    c.decidedAt=Date.now();
    if(approve){
      c.status='approved';
      const ev={id:'e'+Date.now().toString(36)+Math.random().toString(36).slice(2,5),name:e[0],category:e[4],date:longDate(m.date),dateShort:e[1],time:cur?.time||'10.00',venue:e[2],description:cur?.description||`Halaman ${e[0]} kini dikelola langsung oleh ${promoterState.organization}.`,ticketUrl:cur?.ticketUrl||'',price:m.price,amount:m.amount,capacity:500,status:'published',submittedAt:'',reviewNote:'',publishedIndex:i,announcements:[],claimedFrom:id};
      promoterState.events.push(ev);savePromoter();syncPublishedEvent();
      window.promoterTeam?.log(`mengklaim halaman “${e[0]}” dari kalender kurasi`);
      pushNotif({kind:'event',icon:'✓',who:'Tim Temmoo',av:'T',tone:'',text:`menyetujui klaim ${e[0]}. Halaman kini dikelola ${c.org}.`,go:{screen:64}});
      adminLog(`Klaim halaman ${e[0]} oleh ${c.org} disetujui`);
    }else{
      c.status='rejected';c.note=note||'Bukti belum menunjukkan organisasimu sebagai penyelenggara. Kirim tautan resmi yang menyebut nama organisasimu.';
      pushNotif({kind:'event',icon:'!',who:'Tim Temmoo',av:'T',tone:'gold',text:`menolak klaim ${e[0]}`,quote:c.note,go:{screen:CLAIM}});
      adminLog(`Klaim halaman ${e[0]} oleh ${c.org} ditolak: ${c.note}`);
    }
    save();refreshCatalog();
  }

  /* ---------- Layar 75: Kalender kurasi (Admin Console) ---------- */
  const CATS=['Musik','Kuliner','Seni & Budaya','Olahraga','Komunitas'];
  function calendarPage(){
    const rows=events.map((e,i)=>({e,i,x:info(i)})).filter(r=>r.x.kind==='curated'||claims[r.x.id]||curatedEntry(r.x.id)||r.x.own?.claimedFrom);
    const pending=Object.entries(claims).filter(([,c])=>c.status==='pending').map(([id,c])=>({id,c,i:eventIndexById(id)})).filter(r=>r.i>=0);
    const n={all:rows.length,open:rows.filter(r=>r.x.kind==='curated'&&r.x.claim?.status!=='pending').length,claimed:rows.filter(r=>r.x.kind==='official').length};
    const reasons=['Bukti tidak menyebut organisasi ini sebagai penyelenggara','Tautan bukti tidak bisa dibuka','Event diselenggarakan organisasi lain'];
    return adminPage('Kalender kurasi','Event yang diisi Tim Temmoo dan klaim halaman oleh penyelenggara',`
      <div class="admin-stats compact claim-stats"><article><span>Event kurasi</span><b>${n.all}</b></article><article><span>Belum diklaim</span><b>${n.open}</b></article><article><span>Klaim menunggu</span><b>${pending.length}</b></article><article><span>Sudah diklaim</span><b>${n.claimed}</b></article></div>
      <section class="admin-panel claim-admin"><h3>Klaim menunggu keputusan</h3>${pending.length?pending.map(({id,c,i})=>`<div class="admin-list-row"><i class="event-admin-icon">K</i><div><b>${esc(events[i][0])}</b><span>${esc(c.org)} · ${{organizer:'Penyelenggara / EO',venue:'Pengelola venue',partner:'Mitra resmi'}[c.role]} · ${esc(c.link)}${c.doc?` · dokumen ${esc(c.doc)}`:''}</span>${adminReject===id?`<div class="claim-reject">${reasons.map(r=>`<button data-claim-reject-reason="${esc(r)}" data-id="${esc(id)}">${r}</button>`).join('')}</div>`:''}</div><div class="pro-admin-actions"><button data-claim-admin="reject" data-id="${esc(id)}">Tolak</button><button class="ok" data-claim-admin="approve" data-id="${esc(id)}">Setujui</button></div></div>`).join(''):'<div class="ins-empty"><b>Tidak ada klaim yang menunggu</b><span>Klaim dari promotor muncul di sini.</span></div>'}</section>
      <section class="admin-panel claim-admin"><h3>Tambah event ke kalender</h3><form class="pro-form claim-curate" data-curate-form>
        <label>Nama event<input name="name" required maxlength="70" placeholder="Contoh: Festival Rujak Uleg 2027"></label>
        <div class="pro-grid"><label>Tanggal<input name="date" type="date" required></label><label>Jam mulai<input name="time" placeholder="10.00" value="10.00" maxlength="5"></label></div>
        <div class="pro-grid"><label>Venue<input name="venue" required maxlength="80" placeholder="Taman Bungkul"></label><label>Kota<select name="city"><option>Surabaya</option><option>Jakarta</option><option>Bandung</option></select></label></div>
        <div class="pro-grid"><label>Kategori<select name="category">${CATS.map(c=>`<option>${c}</option>`).join('')}</select></label><label>Harga<select name="price"><option>Gratis</option><option>Berbayar</option></select></label></div>
        <label>Kisaran harga atau tautan tiket (opsional)<input name="ticket" maxlength="200" placeholder="Rp50.000 atau https://..."></label>
        <label>Sumber informasi<input name="source" required maxlength="80" placeholder="Contoh: kalender Disbudpar Surabaya"></label>
        <div class="pro-actions"><button class="pro-btn" type="submit">Tambahkan ke kalender</button></div></form></section>
      <section class="admin-panel claim-admin"><h3>Semua event kurasi</h3>${rows.map(({e,i,x})=>`<div class="admin-list-row"><i class="event-admin-icon">${esc(e[1].split(' ')[0])}</i><div><b>${esc(e[0])} ${endedBadge(i)}</b><span>${esc(e[1])} · ${esc(e[2])}${curatedEntry(x.id)?` · sumber: ${esc(curatedEntry(x.id).source)}`:''}</span></div><em class="claim-state ${x.kind==='official'?'approved':x.claim?.status||'open'}">${x.kind==='official'?`Diklaim ${esc(x.org)}`:x.claim?.status==='pending'?'Klaim ditinjau':x.claim?.status==='rejected'?'Klaim ditolak':'Belum diklaim'}</em></div>`).join('')}</section>`);
  }

  /* ---------- Template ---------- */
  const base=template;
  template=function(n){
    if(n===CLAIM){const fl=document.querySelector('#flowLayer');if(innerWidth>620)fl.classList.add('embedded');document.querySelector('#flowTitle').textContent='Klaim halaman event';document.querySelector('#flowIndex').textContent='Kalender kurasi Temmoo';return claimScreen()}
    if(n===CAL){if(accountState.accountType!=='temmoo_official')return base(68);return calendarPage()}
    const html=base(n);
    if([18,20,46].includes(n)){const hero=eventHero();if(html.includes(hero))return html.replace(hero,hero+banner(activeEvent))}
    if(n===64&&promoter()&&html.includes('<section class="pe-list">'))return html.replace('<section class="pe-list">',`<button class="claim-entry" data-go="${CLAIM}" data-claim-pick><span>◆</span><div><b>Event-mu sudah ada di kalender Temmoo?</b><small>Klaim halamannya, tidak perlu membuat event dari awal</small></div><i>›</i></button><section class="pe-list">`);
    return html;
  };

  /* ---------- Interaksi ---------- */
  document.addEventListener('click',e=>{
    const start=e.target.closest('[data-claim-start]');if(start){target=start.dataset.claimStart;openFlow(CLAIM);return}
    if(e.target.closest('[data-claim-pick]')){e.preventDefault();e.stopPropagation();target=null;openFlow(CLAIM,flowCurrent!==CLAIM);return}
    const manage=e.target.closest('[data-claim-manage]');if(manage){promoterState.activeEventId=manage.dataset.claimManage;savePromoter();openFlow(71);return}
    const cancel=e.target.closest('[data-claim-cancel]');if(cancel){delete claims[target];save();toast('Klaim dibatalkan');openFlow(CLAIM,false);return}
    const sim=e.target.closest('[data-claim-sim]');if(sim){const ok=sim.dataset.claimSim==='approve';decide(target,ok);toast(ok?'Klaim disetujui. Event masuk Promotor Studio':'Klaim ditolak');openFlow(CLAIM,false);return}
    const adm=e.target.closest('[data-claim-admin]');if(adm){const id=adm.dataset.id;if(adm.dataset.claimAdmin==='approve'){decide(id,true);adminReject=null;toast('Klaim disetujui')}else adminReject=adminReject===id?null:id;openFlow(CAL,false);return}
    const why=e.target.closest('[data-claim-reject-reason]');if(why){decide(why.dataset.id,false,why.dataset.claimRejectReason+'.');adminReject=null;toast('Klaim ditolak');openFlow(CAL,false);return}
  },true);
  document.addEventListener('input',e=>{const q=e.target.closest('[data-claim-query]');if(!q)return;query=q.value;const list=document.querySelector('.claim-list');if(!list)return;const tmp=document.createElement('div');tmp.innerHTML=picker();list.replaceWith(tmp.querySelector('.claim-list'))});
  document.addEventListener('submit',e=>{
    const form=e.target.closest('[data-claim-form]');
    if(form){e.preventDefault();const d=new FormData(form),link=String(d.get('link')||'').trim();
      if(!/^https?:\/\/\S+\.\S+/.test(link)){toast('Masukkan tautan bukti yang valid (https://...)');return}
      if(!d.get('agree')){toast('Centang pernyataan kewenangan dulu');return}
      const ev=events[eventIndexById(target)];
      claims[target]={id:target,status:'pending',org:promoterState.organization,role:d.get('role')||'organizer',link,doc:d.get('doc')?.name||'',email:String(d.get('email')||'').trim(),message:String(d.get('note')||'').trim(),at:Date.now(),by:window.promoterTeam?.me().name};
      save();window.promoterTeam?.log(`mengajukan klaim halaman “${ev?.[0]}”`);toast('Klaim dikirim ke Tim Temmoo');openFlow(CLAIM,false);return}
    const cur=e.target.closest('[data-curate-form]');
    if(cur){e.preventDefault();const d=new FormData(cur),name=String(d.get('name')).trim(),date=String(d.get('date')),ticket=String(d.get('ticket')||'').trim(),price=d.get('price');
      if(!name||!date)return;
      const id='curated-'+name.toLowerCase().normalize('NFD').replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'')+'-'+date.replace(/-/g,'');
      if(eventIndexById(id)>=0){toast('Event dengan nama dan tanggal ini sudah ada');return}
      const c={id,name,date,time:String(d.get('time')||'10.00'),venue:String(d.get('venue')).trim(),city:d.get('city'),category:d.get('category'),price,amount:price==='Gratis'?'Gratis':/^https?:/.test(ticket)?'Lihat tautan tiket':ticket||'Harga menyusul',ticketUrl:/^https?:/.test(ticket)?ticket:'',source:String(d.get('source')).trim(),addedAt:Date.now()};
      curated.push(c);addToCatalog(c);save();refreshCatalog();adminLog(`${name} ditambahkan ke kalender kurasi (sumber: ${c.source})`);toast(`${name} ditambahkan ke kalender`);openFlow(CAL,false);return}
  },true);

  window.eventClaims={info,decide,claims};
})();
