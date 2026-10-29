// Ringkasan Promotor Studio (layar 64): rencana kehadiran, alasan, tren, asal peserta, komunitas,
// langkah berikutnya, dan pengumuman. Angka peserta adalah contoh (prototipe tanpa server),
// ditambah status kehadiran & alasan yang dipilih di browser ini untuk event tersebut.
(()=>{
  const esc=escapeText,nf=n=>Number(n).toLocaleString('id-ID');
  const MONTHS=['januari','februari','maret','april','mei','juni','juli','agustus','september','oktober','november','desember'];
  const REASONS=['Harga tiket','Belum punya teman','Lokasi terlalu jauh','Transportasi','Belum yakin dengan lineup'];
  const TIPS={'Harga tiket':'Pertimbangkan harga early bird atau promo beli berempat.','Belum punya teman':'Aktifkan grup resmi dan ajak peserta mencari teman datang bareng di Circle.','Lokasi terlalu jauh':'Bagikan info rute dan titik kumpul dari kota sekitar.','Transportasi':'Umumkan opsi parkir, ojek online, dan rute transportasi umum.','Belum yakin dengan lineup':'Bagikan rundown dan cuplikan pengisi acara.'};

  function seedOf(str){let h=2166136261;for(const c of str)h=Math.imul(h^c.charCodeAt(0),16777619);return h>>>0}
  function rand(seed){let s=seed||1;return()=>((s=Math.imul(s^s>>>15,2246822507)^Math.imul(s^s>>>13,3266489909),(s^=s>>>16)>>>0)%1000)/1000}
  function eventDate(ev){const m=String(ev.date||'').toLowerCase().match(/(\d{1,2})\s+([a-z]+)\s+(\d{4})/);if(!m)return null;const mi=MONTHS.indexOf(m[2]);return mi<0?null:new Date(+m[3],mi,+m[1])}
  function phase(ev){const d=eventDate(ev);if(!d)return {key:'upcoming',days:null};const t=new Date();t.setHours(0,0,0,0);const days=Math.round((d-t)/864e5);return {key:days>0?'upcoming':days===0?'today':'finished',days,date:d}}

  function stats(){
    const ev=promoterState.event,cap=Number(ev.capacity)||1000,r=rand(seedOf(ev.name)),ph=phase(ev);
    const s={interested:Math.round(cap*.2+r()*40),considering:Math.round(cap*.055+r()*15),going:Math.round(cap*.15+r()*30),attended:0};
    if(ph.key==='finished'){s.attended=Math.round(s.going*(.78+r()*.1));s.going-=s.attended}
    // Sinyal nyata dari browser ini: status & alasan yang dipilih pengguna untuk event ini.
    const idx=ev.publishedIndex,own=idx!=null&&typeof attendanceState!=='undefined'?attendanceState[idx]:null;
    if(own&&s[own.status]!==undefined)s[own.status]++;
    const w=[.38,.27,.17,.11,.07],reasons=REASONS.map((name,i)=>({name,n:Math.round(s.considering*w[i])}));
    if(own?.reason){const x=reasons.find(x=>x.name===own.reason);if(x)x.n++}
    reasons.sort((a,b)=>b.n-a.n);
    const city=(ev.venue||'').split(',').pop().trim()||'Surabaya';
    const others=['Sidoarjo','Malang','Gresik','Jakarta','Mojokerto'].filter(c=>c!==city);
    const share=[.61,.14,.1,.07,.04],people=s.interested+s.considering+s.going+s.attended;
    const cities=[city,...others.slice(0,4)].map((c,i)=>({name:c,n:Math.round(people*share[i])}));
    const end=ph.key==='finished'?ph.date:new Date(),trend=[];
    for(let i=6;i>=0;i--){const d=new Date(end);d.setDate(d.getDate()-i);trend.push({d,n:Math.round(s.going/30*(.6+r()*.9)+(6-i)*1.4)})}
    return {...s,cap,people,reasons,cities,trend,ph,
      community:{members:Math.round((s.going+s.attended)*.36),groups:3+Math.floor(r()*4),posts:12+Math.floor(r()*30),questions:2+Math.floor(r()*5)}};
  }

  const tip=(t)=>`data-tip="${esc(t)}"`;
  function kpis(st){
    const decided=st.going+st.attended,fin=st.ph.key==='finished';
    const dayTxt=st.ph.days==null?'Tanggal belum valid':fin?`Selesai ${-st.ph.days} hari lalu`:st.ph.key==='today'?'Hari ini':`${st.ph.days} hari lagi`;
    return `<div class="ins-kpis">
      <article><span>Total peminat</span><b>${nf(st.people)}</b><small>Semua yang memilih status</small></article>
      <article><span>${fin?'Sudah hadir':'Mau datang'}</span><b>${nf(fin?st.attended:st.going)}</b><small>${fin?`${Math.round(st.attended/Math.max(1,decided)*100)}% dari yang berencana datang`:`${Math.round(st.going/st.cap*100)}% dari kapasitas ${nf(st.cap)}`}</small></article>
      <article><span>Masih mikir</span><b>${nf(st.considering)}</b><small>Peluang untuk diyakinkan</small></article>
      <article><span>Hari event</span><b>${fin?'Selesai':st.ph.key==='today'?'Hari ini':st.ph.days==null?'—':nf(st.ph.days)}</b><small>${dayTxt}</small></article></div>`;
  }
  function attendanceCard(st){
    const rows=[['ins-s1','Tertarik','Menyimpan event, belum menentukan',st.interested],['ins-s2','Masih mikir','Punya alasan menunda keputusan',st.considering],['ins-s3','Mau datang',st.ph.key==='finished'?'Berencana datang, tidak check-in':'Berencana hadir',st.going]];
    if(st.ph.key==='finished')rows.push(['ins-s4','Sudah hadir','Check-in di venue',st.attended]);
    const total=rows.reduce((a,r)=>a+r[3],0)||1,decided=st.going+st.attended,pct=n=>Math.round(n/total*100);
    const fill=Math.min(100,decided/st.cap*100);
    const conv=Math.round(decided/total*100);
    return `<section class="ins-card ins-wide"><header><div><h2>Rencana kehadiran</h2><p>Status yang dipilih pengguna di halaman event</p></div><span class="ins-sample">Data contoh</span></header>
      <div class="ins-stack" role="img" aria-label="Komposisi rencana kehadiran">${rows.map(r=>`<i class="${r[0]}" style="flex:${Math.max(r[3],total*.012)}" ${tip(`${r[1]}: ${nf(r[3])} (${pct(r[3])}%)`)}></i>`).join('')}</div>
      <ul class="ins-rows">${rows.map(r=>`<li><span class="key ${r[0]}"></span><span>${r[1]}<small>${r[2]}</small></span><b>${nf(r[3])}</b><em>${pct(r[3])}%</em></li>`).join('')}</ul>
      <div class="ins-meter"><div><b>Kuota kursi terisi</b><span>${nf(decided)} dari ${nf(st.cap)} (${Math.round(fill)}%)</span></div><div class="ins-track" ${tip(`${nf(decided)} orang berencana datang / kapasitas ${nf(st.cap)}`)}><i style="width:${fill}%"></i></div></div>
      <p class="ins-insight">${conv}% peminat sudah memutuskan datang. ${st.considering?`${nf(st.considering)} orang masih mikir, kebanyakan karena <b>${esc(st.reasons[0].name.toLowerCase())}</b>.`:''}</p></section>`;
  }
  function reasonsCard(st){
    const max=Math.max(1,...st.reasons.map(x=>x.n));
    return `<section class="ins-card"><header><div><h2>Kenapa masih mikir?</h2><p>Alasan dari ${nf(st.considering)} orang</p></div></header>
      <div class="ins-bars">${st.reasons.map((x,i)=>`<div class="ins-bar" ${tip(`${x.name}: ${nf(x.n)} orang`)}><span>${x.name}</span><span><i class="fill ${i?'muted':''}" style="display:block;width:${x.n/max*100}%"></i></span><b>${nf(x.n)}</b></div>`).join('')}</div>
      <p class="ins-tip"><b>Saran:</b> ${TIPS[st.reasons[0].name]}</p></section>`;
  }
  function trendCard(st){
    const max=Math.max(1,...st.trend.map(x=>x.n)),fmt=d=>d.toLocaleDateString('id-ID',{day:'numeric',month:'short'});
    return `<section class="ins-card"><header><div><h2>Pendaftar "Mau datang"</h2><p>${st.ph.key==='finished'?'7 hari terakhir sebelum event':'7 hari terakhir'}</p></div></header>
      <div class="ins-cols">${st.trend.map((x,i)=>`<div ${tip(`${fmt(x.d)}: ${x.n} orang baru`)}><i style="height:${Math.max(4,x.n/max*100)}%"></i>${i===6?`<b style="bottom:${x.n/max*100}%">${x.n}</b>`:''}</div>`).join('')}</div>
      <div class="ins-days">${st.trend.map(x=>`<span>${fmt(x.d)}</span>`).join('')}</div></section>`;
  }
  function citiesCard(st){
    const max=Math.max(1,...st.cities.map(x=>x.n));
    return `<section class="ins-card"><header><div><h2>Asal peserta</h2><p>Berdasarkan kota di profil</p></div></header>
      <div class="ins-bars">${st.cities.map((x,i)=>`<div class="ins-bar" ${tip(`${x.name}: ${nf(x.n)} orang (${Math.round(x.n/st.people*100)}%)`)}><span>${x.name}</span><span><i class="fill ${i?'muted':''}" style="display:block;width:${x.n/max*100}%"></i></span><b>${Math.round(x.n/st.people*100)}%</b></div>`).join('')}</div></section>`;
  }
  function communityCard(st){
    const c=st.community;
    return `<section class="ins-card"><header><div><h2>Komunitas event</h2><p>Aktivitas di sekitar eventmu</p></div></header>
      <div class="ins-community"><div><b>${nf(c.members)}</b><span>Anggota grup resmi</span></div><div><b>${c.groups}</b><span>Grup buatan peserta</span></div><div><b>${c.posts}</b><span>Postingan menyebut event</span></div><div><b>${c.questions}</b><span>Pertanyaan belum dijawab</span></div></div></section>`;
  }
  function actionsCard(st){
    const fin=st.ph.key==='finished';
    const items=fin?[['▧','Unggah album resmi','Peserta bisa membeli foto event','album'],['✉','Kirim ucapan terima kasih',`Ke ${nf(st.attended)} peserta yang hadir`,'announce'],['▣','Lihat Event Hub','Cek tampilan publik eventmu','hub']]
      :[['✉','Kirim pengumuman',`Ke ${nf(st.people)} peminat event`,'announce'],['◎','Buka grup resmi',`${nf(st.community.members)} anggota · ${st.community.questions} pertanyaan menunggu`,'groups'],['▣','Lihat Event Hub','Cek tampilan publik eventmu','hub']];
    return `<section class="ins-card"><header><div><h2>Langkah berikutnya</h2><p>${fin?'Event sudah selesai':'Event belum dimulai'}</p></div></header>
      <div class="ins-actions">${items.map(x=>`<button type="button" data-ins-action="${x[3]}"><i>${x[0]}</i><span><b>${x[1]}</b><small>${x[2]}</small></span>›</button>`).join('')}</div></section>`;
  }
  function announceCard(){
    const list=promoterState.announcements||[];
    return `<section class="ins-card ins-announce" id="insAnnounce"><header><div><h2>Pengumuman ke peserta</h2><p>Tampil di Event Hub dan dikirim sebagai notifikasi</p></div></header>
      <form data-ins-announce><textarea name="text" required maxlength="280" placeholder="Contoh: Gate dibuka pukul 09.00. Bawa tiket dan identitas."></textarea><div><span>Maksimal 280 karakter</span><button type="submit">Kirim pengumuman</button></div></form>
      ${list.length?`<ul>${list.slice(0,3).map(a=>`<li>${esc(a.text)}<small>${new Date(a.at).toLocaleString('id-ID',{day:'numeric',month:'short',hour:'2-digit',minute:'2-digit'})}</small></li>`).join('')}</ul>`:''}</section>`;
  }

  // Tooltip hover ringan untuk semua elemen [data-tip] di dashboard.
  document.body.insertAdjacentHTML('beforeend','<div class="ins-hover" id="insHover" hidden></div>');
  const hover=document.querySelector('#insHover');
  document.addEventListener('mousemove',e=>{const t=e.target.closest?.('[data-tip]');if(!t){hover.hidden=true;return}hover.textContent=t.dataset.tip;hover.hidden=false;const x=Math.min(e.clientX+14,innerWidth-hover.offsetWidth-8);hover.style.left=x+'px';hover.style.top=(e.clientY+16)+'px'});

  const baseTemplate=template;
  template=function(n){
    let html=baseTemplate(n);
    if(n===64&&typeof isPromoter==='function'&&isPromoter()){
      const ev=promoterState.event;
      html=html.replace(/<div class="promoter-stats">[\s\S]*?<\/div><section class="promoter-panel">/,m=>(ev.status==='published'?kpis(stats()):'')+'<section class="promoter-panel">');
      const extra=ev.status==='published'?(()=>{const st=stats();return `<div class="ins-grid">${attendanceCard(st)}${reasonsCard(st)}${trendCard(st)}${citiesCard(st)}${communityCard(st)}${actionsCard(st)}${announceCard()}</div>`})()
        :`<div class="ins-grid"><section class="ins-card ins-wide"><div class="ins-empty"><b>Data peserta muncul setelah event terbit</b><span>Rencana kehadiran, alasan peserta, asal kota, dan pengumuman tersedia begitu event disetujui Tim Temmoo.</span></div></section></div>`;
      const i=html.lastIndexOf('</main>');if(i>0)html=html.slice(0,i)+extra+html.slice(i);
    }
    // Event Hub menampilkan pengumuman terbaru promotor untuk event miliknya.
    if(n===46&&promoterState.event.status==='published'&&activeEvent===promoterState.event.publishedIndex&&promoterState.announcements?.length){
      const a=promoterState.announcements[0];
      html=html.replace(/(<div class="hub-announcement"><b>)Pengumuman promotor(<\/b><p>)[\s\S]*?(<\/p><small>)[\s\S]*?(<\/small>)/,`$1Pengumuman ${esc(promoterState.organization)}$2${esc(a.text)}$3Baru saja$4`);
    }
    return html;
  };

  document.addEventListener('click',e=>{
    const a=e.target.closest('[data-ins-action]');if(!a)return;
    const ev=promoterState.event;syncPublishedEvent();activeEvent=ev.publishedIndex??0;
    const act=a.dataset.insAction;
    if(act==='announce'){const box=document.querySelector('#insAnnounce');box?.scrollIntoView({behavior:'smooth',block:'center'});setTimeout(()=>box?.querySelector('textarea')?.focus(),300)}
    if(act==='hub')openFlow(46);
    if(act==='groups')openFlow(19);
    if(act==='album')openFlow(59);
  });
  document.addEventListener('submit',e=>{
    const f=e.target.closest('[data-ins-announce]');if(!f)return;e.preventDefault();
    const text=f.elements.text.value.trim();if(!text)return;
    promoterState.announcements=[{text,at:Date.now()},...(promoterState.announcements||[])].slice(0,20);savePromoter();
    const idx=promoterState.event.publishedIndex;
    pushNotif({kind:'group',icon:'✉',who:promoterState.organization,av:promoterState.organization.split(/\s+/).slice(0,2).map(w=>w[0]).join('').toUpperCase(),tone:'gold',text:`mengumumkan untuk ${promoterState.event.name}`,quote:text,go:idx!=null?{event:idx}:{screen:64}});
    toast('Pengumuman terkirim ke peserta');openFlow(64,false);
  });
})();
