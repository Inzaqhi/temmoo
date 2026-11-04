// Menu Promotor Studio dan Admin Console di HP: bilah bawah berisi 3 menu utama + "Lainnya" (tidak perlu digeser).
// Menu lain tampil di lembar bawah saat "Lainnya" ditekan. Di layar lebar menu samping tetap utuh seperti biasa.
(()=>{
  const ICON={
    grid:'<rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/>',
    plus:'<circle cx="12" cy="12" r="9"/><path d="M12 8v8M8 12h8"/>',
    team:'<circle cx="9" cy="8" r="3.2"/><path d="M3.5 19a5.5 5.5 0 0 1 11 0"/><path d="M16 5.2a3 3 0 0 1 0 5.6M17.5 14a5 5 0 0 1 3 5"/>',
    queue:'<path d="M9 5h11M9 12h11M9 19h11"/><path d="m3.5 5 1.2 1.2L7 4M3.5 12l1.2 1.2L7 11M3.5 19l1.2 1.2L7 18"/>',
    calendar:'<rect x="3.5" y="5" width="17" height="15" rx="2"/><path d="M3.5 10h17M8 3v4M16 3v4"/>',
    more:'<circle cx="5" cy="12" r="1.6"/><circle cx="12" cy="12" r="1.6"/><circle cx="19" cy="12" r="1.6"/>',
  };
  const svg=name=>`<svg viewBox="0 0 24 24" aria-hidden="true">${ICON[name]}</svg>`;
  // Menu utama per konsol: [selector tombol, ikon, label pendek di bilah bawah]
  const PRIMARY={
    'promoter-nav':[['[data-go="64"]','grid','Ringkasan'],['[data-pe-new]','plus','Buat event'],['[data-go="72"]','team','Tim']],
    'admin-nav':[['[data-go="57"]','grid','Ringkasan'],['[data-go="61"]','queue','Antrean event'],['[data-go="75"]','calendar','Kalender']],
  };

  function enhance(nav){
    if(nav.dataset.mobileNav)return;nav.dataset.mobileNav='1';
    const kind=nav.classList.contains('admin-nav')?'admin-nav':'promoter-nav';
    const buttons=[...nav.querySelectorAll(':scope>button')];
    // Teks asli dibungkus supaya bisa disembunyikan di HP (diganti label pendek) tanpa mengubah tombolnya.
    buttons.forEach(b=>[...b.childNodes].filter(n=>n.nodeType===3&&n.data.trim()).forEach(n=>{const s=document.createElement('span');s.className='nav-full';n.replaceWith(s);s.append(n)}));
    const primary=PRIMARY[kind].map(([sel,icon,short])=>{const b=nav.querySelector(`:scope>${sel}`);if(b){b.classList.add('nav-primary');b.insertAdjacentHTML('afterbegin',svg(icon));b.dataset.short=short;b.insertAdjacentHTML('beforeend',`<span class="nav-short">${short}</span>`)}return b}).filter(Boolean);
    const rest=buttons.filter(b=>!primary.includes(b));
    rest.forEach(b=>b.classList.add('nav-overflow'));
    if(!rest.length)return;
    const activeRest=rest.find(b=>b.classList.contains('active'));
    nav.insertAdjacentHTML('beforeend',`<button type="button" class="nav-more ${activeRest?'active':''}" data-nav-more aria-haspopup="dialog">${svg('more')}<span class="nav-short">${activeRest?'':'Lainnya'}</span></button>`);
    // Halaman yang sedang dibuka ada di "Lainnya": tampilkan namanya di tombol itu supaya posisi tetap jelas.
    const more=nav.querySelector('[data-nav-more]');
    if(activeRest){more.querySelector('.nav-short').textContent=activeRest.textContent.trim();more.setAttribute('aria-label','Lainnya · '+activeRest.textContent.trim())}
  }

  function openSheet(nav){
    const items=[...nav.querySelectorAll(':scope>.nav-overflow')];
    const d=openAppDialog({label:'Menu lainnya',className:'nav-sheet',html:`<header><b>${nav.classList.contains('admin-nav')?'Admin Console':'Promotor Studio'}</b><button type="button" data-sheet-close aria-label="Tutup">×</button></header><div class="nav-sheet-list">${items.map((b,i)=>`<button type="button" class="${b.classList.contains('active')?'active':''} ${b.matches('.admin-exit,[data-go="56"]')?'is-exit':''}" data-sheet-item="${i}" ${b.classList.contains('active')?'aria-current="page"':''}>${(b.querySelector('.nav-full')||b).textContent.trim()}</button>`).join('')}</div>`});
    d.box.querySelector('[data-sheet-close]').onclick=()=>d.close(false);
    d.box.querySelectorAll('[data-sheet-item]').forEach(x=>x.onclick=()=>{const target=items[Number(x.dataset.sheetItem)];d.close(true);target?.click()});
    (d.box.querySelector('[data-sheet-item].active')||d.box.querySelector('[data-sheet-item]'))?.focus();
  }

  const sweep=()=>document.querySelectorAll('.promoter-nav:not([data-mobile-nav]),.admin-nav:not([data-mobile-nav])').forEach(enhance);
  new MutationObserver(sweep).observe(document.body,{childList:true,subtree:true});sweep();
  document.addEventListener('click',e=>{const more=e.target.closest('[data-nav-more]');if(more){e.preventDefault();openSheet(more.closest('nav'))}});
})();
