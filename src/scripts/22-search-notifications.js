
// Pencarian global (layar 14), halaman notifikasi (layar 11), dan penyimpanan Temui / follow / chat.
(()=>{
  const read=(k,d)=>{try{return JSON.parse(localStorage.getItem(k))??d}catch{return d}};
  const write=(k,v)=>{try{localStorage.setItem(k,JSON.stringify(v))}catch{}};
  const esc=escapeText,norm=v=>String(v||'').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g,'');
  const plain=html=>{const d=document.createElement('div');d.innerHTML=html;return d.textContent};
  const avatar=(tone,text)=>`<div class="avatar ${tone||''}">${text}</div>`;

  /* ---------- Pencarian ---------- */
  const RECENT='temmoo_recent_search_v1';
  let query='',tab='all',recent=read(RECENT,[]);
  const people=()=>Object.values(publicProfiles).map(p=>{const c=circles.find(c=>c[0]===p.name)||[];return {...p,match:c[3]||p.match||'',interests:c[4]||''}});
  const hit=(q,...fields)=>fields.some(f=>norm(f).includes(q));
  const mark=(text,q)=>{const t=esc(text);if(!q)return t;const i=norm(text).indexOf(q);return i<0?t:esc(text.slice(0,i))+'<mark>'+esc(text.slice(i,i+q.length))+'</mark>'+esc(text.slice(i+q.length))};
  function rememberQuery(q){q=q.trim();if(!q)return;recent=[q,...recent.filter(x=>norm(x)!==norm(q))].slice(0,6);write(RECENT,recent)}
  function searchResults(){
    const q=norm(query.trim());
    if(!q)return `<section class="search-section">${recent.length?`<header><h3>Pencarian terakhir</h3><button data-search-clear-recent>Hapus</button></header><div class="search-chips">${recent.map(r=>`<button data-search-term="${esc(r)}">↺ ${esc(r)}</button>`).join('')}</div>`:''}</section><section class="search-section"><header><h3>Coba cari</h3></header><div class="search-chips">${['festival','Surabaya','coffee','Hindia','kuliner','Nadia'].map(r=>`<button data-search-term="${r}">${r}</button>`).join('')}</div></section>`;
    const ppl=people().filter(p=>hit(q,p.name,p.handle,p.interests,p.bio));
    const pst=posts.filter(p=>hit(q,p[0],p[1],plain(p[5]),p[6]));
    const evs=events.map((e,i)=>({e,i})).filter(({e})=>hit(q,e[0],e[2],e[4]));
    const total=ppl.length+pst.length+evs.length;
    if(!total)return `<div class="search-empty"><b>Tidak ada hasil untuk “${esc(query.trim())}”</b>Coba kata lain, nama orang, atau nama event.</div>`;
    const limit=tab==='all'?3:99;
    const section=(key,title,items,render)=>(tab==='all'||tab===key)&&items.length?`<section class="search-section"><header><h3>${title} <small class="muted">${items.length}</small></h3>${tab==='all'&&items.length>limit?`<button data-search-tab="${key}">Lihat semua</button>`:''}</header>${items.slice(0,limit).map(render).join('')}</section>`:'';
    return section('people','Orang',ppl,p=>`<button class="search-row" data-open-profile="${esc(p.name)}" data-search-hit>${avatar(p.tone,p.avatar)}<div><b>${mark(p.name,q)}</b><small>${mark(p.handle,q)}${p.interests?' · '+mark(p.interests,q):''}</small></div>${p.match?`<em>${esc(p.match)}</em>`:''}</button>`)
      +section('events','Event',evs,({e,i})=>`<button class="search-row" data-event-index="${i}" data-search-hit><span class="search-date">${esc(e[1]).replace(' ','<br>')}</span><div><b>${mark(e[0],q)}</b> ${endedBadge(i)}<small>${mark(e[2],q)} · ${mark(e[4],q)}</small></div></button>`)
      +section('posts','Postingan',pst,p=>post(p))
      +((tab!=='all'&&!{people:ppl,events:evs,posts:pst}[tab].length)?`<div class="search-empty"><b>Tidak ada hasil di kategori ini</b>Coba lihat tab Semua.</div>`:'');
  }
  function searchScreen(){
    return `<div class="search-page"><label class="search-box"><span>⌕</span><input id="globalSearch" type="text" enterkeyhint="search" autocomplete="off" placeholder="Cari orang, postingan, atau event" value="${esc(query)}"><button type="button" data-search-clear aria-label="Hapus pencarian" ${query?'':'hidden'}>×</button></label><div class="search-tabs">${[['all','Semua'],['people','Orang'],['events','Event'],['posts','Postingan']].map(([k,l])=>`<button class="${tab===k?'active':''}" data-search-tab="${k}">${l}</button>`).join('')}</div><div id="searchResults">${searchResults()}</div></div>`;
  }
  const refreshResults=()=>{const r=document.querySelector('#searchResults');if(r)r.innerHTML=searchResults();const c=document.querySelector('[data-search-clear]');if(c)c.hidden=!query};
  window.openSearch=function(q){if(typeof q==='string')query=q;if(flowCurrent===14){const i=document.querySelector('#globalSearch');if(i)i.value=query;refreshResults()}else openFlow(14);requestAnimationFrame(()=>{const i=document.querySelector('#globalSearch');if(i){i.focus();i.setSelectionRange(i.value.length,i.value.length)}})};

  /* ---------- Notifikasi ---------- */
  const READ='temmoo_notif_read_v1',FOLLOW='temmoo_follow_v1';
  const readIds=new Set(read(READ,[])),followed=new Set(read(FOLLOW,[]));
  let notifTab='all';
  const notifs=[
    {id:'n1',kind:'meet',icon:'✓',who:'Nadia Aulia',av:'NA',tone:'teal',text:'menerima permintaan Temui-mu. Sekarang kalian bisa ngobrol.',time:'2 menit',fresh:true,go:{profile:'Nadia Aulia'}},
    {id:'n2',kind:'like',icon:'♥',who:'Kevin Ardana',av:'KA',tone:'gold',text:'menyukai postinganmu',quote:'Circle-nya asik banget pas konser kemarin.',time:'15 menit',fresh:true,go:{view:'profile'}},
    {id:'n3',kind:'reply',icon:'↩',who:'Salsa Putri',av:'SP',tone:'',text:'membalas postinganmu',quote:'Aku juga mau ikut barengan dari Surabaya!',time:'1 jam',fresh:true,go:{view:'profile'}},
    {id:'n4',kind:'event',icon:'★',who:'+62 Coffee R-I Fest',av:'CF',tone:'gold',text:'sudah selesai. Bagikan momen favoritmu bersama Circle',time:'3 jam',go:{event:0}},
    {id:'n5',kind:'group',icon:'▣',who:'Circle Coffee Fest',av:'CF',tone:'gold',text:'12 pesan baru di grup',quote:'Kevin: ketemu di gate 2 ya',time:'5 jam',go:{chat:1}},
    {id:'n6',kind:'follow',icon:'＋',who:'Dimas Raka',av:'DR',tone:'teal',text:'mulai mengikutimu',time:'1 hari',go:{profile:'Dimas Raka'},follow:true},
    {id:'n7',kind:'event',icon:'★',who:'Hindia Live 2026',av:'HL',tone:'teal',text:'94 orang tertarik, termasuk 2 teman Circle-mu',time:'2 hari',go:{event:1}}
  ];
  // Notifikasi tambahan dari fitur lain (mis. status pengajuan promotor), disimpan agar tidak hilang saat refresh.
  const EXTRA='temmoo_notif_extra_v1',extra=read(EXTRA,[]);notifs.unshift(...extra);
  window.pushNotif=function(n){n={fresh:true,time:'Baru saja',...n,id:n.id||'x'+Date.now()};extra.unshift(n);write(EXTRA,extra.slice(0,30));notifs.unshift(n);readIds.delete(n.id);updateBadges();if(document.querySelector('.notif-page'))refreshNotif()};
  const unread=()=>notifs.filter(n=>!readIds.has(n.id)).length;
  function updateBadges(){const n=unread();document.querySelectorAll('[data-notif-count]').forEach(b=>{b.textContent=n>9?'9+':n;b.hidden=!n})}
  function notifItem(n){const isRead=readIds.has(n.id),on=followed.has(n.who);return `<div class="notif-item ${isRead?'':'unread'}" role="button" tabindex="0" data-notif="${n.id}"><span class="notif-av">${avatar(n.tone,n.av)}<i class="notif-icon ni-${n.kind}">${n.icon}</i></span><div class="notif-body"><span><b>${esc(n.who)}</b> ${esc(n.text)}</span>${n.quote?`<q>“${esc(n.quote)}”</q>`:''}<small>${n.time==='Baru saja'?n.time:n.time+' lalu'}</small></div>${n.follow?`<button class="notif-follow ${on?'following':''}" data-follow-back="${esc(n.who)}">${on?'Mengikuti':'Ikuti balik'}</button>`:''}</div>`}
  function notifList(){
    const list=notifs.filter(n=>notifTab==='all'||(notifTab==='social'?['meet','like','reply','follow'].includes(n.kind):['event','group'].includes(n.kind)));
    if(!list.length)return `<div class="search-empty"><b>Belum ada notifikasi</b>Kabar terbaru akan muncul di sini.</div>`;
    const fresh=list.filter(n=>n.fresh),old=list.filter(n=>!n.fresh);
    return (fresh.length?`<div class="notif-group">BARU</div>${fresh.map(notifItem).join('')}`:'')+(old.length?`<div class="notif-group">SEBELUMNYA</div>${old.map(notifItem).join('')}`:'');
  }
  function notifScreen(){const n=unread();return `<div class="notif-page"><div class="notif-top"><p>${n?`${n} belum dibaca`:'Semua sudah dibaca'}</p><button data-notif-read-all ${n?'':'disabled'}>Tandai semua dibaca</button></div><div class="notif-tabs">${[['all','Semua'],['social','Interaksi'],['event','Event & Grup']].map(([k,l])=>`<button class="${notifTab===k?'active':''}" data-notif-tab="${k}">${l}</button>`).join('')}</div><div id="notifList">${notifList()}</div></div>`}
  const refreshNotif=()=>{const page=document.querySelector('.notif-page');if(page)page.outerHTML=notifScreen();updateBadges()};
  function openNotif(n){
    readIds.add(n.id);write(READ,[...readIds]);updateBadges();
    const g=n.go;
    if(g.profile)openPublicProfile(g.profile);
    else if(g.event!==undefined)openEvent(g.event);
    else if(g.chat!==undefined){closeFlow();show('chat');selectChat(g.chat)}
    else if(g.view){closeFlow();show(g.view)}
    else if(g.screen){if(g.promoterEvent)window.selectPromoterEvent?.(g.promoterEvent);openFlow(g.screen)}
  }

  /* ---------- Layar baru di sistem flow ---------- */
  const baseTemplate=template;
  template=function(n){
    if(n!==11&&n!==14)return baseTemplate(n);
    const flowEl=document.querySelector('#flowLayer');
    if(innerWidth>620){flowEl.classList.add('embedded');}
    document.querySelector('#flowTitle').textContent=n===14?'Cari':'Notifikasi';
    document.querySelector('#flowIndex').textContent=n===14?'Orang, postingan, dan event':'Kabar terbaru untukmu';
    return n===14?searchScreen():notifScreen();
  };
  // Tandai menu samping yang sesuai dengan layar yang sedang terbuka.
  function syncNav(){
    const open=document.querySelector('#flowLayer')?.classList.contains('open');
    const extra=open&&[11,14].includes(flowCurrent)?String(flowCurrent):'';
    document.querySelectorAll('.nav').forEach(x=>x.classList.toggle('active',extra?x.dataset.openScreen===extra:x.dataset.view===document.querySelector('.view.active')?.id));
  }
  new MutationObserver(syncNav).observe(document.querySelector('#flowLayer'),{attributes:true,attributeFilter:['class']});
  new MutationObserver(syncNav).observe(document.querySelector('#flowContent'),{childList:true});

  /* ---------- Penyimpanan Temui, follow, chat ---------- */
  const MEET='temmoo_meet_v1',CHAT='temmoo_chat_v1';
  const met=new Set(read(MEET,[])),chatStore=read(CHAT,{});
  const meetName=btn=>(btn.closest('.suggest')?.querySelector('b')||btn.closest('.circle-card')?.querySelector('h3')||btn.closest('.row')?.querySelector('b'))?.textContent.trim();
  function applyState(){
    document.querySelectorAll('[data-meet]:not([data-state-applied])').forEach(b=>{b.dataset.stateApplied='1';if(met.has(meetName(b)))b.textContent='Terkirim'});
    document.querySelectorAll('[data-follow-profile]:not([data-state-applied])').forEach(b=>{b.dataset.stateApplied='1';if(followed.has(selectedProfile().name)){b.classList.add('following');b.textContent='✓ Mengikuti'}});
    const thread=document.querySelector('#chatThread');
    if(thread&&!thread.querySelector('.persist-chat')){const name=document.querySelector('#chatName')?.textContent.trim();thread.insertAdjacentHTML('beforeend',(chatStore[name]||[]).map(t=>`<div class="bubble outgoing">${esc(t)}</div>`).join('')+'<i class="persist-chat" hidden></i>')}
    document.querySelectorAll('.dm-view').forEach(v=>{const box=v.querySelector('.dm-messages');if(!box||box.querySelector('.persist-chat'))return;const name=v.querySelector('.dm-profile b')?.textContent.trim();box.insertAdjacentHTML('beforeend',(chatStore[name]||[]).map(t=>`<div class="dm-row outgoing"><div><p>${esc(t)}</p><time>Terkirim</time></div></div>`).join('')+'<i class="persist-chat" hidden></i>')});
  }
  new MutationObserver(applyState).observe(document.body,{childList:true,subtree:true});
  function saveChat(name,text){if(!name||!text)return;(chatStore[name]=chatStore[name]||[]).push(text);write(CHAT,chatStore)}
  // Hitung pesan keluar sebelum & sesudah handler asli supaya hanya pesan yang benar-benar terkirim yang disimpan.
  let before=0;
  const outgoing=form=>form.id==='chatCompose'?document.querySelectorAll('#chatThread .bubble.outgoing'):form.closest('.dm-view')?.querySelectorAll('.dm-messages .dm-row.outgoing')||[];
  // Di window (bukan document) agar berjalan sebelum & sesudah semua handler bawaan, termasuk yang memakai capture.
  window.addEventListener('submit',e=>{if(e.target.id==='chatCompose'||e.target.matches('[data-dm-compose]'))before=outgoing(e.target).length},true);
  window.addEventListener('submit',e=>{
    const f=e.target;if(f.id!=='chatCompose'&&!f.matches('[data-dm-compose]'))return;
    const list=outgoing(f);if(list.length<=before)return;
    const name=f.id==='chatCompose'?document.querySelector('#chatName')?.textContent.trim():f.closest('.dm-view')?.querySelector('.dm-profile b')?.textContent.trim();
    saveChat(name,list[list.length-1].querySelector('p')?.textContent??list[list.length-1].textContent);
  });

  /* ---------- Event klik & ketik ---------- */
  document.addEventListener('click',e=>{
    const meet=e.target.closest('[data-meet]');if(meet){const n=meetName(meet);if(n){met.add(n);write(MEET,[...met])}}
    const follow=e.target.closest('[data-follow-profile]');if(follow){const n=selectedProfile().name;setTimeout(()=>{follow.classList.contains('following')?followed.add(n):followed.delete(n);write(FOLLOW,[...followed])},0)}
    const back=e.target.closest('[data-follow-back]');if(back){e.stopPropagation();const n=back.dataset.followBack;followed.has(n)?followed.delete(n):followed.add(n);write(FOLLOW,[...followed]);back.classList.toggle('following',followed.has(n));back.textContent=followed.has(n)?'Mengikuti':'Ikuti balik';toast(followed.has(n)?`Kamu mengikuti ${n}`:`Berhenti mengikuti ${n}`);return}
    const item=e.target.closest('[data-notif]');if(item){const n=notifs.find(x=>x.id===item.dataset.notif);if(n)openNotif(n);return}
    if(e.target.closest('[data-notif-read-all]')){notifs.forEach(n=>readIds.add(n.id));write(READ,[...readIds]);refreshNotif();toast('Semua notifikasi ditandai dibaca');return}
    const nt=e.target.closest('[data-notif-tab]');if(nt){notifTab=nt.dataset.notifTab;refreshNotif();return}
    const st=e.target.closest('[data-search-tab]');if(st){tab=st.dataset.searchTab;document.querySelectorAll('[data-search-tab]').forEach(b=>b.classList.toggle('active',b.dataset.searchTab===tab&&b.closest('.search-tabs')));refreshResults();return}
    const term=e.target.closest('[data-search-term]');if(term){openSearch(term.dataset.searchTerm);rememberQuery(query);return}
    if(e.target.closest('[data-search-clear]')){openSearch('');return}
    if(e.target.closest('[data-search-clear-recent]')){recent=[];write(RECENT,recent);refreshResults();return}
    if(e.target.closest('[data-search-hit]')||e.target.closest('.search-page .post'))rememberQuery(query);
    if(e.target.closest('[data-rail-search]')){e.preventDefault();openSearch(document.querySelector('[data-rail-search] input').value)}
    if(e.target.closest('[data-open-screen="14"]')){e.preventDefault();e.stopPropagation();openSearch();return}
  },true);
  document.addEventListener('keydown',e=>{if(e.key==='Enter'&&e.target.closest('[data-notif]'))e.target.click();if(e.key==='Enter'&&e.target.id==='globalSearch')rememberQuery(query)});
  document.addEventListener('input',e=>{
    if(e.target.id==='globalSearch'){query=e.target.value;refreshResults()}
    if(e.target.closest('[data-rail-search]')){openSearch(e.target.value);e.target.value=''}
  });

  updateBadges();applyState();syncNav();
})();
