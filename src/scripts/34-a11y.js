// Aksesibilitas keyboard & pembaca layar untuk elemen yang dibuat oleh skrip lain:
// 1. Elemen yang bisa diklik tapi bukan <button>/<a> (kartu event, baris orang/chat, pilihan minat, angka profil)
//    dibuat bisa difokus (Tab) dan dijalankan dengan Enter/Spasi. Kalau elemen itu berisi tombol lain (mis. ♡ di kartu
//    event), yang difokus adalah judulnya supaya tidak ada tombol di dalam tombol.
// 2. Tombol ikon (←, ···, ＋, ×) diberi nama.
// 3. Isian tanpa label dihubungkan ke <label> di sebelahnya, placeholder, atau judul layar.
// Teks label ditulis dalam Bahasa Indonesia; mesin bahasa (33-i18n) menerjemahkannya seperti teks lain.
(()=>{
  const NATIVE='button,a[href],input,select,textarea,summary,label,[tabindex]:not([tabindex="-1"]),[contenteditable="true"]';
  const CLICKABLE=['.catalog-card','.event-group-card','.user-photo-card','.suggest','.row','.choice:not(select)','.status-option','.circle-card',
    '[data-open-screen]','[data-profile-jump]','[data-thread-menu]','[data-go]:not(input)','.placeholder[data-compose]','.post-head>b','.account'].join(',');
  // Bagian yang difokus bila kartu berisi tombol sendiri.
  const LABEL_PART='h4,h3,.row-main>b,.row-line>b,b';
  const ICON_NAMES=[['#flowBack','Kembali'],['#flowMore','Opsi lainnya'],['.float[data-compose]','Buat postingan'],['[data-repost]','Repost'],
    ['[data-share-post]','Bagikan'],['[data-thread-menu]','Opsi postingan'],['.post-head .more','Opsi postingan']];
  const source=(el,a)=>window.i18nSource?.(el,a)??el.getAttribute(a);
  let uid=0;const idOf=el=>el.id||(el.id='a11y-'+(++uid));

  function makeClickable(el){
    if(el.dataset.a11y)return;el.dataset.a11y='1';
    if(el.closest(NATIVE)||el.closest('[data-a11y-click]'))return;
    if(getComputedStyle(el).cursor!=='pointer')return;
    let target=el;
    if(el.querySelector('button,a[href],input,select,textarea')){
      target=[...el.querySelectorAll(LABEL_PART)].find(x=>!x.closest('button,a')&&getComputedStyle(x).display!=='none');if(!target)return;
      target.setAttribute('role','link');
    }else if(!el.hasAttribute('role'))el.setAttribute('role','button');
    target.tabIndex=0;target.dataset.a11yClick='';
    if(el.matches('.choice'))syncPressed(el);
  }
  const syncPressed=el=>el.setAttribute('aria-pressed',String(el.classList.contains('selected')));

  function labelControl(el){
    if(el.dataset.a11y)return;el.dataset.a11y='1';
    if(el.getAttribute('aria-label')||el.getAttribute('aria-labelledby')||el.closest('label')||(el.id&&document.querySelector(`label[for="${CSS.escape(el.id)}"]`)))return;
    const prev=el.previousElementSibling;
    if(prev?.tagName==='LABEL'&&!prev.htmlFor&&!prev.querySelector('input,select,textarea')){prev.htmlFor=idOf(el);return}
    const ph=source(el,'placeholder');if(ph){el.setAttribute('aria-label',ph);return}
    const grid=el.closest('.choice-grid');if(grid&&el.tagName==='SELECT'){const parts=['Tanggal','Bulan','Tahun'],i=[...grid.querySelectorAll('select')].indexOf(el);if(parts[i]){el.setAttribute('aria-label',parts[i]);return}}
    if(el.tagName==='SELECT'&&el.closest('.admin-toolbar')){el.setAttribute('aria-label','Filter status');return}
    const text=el.parentElement?.querySelector(':scope>span');if(text&&el.type==='checkbox'){el.setAttribute('aria-labelledby',idOf(text));return}
    if(el.closest('#flowContent'))el.setAttribute('aria-labelledby','flowTitle');
  }

  function nameIcons(root){
    for(const [sel,name] of ICON_NAMES)root.querySelectorAll(sel).forEach(el=>{if(!el.getAttribute('aria-label'))el.setAttribute('aria-label',name)});
    root.querySelectorAll('button:not([aria-label])').forEach(b=>{if(/^\s*[×✕]\s*$/.test(b.textContent))b.setAttribute('aria-label','Tutup')});
  }

  let queued=false;
  function sweep(){queued=false;
    nameIcons(document);
    document.querySelectorAll(`:is(${CLICKABLE}):not([data-a11y])`).forEach(makeClickable);
    document.querySelectorAll('input:not([type=hidden]):not([type=file]):not([data-a11y]),select:not([data-a11y]),textarea:not([data-a11y])').forEach(labelControl);
  }
  const queue=()=>{if(!queued){queued=true;requestAnimationFrame(sweep)}};
  new MutationObserver(queue).observe(document.body,{childList:true,subtree:true});
  window.addEventListener('load',queue);queue();
  // Pilihan (minat, privasi) berganti kelas .selected saat diklik: perbarui aria-pressed.
  document.addEventListener('click',()=>setTimeout(()=>document.querySelectorAll('.choice[aria-pressed]').forEach(syncPressed),0));

  document.addEventListener('keydown',e=>{
    const el=e.target;if(!(el instanceof Element)||!el.hasAttribute('data-a11y-click'))return;
    if(e.key!=='Enter'&&e.key!==' ')return;
    e.preventDefault();if(!e.repeat)el.click();
  });
})();
