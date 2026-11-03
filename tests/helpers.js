// Pembungkus Playwright untuk semua skenario: membuka build index.html dari repo,
// mengunci tanggal dan Math.random supaya keluaran tes selalu sama (bisa dibandingkan dengan snapshot).
const path=require('path'),pw=require('playwright');
const INDEX=path.resolve(__dirname,'..','index.html');
const APP='file://'+INDEX;
// Tanggal acuan data contoh: Hindia Live 2026 masih akan datang, Coffee Fest & LaLaLa Fest sudah selesai.
const NOW=new Date(process.env.TEMMOO_NOW||'2026-11-03T10:00:00+07:00');
const seedRandom=`(()=>{let s=20261103;Math.random=()=>{s=(Math.imul(s,1664525)+1013904223)>>>0;return s/4294967296}})()`;
async function prepare(target){await target.clock.setFixedTime(NOW);await target.addInitScript(seedRandom)}
const chromium={async launch(options={}){
  const browser=await pw.chromium.launch(options);
  const newPage=browser.newPage.bind(browser),newContext=browser.newContext.bind(browser);
  browser.newContext=async opts=>{const c=await newContext(opts);await prepare(c);return c};
  browser.newPage=async opts=>{const c=await browser.newContext(opts),p=await c.newPage();return p};
  return browser;
}};
module.exports={chromium,APP,INDEX,NOW};
