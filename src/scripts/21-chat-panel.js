
(()=>{
  const flowEl=document.querySelector('#flowLayer'),layout=document.querySelector('.layout');
  // Ubah class hanya bila berbeda: classList.add/remove selalu memicu MutationObserver walau nilainya sama.
  const setClass=(name,on)=>{if(flowEl.classList.contains(name)!==on)flowEl.classList.toggle(name,on)};
  function place(){
    const embedded=flowEl.classList.contains('open')&&flowEl.classList.contains('embedded')&&innerWidth>620;
    const inChat=embedded&&layout.classList.contains('chat-mode')&&innerWidth>850;
    if(!inChat){setClass('in-chat',false);setClass('cover-page',false)}
    if(!embedded){flowEl.style.left=flowEl.style.width='';return}
    if(!inChat){
      // Layar detail menempati persis kolom utama, agar lebar & posisinya sama dengan Home/Events.
      const col=document.querySelector('.layout .main').getBoundingClientRect();
      flowEl.style.left=col.left+'px';flowEl.style.width=col.width+'px';return;
    }
    // Cari & Notifikasi adalah halaman utama: tutupi daftar chat + percakapan. Layar lain: hanya kolom percakapan.
    const cover=[11,14].includes(flowCurrent);
    const pane=document.querySelector('.layout .right').getBoundingClientRect();
    const left=cover?document.querySelector('.layout .main').getBoundingClientRect().left:pane.left;
    setClass('in-chat',true);setClass('cover-page',cover);
    flowEl.style.left=left+'px';flowEl.style.width=(pane.right-left)+'px';
  }
  new MutationObserver(place).observe(flowEl,{attributes:true,attributeFilter:['class']});
  new MutationObserver(place).observe(layout,{attributes:true,attributeFilter:['class']});
  new MutationObserver(place).observe(document.querySelector('#flowContent'),{childList:true});
  addEventListener('resize',place);
  place();
})();
