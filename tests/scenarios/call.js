const {chromium,APP,INDEX}=require('../helpers');
// Timer panggilan menghitung detik sungguhan; saat CPU sibuk bisa meleset satu detik.
// Durasi 1–9 detik dicetak "00:0x" supaya snapshot stabil (00:00 dan durasi lain, misalnya 04:12, tetap dicek persis).
const shortCall=x=>typeof x==='string'?x.replace(/(?<!\d)00:0[1-9](?!\d)/g,'00:0x'):Array.isArray(x)?x.map(shortCall):x&&typeof x==='object'?Object.fromEntries(Object.entries(x).map(([k,v])=>[k,shortCall(v)])):x;
const log=console.log;console.log=(...a)=>log(...a.map(shortCall));
(async()=>{const b=await chromium.launch({args:['--use-fake-ui-for-media-stream','--use-fake-device-for-media-stream']});
const ctx=await b.newContext({viewport:{width:1440,height:900},permissions:['camera']});const p=await ctx.newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));
await p.route(/^https?:/,r=>r.abort());await p.goto(APP+'');await p.evaluate(()=>{localStorage.clear();localStorage.setItem('temmoo_onboarded','1');sessionStorage.clear()});await p.goto(APP+'#/home');await p.waitForTimeout(300);
const st=()=>p.evaluate(()=>[document.querySelector('#callOverlay').hidden?'tutup':'buka',document.querySelector('#callStatus').textContent]);
await p.evaluate(()=>{show('chat');selectChat(0)});await p.waitForTimeout(200);await p.screenshot({path:'call-header.png',clip:{x:690,y:0,width:750,height:80}});
await p.click('.chat-person [data-call="voice"]');await p.waitForTimeout(300);console.log('suara awal',await st());await p.screenshot({path:'call-ringing.png'});
await p.waitForTimeout(3300);// Tunggu detik pertama terhitung: di mesin lambat panggilan baru tersambung saat dibaca (masih 00:00).
await p.waitForFunction(()=>/^\d\d:\d\d$/.test(document.querySelector('#callStatus')?.textContent)&&document.querySelector('#callStatus').textContent!=='00:00',null,{timeout:5000}).catch(()=>{});console.log('suara tersambung',await st());
await p.click('[data-call-toggle="mute"]');await p.waitForTimeout(1200);console.log('bisu:',await p.$eval('[data-call-toggle="mute"]',b=>b.classList.contains('on')),'waktu',await st());await p.screenshot({path:'call-connected.png'});
await p.click('[data-call-minimize]');await p.waitForTimeout(300);console.log('diperkecil, pill:',await p.$eval('#callPill',x=>!x.hidden&&x.textContent));await p.screenshot({path:'call-pill.png',clip:{x:400,y:0,width:640,height:90}});
await p.evaluate(()=>show('home'));await p.click('#callPill .dot');await p.waitForTimeout(200);console.log('dipulihkan',await st());
await p.click('#callOverlay [data-call-end]');await p.waitForTimeout(300);console.log('diakhiri',await st(),'toast',await p.$eval('#toast',x=>x.textContent));
// video
await p.evaluate(()=>{show('chat');selectChat(0)});await p.click('.chat-person [data-call="video"]');await p.waitForTimeout(4000);
console.log('video: kamera aktif',await p.evaluate(()=>{const v=document.querySelector('#callSelf video');return !!(v&&v.srcObject&&v.srcObject.getTracks()[0].readyState)}));await p.screenshot({path:'call-video.png'});
const tracks=await p.evaluate(()=>{window.__s=document.querySelector('#callSelf video').srcObject;return 1});
await p.click('[data-call-toggle="camera"]');await p.waitForTimeout(200);console.log('kamera dimatikan, track:',await p.evaluate(()=>window.__s.getTracks()[0].readyState));
await p.click('#callOverlay [data-call-end]');await p.waitForTimeout(200);
// no answer: Salsa
await p.evaluate(()=>startCall('Salsa Putri','voice'));await p.waitForTimeout(9500);console.log('Salsa',await st(),'tombol:',await p.$$eval('#callOverlay .call-ctrl:not([hidden]) span',x=>x.map(s=>s.textContent)));await p.screenshot({path:'call-noanswer.png'});
await p.click('#callOverlay [data-call-end]');
// riwayat
await p.evaluate(()=>{show('chat')});await p.click('[data-chat-tab="calls"]');await p.waitForTimeout(200);
console.log('riwayat:',await p.$$eval('.call-row',x=>x.map(r=>r.querySelector('b').textContent+' | '+r.querySelector('p').textContent)));await p.screenshot({path:'call-history.png'});
await p.click('[data-chat-tab="direct"]');await p.waitForTimeout(200);console.log('kembali ke direct, baris:',await p.locator('#chatList .row').count());
await p.reload();await p.waitForTimeout(300);await p.evaluate(()=>{show('chat')});await p.click('[data-chat-tab="calls"]');console.log('riwayat setelah reload:',await p.locator('.call-row').count());
// hp: DM
const m=await ctx.newPage();await m.setViewportSize({width:390,height:844});await m.route(/^https?:/,r=>r.abort());await m.goto(APP+'#/home');await m.waitForTimeout(300);
await m.evaluate(()=>show('chat'));await m.click('#chatList .row >> nth=0');await m.waitForTimeout(300);console.log('DM tombol:',await m.$$eval('.dm-call',x=>x.map(b=>b.textContent.trim())));await m.screenshot({path:'call-dm.png'});
await m.click('.dm-call[data-call="video"]');await m.waitForTimeout(3800);await m.screenshot({path:'call-mobile.png'});console.log('HP video',await m.evaluate(()=>document.querySelector('#callStatus').textContent));
console.log('errors',errs);await b.close()})();
