
(()=>{
  const routeKey='temmoo_ui_route_v1',filterKey='temmoo_event_filters_v1';
  let restoring=false;
  // Preview sandbox (iframe srcdoc) melarang ubah URL; tetap simpan state tanpa URL.
  // historyWorks=false berarti URL tidak bisa diubah, jadi tombol back memakai trail.
  let historyWorks=true;
  const setHistory=(method,state,url)=>{try{history[method](state,'',url)}catch{historyWorks=false;try{history[method](state,'')}catch{}}};
  // Jejak halaman yang dibuka, dipakai tombol back di dalam aplikasi.
  const trail=[];
  const track=(next,replace)=>{if(replace&&trail.length)trail[trail.length-1]=next;else if(trail[trail.length-1]!==next)trail.push(next);if(trail.length>50)trail.shift()};
  const slug=v=>String(v||'').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'');
  const route=()=>location.hash.startsWith('#/')?location.hash.slice(1):'';
  const activeView=()=>document.querySelector('.view.active')?.id||'home';
  const eventTabs={18:'posts',19:'groups',22:'hadir',59:'album',20:'detail',46:'hub'};
  const mainRoute=id=>['home','events','circle','chat','profile'].includes(id)?`/${id}`:'/home';

  function routeForScreen(n){
    n=Number(n);
    if(eventTabs[n])return `/event/${eventSlug(Number(activeEvent)||0)}/${eventTabs[n]}`;
    if(n===32)return `/user/${slug(activePublicProfile||'Kevin Ardana')}`;
    if(n===45)return `/post/${Number(activePost)||0}`;
    if(n===44)return '/profile/history';
    if(n===47)return '/profile/followers';
    if(n===48)return '/profile/following';
    if(n===35)return typeof activeEventGroup!=='undefined'&&activeEventGroup?`/chat/group/${activeEventGroup.kind}`:`/chat/direct/${Number(activeChat)||0}`;
    return `/screen/${n}`;
  }
  function commit(next,replace=false){
    if(restoring||!next)return;
    track(next,replace);
    if(location.hash==='#'+next)return;
    const depth=replace?(history.state?.temmooDepth||0):(history.state?.temmooDepth||0)+1;
    setHistory(replace?'replaceState':'pushState',{temmoo:true,temmooDepth:depth,route:next},`#${next}`);
    sessionStorage.setItem(routeKey,next);
  }

  const originalShow=show,originalOpenFlow=openFlow,originalCloseFlow=closeFlow;
  const originalOpenEvent=openEvent,originalOpenPublicProfile=openPublicProfile;
  let directSelect=selectChat;
  show=function(id){const out=originalShow.apply(this,arguments);if(!restoring)commit(mainRoute(id));return out};
  openFlow=function(n,push=true){const out=originalOpenFlow.apply(this,arguments);if(n!=='close'&&!restoring)commit(routeForScreen(n));return out};
  closeFlow=function(){const out=originalCloseFlow.apply(this,arguments);if(!restoring)commit(mainRoute(activeView()));return out};
  openEvent=function(ref){const out=originalOpenEvent.apply(this,arguments);if(!restoring)commit(`/event/${eventSlug(activeEvent)}/posts`,true);return out};
  openPublicProfile=function(name){const out=originalOpenPublicProfile.apply(this,arguments);if(!restoring)commit(`/user/${slug(name)}`,true);return out};

  function restoreMain(id){if(document.querySelector('#flowLayer')?.classList.contains('open'))originalCloseFlow();originalShow(id)}
  function restoreProfileTab(tab){
    originalShow('profile');
    if(tab==='followers'){originalOpenFlow(47,false);return}
    if(tab==='following'){originalOpenFlow(48,false);return}
    document.querySelector(`[data-profile-tab="${tab}"]`)?.click();
  }
  function restoreGroup(kind){
    originalShow('chat');
    document.querySelector('[data-chat-tab="groups"]')?.click();
    requestAnimationFrame(()=>{
      const groups=typeof allEventGroups==='function'?allEventGroups():[];
      const index=groups.findIndex(g=>Number(g.kind)===Number(kind));
      document.querySelector(`[data-event-directory-group="${Math.max(index,0)}"]`)?.click();
    });
  }
  function applyRoute(next){
    if(!next)return;
    restoring=true;
    try{
      const p=next.replace(/^\//,'').split('/').filter(Boolean),root=p[0]||'home';
      if(['home','events','circle','chat','profile'].includes(root)&&document.querySelector('#flowLayer')?.classList.contains('open'))originalCloseFlow();
      if(['home','events','circle'].includes(root)){restoreMain(root);return}
      if(root==='chat'){
        if(p[1]==='direct'){originalShow('chat');directSelect(Number(p[2])||0);return}
        if(p[1]==='group'){restoreGroup(Number(p[2])||0);return}
        restoreMain('chat');return;
      }
      if(root==='profile'){p[1]?restoreProfileTab(p[1]):restoreMain('profile');return}
      if(root==='event'){
        activeEvent=eventIndexFromRef(p[1]);
        originalOpenFlow(({posts:18,groups:19,hadir:22,album:59,detail:20,hub:46})[p[2]]||18,false);return;
      }
      if(root==='user'){
        activePublicProfile=Object.keys(publicProfiles).find(name=>slug(name)===p.slice(1).join('-'))||'Kevin Ardana';
        originalOpenFlow(32,false);return;
      }
      if(root==='post'){
        activePost=Math.max(0,Number(p[1])||0);activePostData=posts[activePost]||null;originalOpenFlow(45,false);return;
      }
      if(root==='screen'){originalOpenFlow(Number(p[1])||1,false);return}
      restoreMain('home');
    }finally{restoring=false;sessionStorage.setItem(routeKey,next)}
  }

  function saveFilters(){
    sessionStorage.setItem(filterKey,JSON.stringify({search:document.querySelector('#eventSearch')?.value||'',city:document.querySelector('#eventCity')?.value||'Semua',date:document.querySelector('#eventDate')?.value||'',sort:document.querySelector('#eventSort')?.value||'Terdekat',category:activeCategory||'Semua',price:activePrice||'Semua'}));
  }
  function restoreFilters(){
    let s;try{s=JSON.parse(sessionStorage.getItem(filterKey)||'null')}catch{return}if(!s)return;
    const search=document.querySelector('#eventSearch'),city=document.querySelector('#eventCity'),date=document.querySelector('#eventDate'),sort=document.querySelector('#eventSort');
    if(search)search.value=s.search||'';if(city)city.value=s.city||'Semua';if(date)date.value=s.date||'';if(sort)sort.value=s.sort||'Terdekat';
    activeCategory=s.category||'Semua';activePrice=s.price||'Semua';
    document.querySelectorAll('[data-category]').forEach(x=>x.classList.toggle('active',x.dataset.category===activeCategory));
    document.querySelectorAll('[data-price]').forEach(x=>x.classList.toggle('active',x.dataset.price===activePrice));
    if(typeof renderCategorizedEvents==='function')renderCategorizedEvents();
  }
  document.addEventListener('change',e=>{if(e.target.closest('.event-filter-panel,.event-results-head'))saveFilters()});
  document.addEventListener('input',e=>{if(e.target.id==='eventSearch')saveFilters()});
  document.addEventListener('click',e=>{if(e.target.closest('[data-category],[data-price],#resetEventFilters'))setTimeout(saveFilters,0)});
  document.addEventListener('click',e=>{const tab=e.target.closest('[data-profile-tab]');if(tab&&!restoring)setTimeout(()=>commit(tab.dataset.profileTab==='posts'?'/profile':`/profile/${tab.dataset.profileTab}`),0)});
  addEventListener('popstate',e=>{const next=e.state?.route||route()||'/home';if(trail[trail.length-2]===next)trail.pop();else track(next);applyRoute(next)});
  document.addEventListener('DOMContentLoaded',()=>{
    directSelect=selectChat;
    selectChat=function(index){const out=directSelect.apply(this,arguments);if(!restoring)commit(`/chat/direct/${Number(index)||0}`);return out};
    restoreFilters();
    const initial=route()||sessionStorage.getItem(routeKey)||'/home';applyRoute(initial);trail.splice(0,trail.length,initial);setHistory('replaceState',{temmoo:true,temmooDepth:history.state?.temmooDepth||0,route:initial},`#${initial}`);
    const back=document.querySelector('#flowBack');
    if(back)back.onclick=()=>{
      if(historyWorks&&(history.state?.temmooDepth||0)>0){history.back();return}
      if(trail.length>1){trail.pop();const prev=trail[trail.length-1];applyRoute(prev);setHistory('replaceState',{temmoo:true,temmooDepth:0,route:prev},`#${prev}`);return}
      const root=((trail[0]||route()).replace(/^\//,'').split('/')[0]||'home');
      const parent=root==='event'?'/events':root==='user'?'/circle':root==='post'?'/home':root==='chat'?'/chat':mainRoute(activeView());
      applyRoute(parent);trail.splice(0,trail.length,parent);setHistory('replaceState',{temmoo:true,temmooDepth:0,route:parent},`#${parent}`);
    };
  });
})();
