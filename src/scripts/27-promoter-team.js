// Anggota tim akun promotor: undangan, peran (Pemilik/Admin/Editor/Pengamat), akses per event,
// "Lihat sebagai" untuk menguji hak akses, dan log aktivitas. Tanpa server, undangan diterima lewat simulasi
// dan hak akses hanya ditegakkan di tampilan.
(()=>{
  const esc=escapeText,TEAM=72;
  const ROLES={
    owner:{label:'Pemilik',desc:'Semua akses, termasuk mengelola tim'},
    admin:{label:'Admin',desc:'Kelola semua event, ajukan ke Temmoo, dan atur anggota'},
    editor:{label:'Editor',desc:'Buat & ubah event serta kirim pengumuman'},
    viewer:{label:'Pengamat',desc:'Hanya melihat dashboard dan data peserta'}};
  const PERMS={
    owner:{create:1,edit:1,submit:1,delete:1,announce:1,team:1},
    admin:{create:1,edit:1,submit:1,delete:1,announce:1,team:1},
    editor:{create:1,edit:1,submit:0,delete:0,announce:1,team:0},
    viewer:{create:0,edit:0,submit:0,delete:0,announce:0,team:0}};
  const ACTIONS=[['Melihat dashboard & data peserta',null],['Membuat event baru','create'],['Mengubah event','edit'],['Mengirim pengumuman','announce'],['Mengajukan event ke Tim Temmoo','submit'],['Menghapus draft event','delete'],['Mengundang & mengatur anggota','team']];

  /* ---------- Data ---------- */
  const uid=()=>'m'+Date.now().toString(36)+Math.random().toString(36).slice(2,5);
  if(!promoterState.team){promoterState.team={members:[],activity:[]};}
  const team=promoterState.team;
  // Pemilik = akun yang mendaftar sebagai promotor.
  if(!team.members.some(m=>m.role==='owner'))team.members.unshift({id:'owner',name:accountState.name,email:accountState.email,role:'owner',access:'all',status:'active',joinedAt:Date.now()});
  // Akun yang sedang login. Bukan berarti Pemilik: kepemilikan bisa dipindahkan ke anggota lain.
  if(!team.selfId)team.selfId='owner';
  savePromoter();
  let actingId=null; // "Lihat sebagai" (tidak disimpan: kembali ke Pemilik setelah refresh)
  let showInvite=false,confirmRemove=null,editAccess=null;

  const self=()=>team.members.find(m=>m.id===team.selfId);
  const me=()=>(actingId&&team.members.find(m=>m.id===actingId))||self()||{id:null,name:accountState.name,role:'none'};
  const can=act=>!!PERMS[me().role]?.[act];
  // Tetap promotor terverifikasi hanya selama masih menjadi anggota tim.
  const baseIsPromoter=window.isPromoter;
  window.isPromoter=()=>baseIsPromoter()&&!!self();
  const leftTeam=()=>baseIsPromoter()&&!self();
  const fullAccess=m=>m.role==='owner'||m.role==='admin'||m.access==='all';
  const owner=()=>team.members.find(m=>m.role==='owner');
  const DAY=864e5;
  const visibleEvents=()=>{const m=me();return fullAccess(m)?promoterState.events:promoterState.events.filter(e=>(m.access||[]).includes(e.id))};
  function log(text){team.activity.unshift({by:me().name,role:me().role,text,at:Date.now()});team.activity=team.activity.slice(0,40);savePromoter()}
  // Event baru yang dibuat Editor dengan akses terbatas otomatis masuk aksesnya.
  function grantNewEvent(id){const m=me();if(!fullAccess(m)){m.access=[...(m.access||[]),id];savePromoter()}}
  window.promoterTeam={can,visibleEvents,log,grantNewEvent,me};

  const initials=s=>String(s||'?').split(/[\s@.]+/).filter(Boolean).slice(0,2).map(w=>w[0]).join('').toUpperCase();
  const ago=t=>{if(!t)return '';const m=Math.floor((Date.now()-t)/60000);return m<1?'baru saja':m<60?m+' mnt lalu':m<1440?Math.floor(m/60)+' jam lalu':Math.floor(m/1440)+' hari lalu'};
  const accessText=m=>fullAccess(m)?'Semua event':`${(m.access||[]).length} event`;
  const canManage=m=>can('team')&&m.role!=='owner'&&m.id!==me().id;

  /* ---------- Halaman Tim (layar 72) ---------- */
  function inviteForm(){
    const evs=promoterState.events;
    return `<form class="team-invite" data-team-invite><h3>Undang anggota</h3>
      <div class="team-grid"><label>Email<input name="email" type="email" required placeholder="nama@email.com"></label><label>Nama <small>opsional</small><input name="name" maxlength="40" placeholder="Nama anggota"></label></div>
      <fieldset class="team-roles"><legend>Peran</legend>${['admin','editor','viewer'].map((r,i)=>`<label><input type="radio" name="role" value="${r}" ${i===1?'checked':''}><span><b>${ROLES[r].label}</b><small>${ROLES[r].desc}</small></span></label>`).join('')}</fieldset>
      <fieldset class="team-access" data-team-access><legend>Akses event <small>(Admin selalu bisa mengakses semua event)</small></legend>
        <label><input type="radio" name="scope" value="all" checked> Semua event, termasuk event baru</label>
        <label><input type="radio" name="scope" value="some"> Event tertentu</label>
        <div class="team-events">${evs.map(e=>`<label><input type="checkbox" name="events" value="${e.id}"> ${esc(e.name||'Event tanpa nama')}</label>`).join('')}</div></fieldset>
      <div class="team-form-actions"><button type="button" class="ghost" data-team-invite-toggle>Batal</button><button type="submit">Kirim undangan</button></div></form>`;
  }
  function memberRow(m){
    const isMe=m.id===me().id,manage=canManage(m),pending=m.status==='invited';
    const role=manage?`<select data-team-role="${m.id}" aria-label="Peran ${esc(m.name||m.email)}">${['admin','editor','viewer'].map(r=>`<option value="${r}" ${m.role===r?'selected':''}>${ROLES[r].label}</option>`).join('')}</select>`:`<span class="team-role ${m.role}">${ROLES[m.role].label}</span>`;
    const access=m.role==='owner'||m.role==='admin'?'<span class="team-muted">Semua event</span>':manage?`<button type="button" class="team-link" data-team-access-edit="${m.id}">${accessText(m)} ✎</button>`:`<span class="team-muted">${accessText(m)}</span>`;
    const actions=[];
    if(pending&&can('team'))actions.push(`<button type="button" class="team-demo" data-team-accept="${m.id}">Simulasikan diterima</button>`);
    if(!pending&&m.role!=='owner'&&actingId!==m.id&&me().role==='owner')actions.push(`<button type="button" data-team-act="${m.id}">Lihat sebagai</button>`);
    if(manage)actions.push(`<button type="button" class="danger" data-team-remove="${m.id}">${confirmRemove===m.id?(pending?'Yakin batalkan?':'Yakin hapus?'):(pending?'Batalkan':'Hapus')}</button>`);
    const editor=editAccess===m.id?`<div class="team-access-edit"><b>Akses ${esc(m.name||m.email)}</b><label><input type="radio" name="scope-${m.id}" value="all" ${m.access==='all'?'checked':''} data-team-scope="${m.id}"> Semua event</label>${promoterState.events.map(e=>`<label><input type="checkbox" value="${e.id}" data-team-event="${m.id}" ${m.access!=='all'&&(m.access||[]).includes(e.id)?'checked':''}> ${esc(e.name||'Event tanpa nama')}</label>`).join('')}<button type="button" data-team-access-done>Selesai</button></div>`:'';
    return `<article class="team-row ${pending?'pending':''}"><div class="avatar ${m.role==='owner'?'':'teal'}">${esc(initials(m.name||m.email))}</div>
      <div class="team-who"><b>${esc(m.name||m.email)}${isMe?' <em>(kamu)</em>':''}</b><span>${esc(m.email||'')}</span><small>${pending?`Undangan terkirim ${ago(m.invitedAt)}`:m.role==='owner'?'Pemilik akun promotor':team.transfer?.to===m.id?'Calon pemilik baru · menunggu diterima':`Bergabung ${ago(m.joinedAt)}`}</small></div>
      <div class="team-cell">${role}</div><div class="team-cell">${access}</div><div class="team-actions">${actions.join('')}</div>${editor}</article>`;
  }
  let showTransfer=false,otp=null;
  const OTP_TTL=5*60e3,OTP_RESEND=60e3,OTP_MAX=5;
  const maskPhone=p=>{const d=String(p||'').replace(/\D/g,'');return d.length<8?p:`+${d.slice(0,2)} ${d.slice(2,5)}-••••-${d.slice(-4)}`};
  const maskEmail=e=>{const [u,dom]=String(e||'').split('@');return dom?`${u.slice(0,2)}${'•'.repeat(Math.max(2,u.length-2))}@${dom}`:e};
  function sendOtp(){otp.code=String(Math.floor(100000+Math.random()*900000));otp.sentAt=Date.now();otp.expiresAt=otp.sentAt+OTP_TTL;otp.error='';}
  const mmss=ms=>{const t=Math.max(0,Math.ceil(ms/1000));return `${Math.floor(t/60)}:${String(t%60).padStart(2,'0')}`};
  // otp = {purpose:'transfer'|'accept', contact:{phone,email}, channel, code, sentAt, expiresAt, attempts, error, ...}
  function startOtp(data){otp={attempts:0,error:'',...data,channel:data.contact.phone?'phone':'email'};sendOtp();rerender();setTimeout(()=>document.querySelector('[data-otp-digit]')?.focus(),50)}
  function otpForm(submitLabel,submitClass='danger-solid'){
    const c=otp.contact,dest=otp.channel==='phone'?maskPhone(c.phone):maskEmail(c.email);
    const wait=otp.sentAt+OTP_RESEND-Date.now(),cooling=wait>0;
    return `<form class="team-otp" data-otp-form autocomplete="off">
        <p>Kami mengirim kode 6 digit ke <b>${esc(dest)}</b> lewat ${otp.channel==='phone'?'SMS/WhatsApp':'email'}.</p>
        <div class="team-otp-boxes" role="group" aria-label="Kode OTP 6 digit">${Array.from({length:6},(_,i)=>`<input data-otp-digit inputmode="numeric" pattern="[0-9]*" maxlength="1" aria-label="Digit ${i+1}" ${i===0?'autocomplete="one-time-code"':''}>`).join('')}</div>
        <p class="team-otp-error" data-otp-error role="alert">${esc(otp.error)}</p>
        <div class="team-otp-meta"><span>Kode berlaku <b data-otp-expire>${mmss(otp.expiresAt-Date.now())}</b></span><button type="button" class="team-link" data-otp-resend ${cooling?'disabled':''}>${cooling?`Kirim ulang dalam ${mmss(wait)}`:'Kirim ulang'}</button></div>
        <div class="team-otp-meta"><span>Tidak menerima kode?</span>${c.phone&&c.email?`<button type="button" class="team-link" data-otp-channel ${cooling?'disabled':''}>Kirim ke ${otp.channel==='phone'?'email':'nomor HP'}</button>`:'<span>Periksa folder spam atau kirim ulang</span>'}</div>
        <div class="pro-demo"><small>FITUR UJI COBA PROTOTIPE: kode tidak benar-benar dikirim</small><div><span class="team-otp-demo">Kode OTP${otp.purpose==='accept'?` untuk ${esc(otp.name)}`:'-mu'}: <b>${otp.code}</b></span></div></div>
        <div class="team-form-actions"><button type="button" class="ghost" data-otp-back>Kembali</button><button type="submit" class="${submitClass}">${submitLabel}</button></div>
      </form>`;
  }
  function otpStep(){
    const to=team.members.find(m=>m.id===otp.to);
    return `<section class="team-card team-danger"><header class="team-head"><div><h3>Verifikasi dengan kode OTP</h3><p>Langkah terakhir sebelum meminta ${esc(to?.name||to?.email||'')} menjadi Pemilik.</p></div></header>${otpForm('Verifikasi &amp; kirim permintaan')}</section>`;
  }
  // Perbarui teks tanpa merender ulang (agar isi kotak OTP tidak hilang).
  function refreshOtp(clear){
    const err=document.querySelector('[data-otp-error]');if(err)err.textContent=otp?.error||'';
    if(clear){document.querySelectorAll('[data-otp-digit]').forEach(i=>i.value='');document.querySelector('[data-otp-digit]')?.focus()}
    document.querySelector('.team-otp-boxes')?.classList.toggle('bad',!!otp?.error);
  }
  setInterval(()=>{
    if(!otp)return;
    const ex=document.querySelector('[data-otp-expire]');if(ex)ex.textContent=Date.now()>otp.expiresAt?'kedaluwarsa':mmss(otp.expiresAt-Date.now());
    const wait=otp.sentAt+OTP_RESEND-Date.now();
    const rs=document.querySelector('[data-otp-resend]');if(rs){rs.disabled=wait>0;rs.textContent=wait>0?`Kirim ulang dalam ${mmss(wait)}`:'Kirim ulang'}
    const ch=document.querySelector('[data-otp-channel]');if(ch)ch.disabled=wait>0;
  },500);
  function transferPending(){
    const tr=team.transfer;if(!tr){if(otp?.purpose==='accept')otp=null;kyc=null;return ''}
    const to=team.members.find(m=>m.id===tr.to);if(!to){team.transfer=null;savePromoter();return ''}
    const days=Math.max(0,Math.ceil((tr.expiresAt-Date.now())/DAY)),old=owner();
    const isTarget=me().id===to.id,mine=me().role==='owner';
    if(kyc)return kycStep(to,isTarget);
    if(otp?.purpose==='accept')return `<section class="team-card team-accept"><header class="team-head"><div><h3>Terima kepemilikan ${esc(promoterState.organization)}</h3><p>Identitas sudah diperiksa${tr.kyc?` (NIK ${esc(tr.kyc.nik)}${tr.kyc.review?', dengan catatan tinjauan manual':''})`:''}. Terakhir, masukkan kode OTP.</p></div></header>${stepper(2)}${otpForm('Verifikasi &amp; terima kepemilikan','accept-solid')}</section>`;
    const head=isTarget?`<b>${esc(old?.name||'Pemilik')} meminta kamu menjadi Pemilik ${esc(promoterState.organization)}</b><span>Berlaku ${days} hari lagi. Sebagai Pemilik, kamu memegang kendali penuh atas event dan tim. Kode OTP akan dikirim ke emailmu untuk konfirmasi.</span>`
      :`<b>Menunggu ${esc(to.name||to.email)} menerima kepemilikan</b><span>Dikirim ${ago(tr.at)} · berlaku ${days} hari lagi. ${esc(to.name||to.email)} perlu memverifikasi identitas (KTP) dan kode OTP sebelum menerima. Setelah diterima, ${esc(old?.name||'pemilik lama')} ${tr.keepAs==='admin'?'tetap di tim sebagai Admin':'keluar dari tim'}.</span>`;
    const actions=isTarget?'<button type="button" class="team-accept-btn" data-transfer-accept>Terima kepemilikan</button><button type="button" class="danger" data-transfer-sim="decline">Tolak</button>'
      :`${mine?'<button type="button" class="danger" data-transfer-cancel>Batalkan permintaan</button>':''}<button type="button" class="team-demo" data-transfer-accept>Simulasikan diterima</button><button type="button" class="team-demo" data-transfer-sim="decline">Simulasikan ditolak</button>`;
    return `<section class="team-transfer-pending"><div>${head}</div><div class="team-transfer-actions">${actions}</div></section>`;
  }
  function transferCard(){
    if(me().role!=='owner'||actingId)return '';
    if(team.transfer)return '';
    if(otp?.purpose==='transfer')return otpStep();
    const admins=team.members.filter(m=>m.role==='admin'&&m.status==='active');
    const intro=`<header class="team-head"><div><h3>Pindahkan kepemilikan</h3><p>Serahkan peran Pemilik ${esc(promoterState.organization)} ke Admin lain. Hanya ada satu Pemilik.</p></div>${showTransfer?'':'<button type="button" class="team-danger-btn" data-transfer-toggle>Pindahkan kepemilikan…</button>'}</header>`;
    if(!showTransfer)return `<section class="team-card team-danger">${intro}</section>`;
    if(!admins.length)return `<section class="team-card team-danger">${intro}<div class="team-transfer-empty"><b>Belum ada Admin aktif</b><span>Pemilik baru harus Admin yang sudah bergabung. Ubah peran salah satu anggota menjadi Admin, lalu coba lagi.</span><button type="button" class="ghost" data-transfer-toggle>Tutup</button></div></section>`;
    return `<section class="team-card team-danger">${intro}<form class="team-transfer" data-transfer-form>
      <fieldset><legend>Pemilik baru</legend>${admins.map((m,i)=>`<label class="team-pick"><input type="radio" name="to" value="${m.id}" ${i===0?'checked':''}><span class="avatar teal">${esc(initials(m.name||m.email))}</span><span><b>${esc(m.name||m.email)}</b><small>${esc(m.email)} · Admin</small></span></label>`).join('')}</fieldset>
      <fieldset><legend>Setelah dipindahkan, kamu</legend><label class="team-pick"><input type="radio" name="keepAs" value="admin" checked><span><b>Tetap di tim sebagai Admin</b><small>Masih bisa mengelola event dan anggota</small></span></label><label class="team-pick"><input type="radio" name="keepAs" value="leave"><span><b>Keluar dari tim</b><small>Kehilangan akses ke Promotor Studio ${esc(promoterState.organization)}</small></span></label></fieldset>
      <ul class="team-consequences"><li>Pemilik baru memegang kendali penuh, termasuk menghapus atau mengubah peranmu.</li><li>Pemilik baru harus menerima dalam 7 hari dan memverifikasi identitas (KTP).</li><li>Setelah diterima, kamu tidak bisa membatalkannya sendiri.</li></ul>
      <label class="team-confirm"><span>Ketik <b>${esc(promoterState.organization)}</b> untuk konfirmasi</span><input name="confirm" autocomplete="off" required></label>
      <label class="team-check"><input type="checkbox" name="agree" required> Saya memahami akibat pemindahan kepemilikan ini.</label>
      <div class="team-form-actions"><button type="button" class="ghost" data-transfer-toggle>Batal</button><button type="submit" class="danger-solid">Kirim permintaan pemindahan</button></div></form></section>`;
  }
  function teamPage(){
    const active=team.members.filter(m=>m.status==='active').length,pending=team.members.length-active;
    const matrix=`<section class="team-card"><h3>Hak akses per peran</h3><div class="team-matrix" role="table"><div role="row"><span role="columnheader">Tindakan</span>${Object.values(ROLES).map(r=>`<span role="columnheader">${r.label}</span>`).join('')}</div>${ACTIONS.map(([label,key])=>`<div role="row"><span role="cell">${label}</span>${Object.keys(ROLES).map(r=>`<span role="cell" class="${!key||PERMS[r][key]?'yes':'no'}" aria-label="${!key||PERMS[r][key]?'Bisa':'Tidak bisa'}">${!key||PERMS[r][key]?'✓':'—'}</span>`).join('')}</div>`).join('')}</div><p class="team-muted">Editor dan Pengamat bisa dibatasi ke event tertentu.</p></section>`;
    const activity=`<section class="team-card"><h3>Aktivitas tim</h3>${team.activity.length?`<ul class="team-activity">${team.activity.slice(0,10).map(a=>`<li><b>${esc(a.by)}</b> <span class="team-role mini ${a.role}">${ROLES[a.role]?.label||''}</span> ${esc(a.text)}<small>${ago(a.at)}</small></li>`).join('')}</ul>`:'<p class="team-muted">Belum ada aktivitas.</p>'}</section>`;
    const body=can('team')?`<section class="team-card"><header class="team-head"><div><h3>Anggota tim</h3><p>${active} aktif${pending?` · ${pending} undangan menunggu`:''}</p></div>${showInvite?'':'<button type="button" class="team-primary" data-team-invite-toggle>＋ Undang anggota</button>'}</header>${showInvite?inviteForm():''}<div class="team-list">${team.members.map(memberRow).join('')}</div></section>${transferPending()}<div class="team-two">${matrix}${activity}</div>${transferCard()}`
      :`<section class="team-card"><div class="ins-empty"><b>Hanya Pemilik dan Admin yang bisa mengelola tim</b><span>Kamu masuk sebagai ${ROLES[me().role].label}.</span></div></section>${matrix}`;
    return promoterPage('Tim',`Kelola siapa saja yang bisa mengakses Promotor Studio ${esc(promoterState.organization)}`,body);
  }

  /* ---------- Penegakan hak akses di halaman lain ---------- */
  function banner(){const m=me();return actingId?`<div class="team-acting"><span>👁 Kamu melihat Promotor Studio sebagai <b>${esc(m.name||m.email)}</b> (${ROLES[m.role].label})</span><button type="button" data-team-exit>Kembali sebagai Pemilik</button></div>`:''}
  function restrict(html,n){
    if(!can('create'))html=html.replace(/<button class="(?:active)?" data-pe-new>＋ Buat event<\/button>/,'');
    if(!can('team'))html=html.replace(/<button class="(?:active)?" data-go="72">Tim<\/button>/,'');
    if(n===65&&!can('edit')){
      // Hanya kolom di dalam form; pemilih event di atas halaman tetap bisa dipakai.
      html=html.replace(/<form class="promoter-form"[\s\S]*?<\/form>/,form=>form.replace(/<(input|select|textarea)(?![^>]*\sdisabled)/g,'<$1 disabled').replace(/<div class="form-actions">[\s\S]*?<\/div>/,'<p class="team-note">Peranmu hanya bisa melihat event ini.</p>'));
    }else if(n===65&&!can('submit')){
      html=html.replace(/<button class="primary" type="submit" name="intent" value="submit">[^<]*<\/button>/,'').replace('<div class="form-actions">','<div class="form-actions"><span class="team-note inline">Pengajuan ke Tim Temmoo dilakukan oleh Admin atau Pemilik.</span>');
    }
    if(n===71){
      if(!can('edit'))html=html.replace(/<button data-go="65">Edit event<\/button>/,'');
      if(!can('submit'))html=html.replace(/<button class="primary" data-submit-event>[^<]*<\/button>/,'<span class="team-note inline">Menunggu Admin/Pemilik mengajukan</span>');
      if(!can('announce'))html=html.replace(/<button type="button" data-ins-action="announce">[\s\S]*?<\/button>/,'');
    }
    return html.replace('<main class="promoter-main">','<main class="promoter-main">'+banner());
  }
  // Event yang tidak termasuk akses anggota tidak boleh dibuka lewat pemilih/URL.
  function guardActive(){const vis=visibleEvents();if(vis.length&&!vis.some(e=>e.id===promoterState.activeEventId)){promoterState.activeEventId=vis[0].id}}

  const baseTemplate=template;
  function leftPage(){
    const o=owner();
    return `<div class="pro-locked"><div class="orb">▣</div><h2>Kamu sudah keluar dari tim ${esc(promoterState.organization)}</h2><p>Kepemilikan dipindahkan ke ${esc(o?.name||o?.email||'pemilik baru')}. Minta Pemilik mengundangmu lagi bila perlu akses.</p>
      <button class="pro-btn secondary" data-go="56">Kembali ke Pusat Akun</button><div class="pro-demo"><small>FITUR UJI COBA PROTOTIPE</small><div><button data-transfer-restore>Pulihkan sebagai Pemilik</button></div></div></div>`;
  }
  template=function(n){
    if(leftTeam()&&[64,65,66,67,70,71,TEAM].includes(n)){const fl=document.querySelector('#flowLayer');if(innerWidth>620)fl.classList.add('embedded');document.querySelector('#flowTitle').textContent='Promotor Studio';document.querySelector('#flowIndex').textContent='Akses berakhir';return leftPage()}
    const promoter=typeof isPromoter==='function'&&isPromoter();
    if(n===TEAM&&promoter)return restrict(window.promoterNav(teamPage(),TEAM),TEAM);
    if(promoter&&[64,65,66,67,71].includes(n)){
      if(n!==64){guardActive();if(!visibleEvents().length)return restrict(window.promoterNav(promoterPage('Event','Tidak ada event yang bisa diakses','<section class="team-card"><div class="ins-empty"><b>Belum ada event yang dibagikan kepadamu</b><span>Minta Pemilik atau Admin memberi akses event.</span></div></section>'),n),n)}
      return restrict(baseTemplate(n),n);
    }
    return baseTemplate(n);
  };
  const rerender=()=>openFlow(flowCurrent,false);

  function completeTransfer(){
    const tr=team.transfer,to=team.members.find(m=>m.id===tr?.to),old=owner();if(!tr||!to||!old)return;
    to.role='owner';to.access='all';
    if(tr.keepAs==='admin'){old.role='admin';old.access='all'}else team.members=team.members.filter(m=>m.id!==old.id);
    team.transfer=null;actingId=null;
    team.activity.unshift({by:to.name||to.email,role:'owner',text:`menerima kepemilikan ${promoterState.organization} dari ${old.name}${tr.kyc?` · identitas NIK ${tr.kyc.nik}${tr.kyc.review?' (perlu tinjauan manual)':''}`:''}${tr.keepAs==='admin'?'':' (pemilik lama keluar dari tim)'}`,at:Date.now()});savePromoter();
    pushNotif({kind:'meet',icon:'✓',who:to.name||to.email,av:initials(to.name||to.email),tone:'teal',text:`sekarang menjadi Pemilik ${promoterState.organization}.${tr.keepAs==='admin'?' Kamu tetap di tim sebagai Admin.':' Kamu sudah keluar dari tim.'}`,go:{screen:tr.keepAs==='admin'?TEAM:56}});
    window.syncPromoterChrome?.();
  }

  /* ---------- Verifikasi identitas (KTP) sebelum OTP penerimaan ---------- */
  // kyc = {to, ktp:{name,url,w,h}, selfie:{...}, nik, fullName, consent, status:'form'|'checking', error, results}
  // Foto hanya disimpan di memori selama proses; yang dicatat hanya NIK tersamarkan.
  let kyc=null;
  const KYC_MAX=5*1024*1024,KYC_MIN_W=600,KYC_MIN_H=380;
  const MONTHS_ID=['Januari','Februari','Maret','April','Mei','Juni','Juli','Agustus','September','Oktober','November','Desember'];
  const maskNik=n=>n?n.slice(0,4)+'••••••••'+n.slice(-4):'';
  function nikInfo(nik){
    if(!/^\d{16}$/.test(nik))return {error:'NIK harus 16 digit angka.'};
    const prov=+nik.slice(0,2);if(prov<11||prov>94)return {error:'Kode provinsi pada NIK tidak valid.'};
    let dd=+nik.slice(6,8);const mm=+nik.slice(8,10),yy=+nik.slice(10,12),female=dd>40;if(female)dd-=40;
    const nowYY=new Date().getFullYear()%100,year=yy>nowYY?1900+yy:2000+yy,birth=new Date(year,mm-1,dd);
    if(mm<1||mm>12||dd<1||birth.getMonth()!==mm-1||birth.getDate()!==dd)return {error:'Tanggal lahir di dalam NIK tidak valid.'};
    if(nik.slice(12)==='0000')return {error:'Nomor urut NIK tidak valid.'};
    const t=new Date();let age=t.getFullYear()-year;if(t.getMonth()<mm-1||(t.getMonth()===mm-1&&t.getDate()<dd))age--;
    return {birth,age,female,label:`${dd} ${MONTHS_ID[mm-1]} ${year}`};
  }
  const normName=n=>String(n||'').toLowerCase().replace(/[^a-z\s]/g,' ').split(/\s+/).filter(Boolean);
  function nameMatches(a,b){const x=normName(a),y=normName(b);return x.length&&y.length&&(x.every(w=>y.includes(w))||y.every(w=>x.includes(w)))}
  function readImage(file){return new Promise((ok,fail)=>{
    if(!file)return fail('Pilih file foto.');
    if(!/^image\/(jpeg|png|webp)$/.test(file.type))return fail('Gunakan foto JPG, PNG, atau WEBP.');
    if(file.size>KYC_MAX)return fail('Ukuran foto maksimal 5 MB.');
    const r=new FileReader();r.onerror=()=>fail('Foto tidak bisa dibaca.');r.onload=()=>{const img=new Image();img.onload=()=>ok({name:file.name,url:r.result,w:img.naturalWidth,h:img.naturalHeight});img.onerror=()=>fail('Foto tidak bisa dibaca.');img.src=r.result};r.readAsDataURL(file);
  })}
  const stepper=n=>`<ol class="kyc-steps"><li class="${n>1?'done':'now'}"><i>${n>1?'✓':'1'}</i>Verifikasi identitas</li><li class="${n===2?'now':''}"><i>2</i>Kode OTP</li></ol>`;
  function kycStep(to,isTarget){
    const k=kyc,who=isTarget?'kamu':esc(to.name||to.email),uploading=k.status==='checking';
    const file=(key,label,hint)=>{const f=k[key];return `<label class="kyc-file ${f?'has':''}"><span class="kyc-thumb">${f?`<img src="${f.url}" alt="Pratinjau ${label}">`:'▧'}</span><span><b>${label}</b><small>${f?`${esc(f.name)} · ${f.w}×${f.h} px`:hint}</small></span><input type="file" accept="image/jpeg,image/png,image/webp" data-kyc-file="${key}" ${uploading?'disabled':''}><em>${f?'Ganti':'Pilih foto'}</em></label>`};
    const results=k.results?`<ul class="kyc-results">${k.results.map(r=>`<li class="${r.ok===true?'ok':r.ok===false?'bad':'warn'}"><i>${r.ok===true?'✓':r.ok===false?'✕':'!'}</i>${esc(r.text)}</li>`).join('')}</ul>`:'';
    return `<section class="team-card team-accept"><header class="team-head"><div><h3>Terima kepemilikan ${esc(promoterState.organization)}</h3><p>Pemilik bertanggung jawab atas event resmi dan dana penjualan, jadi identitas ${who} perlu diperiksa.</p></div></header>${stepper(1)}
      <form class="kyc-form" data-kyc-form novalidate>
        <div class="kyc-files">${file('ktp','Foto KTP','Seluruh kartu terlihat jelas, tidak buram atau terpotong')}${file('selfie','Selfie dengan KTP','Wajah dan KTP terlihat dalam satu foto')}</div>
        <div class="team-grid"><label>NIK<input name="nik" inputmode="numeric" maxlength="16" autocomplete="off" value="${esc(k.nik||'')}" placeholder="16 digit sesuai KTP" ${uploading?'disabled':''}></label><label>Nama lengkap sesuai KTP<input name="fullName" maxlength="60" value="${esc(k.fullName||'')}" placeholder="Seperti tertulis di KTP" ${uploading?'disabled':''}></label></div>
        <label class="team-check"><input type="checkbox" name="consent" ${k.consent?'checked':''} ${uploading?'disabled':''}> Saya setuju data KTP dan foto diproses untuk verifikasi identitas sesuai Kebijakan Privasi Temmoo dan UU Pelindungan Data Pribadi.</label>
        <p class="team-otp-error" role="alert">${esc(k.error||'')}</p>${results}
        <div class="pro-demo"><small>FITUR UJI COBA PROTOTIPE: pemeriksaan hanya format & kualitas foto; pencocokan wajah dan data Dukcapil butuh layanan e-KYC</small><div><button type="button" data-kyc-sample>Isi NIK & nama contoh</button></div></div>
        <div class="team-form-actions"><button type="button" class="ghost" data-kyc-back>Kembali</button><button type="submit" class="accept-solid" ${uploading?'disabled':''}>${uploading?'Memeriksa dokumen…':'Periksa & lanjut ke OTP'}</button></div>
      </form></section>`;
  }
  function runKycCheck(){
    const to=team.members.find(m=>m.id===kyc.to),info=nikInfo(kyc.nik||'');
    const results=[];
    results.push(kyc.ktp&&kyc.ktp.w>=KYC_MIN_W&&kyc.ktp.h>=KYC_MIN_H?{ok:true,text:`Foto KTP cukup jelas (${kyc.ktp.w}×${kyc.ktp.h} px)`}:{ok:false,text:`Foto KTP terlalu kecil; minimal ${KYC_MIN_W}×${KYC_MIN_H} px`});
    results.push(kyc.selfie?{ok:true,text:'Selfie dengan KTP sudah diunggah'}:{ok:false,text:'Selfie dengan KTP belum diunggah'});
    if(info.error)results.push({ok:false,text:info.error});
    else{results.push({ok:true,text:`Format NIK valid · lahir ${info.label}`});results.push(info.age>=17?{ok:true,text:`Usia ${info.age} tahun (minimal 17)`}:{ok:false,text:`Usia ${info.age} tahun; pemilik minimal 17 tahun`})}
    results.push(nameMatches(kyc.fullName,to?.name)?{ok:true,text:'Nama di KTP sesuai dengan nama akun'}:{ok:'warn',text:`Nama di KTP berbeda dengan nama akun (${to?.name||to?.email}); Tim Temmoo akan meninjau manual`});
    return results;
  }
  function kycSubmit(form){
    const d=new FormData(form);kyc.nik=String(d.get('nik')||'').replace(/\D/g,'');kyc.fullName=String(d.get('fullName')||'').trim();kyc.consent=!!d.get('consent');kyc.results=null;
    const missing=!kyc.ktp?'Unggah foto KTP.':!kyc.selfie?'Unggah selfie dengan KTP.':!kyc.nik?'Isi NIK.':!kyc.fullName?'Isi nama lengkap sesuai KTP.':!/^[A-Za-z .,'-]+$/.test(kyc.fullName)?'Nama hanya boleh berisi huruf, spasi, titik, koma, atau tanda kutip.':!kyc.consent?'Setujui pemrosesan data untuk melanjutkan.':'';
    if(missing){kyc.error=missing;rerender();return}
    kyc.error='';kyc.status='checking';rerender();
    setTimeout(()=>{
      if(!kyc)return;kyc.status='form';kyc.results=runKycCheck();
      if(kyc.results.some(r=>r.ok===false)){kyc.error='Verifikasi belum lolos. Perbaiki yang ditandai ✕ lalu periksa lagi.';rerender();return}
      const to=team.members.find(m=>m.id===kyc.to);
      team.transfer.kyc={nik:maskNik(kyc.nik),verifiedAt:Date.now(),review:kyc.results.some(r=>r.ok==='warn')};savePromoter();
      const review=team.transfer.kyc.review;kyc=null;
      toast(review?'Identitas diterima dengan catatan tinjauan manual':'Identitas terverifikasi');
      startOtp({purpose:'accept',to:to.id,name:to.name||to.email,contact:{phone:to.phone||'',email:to.email}});
    },1400);
  }
  /* ---------- Event ---------- */
  document.addEventListener('click',e=>{
    const t=e.target;
    if(t.closest('[data-transfer-toggle]')){showTransfer=!showTransfer;otp=null;rerender();return}
    if(t.closest('[data-otp-back]')){otp=null;rerender();return}
    if(t.closest('[data-otp-resend]')&&otp){if(Date.now()<otp.sentAt+OTP_RESEND)return;sendOtp();toast('Kode baru dikirim');rerender();setTimeout(()=>document.querySelector('[data-otp-digit]')?.focus(),50);return}
    if(t.closest('[data-otp-channel]')&&otp){const wait=otp.sentAt+OTP_RESEND-Date.now();if(wait>0){toast(`Tunggu ${mmss(wait)} sebelum meminta kode baru`);return}otp.channel=otp.channel==='phone'?'email':'phone';sendOtp();toast(`Kode dikirim ke ${otp.channel==='phone'?'nomor HP':'email'}`);rerender();setTimeout(()=>document.querySelector('[data-otp-digit]')?.focus(),50);return}
    if(t.closest('[data-transfer-cancel]')){if(otp?.purpose==='accept')otp=null;kyc=null;if(team.transfer){const to=team.members.find(m=>m.id===team.transfer.to);team.transfer=null;log(`membatalkan pemindahan kepemilikan ke ${to?.name||to?.email}`);toast('Permintaan dibatalkan')}rerender();return}
    if(t.closest('[data-transfer-accept]')&&team.transfer){const to=team.members.find(m=>m.id===team.transfer.to);if(to){
      // Identitas yang sudah lolos untuk permintaan ini tidak perlu diunggah ulang.
      if(team.transfer.kyc){kyc=null;startOtp({purpose:'accept',to:to.id,name:to.name||to.email,contact:{phone:to.phone||'',email:to.email}})}
      else{otp=null;kyc={to:to.id,status:'form'};rerender()}}return}
    if(t.closest('[data-kyc-back]')){kyc=null;rerender();return}
    if(t.closest('[data-kyc-sample]')&&kyc){const to=team.members.find(m=>m.id===kyc.to);kyc.nik='3578015408000004';kyc.fullName=(to?.name||'').toUpperCase();kyc.error='';rerender();return}
    const sim=t.closest('[data-transfer-sim]');if(sim&&team.transfer){
      if(sim.dataset.transferSim==='decline'){otp=null;kyc=null;const to=team.members.find(m=>m.id===team.transfer.to);team.activity.unshift({by:to?.name||to?.email,role:to?.role,text:'menolak permintaan menjadi Pemilik',at:Date.now()});team.transfer=null;savePromoter();pushNotif({kind:'event',icon:'!',who:to?.name||'Anggota tim',av:initials(to?.name||to?.email),tone:'gold',text:'menolak permintaan menjadi Pemilik. Kamu tetap Pemilik.',go:{screen:TEAM}});toast('Permintaan ditolak');rerender()}
      return}
    if(t.closest('[data-transfer-restore]')){team.members.forEach(m=>{if(m.role==='owner'){m.role='admin';m.access='all'}});team.members.unshift({id:team.selfId,name:accountState.name,email:accountState.email,role:'owner',access:'all',status:'active',joinedAt:Date.now()});savePromoter();window.syncPromoterChrome?.();toast('Kamu kembali menjadi Pemilik (uji coba)');openFlow(TEAM,false);return}
    // Penjaga tindakan yang tidak diizinkan (mis. tombol yang dipanggil dari tempat lain)
    if(t.closest('[data-submit-event]')&&!can('submit')){e.preventDefault();e.stopImmediatePropagation();toast('Peranmu tidak bisa mengajukan event');return}
    if(t.closest('[data-team-invite-toggle]')){showInvite=!showInvite;rerender();return}
    const accept=t.closest('[data-team-accept]');if(accept){const m=team.members.find(x=>x.id===accept.dataset.teamAccept);if(m){m.status='active';m.joinedAt=Date.now();if(!m.name)m.name=m.email.split('@')[0];team.activity.unshift({by:m.name,role:m.role,text:`menerima undangan dan bergabung sebagai ${ROLES[m.role].label}`,at:Date.now()});savePromoter();
      pushNotif({kind:'follow',icon:'＋',who:m.name,av:initials(m.name),tone:'teal',text:`bergabung ke tim ${promoterState.organization} sebagai ${ROLES[m.role].label}`,go:{screen:TEAM}});toast(`${m.name} bergabung ke tim`);rerender()}return}
    const act=t.closest('[data-team-act]');if(act){actingId=act.dataset.teamAct;confirmRemove=null;editAccess=null;guardActive();toast(`Melihat sebagai ${me().name}`);openFlow(64,false);return}
    if(t.closest('[data-team-exit]')){actingId=null;toast('Kembali sebagai Pemilik');openFlow(TEAM,false);return}
    const rem=t.closest('[data-team-remove]');if(rem){const id=rem.dataset.teamRemove;if(confirmRemove!==id){confirmRemove=id;rerender();return}
      const m=team.members.find(x=>x.id===id);if(m&&canManage(m)){if(team.transfer?.to===id){team.transfer=null;log('permintaan pemindahan kepemilikan batal karena calon pemilik dihapus')}team.members=team.members.filter(x=>x.id!==id);log(m.status==='invited'?`membatalkan undangan ${m.email}`:`menghapus ${m.name||m.email} dari tim`);toast(m.status==='invited'?'Undangan dibatalkan':'Anggota dihapus')}confirmRemove=null;rerender();return}
    const ae=t.closest('[data-team-access-edit]');if(ae){editAccess=editAccess===ae.dataset.teamAccessEdit?null:ae.dataset.teamAccessEdit;rerender();return}
    if(t.closest('[data-team-access-done]')){editAccess=null;rerender();return}
  },true);
  const digits=()=>[...document.querySelectorAll('[data-otp-digit]')];
  const submitIfFull=()=>{if(digits().every(i=>i.value))document.querySelector('[data-otp-form] [type=submit]')?.click()};
  document.addEventListener('input',e=>{
    const box=e.target.closest('[data-otp-digit]');if(!box)return;
    // Hapus pesan error lama SEBELUM memeriksa, supaya error dari pemeriksaan ini tetap tampil.
    if(otp?.error){otp.error='';refreshOtp()}
    const v=box.value.replace(/\D/g,'');
    if(v.length>1){const all=digits(),start=all.indexOf(box);[...v].slice(0,6-start).forEach((c,i)=>all[start+i].value=c);all[Math.min(5,start+v.length)]?.focus();submitIfFull();return}
    box.value=v;if(v){const all=digits();all[all.indexOf(box)+1]?.focus();submitIfFull()}
  });
  document.addEventListener('keydown',e=>{
    const box=e.target.closest?.('[data-otp-digit]');if(!box)return;const all=digits(),i=all.indexOf(box);
    if(e.key==='Backspace'&&!box.value&&i>0){e.preventDefault();all[i-1].value='';all[i-1].focus()}
    if(e.key==='ArrowLeft'&&i>0)all[i-1].focus();
    if(e.key==='ArrowRight'&&i<5)all[i+1].focus();
  });
  document.addEventListener('paste',e=>{
    const box=e.target.closest?.('[data-otp-digit]');if(!box)return;const v=(e.clipboardData?.getData('text')||'').replace(/\D/g,'').slice(0,6);if(!v)return;e.preventDefault();
    const all=digits();[...v].forEach((c,i)=>{if(all[i])all[i].value=c});all[Math.min(5,v.length)]?.focus();submitIfFull();
  });
  document.addEventListener('change',e=>{
    const t=e.target;
    const kf=t.closest('[data-kyc-file]');if(kf&&kyc){const key=kf.dataset.kycFile,form=kf.form;
      if(form){kyc.nik=form.elements.nik.value.replace(/\D/g,'');kyc.fullName=form.elements.fullName.value;kyc.consent=form.elements.consent.checked}
      readImage(kf.files[0]).then(img=>{kyc[key]=img;kyc.error='';kyc.results=null;rerender()},msg=>{kyc.error=msg;rerender()});return}
    const r=t.closest('[data-team-role]');if(r){const m=team.members.find(x=>x.id===r.dataset.teamRole);if(m&&canManage(m)){const from=ROLES[m.role].label;m.role=r.value;if(m.role==='admin')m.access='all';if(team.transfer?.to===m.id&&m.role!=='admin'){team.transfer=null;log('permintaan pemindahan kepemilikan batal karena calon pemilik bukan Admin lagi')}log(`mengubah peran ${m.name||m.email}: ${from} → ${ROLES[m.role].label}`);toast('Peran diperbarui');rerender()}return}
    const sc=t.closest('[data-team-scope]');if(sc){const m=team.members.find(x=>x.id===sc.dataset.teamScope);if(m){m.access='all';log(`memberi ${m.name||m.email} akses semua event`);rerender()}return}
    const ev=t.closest('[data-team-event]');if(ev){const m=team.members.find(x=>x.id===ev.dataset.teamEvent);if(m){const set=new Set(m.access==='all'?[]:m.access||[]);ev.checked?set.add(ev.value):set.delete(ev.value);m.access=[...set];const name=promoterState.events.find(x=>x.id===ev.value)?.name||'event';log(`${ev.checked?'memberi':'mencabut'} akses ${m.name||m.email} ke “${name}”`);rerender()}return}
    // Form undangan: daftar event hanya aktif bila "Event tertentu"
    const scope=t.closest('[data-team-invite] [name=scope]');if(scope)t.form.querySelector('.team-events').classList.toggle('on',scope.value==='some');
  });
  document.addEventListener('submit',e=>{const f=e.target.closest('[data-kyc-form]');if(!f||!kyc)return;e.preventDefault();kycSubmit(f)});
  document.addEventListener('input',e=>{const n=e.target.closest('[data-kyc-form] [name=nik]');if(n)n.value=n.value.replace(/\D/g,'').slice(0,16)});
  document.addEventListener('submit',e=>{
    const f=e.target.closest('[data-transfer-form]');if(!f)return;e.preventDefault();
    if(me().role!=='owner'||actingId){toast('Hanya Pemilik yang bisa memindahkan kepemilikan');return}
    const d=new FormData(f),to=team.members.find(m=>m.id===d.get('to')&&m.role==='admin'&&m.status==='active');
    if(!to){toast('Pilih Admin aktif sebagai pemilik baru');return}
    if(String(d.get('confirm')).trim()!==promoterState.organization){toast(`Ketik “${promoterState.organization}” persis untuk konfirmasi`);f.elements.confirm.focus();return}
    startOtp({purpose:'transfer',to:to.id,keepAs:d.get('keepAs')==='leave'?'leave':'admin',name:accountState.name,contact:{phone:accountState.phone,email:accountState.email}});
  });
  // Langkah OTP: kode 6 digit, berlaku 5 menit, kirim ulang setelah 60 detik, maksimal 5 percobaan.
  document.addEventListener('submit',e=>{
    const f=e.target.closest('[data-otp-form]');if(!f)return;e.preventDefault();
    if(!otp)return;
    if(otp.purpose==='transfer'&&(me().role!=='owner'||actingId))return;
    if(otp.purpose==='accept'&&!team.transfer){otp=null;rerender();return}
    const code=[...f.querySelectorAll('[data-otp-digit]')].map(i=>i.value).join('');
    if(code.length<6){otp.error='Masukkan 6 digit kode.';refreshOtp();return}
    if(Date.now()>otp.expiresAt){otp.error='Kode sudah kedaluwarsa. Kirim ulang kode baru.';refreshOtp();return}
    if(code!==otp.code){
      otp.attempts++;
      if(otp.attempts>=OTP_MAX){
        if(otp.purpose==='accept'){const to=team.members.find(m=>m.id===otp.to);team.activity.unshift({by:to?.name||to?.email,role:to?.role,text:`gagal memasukkan kode OTP ${OTP_MAX} kali saat menerima kepemilikan`,at:Date.now()});savePromoter();otp=null;toast('Terlalu banyak percobaan. Permintaan tetap menunggu; coba terima lagi.');rerender();return}
        log(`gagal memasukkan kode OTP ${OTP_MAX} kali saat memindahkan kepemilikan`);otp=null;showTransfer=false;toast('Terlalu banyak percobaan. Ulangi pemindahan dari awal.');rerender();return}
      otp.error=`Kode salah. Sisa ${OTP_MAX-otp.attempts} percobaan.`;refreshOtp(true);return}
    if(otp.purpose==='accept'){
      const left=team.transfer.keepAs==='leave';otp=null;completeTransfer();
      toast(left?'Kepemilikan diterima. Pemilik lama keluar dari tim.':'Kepemilikan diterima');openFlow(left&&!self()?64:TEAM,false);return}
    const to=team.members.find(m=>m.id===otp.to&&m.role==='admin'&&m.status==='active');
    if(!to){otp=null;toast('Calon pemilik tidak lagi Admin aktif');rerender();return}
    team.transfer={to:to.id,keepAs:otp.keepAs,at:Date.now(),expiresAt:Date.now()+7*DAY};otp=null;
    log(`memverifikasi OTP dan meminta ${to.name||to.email} menjadi Pemilik baru`);showTransfer=false;
    pushNotif({kind:'event',icon:'◷',who:'Tim Temmoo',av:'T',tone:'',text:`permintaan pemindahan kepemilikan ${promoterState.organization} ke ${to.name||to.email} sudah dikirim`,go:{screen:TEAM}});
    toast('Kode benar. Permintaan pemindahan dikirim');rerender();
  });
  document.addEventListener('submit',e=>{
    const f=e.target.closest('[data-team-invite]');if(!f)return;e.preventDefault();
    if(!can('team')){toast('Peranmu tidak bisa mengundang anggota');return}
    const d=new FormData(f),email=String(d.get('email')).trim().toLowerCase(),role=d.get('role'),scope=d.get('scope'),evs=d.getAll('events');
    if(team.members.some(m=>(m.email||'').toLowerCase()===email)){toast('Email ini sudah ada di tim');return}
    if(role!=='admin'&&scope==='some'&&!evs.length){toast('Pilih minimal satu event');return}
    team.members.push({id:uid(),name:String(d.get('name')||'').trim(),email,role,access:role==='admin'||scope==='all'?'all':evs,status:'invited',invitedAt:Date.now()});
    log(`mengundang ${email} sebagai ${ROLES[role].label}`);showInvite=false;toast('Undangan terkirim');rerender();
  });
  // Catat aktivitas dari form bawaan (kelola event & pengumuman); window bubble = setelah handler aslinya.
  window.addEventListener('submit',e=>{
    if(e.target.closest('[data-promoter-event-form]')){const intent=e.submitter?.value||'draft',name=promoterState.event.name||'Event tanpa nama';log(intent==='submit'?`mengajukan “${name}” ke Tim Temmoo`:`menyimpan draft “${name}”`)}
    if(e.target.closest('[data-ins-announce]'))log(`mengirim pengumuman untuk “${promoterState.event.name}”`);
  });
  // Penjaga kirim pengajuan dari form untuk Editor/Pengamat
  window.addEventListener('submit',e=>{const f=e.target.closest('[data-promoter-event-form]');if(!f)return;if((e.submitter?.value==='submit'&&!can('submit'))||!can('edit')){e.preventDefault();e.stopImmediatePropagation();toast('Peranmu tidak bisa melakukan ini')}},true);
})();
