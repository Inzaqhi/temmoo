// Bahasa antarmuka. Teks di kode tetap Bahasa Indonesia (bahasa sumber); saat bahasa = English, setiap teks antarmuka
// yang tampil diterjemahkan lewat kamus (32-i18n-en.js): cocok persis dulu, lalu aturan pola (angka, tanggal, satuan).
// Teks yang tidak ada di kamus — postingan, chat, nama event, nama orang — dibiarkan apa adanya.
// Bagian bertanda data-no-translate tidak disentuh (mis. teks hukum dua bahasa dari legalText()).
(()=>{
  const KEY='temmoo_lang_v1',LANGS={en:'English',id:'Bahasa Indonesia'};
  // Default English; window.__TEMMOO_DEFAULT_LANG dipakai tes otomatis untuk menjalankan skenario dalam Bahasa Indonesia.
  let lang=window.__TEMMOO_DEFAULT_LANG||'en';try{lang=localStorage.getItem(KEY)||lang}catch{}
  if(!LANGS[lang])lang='en';
  document.documentElement.lang=lang;
  window.appLang=()=>lang;
  window.setAppLang=next=>{if(!LANGS[next]||next===lang)return;try{localStorage.setItem(KEY,next)}catch{}location.reload()};

  /* ---------- Pengaturan bahasa di Pusat Akun (layar 56) ---------- */
  const panel=()=>`<section class="lang-setting" data-no-translate><h3>Language · Bahasa</h3>${Object.entries(LANGS).map(([k,v])=>`<button type="button" data-lang-set="${k}" class="${k===lang?'active':''}" aria-pressed="${k===lang}"><span>${v}</span><small>${k===lang?(k==='en'?'In use':'Sedang dipakai'):(k==='en'?'Gunakan bahasa Inggris':'Use Indonesian')}</small></button>`).join('')}</section>`;
  const base=template;
  template=function(n){const html=base(n);return n===56&&html.includes('<section')?html.replace('<section',panel()+'<section'):html};
  document.addEventListener('click',e=>{const b=e.target.closest('[data-lang-set]');if(b)setAppLang(b.dataset.langSet)});
  // Pencarian dua bahasa: kategori & minat di data berbahasa Indonesia ("Musik", "Musik indie · Coffee") ikut dicari lewat
  // padanan English-nya ("Music", "Indie music"), di kedua bahasa tampilan.
  window.withEnglish=text=>{const s=String(text??''),d=window.I18N_EN?.dict||{};const en=s.split(/\s*·\s*/).map(p=>d[p.trim()]).filter(x=>x&&x!==s);return en.length?s+' '+en.join(' '):s};
  if(lang!=='en')return;

  /* ---------- Penerjemah ---------- */
  const {dict={},rules=[],tokens={}}=window.I18N_EN||{};
  const missing=new Map(),ENGLISH=new Set(Object.values(dict));
  window.i18nMissing=()=>[...missing.entries()].sort((a,b)=>b[1]-a[1]);
  let queue=[];const flush=()=>{if(queue.length&&window.__i18nMissing){window.__i18nMissing(queue);queue=[]}};
  const note=t=>{if(t.length>160||/^[A-Z]{1,3}$/.test(t)||ENGLISH.has(t))return; // inisial avatar (NA, KA) bukan teks antarmuka
    missing.set(t,(missing.get(t)||0)+1);if(missing.get(t)===1&&window.__i18nMissing){queue.push(t);setTimeout(flush,50)}};
  // Kalimat pendek angka + satuan/bulan ("18 hari", "3 Nov 2026, 10.00", "2 foto"): terjemahkan per kata.
  const NUM=/^[\d.,:%+\-–—·/()|•]+$/;
  function byTokens(t){
    const words=t.split(/(\s+)/);let changed=false,prev='';
    const out=words.map(w=>{if(/^\s+$/.test(w)||!w)return w;const lead=w.match(/^[(“"']*/)[0],trail=w.match(/[)”"',.:;!?]*$/)[0],core=w.slice(lead.length,w.length-trail.length);
      if(!core||NUM.test(core)){prev=core;return w}
      const k=tokens[core]??tokens[core.toLowerCase()];if(k===undefined)return null;
      changed=true;const plural=Array.isArray(k)?(/^\d/.test(prev)&&prev!=='1'?k[1]:k[0]):k;prev=core;return lead+plural+trail});
    return out.includes(null)||!changed?undefined:out.join('');
  }
  // Angka diganti "#" untuk mencari di kamus ("# foto dipilih"); {tunggal|jamak} mengikuti angka terdekat sebelumnya.
  const NUMBER=/\d+(?:[.,:]\d+)*%?/g; // titik akhir kalimat bukan bagian angka
  function byNumbers(t){
    const nums=t.match(NUMBER);if(!nums)return undefined;
    const tpl=dict[t.replace(NUMBER,'#')];if(tpl===undefined)return undefined;
    let i=0,last='';
    return tpl.replace(/#|\{([^|}]*)\|([^}]*)\}/g,(m,one,many)=>{if(m==='#'){last=nums[i++]??'';return last}return last.replace(/%$/,'')==='1'?one:many});
  }
  function one(t){
    let out=dict[t];
    if(out===undefined)out=byNumbers(t);
    if(out===undefined)for(const [re,to] of rules){if(re.test(t)){out=t.replace(re,to);break}}
    if(out===undefined){const m=t.match(/^([^\p{L}\d@#]+)(.*?)([^\p{L}\d)]*)$/u);if(m&&m[2]&&(m[1]||m[3])){const inner=dict[m[2]]??byNumbers(m[2])??byTokens(m[2]);if(inner!==undefined)out=m[1]+inner+m[3]}}
    if(out===undefined)out=byTokens(t);
    return out;
  }
  function tr(raw){
    const t=raw.replace(/\s+/g,' ').trim();
    if(!t||!/\p{L}/u.test(t))return undefined;
    let out=one(t);
    // Gabungan "a · b · c": terjemahkan per bagian; bagian yang bukan teks antarmuka (nama, tempat) dibiarkan.
    if(out===undefined&&t.includes(' · ')){let any=false;const parts=t.split(' · ').map(p=>{const r=p&&/\p{L}/u.test(p)?one(p):undefined;if(r!==undefined){any=true;return r}if(/\p{L}/u.test(p))note(p);return p});if(any)out=parts.join(' · ');else return undefined}
    if(out===undefined){note(t);return undefined}
    const lead=raw.match(/^\s*/)[0],trail=raw.match(/\s*$/)[0];return lead+out+trail;
  }
  // Jam ditulis "19.00" di sumber (format Indonesia); dalam English tampil "07:00 PM". Hanya jam dua digit yang valid
  // (00–23 . 00–59) yang tidak menempel ke angka lain, jadi harga (Rp15.000), desimal, dan tanggal 03.11.2026 tidak tersentuh.
  const CLOCK=/(^|[^\d.,:])([01]\d|2[0-3])\.([0-5]\d)(?![\d%]|[.,:]\d)/g;
  const clock=s=>typeof s==='string'&&s.includes('.')?s.replace(CLOCK,(m,pre,h,mm)=>`${pre}${String(+h%12||12).padStart(2,'0')}:${mm} ${+h<12?'AM':'PM'}`):s;
  window.t=s=>{const r=tr(String(s));return clock(r===undefined?s:r)};

  const SKIP=new Set(['SCRIPT','STYLE','TEXTAREA','NOSCRIPT','CODE']);
  const ATTRS=['placeholder','aria-label','title','alt'];
  const seen=new WeakMap(),seenAttr=new WeakMap(),srcAttr=new WeakMap();
  // Teks asli (Indonesia) sebuah atribut, mis. placeholder yang dipakai ulang sebagai aria-label oleh 34-a11y.
  window.i18nSource=(el,a)=>srcAttr.get(el)?.[a]??el.getAttribute(a);
  const skip=el=>!el||SKIP.has(el.tagName)||el.closest('[data-no-translate],[contenteditable="true"]');
  function text(node){if(seen.get(node)===node.data)return;if(skip(node.parentElement)){seen.set(node,node.data);return}
    // <option> tanpa value memakai teksnya sebagai nilai; kunci nilai aslinya supaya filter & form tetap menerima teks Indonesia.
    const opt=node.parentElement;if(opt.tagName==='OPTION'&&!opt.hasAttribute('value'))opt.setAttribute('value',opt.textContent);
    const r=clock(tr(node.data)??node.data);if(r!==node.data)node.data=r;seen.set(node,node.data)}
  function attrs(el){if(skip(el))return;let m=seenAttr.get(el);if(!m)seenAttr.set(el,m={});for(const a of ATTRS){const v=el.getAttribute(a);if(v==null||m[a]===v)continue;(srcAttr.get(el)||srcAttr.set(el,{}).get(el))[a]=v;const r=clock(tr(v)??v);if(r!==v)el.setAttribute(a,r);m[a]=el.getAttribute(a)}
    if(el.tagName==='INPUT'&&/^(button|submit)$/.test(el.type)&&el.value){const r=tr(el.value);if(r!==undefined)el.value=r}}
  function walk(root){
    if(root.nodeType===3){text(root);return}
    if(root.nodeType!==1)return;
    if(root.hasAttributes())attrs(root);
    const w=document.createTreeWalker(root,NodeFilter.SHOW_TEXT|NodeFilter.SHOW_ELEMENT);
    for(let n=w.nextNode();n;n=w.nextNode()){if(n.nodeType===3)text(n);else if(n.hasAttributes())attrs(n)}
  }
  walk(document.documentElement);
  if(document.title){const r=tr(document.title);if(r)document.title=r}
  new MutationObserver(list=>{for(const m of list){
    if(m.type==='characterData')text(m.target);
    else if(m.type==='attributes')attrs(m.target);
    else m.addedNodes.forEach(walk);
  }}).observe(document.documentElement,{subtree:true,childList:true,characterData:true,attributes:true,attributeFilter:[...ATTRS,'value']});
})();
