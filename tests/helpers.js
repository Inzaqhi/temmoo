// Pembungkus Playwright untuk semua skenario: membuka build index.html dari repo,
// mengunci tanggal dan Math.random supaya keluaran tes selalu sama (bisa dibandingkan dengan snapshot).
const path=require('path'),pw=require('playwright');
const INDEX=path.resolve(__dirname,'..','index.html');
const APP='file://'+INDEX;
// Zona waktu Asia/Jakarta & locale id-ID seperti pengguna di Indonesia. Tanggal acuan data contoh: Hindia Live 2026 masih akan datang, Coffee Fest & LaLaLa Fest sudah selesai.
const NOW=new Date(process.env.TEMMOO_NOW||'2026-11-03T10:00:00+07:00');
// Bahasa: skenario lama ditulis untuk Bahasa Indonesia (bahasa sumber); TEMMOO_LANG=en menjalankannya dalam English.
// Hanya menetapkan bahasa default (window.__TEMMOO_DEFAULT_LANG), tidak menulis localStorage: tulisan localStorage di awal
// pemuatan halaman membuat tulisan halaman sebelumnya hilang saat reload. Skenario yang memilih bahasa sendiri tetap dihormati.
const LANG=process.env.TEMMOO_LANG||'id';
const langInit=`window.__TEMMOO_DEFAULT_LANG='${LANG}'`;
const seedRandom=`(()=>{let s=20261103;Math.random=()=>{s=(Math.imul(s,1664525)+1013904223)>>>0;return s/4294967296}})()`;
// TEMMOO_I18N_COLLECT=file: kumpulkan teks antarmuka yang belum ada di kamus English (dipakai saat menyusun kamus).
const collect=process.env.TEMMOO_I18N_COLLECT;
async function prepare(target){await target.clock.setFixedTime(NOW);await target.addInitScript(seedRandom);await target.addInitScript(langInit);
  if(collect)await target.exposeBinding('__i18nMissing',(src,list)=>require('fs').appendFileSync(collect,list.map(x=>JSON.stringify(x)).join('\n')+'\n'))}
const chromium={async launch(options={}){
  const browser=await pw.chromium.launch(options);
  const newPage=browser.newPage.bind(browser),newContext=browser.newContext.bind(browser);
  browser.newContext=async opts=>{const c=await newContext({timezoneId:'Asia/Jakarta',locale:'id-ID',...opts});await prepare(c);return c};
  browser.newPage=async opts=>{const c=await browser.newContext(opts),p=await c.newPage();return p};
  return browser;
}};
module.exports={chromium,APP,INDEX,NOW};
