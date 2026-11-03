const {chromium,APP,INDEX}=require('../helpers');
(async()=>{const b=await chromium.launch();const errs=[];
for(const w of [1440,1920,1000]){
const p=await b.newPage({viewport:{width:w,height:900}});p.on('pageerror',e=>errs.push(e.message));await p.route(/^https?:/,r=>r.abort());
await p.goto(APP+'');await p.evaluate(()=>{localStorage.clear();localStorage.setItem('temmoo_onboarded','1');sessionStorage.clear()});await p.goto(APP+'#/home');await p.waitForTimeout(300);
await p.click('.nav[data-view="chat"]');await p.waitForTimeout(200);
await p.click('#chatList .row >> nth=1').catch(()=>{});await p.waitForTimeout(200);
const lp=await p.$('.chat-intro [data-open-profile], #chatThread [data-open-profile]');if(lp){await lp.click()}else{await p.evaluate(()=>openPublicProfile('Salsa Putri'))}
await p.waitForTimeout(300);
const r=await p.evaluate(()=>{const R=s=>{const x=document.querySelector(s)?.getBoundingClientRect();return x?[Math.round(x.left),Math.round(x.right)]:null};return {flow:R('#flowLayer'),list:R('.layout .main'),pane:R('.layout .right'),title:document.querySelector('#flowTitle').textContent}});
console.log(w,'profil dari chat',JSON.stringify(r));
await p.screenshot({path:`cp-${w}.png`});
await p.click('#flowBack');await p.waitForTimeout(250);console.log(w,'back ->',await p.evaluate(()=>[document.querySelector('#flowLayer').classList.contains('open'),document.querySelector('.view.active').id,document.querySelector('#chatName').textContent]));
await p.click('.nav[data-open-screen="11"]');await p.waitForTimeout(250);
console.log(w,'notif dari chat',await p.evaluate(()=>{const f=document.querySelector('#flowLayer').getBoundingClientRect(),m=document.querySelector('.layout .main').getBoundingClientRect();return [Math.round(f.left),Math.round(f.right),Math.round(m.left)]}));
await p.screenshot({path:`cp-notif-${w}.png`});
await p.click('.nav[data-view="home"]');await p.waitForTimeout(250);await p.evaluate(()=>openPublicProfile('Nadia Aulia'));await p.waitForTimeout(250);
console.log(w,'profil dari home (normal):',await p.evaluate(()=>{const f=document.querySelector('#flowLayer');return [f.classList.contains('in-chat'),f.style.left||'(css)',Math.round(f.getBoundingClientRect().left)]}));
await p.close();}
console.log('errors',errs);await b.close();})();
