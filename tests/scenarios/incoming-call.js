const {chromium,APP,INDEX}=require('../helpers');
// Timer panggilan menghitung detik sungguhan; saat CPU sibuk bisa meleset satu detik.
// Durasi 1–9 detik dicetak "00:0x" supaya snapshot stabil (00:00 dan durasi lain, misalnya 04:12, tetap dicek persis).
const shortCall=x=>typeof x==='string'?x.replace(/(?<!\d)00:0[1-9](?!\d)/g,'00:0x'):Array.isArray(x)?x.map(shortCall):x&&typeof x==='object'?Object.fromEntries(Object.entries(x).map(([k,v])=>[k,shortCall(v)])):x;
const log=console.log;console.log=(...a)=>log(...a.map(shortCall));
(async()=>{const b=await chromium.launch({args:['--use-fake-ui-for-media-stream','--use-fake-device-for-media-stream','--autoplay-policy=no-user-gesture-required']});
const ctx=await b.newContext({viewport:{width:1440,height:900},permissions:['camera']});const p=await ctx.newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));
await p.route(/^https?:/,r=>r.abort());await p.goto(APP+'');await p.evaluate(()=>{localStorage.clear();localStorage.setItem('temmoo_onboarded','1');sessionStorage.clear()});await p.goto(APP+'#/home');await p.waitForTimeout(300);
// Saat panggilan masuk judul tab berkedip tiap 0,9 detik; tunggu fase "📞 …" supaya hasilnya tidak bergantung waktu baca.
const st=async()=>{if(await p.evaluate(()=>!document.querySelector('#callOverlay').hidden&&/masuk/.test(document.querySelector('#callStatus').textContent)))await p.waitForFunction(()=>document.title.startsWith('📞'),null,{timeout:1000}).catch(()=>{});return readState()};
const readState=()=>p.evaluate(()=>({overlay:!document.querySelector('#callOverlay').hidden,status:document.querySelector('#callStatus').textContent,tombol:[...document.querySelectorAll('#callOverlay .call-ctrl:not([hidden]) span')].map(s=>s.textContent),title:document.title}));
// 1. Simulasi -> terima
await p.evaluate(()=>show('chat'));await p.click('[data-chat-tab="calls"]');await p.click('[data-call-demo]');await p.waitForTimeout(1500);
console.log('1 masuk:',JSON.stringify(await st()));await p.screenshot({path:'in-ringing.png'});
await p.click('[data-call-accept]');await p.waitForTimeout(2200);console.log('1 diterima:',JSON.stringify(await st()));
await p.click('#callOverlay [data-call-end]');await p.waitForTimeout(200);
// 2. Simulasi (Nadia video) -> tolak
await p.click('[data-call-demo]');await p.waitForTimeout(900);console.log('2 masuk:',(await st()).status);await p.click('[data-call-decline]');await p.waitForTimeout(200);console.log('2 ditolak:',JSON.stringify(await st()),await p.$eval('#toast',x=>x.textContent));
// 3. Dimas -> balas pesan (bukan di chat -> profil)
await p.click('[data-call-demo]');await p.waitForTimeout(900);await p.click('#callOverlay [data-call-message]');await p.waitForTimeout(300);console.log('3 balas pesan Dimas ->',await p.evaluate(()=>document.querySelector('#flowTitle').textContent));
// 4. Tidak diangkat 20 detik
await p.evaluate(()=>{closeFlow();receiveCall('Kevin Ardana','voice')});await p.waitForTimeout(20600);console.log('4 dibiarkan:',JSON.stringify(await st()),await p.$eval('#toast',x=>x.textContent));
// 5. Masuk saat sedang menelepon
await p.evaluate(()=>startCall('Nadia Aulia','voice'));await p.waitForTimeout(3500);await p.evaluate(()=>receiveCall('Kevin Ardana','video'));await p.waitForTimeout(200);console.log('5 saat menelepon: status tetap',(await st()).status,'| toast',await p.$eval('#toast',x=>x.textContent));
await p.click('#callOverlay [data-call-end]');
// 6. Salsa telepon balik
await p.evaluate(()=>startCall('Salsa Putri','voice'));await p.waitForTimeout(9300);await p.click('#callOverlay [data-call-end]');await p.waitForTimeout(12500);console.log('6 Salsa telepon balik:',JSON.stringify(await st()));await p.click('[data-call-accept]');await p.waitForTimeout(1300);await p.click('#callOverlay [data-call-end]');
// riwayat
await p.evaluate(()=>{show('chat')});await p.click('[data-chat-tab="calls"]');await p.waitForTimeout(200);
console.log('riwayat:\n  '+(await p.$$eval('.call-row',x=>x.map(r=>r.querySelector('b').textContent+' | '+r.querySelector('p').textContent))).join('\n  '));await p.screenshot({path:'in-history.png'});
console.log('title akhir:',await p.title(),'| errors',errs);await b.close()})();
