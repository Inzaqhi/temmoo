// Aksesibilitas: semua yang bisa diklik bisa dijangkau keyboard (Tab + Enter/Spasi), tombol ikon punya nama,
// dan isian punya label. Pemeriksaan otomatis menjelajah layar pengguna, promotor, dan admin.
const {chromium,APP}=require('../helpers');
(async()=>{const b=await chromium.launch();const p=await b.newPage({viewport:{width:1440,height:1000}});
const errs=[];p.on('pageerror',e=>errs.push(e.message));p.on('console',m=>{if(m.type()==='error'&&!/ERR_FAILED|net::/.test(m.text()))errs.push(m.text())});
await p.route(/^https?:/,r=>r.abort());
const W=ms=>p.waitForTimeout(ms||150);
await p.goto(APP);await p.evaluate(()=>{localStorage.clear();localStorage.setItem('temmoo_onboarded','1');localStorage.setItem('temmoo_promoter_app_v1',JSON.stringify({status:'approved',org:'Ruang Kolektif',tier:'full',type:'Komunitas'}));
  localStorage.setItem('temmoo_promoter_v1',JSON.stringify({organization:'Ruang Kolektif',activeEventId:'a',events:[{id:'a',name:'Malam Puisi',category:'Seni & Budaya',date:'12 Desember 2026',dateShort:'12 DES',venue:'Balai Pemuda, Surabaya',ticketUrl:'',capacity:400,status:'published',announcements:[]}]}))});
await p.reload();await W(300);

// 1. Pemeriksaan otomatis
const audit=()=>p.evaluate(()=>{
  const vis=e=>{const r=e.getBoundingClientRect();return r.width>0&&r.height>0&&getComputedStyle(e).visibility!=='hidden'};
  const NAT='button,a[href],input,select,textarea,summary,[tabindex]:not([tabindex="-1"]),label,[contenteditable]';
  const desc=e=>e.tagName.toLowerCase()+[...e.classList].map(c=>'.'+c).join('')+' "'+(e.innerText||'').trim().slice(0,30).replace(/\n/g,' ')+'"';
  const out=[];
  for(const e of document.querySelectorAll('body *')){if(!vis(e))continue;
    if(getComputedStyle(e).cursor==='pointer'&&!e.closest(NAT)&&![...e.querySelectorAll('[data-a11y-click]')].some(vis)&&!(e.matches('.avatar')&&[...e.parentElement.querySelectorAll('[data-a11y-click]')].some(vis))){const par=e.parentElement;if(!(par&&getComputedStyle(par).cursor==='pointer'&&!par.closest(NAT)))out.push('tidak bisa difokus: '+desc(e))}
    if(e.matches('button,a[href],[role=button],[role=link]')){const n=(e.getAttribute('aria-label')||e.getAttribute('title')||e.innerText||'').trim();if(!/[\p{L}\p{N}]/u.test(n))out.push('tanpa nama: '+desc(e))}
    if(e.matches('input:not([type=hidden]):not([type=file]),select,textarea')&&!(e.getAttribute('aria-label')||e.getAttribute('aria-labelledby')||e.closest('label')||(e.id&&document.querySelector(`label[for="${e.id}"]`))))out.push('isian tanpa label: '+desc(e)+' '+e.placeholder);
  }return out});
const found=new Map();const add=(k,list)=>list.forEach(x=>found.set(x,[...(found.get(x)||[]),k]));
for(const v of ['home','events','circle','chat','profile']){await p.evaluate(v=>{closeFlow();show(v)},v);await W();add(v,await audit())}
await p.evaluate(()=>document.querySelector('[data-profile-tab="album"]')?.click());await W(250);add('foto saya',await audit());
for(const n of [1,2,3,4,5,6,7,8,9,11,13,14,18,19,20,21,22,24,25,26,27,28,29,30,32,33,35,36,37,38,40,41,44,45,46,47,48,49,50,51,52,53,54,55,56,59,63,64,65,66,67,69,70,71,72,73,74,76]){await p.evaluate(n=>{try{activeEvent=3;openFlow(n)}catch(e){}},n);await W();add(n,await audit())}
await p.evaluate(()=>{accountState.accountType='temmoo_official';accountState.role='super_admin'});
for(const n of [57,58,60,61,62,68,75]){await p.evaluate(n=>openFlow(n),n);await W();add(n,await audit())}
console.log('1 temuan pemeriksaan:',found.size,[...found].map(([k,v])=>k+' @ '+v.join(',')));

// 2. Pakai keyboard saja
const focused=()=>p.evaluate(()=>{const e=document.activeElement;return (e.getAttribute('aria-label')||e.innerText||'').trim().replace(/\n+/g,' ').slice(0,40)});
const tabTo=async sel=>{for(let i=0;i<300;i++){await p.keyboard.press('Tab');if(await p.evaluate(s=>document.activeElement?.matches(s),sel))return focused()}return '(tidak terjangkau)'};
await p.evaluate(()=>{closeFlow();show('events');document.activeElement?.blur()});await W();
console.log('2 Tab ke kartu event:',await tabTo('.catalog-card h4'),'| peran:',await p.evaluate(()=>document.activeElement.getAttribute('role')));
await p.keyboard.press('Enter');await W();console.log('  Enter membuka:',await p.$eval('#flowTitle',x=>x.textContent),'| event:',await p.evaluate(()=>events[activeEvent][0]));
console.log('  tombol kembali:',await p.$eval('#flowBack',x=>x.getAttribute('aria-label')),'| opsi:',await p.$eval('#flowMore',x=>x.getAttribute('aria-label')));
await p.keyboard.press('Escape');await W();
await p.evaluate(()=>{closeFlow();show('home');document.activeElement?.blur()});await W();
console.log('  Tab ke saran Circle:',await tabTo('.suggest [data-a11y-click]'));await p.keyboard.press(' ');await W();console.log('  Spasi membuka:',await p.$eval('#flowTitle',x=>x.textContent));
await p.evaluate(()=>{closeFlow();show('profile');document.activeElement?.blur()});await W();
console.log('  Tab ke jumlah pengikut:',await tabTo('.counts [data-open-screen="47"]'));await p.keyboard.press('Enter');await W();console.log('  Enter membuka:',await p.$eval('#flowTitle',x=>x.textContent));
await p.evaluate(()=>openFlow(6));await W();
const choice=await p.evaluate(()=>{const c=document.querySelector('.choice[data-select]');c.focus();return [c.getAttribute('role'),c.getAttribute('aria-pressed')]});
await p.keyboard.press('Enter');await W(50);console.log('  pilihan minat (peran, aria-pressed sebelum → sesudah Enter):',choice,'→',await p.$eval('.choice[data-select]',c=>c.getAttribute('aria-pressed')));
await p.evaluate(()=>openFlow(5));await W();console.log('  tanggal lahir:',await p.$$eval('.choice-grid select',x=>x.map(s=>s.getAttribute('aria-label'))));
await p.evaluate(()=>openFlow(4));await W();console.log('  label isian daftar:',await p.$$eval('#flowContent .field input',x=>x.map(i=>i.labels[0]?.textContent)));
await p.evaluate(()=>{closeFlow();show('chat')});await W();console.log('  isian chat:',await p.$$eval('#chat input',x=>x.filter(i=>i.offsetParent).map(i=>i.getAttribute('aria-label'))));

// 3. English: label ikut diterjemahkan
await p.evaluate(()=>localStorage.setItem('temmoo_lang_v1','en'));await p.reload();await W(300);
await p.evaluate(()=>{show('chat')});await W();console.log('3 English, isian chat:',await p.$$eval('#chat input',x=>x.filter(i=>i.offsetParent).map(i=>i.getAttribute('aria-label'))),'| tombol tulis:',await p.$eval('.float[data-compose]',x=>x.getAttribute('aria-label')));
await p.evaluate(()=>{activeEvent=3;openFlow(20)});await W();console.log('  kembali/opsi:',await p.$eval('#flowBack',x=>x.getAttribute('aria-label')),'/',await p.$eval('#flowMore',x=>x.getAttribute('aria-label')));

console.log('errors',errs);await b.close()})();
