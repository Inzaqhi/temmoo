
// Panggilan suara & video. Lawan bicara disimulasikan (belum ada server); kamera sendiri memakai kamera asli bila diizinkan.
(()=>{
  const read=(k,d)=>{try{return JSON.parse(localStorage.getItem(k))??d}catch{return d}};
  const write=(k,v)=>{try{localStorage.setItem(k,JSON.stringify(v))}catch{}};
  const esc=escapeText,HIST='temmoo_calls_v1';
  const icon={phone:'<svg viewBox="0 0 24 24"><path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1.9.4 1.8.7 2.7a2 2 0 0 1-.5 2.1L8 9.8a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.4c.9.3 1.8.6 2.7.7a2 2 0 0 1 1.7 2Z"/></svg>',
    video:'<svg viewBox="0 0 24 24"><path d="m22 8-6 4 6 4V8Z"/><rect x="2" y="6" width="14" height="12" rx="2"/></svg>',
    mic:'<svg viewBox="0 0 24 24"><rect x="9" y="2" width="6" height="12" rx="3"/><path d="M5 10a7 7 0 0 0 14 0M12 19v3"/></svg>',
    micOff:'<svg viewBox="0 0 24 24"><path d="m2 2 20 20M9 9v1a3 3 0 0 0 5.1 2.1M15 9.3V5a3 3 0 0 0-5.9-.6M19 10a7 7 0 0 1-1.1 3.8M5 10a7 7 0 0 0 11.4 5.4M12 19v3"/></svg>',
    speaker:'<svg viewBox="0 0 24 24"><path d="M11 5 6 9H2v6h4l5 4V5Z"/><path d="M15.5 8.5a5 5 0 0 1 0 7M19 5a10 10 0 0 1 0 14"/></svg>',
    camOff:'<svg viewBox="0 0 24 24"><path d="m2 2 20 20M16 16v1a1 1 0 0 1-1 1H4a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h2m4 0h5a1 1 0 0 1 1 1v3.3l1 1L22 8v8"/></svg>',
    end:'<svg viewBox="0 0 24 24" style="transform:rotate(135deg)"><path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1.9.4 1.8.7 2.7a2 2 0 0 1-.5 2.1L8 9.8a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.4c.9.3 1.8.6 2.7.7a2 2 0 0 1 1.7 2Z"/></svg>'};
  const now=Date.now();
  let history=read(HIST,null)||[
    {name:'Nadia Aulia',avatar:'NA',tone:'teal',kind:'video',dir:'out',at:now-3*36e5,dur:252},
    {name:'Kevin Ardana',avatar:'KA',tone:'gold',kind:'voice',dir:'missed',at:now-26*36e5,dur:0}];
  const saveHistory=()=>write(HIST,history.slice(0,50));
  // Kontak yang tidak mengangkat, untuk mencontohkan alur "tidak menjawab".
  const NO_ANSWER=['Salsa Putri'];

  const fmt=s=>`${String(Math.floor(s/60)).padStart(2,'0')}:${String(s%60).padStart(2,'0')}`;
  const ago=t=>{const m=Math.floor((Date.now()-t)/60000);return m<1?'Baru saja':m<60?m+' mnt lalu':m<1440?Math.floor(m/60)+' jam lalu':m<2880?'Kemarin':Math.floor(m/1440)+' hari lalu'};
  const contact=name=>{const c=chats.find(c=>c[0]===name);if(c)return {name,avatar:c[1],tone:c[2]};const p=publicProfiles[name];return p?{name,avatar:p.avatar,tone:p.tone}:{name,avatar:name.split(/\s+/).slice(0,2).map(w=>w[0]).join('').toUpperCase(),tone:''}};

  /* ---------- Layar panggilan ---------- */
  document.body.insertAdjacentHTML('beforeend',`<div class="call-overlay" id="callOverlay" hidden role="dialog" aria-modal="true" aria-label="Panggilan">
    <div class="call-video"></div>
    <div class="call-top"><button type="button" data-call-minimize aria-label="Perkecil">⌄</button><span id="callBadge">🔒 Terenkripsi</span><span style="visibility:hidden;width:42px"></span></div>
    <div class="call-self" id="callSelf" hidden>Kamera tidak tersedia</div>
    <div class="call-center"><div class="call-avatar" id="callAvatar"></div><h2 id="callName"></h2><div class="call-status" id="callStatus"></div><div class="call-note" id="callNote"></div></div>
    <div class="call-controls">
      <button type="button" class="call-ctrl" data-call-toggle="mute"><i>${icon.mic}</i><span>Bisukan</span></button>
      <button type="button" class="call-ctrl" data-call-toggle="speaker"><i>${icon.speaker}</i><span>Speaker</span></button>
      <button type="button" class="call-ctrl" data-call-toggle="camera"><i>${icon.video}</i><span>Kamera</span></button>
      <button type="button" class="call-ctrl" data-call-retry hidden><i>${icon.phone}</i><span>Telepon lagi</span></button>
      <button type="button" class="call-ctrl" data-call-message hidden><i>✉</i><span>Kirim pesan</span></button>
      <button type="button" class="call-ctrl end" data-call-end><i>${icon.end}</i><span>Akhiri</span></button>
      <button type="button" class="call-ctrl end" data-call-decline hidden><i>${icon.end}</i><span>Tolak</span></button>
      <button type="button" class="call-ctrl accept" data-call-accept hidden><i>${icon.phone}</i><span>Terima</span></button>
    </div></div>
    <button type="button" class="call-pill" id="callPill" hidden data-call-restore><span class="dot"></span><span id="callPillName"></span><b id="callPillTime">00:00</b><span class="end" data-call-end aria-label="Akhiri">✕</span></button>`);
  const $o=document.querySelector('#callOverlay'),$s=id=>document.querySelector('#'+id);
  let call=null;

  function setStatus(text,note=''){$s('callStatus').textContent=text;$s('callNote').textContent=note}
  function controls(state){
    const live=state==='calling'||state==='ringing'||state==='connected',incoming=state==='incoming';
    $o.querySelectorAll('[data-call-toggle]').forEach(b=>b.hidden=!live||(b.dataset.callToggle==='camera'&&call.kind!=='video')||(b.dataset.callToggle==='speaker'&&call.kind==='video'));
    $o.querySelector('[data-call-retry]').hidden=state!=='noanswer';
    const msg=$o.querySelector('[data-call-message]');msg.hidden=state!=='noanswer'&&!incoming;msg.querySelector('span').textContent=incoming?'Balas pesan':'Kirim pesan';
    $o.querySelector('[data-call-end]').hidden=incoming;
    $o.querySelector('[data-call-end] span').textContent=state==='noanswer'?'Tutup':'Akhiri';
    $o.querySelector('[data-call-decline]').hidden=$o.querySelector('[data-call-accept]').hidden=!incoming;
    $o.querySelector('[data-call-accept] i').innerHTML=call.kind==='video'?icon.video:icon.phone;
    $o.querySelector('[data-call-minimize]').style.visibility=incoming?'hidden':'';
    $o.classList.toggle('is-ringing',state==='calling'||state==='ringing'||incoming);$o.classList.toggle('is-incoming',incoming);
  }
  async function startCamera(){
    const box=$s('callSelf');box.hidden=false;box.textContent='Menyalakan kamera…';
    try{
      if(!navigator.mediaDevices?.getUserMedia)throw new Error('unsupported');
      const owner=call,stream=await navigator.mediaDevices.getUserMedia({video:{facingMode:'user'},audio:false});
      // Panggilan bisa sudah diakhiri / kamera dimatikan selagi menunggu izin: jangan biarkan kamera menyala.
      if(call!==owner||!owner.camera){stream.getTracks().forEach(t=>t.stop());return}
      owner.stream?.getTracks().forEach(t=>t.stop());owner.stream=stream;
      box.textContent='';const v=document.createElement('video');v.autoplay=v.muted=v.playsInline=true;v.srcObject=stream;box.appendChild(v);
    }catch{box.textContent='Kamera tidak tersedia di sini'}
  }
  function stopCamera(){call?.stream?.getTracks().forEach(t=>t.stop());if(call)call.stream=null;const box=$s('callSelf');box.hidden=true;box.textContent=''}
  window.startCall=function(name,kind='voice'){
    if(call){toast('Kamu sedang dalam panggilan');restore();return}
    const c=contact(name);
    call={...c,kind,state:'calling',seconds:0,muted:false,speaker:false,camera:kind==='video',timers:[]};
    const av=$s('callAvatar');av.className='call-avatar '+(c.tone||'');av.textContent=c.avatar;$s('callName').textContent=c.name;
    $o.classList.toggle('is-video',kind==='video');
    $o.querySelectorAll('[data-call-toggle]').forEach(b=>b.classList.remove('on'));
    $o.querySelector('[data-call-toggle="camera"]').classList.toggle('on',kind==='video');
    $o.hidden=false;$s('callPill').hidden=true;document.body.style.overflow='hidden';
    setStatus(kind==='video'?'Memulai panggilan video…':'Memanggil…');controls('calling');
    if(kind==='video')startCamera();
    call.timers.push(setTimeout(()=>{if(!call)return;call.state='ringing';setStatus('Berdering…');controls('ringing')},1200));
    if(NO_ANSWER.includes(c.name)){
      call.timers.push(setTimeout(()=>{if(!call)return;call.state='noanswer';stopCamera();setStatus('Tidak menjawab',`${c.name.split(' ')[0]} belum bisa mengangkat. Coba lagi nanti atau kirim pesan.`);controls('noanswer');log('noanswer');
        setTimeout(()=>receiveCall(c.name,'voice'),12000)},9000));
    }else{
      call.timers.push(setTimeout(()=>{if(call)connect()},3200));
    }
  };
  function connect(){
    call.state='connected';setStatus('00:00','Lawan bicara masih disimulasikan — panggilan sungguhan butuh server.');controls('connected');
    call.timers.push(setInterval(()=>{call.seconds++;setStatus(fmt(call.seconds),$s('callNote').textContent);$s('callPillTime').textContent=fmt(call.seconds)},1000));
  }
  /* ---------- Panggilan masuk ---------- */
  let ring=null;
  function startRinging(name){
    stopRinging();ring={title:document.title,timers:[]};
    try{const AC=window.AudioContext||window.webkitAudioContext;if(AC){ring.ctx=new AC();ring.ctx.resume?.().catch(()=>{});
      const beep=(t,f)=>{const o=ring.ctx.createOscillator(),g=ring.ctx.createGain();o.frequency.value=f;o.type='sine';g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(.12,t+.02);g.gain.linearRampToValueAtTime(0,t+.18);o.connect(g).connect(ring.ctx.destination);o.start(t);o.stop(t+.2)};
      const play=()=>{if(!ring?.ctx||ring.ctx.state!=='running')return;const t=ring.ctx.currentTime;beep(t,880);beep(t+.25,880);beep(t+.5,1175)};
      play();ring.timers.push(setInterval(play,2000))}}catch{}
    try{navigator.vibrate?.([400,200,400])}catch{}
    ring.timers.push(setInterval(()=>{try{navigator.vibrate?.([400,200,400])}catch{}},2000));
    let on=false;ring.timers.push(setInterval(()=>{on=!on;document.title=on?`📞 ${name} menelepon…`:ring.title},900));
  }
  function stopRinging(){if(!ring)return;ring.timers.forEach(clearInterval);try{ring.ctx?.close()}catch{}try{navigator.vibrate?.(0)}catch{}document.title=ring.title;ring=null}
  window.receiveCall=function(name,kind='voice'){
    const c=contact(name);
    if(call){history.unshift({...c,kind,dir:'missed',at:Date.now(),dur:0});saveHistory();refreshList();toast(`${c.name} mencoba menelepon kamu`);return}
    call={...c,kind,state:'incoming',incoming:true,seconds:0,muted:false,speaker:false,camera:kind==='video',timers:[]};
    const av=$s('callAvatar');av.className='call-avatar '+(c.tone||'');av.textContent=c.avatar;$s('callName').textContent=c.name;
    $o.classList.toggle('is-video',kind==='video');
    $o.querySelectorAll('[data-call-toggle]').forEach(b=>b.classList.remove('on'));
    $o.querySelector('[data-call-toggle="camera"]').classList.toggle('on',kind==='video');
    $o.hidden=false;$s('callPill').hidden=true;document.body.style.overflow='hidden';
    setStatus(kind==='video'?'Panggilan video masuk…':'Panggilan suara masuk…','Temmoo');controls('incoming');startRinging(c.name.split(' ')[0]);
    // Tidak diangkat dalam 20 detik: tercatat sebagai panggilan tak terjawab.
    call.timers.push(setTimeout(()=>{if(!call||call.state!=='incoming')return;const n=call.name;stopRinging();log('missed');clearTimers();call=null;$o.hidden=true;document.body.style.overflow='';toast(`Panggilan tak terjawab dari ${n}`)},20000));
  };
  function accept(){if(!call||call.state!=='incoming')return;stopRinging();clearTimers();call.timers=[];connect();if(call.kind==='video')startCamera()}
  function decline(){if(!call||call.state!=='incoming')return;const n=call.name;stopRinging();clearTimers();log('declined');call=null;$o.hidden=true;document.body.style.overflow='';toast(`Panggilan dari ${n} ditolak`)}
  function clearTimers(){call?.timers.forEach(t=>{clearTimeout(t);clearInterval(t)})}
  function log(dir){if(call.logged)return;call.logged=true;history.unshift({name:call.name,avatar:call.avatar,tone:call.tone,kind:call.kind,dir,at:Date.now(),dur:call.seconds});saveHistory();refreshList()}
  function endCall(){
    if(!call)return;clearTimers();stopCamera();
    stopRinging();
    if(call.state==='incoming'){log('declined')}
    else if(call.state==='connected'){log(call.incoming?'in':'out');toast(`Panggilan selesai · ${fmt(call.seconds)}`)}
    else if(call.state!=='noanswer'){log('cancel');toast('Panggilan dibatalkan')}
    call=null;$o.hidden=true;$s('callPill').hidden=true;document.body.style.overflow='';
  }
  function minimize(){if(!call)return;$o.hidden=true;document.body.style.overflow='';$s('callPillName').textContent=call.name.split(' ')[0];$s('callPillTime').textContent=call.state==='connected'?fmt(call.seconds):'Memanggil…';$s('callPill').hidden=false}
  function restore(){if(!call)return;$o.hidden=false;$s('callPill').hidden=true;document.body.style.overflow='hidden'}
  function toggle(kind,btn){
    if(!call||call.state==='noanswer')return;
    const on=!btn.classList.contains('on');btn.classList.toggle('on',on);
    if(kind==='mute'){call.muted=on;btn.querySelector('i').innerHTML=on?icon.micOff:icon.mic;btn.querySelector('span').textContent=on?'Bisu':'Bisukan'}
    if(kind==='speaker')call.speaker=on;
    if(kind==='camera'){call.camera=on;btn.querySelector('i').innerHTML=on?icon.video:icon.camOff;on?startCamera():stopCamera()}
  }

  /* ---------- Tombol panggilan di Chat (desktop) & DM (HP) ---------- */
  const callButtons=`<div class="call-actions"><button type="button" class="call-btn" data-call="voice" aria-label="Panggilan suara" title="Panggilan suara">${icon.phone}</button><button type="button" class="call-btn" data-call="video" aria-label="Panggilan video" title="Panggilan video">${icon.video}</button></div>`;
  const header=document.querySelector('.chat-person');
  header?.querySelector('[data-open-screen="36"],.icon-btn:last-child')?.insertAdjacentHTML('beforebegin',callButtons);
  function decorateDm(){document.querySelectorAll('.dm-profile:not([data-call-ready])').forEach(p=>{p.dataset.callReady='1';p.insertAdjacentHTML('beforeend',`<div class="dm-call-row"><button type="button" class="dm-call" data-call="voice">${icon.phone} Telepon</button><button type="button" class="dm-call" data-call="video">${icon.video} Video</button></div>`)})}
  new MutationObserver(decorateDm).observe(document.querySelector('#flowContent'),{childList:true});

  /* ---------- Tab "Panggilan" di daftar chat ---------- */
  const tabs=document.querySelector('.chat-tabs');
  tabs?.insertAdjacentHTML('beforeend','<button data-chat-tab="calls">Panggilan</button>');
  const kindLabel=h=>h.kind==='video'?'Panggilan video':'Panggilan suara';
  const dirLabel=h=>h.dir==='missed'?'<span class="missed">↙ Tidak terjawab</span>':h.dir==='noanswer'?'<span class="missed">↗ Tidak dijawab</span>':h.dir==='cancel'?'↗ Dibatalkan':h.dir==='declined'?'<span class="missed">↙ Ditolak</span>':h.dir==='in'?'↙ Masuk':'↗ Keluar';
  const demo='<div class="call-demo"><button type="button" data-call-demo>📞 Simulasikan panggilan masuk</button><small>Fitur uji coba prototipe</small></div>';
  function callList(){
    if(!history.length)return demo+ '<div class="call-empty"><b>Belum ada panggilan</b><p>Mulai panggilan dari percakapan mana pun.</p></div>';
    return demo+`<div class="call-list">${history.map((h,i)=>`<div class="call-row"><div class="avatar ${h.tone||''}">${esc(h.avatar)}</div><div class="row-main"><div class="row-line"><b>${esc(h.name)}</b><span class="muted">${ago(h.at)}</span></div><p>${dirLabel(h)} · ${kindLabel(h)}${h.dur||h.dir==='in'||h.dir==='out'?' · '+fmt(h.dur):''}</p></div><div class="call-row-actions"><button type="button" data-call-again="${i}" data-kind="voice" aria-label="Telepon ${esc(h.name)}">${icon.phone}</button><button type="button" data-call-again="${i}" data-kind="video" aria-label="Video call ${esc(h.name)}">${icon.video}</button></div></div>`).join('')}</div>`;
  }
  const callsTabActive=()=>document.querySelector('[data-chat-tab="calls"]')?.classList.contains('active');
  function refreshList(){if(callsTabActive())document.querySelector('#chatList').innerHTML=callList()}

  let demoIndex=0;
  /* ---------- Event ---------- */
  document.addEventListener('click',e=>{
    const tab=e.target.closest('[data-chat-tab="calls"]');
    if(tab){e.stopPropagation();document.querySelectorAll('[data-chat-tab]').forEach(x=>x.classList.toggle('active',x===tab));document.querySelector('#chatList').innerHTML=callList();return}
    const btn=e.target.closest('[data-call]');
    if(btn){e.preventDefault();e.stopPropagation();
      const name=btn.closest('.dm-view')?.querySelector('.dm-profile b')?.textContent.trim()||document.querySelector('#chatName')?.textContent.trim();
      if(name)startCall(name,btn.dataset.call);return}
    const again=e.target.closest('[data-call-again]');
    if(again){e.stopPropagation();const h=history[+again.dataset.callAgain];if(h)startCall(h.name,again.dataset.kind);return}
    if(e.target.closest('[data-call-end]')){e.stopPropagation();endCall();return}
    if(e.target.closest('[data-call-accept]')){accept();return}
    if(e.target.closest('[data-call-decline]')){decline();return}
    if(e.target.closest('[data-call-demo]')){const who=[['Kevin Ardana','voice'],['Nadia Aulia','video'],['Dimas Raka','voice']][demoIndex++%3];setTimeout(()=>receiveCall(who[0],who[1]),600);return}
    if(e.target.closest('[data-call-minimize]')){minimize();return}
    if(e.target.closest('[data-call-restore]')){restore();return}
    const t=e.target.closest('[data-call-toggle]');if(t){toggle(t.dataset.callToggle,t);return}
    if(e.target.closest('[data-call-retry]')){const c={name:call.name,kind:call.kind};endCall();startCall(c.name,c.kind);return}
    if(e.target.closest('[data-call-message]')){const name=call.name;endCall();const i=chats.findIndex(c=>c[0]===name);if(i<0){openPublicProfile(name);return}closeFlow();show('chat');selectChat(i);setTimeout(()=>document.querySelector('#chatMessage')?.focus(),50)}
  },true);
  addEventListener('beforeunload',()=>stopCamera());
  decorateDm();
})();
