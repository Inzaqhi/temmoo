const {chromium,APP,INDEX}=require('../helpers');
(async()=>{const b=await chromium.launch();const p=await b.newPage({viewport:{width:1440,height:900}});const errs=[];p.on('pageerror',e=>errs.push(e.message));
await p.route(/^https?:/,r=>r.abort());await p.goto(APP+'');await p.evaluate(()=>{localStorage.clear();localStorage.setItem('temmoo_onboarded','1');sessionStorage.clear()});await p.goto(APP+'#/home');await p.waitForTimeout(300);
for(const i of [8,0,1]){await p.evaluate(i=>{closeFlow();activeEvent=i;openFlow(19)},i);await p.waitForTimeout(250);
 console.log(await p.evaluate(()=>events[activeEvent][0]),'->',await p.$$eval('.event-group-tools button, .event-group-toolbar>button',x=>x.map(b=>b.textContent.trim()+(b.disabled?' (nonaktif)':''))));
 if(i===8)await p.screenshot({path:'grp-lalala.png',clip:{x:328,y:330,width:710,height:330}});}
await p.click('[data-create-event-group]');await p.fill('[data-group-create] input[name=name]','Nonton Hindia bareng');await p.fill('[data-group-create] textarea','kumpul di gate');await p.click('[data-group-create] button[type=submit]');await p.waitForTimeout(300);
console.log('grup Hindia baru:',await p.evaluate(()=>{const row=[...document.querySelectorAll('#flowContent .info-card, #flowContent .event-group-card')].find(r=>r.textContent.includes('Nonton Hindia'));return row?.textContent.replace(/\s+/g,' ').trim().slice(0,90)}));
console.log('errors',errs);await b.close()})();
