// Kalender kurasi & penyerahan halaman event.
// Tim Temmoo mengisi kalender (event contoh + event tambahan di layar 75). Halaman event kurasi TIDAK diklaim sendiri oleh promotor:
// promotor menghubungi Tim Temmoo lewat WhatsApp (layar 74 mencatat permintaannya), Tim Temmoo memverifikasi ke kontak resmi
// penyelenggara, lalu menyerahkan halaman dari Admin Console. Setelah diserahkan, event masuk Promotor Studio dengan ID yang sama,
// sehingga peminat dan status kehadiran pengguna tetap tersambung. Tim Temmoo juga bisa mencabut penyerahan.
(()=>{
  const CLAIM=74,CAL=75,CLAIMS='temmoo_claims_v1',CURATED='temmoo_curated_v1';
  // Ganti dengan nomor WhatsApp resmi Tim Temmoo sebelum rilis (format internasional tanpa +).
  const TEMMOO_WA='6281100000000';
  const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const read=(k,d)=>{try{return JSON.parse(localStorage.getItem(k))??d}catch{return d}};
  const write=(k,v)=>{try{localStorage.setItem(k,JSON.stringify(v))}catch{}};
  const MONTHS=['Januari','Februari','Maret','April','Mei','Juni','Juli','Agustus','September','Oktober','November','Desember'];
  const longDate=iso=>{const [y,m,d]=String(iso||'').split('-').map(Number);return y?`${d} ${MONTHS[m-1]} ${y}`:''};
  const shortDate=iso=>{const [y,m,d]=String(iso||'').split('-').map(Number);return y?`${d} ${MONTHS[m-1].slice(0,3).toUpperCase()}`:''};
  const maskPhone=p=>{const d=String(p||'').replace(/\D/g,'').replace(/^0/,'62');return d.length<9?String(p||''):`+${d.slice(0,2)} ${d.slice(2,5)}-••••-${d.slice(-4)}`};

  // Contoh: satu event kurasi sudah diserahkan ke penyelenggara lain, supaya tampilan "dikelola organisasi lain" terlihat.
  const SEED={'youth-creative-festival':{status:'approved',org:'Youth Lab Surabaya',external:true}};
  const stored=read(CLAIMS,{});
  // Data lama (klaim mandiri): pengajuan yang belum diputuskan menjadi permintaan; yang ditolak menjadi permintaan ditolak.
  Object.values(stored).forEach(c=>{if(c.status==='pending')c.status='requested';if(c.status==='rejected')c.status='declined'});
  const claims={...SEED,...stored};
  const curated=read(CURATED,[]); // event tambahan dari Tim Temmoo
  const save=()=>{write(CLAIMS,Object.fromEntries(Object.entries(claims).filter(([,c])=>!c.external)));write(CURATED,curated)};
  let target=null,query='',adminOpen=null; // adminOpen: {id, mode:'assign'|'decline'|'revoke'}

  function addToCatalog(c){
    if(eventIndexById(c.id)>=0)return; // sudah dimuat sebagai event promotor hasil penyerahan
    events.push([c.name,shortDate(c.date),c.venue,'0 orang tertarik',c.category]);
    const i=events.length-1;eventMeta[i]={id:c.id,date:c.date,time:c.time,city:c.city,price:c.price,amount:c.amount};eventEndDates[i]=c.date;
  }
  curated.forEach(addToCatalog);
  const refreshCatalog=()=>{try{renderCategorizedEvents()}catch{}try{renderUpcomingRail()}catch{}};
  refreshCatalog();

  const promoter=()=>typeof isPromoter==='function'&&isPromoter();
  const ownEvent=id=>(promoterState.events||[]).find(e=>e.status==='published'&&(e.claimedFrom===id||'promoter-'+e.id===id));
  // official: halaman dikelola promotor (milik sendiri atau organisasi lain); curated: diisi Tim Temmoo.
  function info(i){
    const id=eventId(i),own=ownEvent(id);
    if(own)return {id,kind:'official',org:promoterState.organization,own};
    const c=claims[id];
    if(c?.status==='approved')return {id,kind:'official',org:c.org};
    return {id,kind:'curated',claim:c};
  }
  const curatedEntry=id=>curated.find(c=>c.id===id);
  const waLink=(i,org)=>`https://wa.me/${TEMMOO_WA}?text=${encodeURIComponent(`Halo Tim Temmoo, saya dari ${org||'(nama organisasi)'} dan ingin mengelola halaman event "${events[i]?.[0]}" di Temmoo.`)}`;

  function banner(i){
    const x=info(i);
    if(x.kind==='official')return `<div class="claim-banner official"><span>✓</span><div><b>Halaman resmi</b><small>Dikelola ${esc(x.org)}${x.own?' · organisasimu':''}</small></div>${x.own?`<button data-claim-manage="${esc(x.own.id)}">Kelola di Studio</button>`:''}</div>`;
    const c=x.claim,requested=c?.status==='requested',src=curatedEntry(x.id)?.source;
    return `<div class="claim-banner curated"><span>◆</span><div><b>Dikurasi Tim Temmoo</b><small>${requested?`Permintaan ${esc(c.org)} sedang diverifikasi Tim Temmoo`:`Info dikumpulkan dari ${src?esc(src):'sumber publik'}.`}</small></div><button data-claim-start="${esc(x.id)}">${requested?'Lihat status':'Ini event-mu?'}</button></div>`;
  }

  /* ---------- Layar 74: minta pengelolaan halaman ---------- */
  function gate(){
    const app=window.promoterApp?.get?.()||{};
    if(!promoter())return `<section class="pro-locked"><div class="orb">◆</div><h2>Pengelolaan halaman khusus promotor terverifikasi</h2><p>${app.status==='review'?'Pengajuan promotormu sedang ditinjau. Setelah disetujui, kamu bisa meminta Tim Temmoo menyerahkan halaman event yang kamu selenggarakan.':'Daftar sebagai promotor dulu. Tim Temmoo menyerahkan halaman event hanya kepada penyelenggara aslinya.'}</p><div class="pro-actions">${app.status==='review'?'<button class="pro-btn" data-go="70">Lihat status pengajuan</button>':'<button class="pro-btn" data-go="69">Daftar sebagai promotor</button>'}</div></section>`;
    if(!window.promoterTeam?.can('submit'))return `<section class="pro-locked"><div class="orb">◆</div><h2>Hanya Pemilik atau Admin tim yang bisa meminta pengelolaan</h2><p>Minta Pemilik atau Admin ${esc(promoterState.organization)} menghubungi Tim Temmoo untuk event ini.</p></section>`;
    return '';
  }
  function picker(){
    const q=query.toLowerCase(),rows=events.map((e,i)=>({e,i,x:info(i)})).filter(r=>r.x.kind==='curated'&&(!q||r.e.join(' ').toLowerCase().includes(q)));
    return `<section class="pro-hero"><small>KALENDER KURASI TEMMOO</small><h2>Event-mu sudah ada di Temmoo?</h2><p>Tim Temmoo mengisi kalender festival dari sumber publik. Pilih event-mu, lalu Tim Temmoo akan memverifikasi lewat WhatsApp dan menyerahkan halamannya ke organisasimu.</p></section>
      <label class="claim-search"><span>⌕</span><input data-claim-query value="${esc(query)}" placeholder="Cari nama event atau venue" aria-label="Cari event kurasi"></label>
      <div class="claim-list">${rows.length?rows.map(({e,i,x})=>`<article><div class="pe-date">${esc(e[1]).replace(' ','<br>')}</div><div><b>${esc(e[0])} ${endedBadge(i)}</b><span>${esc(e[2])} · ${esc(e[4])}</span>${x.claim?.status==='requested'?'<small class="claim-state pending">Sedang diverifikasi</small>':x.claim?.status==='declined'?'<small class="claim-state rejected">Permintaan ditolak · bisa diminta lagi</small>':''}</div><button data-claim-start="${esc(x.id)}">${x.claim?.status==='requested'?'Status':'Pilih'}</button></article>`).join(''):'<div class="ins-empty"><b>Tidak ada event kurasi yang cocok</b><span>Kalau event-mu belum ada, buat event baru dari Promotor Studio.</span></div>'}</div>`;
  }
  function eventCard(i){const e=events[i],m=eventMeta[i]||{};return `<div class="claim-event"><div class="pe-date">${esc(e[1]).replace(' ','<br>')}</div><div><b>${esc(e[0])}</b><span>${esc(e[2])} · ${esc(e[4])} · ${esc(m.price||'')}</span></div></div>`}
  const STEPS=[['Hubungi Tim Temmoo','Lewat WhatsApp, dengan pesan yang sudah disiapkan'],['Verifikasi ke kontak resmi','Tim Temmoo menghubungi nomor WhatsApp resmi penyelenggara'],['Halaman diserahkan','Event masuk Promotor Studio organisasimu']];
  function steps(done){return `<div class="pro-steps">${STEPS.map((x,k)=>`<div class="${k<done?'done':k===done?'now':''}"><i>${k<done?'✓':k+1}</i><span><b>${x[0]}</b><small>${x[1]}</small></span></div>`).join('')}</div>`}
  function requestScreen(i,c){
    const declined=c?.status==='declined';
    return `<section class="pro-status ${declined?'changes':'review'} claim-request">${declined?`<div class="pro-note bad"><b>Permintaan sebelumnya ditolak:</b> ${esc(c.note||'Tidak bisa diverifikasi.')}</div>`:''}
      <h2>Minta Tim Temmoo menyerahkan halaman ini</h2><p>Halaman event kurasi hanya diserahkan oleh Tim Temmoo setelah penyelenggara terverifikasi lewat WhatsApp ke kontak resminya.</p>
      ${eventCard(i)}${steps(0)}
      <div class="pro-actions"><a class="pro-btn" href="${waLink(i,promoterState.organization)}" target="_blank" rel="noopener" data-claim-request>Hubungi Tim Temmoo via WhatsApp</a></div>
      <p class="claim-legal">${legalText(`Dengan mengirim permintaan, saya menyatakan berwenang mewakili ${esc(promoterState.organization)} untuk event ini. Permintaan palsu dapat membuat akun promotor dinonaktifkan.`,`By sending this request, I confirm I am authorized to represent ${esc(promoterState.organization)} for this event. False requests may result in the promoter account being deactivated.`)}</p></section>`;
  }
  function statusScreen(i,c){
    return `<section class="pro-status review"><div class="orb">◷</div><h2>Menunggu verifikasi Tim Temmoo</h2><p>Permintaan ${esc(c.org)} sudah dicatat. Lanjutkan percakapan di WhatsApp; Tim Temmoo akan menghubungi kontak resmi penyelenggara sebelum menyerahkan halaman.</p>
      ${eventCard(i)}${steps(1)}
      <div class="pro-actions"><a class="pro-btn" href="${waLink(i,c.org)}" target="_blank" rel="noopener">Buka WhatsApp lagi</a><button class="pro-btn secondary" data-claim-cancel>Batalkan permintaan</button></div>
      <div class="pro-demo"><small>FITUR UJI COBA PROTOTIPE: simulasikan keputusan Tim Temmoo</small><div><button data-claim-sim="approve">✓ Serahkan halaman</button><button data-claim-sim="decline">! Tolak permintaan</button></div></div></section>`;
  }
  function claimScreen(){
    const locked=gate();if(locked)return `<div class="pro-page">${locked}</div>`;
    const i=target?eventIndexById(target):-1;
    if(i<0)return `<div class="pro-page">${picker()}</div>`;
    const x=info(i);
    if(x.kind==='official')return `<div class="pro-page"><section class="pro-status approved"><div class="orb">✓</div><h2>${x.own?'Halaman ini sudah dikelola organisasimu':`Halaman ini dikelola ${esc(x.org)}`}</h2><p>${x.own?'Kelola info event, grup resmi, pengumuman, dan album dari Promotor Studio.':'Kalau menurutmu ini keliru, hubungi Tim Temmoo lewat WhatsApp.'}</p>${eventCard(i)}<div class="pro-actions">${x.own?`<button class="pro-btn" data-claim-manage="${esc(x.own.id)}">Kelola di Studio</button>`:`<a class="pro-btn secondary" href="${waLink(i,promoterState.organization)}" target="_blank" rel="noopener">Hubungi Tim Temmoo via WhatsApp</a>`}<button class="pro-btn secondary" data-claim-pick>Pilih event lain</button></div></section></div>`;
    return `<div class="pro-page">${x.claim?.status==='requested'?statusScreen(i,x.claim):requestScreen(i,x.claim)}</div>`;
  }

  /* ---------- Penyerahan, penolakan, pencabutan (Tim Temmoo) ---------- */
  function assign(id,{org,phone,source}){
    const i=eventIndexById(id);if(i<0)return;
    const e=events[i],m=eventMeta[i]||{},cur=curatedEntry(id),own=org===promoterState.organization&&promoter();
    claims[id]={...(claims[id]||{}),id,status:'approved',org,verifiedVia:'whatsapp',phone:maskPhone(phone),phoneSource:source,decidedAt:Date.now(),by:'Admin Temmoo'};
    if(own&&!ownEvent(id)){
      const ev={id:'e'+Date.now().toString(36)+Math.random().toString(36).slice(2,5),name:e[0],category:e[4],date:longDate(m.date),dateShort:e[1],time:cur?.time||m.time||'10.00',venue:e[2],description:cur?.description||`Halaman ${e[0]} kini dikelola langsung oleh ${org}.`,ticketUrl:cur?.ticketUrl||'',price:m.price,amount:m.amount,capacity:500,status:'published',submittedAt:'',reviewNote:'',publishedIndex:i,announcements:[],claimedFrom:id};
      promoterState.events.push(ev);savePromoter();syncPublishedEvent();
      window.promoterTeam?.log(`menerima halaman “${e[0]}” dari Tim Temmoo`);
      pushNotif({kind:'event',icon:'✓',who:'Tim Temmoo',av:'T',tone:'',text:`menyerahkan halaman ${e[0]} ke ${org}. Kelola dari Promotor Studio.`,go:{screen:64}});
    }
    adminLog(`Halaman ${e[0]} diserahkan ke ${org} (verifikasi WhatsApp ke ${maskPhone(phone)} · sumber: ${source})`);
    save();refreshCatalog();
  }
  function decline(id,note){
    const c=claims[id],i=eventIndexById(id);if(!c||c.status!=='requested'||i<0)return;
    c.status='declined';c.note=note;c.decidedAt=Date.now();
    pushNotif({kind:'event',icon:'!',who:'Tim Temmoo',av:'T',tone:'gold',text:`menolak permintaan pengelolaan ${events[i][0]}`,quote:note,go:{screen:CLAIM}});
    adminLog(`Permintaan pengelolaan ${events[i][0]} oleh ${c.org} ditolak: ${note}`);
    save();refreshCatalog();
  }
  function revoke(id,note){
    const i=eventIndexById(id);if(i<0)return;
    const x=info(i);if(x.kind!=='official')return;
    if(x.own){promoterState.events=promoterState.events.filter(e=>e!==x.own);if(promoterState.activeEventId===x.own.id)promoterState.activeEventId=promoterState.events[0]?.id;savePromoter();
      window.promoterTeam?.log(`pengelolaan halaman “${events[i][0]}” dicabut Tim Temmoo`);
      pushNotif({kind:'event',icon:'!',who:'Tim Temmoo',av:'T',tone:'gold',text:`mencabut pengelolaan halaman ${events[i][0]}`,quote:note,go:{event:i}})}
    // Disimpan sebagai "revoked" (bukan dihapus) supaya contoh bawaan tidak muncul lagi setelah reload.
    claims[id]={id,status:'revoked',org:x.org,decidedAt:Date.now()};
    // Halaman kembali menjadi event kurasi dengan data dari kalender.
    const cur=curatedEntry(id);if(cur){eventMeta[i]={...eventMeta[i],id,date:cur.date,time:cur.time,city:cur.city,price:cur.price,amount:cur.amount}}
    adminLog(`Pengelolaan halaman ${events[i][0]} oleh ${x.org} dicabut: ${note}`);
    save();refreshCatalog();
  }

  /* ---------- Layar 75: Kalender kurasi (Admin Console) ---------- */
  const CATS=['Musik','Kuliner','Seni & Budaya','Olahraga','Komunitas'];
  const DECLINE=['Tidak bisa diverifikasi lewat WhatsApp','Nomor resmi penyelenggara tidak cocok','Event dikelola organisasi lain'];
  const REVOKE=['Penyelenggara resmi meminta pengalihan','Diserahkan ke organisasi yang salah','Kerja sama dengan penyelenggara berakhir'];
  function assignForm(id,org){
    const orgs=[...new Set([promoter()?promoterState.organization:'',org||''].filter(Boolean))];
    return `<form class="pro-form claim-assign" data-claim-assign="${esc(id)}">
      <label>Organisasi promotor<input name="org" required maxlength="60" list="claim-orgs" value="${esc(org||orgs[0]||'')}" placeholder="Nama organisasi terdaftar"></label><datalist id="claim-orgs">${orgs.map(o=>`<option value="${esc(o)}"></option>`).join('')}</datalist>
      <div class="pro-grid"><label>Nomor WhatsApp resmi yang dihubungi<input name="phone" required inputmode="tel" maxlength="20" placeholder="0812 3456 7890"></label><label>Sumber nomor<input name="source" required maxlength="80" placeholder="Contoh: bio Instagram resmi"></label></div>
      <label class="pro-check"><input type="checkbox" name="verified" required> Penyelenggara sudah mengonfirmasi lewat WhatsApp di nomor resmi tersebut</label>
      <div class="pro-actions"><button class="pro-btn" type="submit">Serahkan halaman</button><button class="pro-btn secondary" type="button" data-claim-admin-close>Batal</button></div></form>`;
  }
  const reasons=(list,attr,id)=>`<div class="claim-reject">${list.map(r=>`<button data-${attr}="${esc(r)}" data-id="${esc(id)}">${r}</button>`).join('')}</div>`;
  function calendarPage(){
    const rows=events.map((e,i)=>({e,i,x:info(i)})).filter(r=>r.x.kind==='curated'||claims[r.x.id]||curatedEntry(r.x.id)||r.x.own?.claimedFrom);
    const requests=Object.entries(claims).filter(([,c])=>c.status==='requested').map(([id,c])=>({id,c,i:eventIndexById(id)})).filter(r=>r.i>=0);
    const n={all:rows.length,open:rows.filter(r=>r.x.kind==='curated'&&r.x.claim?.status!=='requested').length,given:rows.filter(r=>r.x.kind==='official').length};
    const open=(id,mode)=>adminOpen?.id===id&&adminOpen.mode===mode;
    return adminPage('Kalender kurasi','Event yang diisi Tim Temmoo dan penyerahan halaman ke penyelenggara',`
      <div class="admin-stats compact claim-stats"><article><span>Event kurasi</span><b>${n.all}</b></article><article><span>Belum dikelola</span><b>${n.open}</b></article><article><span>Permintaan masuk</span><b>${requests.length}</b></article><article><span>Sudah diserahkan</span><b>${n.given}</b></article></div>
      <section class="admin-panel claim-admin"><h3>Permintaan pengelolaan</h3><p class="claim-admin-hint">Promotor menghubungi Tim Temmoo lewat WhatsApp. Verifikasi ke nomor resmi penyelenggara (bukan nomor pengirim) sebelum menyerahkan halaman.</p>${requests.length?requests.map(({id,c,i})=>`<div class="admin-list-row"><i class="event-admin-icon">W</i><div><b>${esc(events[i][0])}</b><span>${esc(c.org)} · diminta ${new Date(c.at).toLocaleDateString('id-ID',{day:'numeric',month:'short'})}${c.by?` · oleh ${esc(c.by)}`:''}</span>${open(id,'assign')?assignForm(id,c.org):''}${open(id,'decline')?reasons(DECLINE,'claim-decline-reason',id):''}</div><div class="pro-admin-actions"><button data-claim-admin="decline" data-id="${esc(id)}">Tolak</button><button class="ok" data-claim-admin="assign" data-id="${esc(id)}">Serahkan</button></div></div>`).join(''):'<div class="ins-empty"><b>Tidak ada permintaan</b><span>Permintaan promotor yang menghubungi lewat WhatsApp muncul di sini.</span></div>'}</section>
      <section class="admin-panel claim-admin"><h3>Tambah event ke kalender</h3><form class="pro-form claim-curate" data-curate-form>
        <label>Nama event<input name="name" required maxlength="70" placeholder="Contoh: Festival Rujak Uleg 2027"></label>
        <div class="pro-grid"><label>Tanggal<input name="date" type="date" required></label><label>Jam mulai<input name="time" placeholder="10.00" value="10.00" maxlength="5"></label></div>
        <div class="pro-grid"><label>Venue<input name="venue" required maxlength="80" placeholder="Taman Bungkul"></label><label>Kota<select name="city"><option>Surabaya</option><option>Jakarta</option><option>Bandung</option></select></label></div>
        <div class="pro-grid"><label>Kategori<select name="category">${CATS.map(c=>`<option>${c}</option>`).join('')}</select></label><label>Harga<select name="price"><option>Gratis</option><option>Berbayar</option></select></label></div>
        <label>Kisaran harga atau tautan tiket (opsional)<input name="ticket" maxlength="200" placeholder="Rp50.000 atau https://..."></label>
        <label>Deskripsi singkat (opsional)<textarea name="description" rows="3" maxlength="400" placeholder="Apa yang bisa ditemui pengunjung di event ini?"></textarea></label>
        <label>Sumber informasi<input name="source" required maxlength="80" placeholder="Contoh: kalender Disbudpar Surabaya"></label>
        <div class="pro-actions"><button class="pro-btn" type="submit">Tambahkan ke kalender</button></div></form></section>
      <section class="admin-panel claim-admin"><h3>Semua event kurasi</h3>${rows.map(({e,i,x})=>{const c=claims[x.id];return `<div class="admin-list-row"><i class="event-admin-icon">${esc(e[1].split(' ')[0])}</i><div><b>${esc(e[0])} ${endedBadge(i)}</b><span>${esc(e[1])} · ${esc(e[2])}${curatedEntry(x.id)?` · sumber: ${esc(curatedEntry(x.id).source)}`:''}${x.kind==='official'&&c?.phone?` · verifikasi WhatsApp ${esc(c.phone)}`:''}</span>${open(x.id,'assign')&&x.kind==='curated'&&c?.status!=='requested'?assignForm(x.id,c?.org):''}${open(x.id,'revoke')?reasons(REVOKE,'claim-revoke-reason',x.id):''}</div><em class="claim-state ${x.kind==='official'?'approved':c?.status==='requested'?'pending':c?.status==='declined'?'rejected':'open'}">${x.kind==='official'?`Dikelola ${esc(x.org)}`:c?.status==='requested'?'Permintaan masuk':c?.status==='declined'?'Permintaan ditolak':'Belum dikelola'}</em><div class="pro-admin-actions">${x.kind==='official'?`<button data-claim-admin="revoke" data-id="${esc(x.id)}">Cabut</button>`:c?.status==='requested'?'':`<button data-claim-admin="assign" data-id="${esc(x.id)}">Serahkan</button>`}</div></div>`}).join('')}</section>`);
  }

  /* ---------- Info event untuk peserta: deskripsi & tautan tiket ---------- */
  // Hanya tautan http(s) yang ditampilkan: input type=url juga menerima "javascript:...".
  const safeUrl=u=>{try{const x=new URL(String(u||'').trim());return /^https?:$/.test(x.protocol)?x.href:''}catch{return ''}};
  function details(i){
    const id=eventId(i),own=ownEvent(id),cur=curatedEntry(id),m=eventMeta[i]||{},x=info(i);
    const ticketUrl=safeUrl(own?own.ticketUrl:cur?.ticketUrl);
    return {about:String(own?.description||cur?.description||m.about||'').trim(),ticketUrl,host:ticketUrl?new URL(ticketUrl).hostname.replace(/^www\./,''):'',free:(m.price||'Gratis')==='Gratis'&&!ticketUrl,amount:m.amount||'',org:x.kind==='official'?x.org:''};
  }
  window.eventDetails=details;
  function detailCards(i){
    const d=details(i);
    return `${d.about?`<div class="info-card event-about"><h3>Tentang event</h3><p>${esc(d.about)}</p>${d.org?`<small>Oleh ${esc(d.org)}</small>`:''}</div>`:''}<div class="info-card event-ticket"><h3>Tiket</h3><p><b>${d.free?'Gratis':esc(d.amount&&d.amount!=='Lihat tautan tiket'?d.amount:'Berbayar')}</b></p><p class="muted">${d.ticketUrl?`Dijual di ${esc(d.host)}`:d.free?'Tidak perlu tiket':'Tautan tiket belum ditambahkan penyelenggara'}</p></div>`;
  }
  function ticketScreen(i){
    const d=details(i),name=esc(events[i][0]);
    if(d.ticketUrl)return `${eventHero()}<div class="flow-body ticket-out"><div class="big">↗</div><h2>Beli tiket di ${esc(d.host)}</h2><p class="helper">Tiket ${name} dijual oleh penyelenggara di ${esc(d.host)}.</p><p class="ticket-url">${esc(d.ticketUrl)}</p><p class="ticket-terms">${legalText('Pembelian, pembayaran, dan pengembalian dana diatur oleh platform tiket tersebut, bukan Temmoo.','Purchases, payments, and refunds are handled by that ticket platform, not Temmoo.')}</p><a class="wide" href="${esc(d.ticketUrl)}" target="_blank" rel="noopener noreferrer" data-ticket-out>Buka ${esc(d.host)} ↗</a>${btn('Kembali ke event',20,'wide secondary')}</div>`;
    if(d.free)return `${eventHero()}<div class="flow-body ticket-out"><div class="big">✓</div><h2>Event ini gratis</h2><p class="helper">Tidak perlu tiket. Pilih Mau datang supaya mendapat pengingat dan rekomendasi Circle.</p>${btn('Kembali ke event',20,'wide secondary')}</div>`;
    return `${eventHero()}<div class="flow-body ticket-out"><div class="big">◷</div><h2>Tautan tiket belum tersedia</h2><p class="helper">Penyelenggara belum menambahkan tautan pembelian tiket. Simpan event ini; pengumuman penyelenggara akan muncul di Ruang Event.</p>${btn('Kembali ke event',20,'wide secondary')}</div>`;
  }

  /* ---------- Template ---------- */
  const base=template;
  template=function(n){
    if(n===21&&!(typeof eventIsOver==='function'&&eventIsOver())){document.querySelector('#flowTitle').textContent='Beli tiket';document.querySelector('#flowIndex').textContent=events[activeEvent]?.[0]||'';return ticketScreen(activeEvent)}
    if(n===CLAIM){const fl=document.querySelector('#flowLayer');if(innerWidth>620)fl.classList.add('embedded');document.querySelector('#flowTitle').textContent='Kelola halaman event';document.querySelector('#flowIndex').textContent='Kalender kurasi Temmoo';return claimScreen()}
    if(n===CAL){if(accountState.accountType!=='temmoo_official')return base(68);return calendarPage()}
    const html=base(n);
    if([18,20,46].includes(n)){const hero=eventHero();let out=html.includes(hero)?html.replace(hero,hero+banner(activeEvent)):html;
      if(n===20){out=out.replace('<div class="info-card"><h3>Rundown</h3>',detailCards(activeEvent)+'<div class="info-card"><h3>Rundown</h3>');const d=details(activeEvent);if(d.free)out=out.replace(btn('Beli tiket',21,'wide secondary'),'')}
      return out}
    if(n===64&&promoter()&&html.includes('<section class="pe-list">'))return html.replace('<section class="pe-list">',`<button class="claim-entry" data-go="${CLAIM}" data-claim-pick><span>◆</span><div><b>Event-mu sudah ada di kalender Temmoo?</b><small>Minta Tim Temmoo menyerahkan halamannya, tidak perlu membuat event dari awal</small></div><i>›</i></button><section class="pe-list">`);
    return html;
  };

  /* ---------- Interaksi ---------- */
  document.addEventListener('click',e=>{
    const start=e.target.closest('[data-claim-start]');if(start){target=start.dataset.claimStart;openFlow(CLAIM);return}
    if(e.target.closest('[data-claim-pick]')){e.preventDefault();e.stopPropagation();target=null;openFlow(CLAIM,flowCurrent!==CLAIM);return}
    const manage=e.target.closest('[data-claim-manage]');if(manage){promoterState.activeEventId=manage.dataset.claimManage;savePromoter();openFlow(71);return}
    // Tautan WhatsApp tetap terbuka seperti biasa; permintaannya dicatat supaya Tim Temmoo bisa mencocokkan percakapan.
    if(e.target.closest('[data-claim-request]')){const ev=events[eventIndexById(target)];claims[target]={id:target,status:'requested',org:promoterState.organization,at:Date.now(),by:window.promoterTeam?.me().name};save();window.promoterTeam?.log(`meminta Tim Temmoo menyerahkan halaman “${ev?.[0]}”`);toast('Permintaan dicatat. Lanjutkan percakapan di WhatsApp');setTimeout(()=>openFlow(CLAIM,false),0);return}
    if(e.target.closest('[data-claim-cancel]')){delete claims[target];save();toast('Permintaan dibatalkan');openFlow(CLAIM,false);return}
    const sim=e.target.closest('[data-claim-sim]');if(sim){if(sim.dataset.claimSim==='approve'){assign(target,{org:claims[target].org,phone:'081234567890',source:'simulasi prototipe'});toast('Halaman diserahkan. Event masuk Promotor Studio')}else{decline(target,DECLINE[0]+'.');toast('Permintaan ditolak')}openFlow(CLAIM,false);return}
    const adm=e.target.closest('[data-claim-admin]');if(adm){const id=adm.dataset.id,mode=adm.dataset.claimAdmin;adminOpen=adminOpen?.id===id&&adminOpen.mode===mode?null:{id,mode};openFlow(CAL,false);return}
    if(e.target.closest('[data-claim-admin-close]')){adminOpen=null;openFlow(CAL,false);return}
    const dr=e.target.closest('[data-claim-decline-reason]');if(dr){decline(dr.dataset.id,dr.dataset.claimDeclineReason+'.');adminOpen=null;toast('Permintaan ditolak');openFlow(CAL,false);return}
    const rr=e.target.closest('[data-claim-revoke-reason]');if(rr){revoke(rr.dataset.id,rr.dataset.claimRevokeReason+'.');adminOpen=null;toast('Pengelolaan halaman dicabut');openFlow(CAL,false);return}
  },true);
  document.addEventListener('input',e=>{const q=e.target.closest('[data-claim-query]');if(!q)return;query=q.value;const list=document.querySelector('.claim-list');if(!list)return;const tmp=document.createElement('div');tmp.innerHTML=picker();list.replaceWith(tmp.querySelector('.claim-list'))});
  document.addEventListener('submit',e=>{
    const af=e.target.closest('[data-claim-assign]');
    if(af){e.preventDefault();const d=new FormData(af),org=String(d.get('org')||'').trim(),phone=String(d.get('phone')||'').trim(),source=String(d.get('source')||'').trim();
      if(!org||!source||phone.replace(/\D/g,'').length<9){toast('Lengkapi organisasi, nomor WhatsApp resmi, dan sumbernya');return}
      if(!d.get('verified')){toast('Centang konfirmasi verifikasi WhatsApp dulu');return}
      assign(af.dataset.claimAssign,{org,phone,source});adminOpen=null;toast(`Halaman diserahkan ke ${org}`);openFlow(CAL,false);return}
    const cur=e.target.closest('[data-curate-form]');
    if(cur){e.preventDefault();const d=new FormData(cur),name=String(d.get('name')).trim(),date=String(d.get('date')),ticket=String(d.get('ticket')||'').trim(),price=d.get('price');
      if(!name||!date)return;
      const id='curated-'+name.toLowerCase().normalize('NFD').replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'')+'-'+date.replace(/-/g,'');
      if(eventIndexById(id)>=0){toast('Event dengan nama dan tanggal ini sudah ada');return}
      const c={id,name,date,time:String(d.get('time')||'10.00'),venue:String(d.get('venue')).trim(),city:d.get('city'),category:d.get('category'),price,amount:price==='Gratis'?'Gratis':/^https?:/.test(ticket)?'Lihat tautan tiket':ticket||'Harga menyusul',ticketUrl:/^https?:/.test(ticket)?ticket:'',description:String(d.get('description')||'').trim(),source:String(d.get('source')).trim(),addedAt:Date.now()};
      curated.push(c);addToCatalog(c);save();refreshCatalog();adminLog(`${name} ditambahkan ke kalender kurasi (sumber: ${c.source})`);toast(`${name} ditambahkan ke kalender`);openFlow(CAL,false);return}
  },true);

  window.eventClaims={info,assign,decline,revoke,claims};
})();
