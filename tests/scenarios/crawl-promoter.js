const {chromium,APP,INDEX}=require('../helpers');
const OPENERS=['data-open-group-info','data-open-approval-center','data-report-message','data-report-group','data-report-member','data-preview-group','data-open-group-settings','data-create-event-group','data-thread-menu','data-member-menu','data-paid-photo','data-user-photo','data-create-user-album','data-admin-user-menu','data-admin-verified-menu','data-event-directory-group','data-open-event-group','data-compose','data-safety-report'];
const scan=()=>{const lum=c=>{const m=c.match(/[\d.]+/g);if(!m)return null;const [r,g,b]=m.slice(0,3).map(v=>{v/=255;return v<=.03928?v/12.92:((v+.055)/1.055)**2.4});return .2126*r+.7152*g+.0722*b};
 const alpha=c=>{const m=c.match(/[\d.]+/g);return m&&m[3]!==undefined?+m[3]:1};
 const onImage=el=>{for(let e=el,i=0;e&&i<6;e=e.parentElement,i++){if(getComputedStyle(e).backgroundImage!=='none')return true}return false};
 const bgOf=el=>{for(let e=el;e;e=e.parentElement){const s=getComputedStyle(e);if(s.backgroundImage!=='none')return 'img';if(alpha(s.backgroundColor)>.5)return s.backgroundColor}return 'rgb(255,255,255)'};
 const SKIP='.date,.history-cover>span,.remove-attachment,.modal,.group-info-overlay,.user-gallery-modal,.album-photo-preview,.album-preview-nav,.album-preview-close,.toast,.edge-scroll,.edge-scroll *,.thread-menu-backdrop,.photo-select,.event-save,.badge';
 const name=el=>el.tagName.toLowerCase()+(typeof el.className==='string'&&el.className.trim()?'.'+el.className.trim().split(/\s+/).slice(0,3).join('.'):'')+' < '+((el.parentElement?.className&&typeof el.parentElement.className==='string')?el.parentElement.className.split(' ')[0]:el.parentElement?.tagName);
 const vis=el=>{const r=el.getBoundingClientRect();if(r.width<2||r.height<2||r.bottom<0||r.top>innerHeight)return false;const s=getComputedStyle(el);return s.visibility!=='hidden'&&s.display!=='none'&&!el.closest('[hidden]')};
 const top=[...document.querySelectorAll('.group-info-overlay,.user-gallery-modal,.album-photo-preview,.modal.open,.thread-menu,.group-member-actions')].filter(vis);
 const roots=top.length?top:[document.querySelector('#flowLayer.open')||document.querySelector('.view.active'),...(document.querySelector('#flowLayer.open')?[]:[document.querySelector('.layout .right'),document.querySelector('.sidebar')])].filter(Boolean);
 const out=[];
 for(const root of roots)for(const el of [root,...root.querySelectorAll('*')]){if(!vis(el)||el.matches(SKIP))continue;const s=getComputedStyle(el);
  if(s.backgroundImage==='none'&&alpha(s.backgroundColor)>.5&&lum(s.backgroundColor)<.05&&!onImage(el.parentElement)){const r=el.getBoundingClientRect();if(r.width*r.height>1200)out.push('GELAP  '+name(el)+' '+s.backgroundColor)}
  const t=[...el.childNodes].filter(n=>n.nodeType===3&&n.textContent.trim()).map(n=>n.textContent.trim()).join(' ');
  if(t){const bg=bgOf(el);if(bg!=='img'){const a=lum(s.color),b2=lum(bg);const ratio=(Math.max(a,b2)+.05)/(Math.min(a,b2)+.05);if(ratio<3&&!el.disabled&&!el.closest('[disabled],.wide:disabled,.create-group-locked')&&!el.closest('.logo'))out.push('KONTRAS '+ratio.toFixed(2)+' '+name(el)+' "'+t.slice(0,22)+'" '+s.color+' / '+bg)}}}
 return out};
(async()=>{const b=await chromium.launch();const p=await b.newPage({viewport:{width:1440,height:900}});const errs=[];p.on('pageerror',e=>errs.push(e.message));p.on('dialog',d=>d.dismiss());
await p.route(/^https?:/,r=>r.abort());await p.goto(APP+'');await p.evaluate(()=>{localStorage.clear();localStorage.setItem('temmoo_onboarded','1');sessionStorage.clear()});await p.goto(APP+'#/home');await p.waitForTimeout(400);
const found=new Map();const add=(ctx,list)=>list.forEach(x=>{if(!found.has(x))found.set(x,ctx)});
const cleanup=()=>p.evaluate(()=>{document.querySelectorAll('.group-info-overlay,.user-gallery-modal,.album-photo-preview,.thread-menu,.thread-menu-backdrop,.group-member-actions').forEach(x=>x.remove());document.querySelector('#modal')?.classList.remove('open');document.body.style.overflow=''});
const states=[...[['none',''],['review','review'],['changes','changes'],['approved','approved']].flatMap(([lbl,st])=>[56,64,65,66,67,69,70].map(n=>[`promotor ${lbl} layar ${n}`,`localStorage.setItem('temmoo_promoter_app_v1',JSON.stringify({status:'${st||'none'}',org:'Ruang Kolektif',type:'Komunitas',city:'Surabaya',email:'a@b.id',note:'Foto KTP kurang jelas'}));location.hash='#/home'`,n])),];
for(const [ctx,js,n0] of states){await cleanup();if(n0){await p.evaluate(js);await p.reload();await p.waitForTimeout(250);await p.evaluate(n=>{closeFlow();openFlow(n)},n0);await p.waitForTimeout(150);add(ctx,await p.evaluate(scan));continue}try{await p.evaluate(js)}catch(e){continue}await p.waitForTimeout(120);add(ctx,await p.evaluate(scan));
 const n=await p.evaluate(O=>O.map(a=>document.querySelectorAll(`[${a}]`).length),OPENERS);
 for(let k=0;k<OPENERS.length;k++){for(let j=0;j<Math.min(n[k],2);j++){await cleanup();try{await p.evaluate(js)}catch{continue}await p.waitForTimeout(60);
   const ok=await p.evaluate(([a,j])=>{const el=[...document.querySelectorAll(`[${a}]`)][j];if(!el||!el.getClientRects().length)return false;el.click();return true},[OPENERS[k],j]);if(!ok)continue;await p.waitForTimeout(150);
   add(ctx+' → '+OPENERS[k],await p.evaluate(scan));
   // satu tingkat lebih dalam: tombol pembuka di dalam dialog yang baru terbuka
   const inner=await p.evaluate(O=>O.filter(a=>document.querySelector(`.group-info-overlay [${a}],.user-gallery-modal [${a}]`)),OPENERS);
   for(const a of inner){await p.evaluate(a=>document.querySelector(`.group-info-overlay [${a}],.user-gallery-modal [${a}]`)?.click(),a);await p.waitForTimeout(150);add(ctx+' → '+OPENERS[k]+' → '+a,await p.evaluate(scan))}
 }}}
const lines=[...found.entries()].map(([k,v])=>k+'   @ '+v);console.log(lines.length+' temuan');console.log(lines.join('\n'));console.log('errors',[...new Set(errs)].slice(0,5));await b.close()})();
