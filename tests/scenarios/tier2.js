const {chromium,APP,INDEX}=require('../helpers');
(async()=>{const b=await chromium.launch();const p=await b.newPage({viewport:{width:1440,height:1300}});const errs=[];p.on('pageerror',e=>errs.push(e.message));await p.route(/^https?:/,r=>r.abort());
await p.goto(APP+'');await p.evaluate(()=>{localStorage.clear();localStorage.setItem('temmoo_onboarded','1');localStorage.setItem('temmoo_promoter_app_v1',JSON.stringify({status:'approved',org:'Ruang Kolektif',tier:'basic',type:'Komunitas'}));
localStorage.setItem('temmoo_promoter_v1',JSON.stringify({organization:'Ruang Kolektif',activeEventId:'a',events:[{id:'a',name:'Malam Puisi',date:'18 Oktober 2026',dateShort:'18 OKT',venue:'Balai Pemuda, Surabaya',capacity:400,status:'published',announcements:[]}]}))});
await p.reload();await p.waitForTimeout(300);await p.evaluate(()=>{syncPublishedEvent();openFlow(71)});await p.waitForTimeout(300);
console.log('event selesai, Dasar: aksi album',await p.locator('[data-ins-action="album"]').count(),'| pengganti:',await p.$eval('[data-tier-upgrade] b',x=>x.textContent));
await p.click('[data-tier-upgrade]');await p.waitForTimeout(400);console.log('klik -> layar',await p.evaluate(()=>flowCurrent),'| kartu terlihat:',await p.$eval('.tier-card',x=>{const r=x.getBoundingClientRect();return r.top>=0&&r.bottom<=innerHeight}));
const box=await (await p.$('.tier-card')).boundingBox();await p.screenshot({path:'tier-card.png',clip:{x:box.x-8,y:box.y-8,width:box.width+16,height:box.height+16}});
console.log('errors',errs);await b.close()})();
