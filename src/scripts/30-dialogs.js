// Dialog di dalam halaman sebagai pengganti confirm()/alert() bawaan browser.
// Pratinjau Claude berjalan di iframe sandbox tanpa allow-modals: confirm() di sana langsung dianggap "batal" tanpa jendela apa pun.
(()=>{
  const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  // Kerangka dialog umum: dipakai askConfirm dan checkout foto. onClose(value) dipanggil sekali saat dialog ditutup.
  window.openAppDialog=function({html,label,className='',onClose}){
    document.querySelector('.app-dialog-backdrop')?.remove();
    const back=document.activeElement;
    document.body.insertAdjacentHTML('beforeend',`<div class="app-dialog-backdrop"><div class="app-dialog ${className}" role="dialog" aria-modal="true" aria-label="${esc(label)}">${html}</div></div>`);
    const root=document.querySelector('.app-dialog-backdrop'),box=root.querySelector('.app-dialog');
    let done=false;
    const close=value=>{if(done)return;done=true;root.remove();document.removeEventListener('keydown',key,true);try{back?.focus?.()}catch{}onClose?.(value)};
    const key=e=>{if(e.key==='Escape'){e.preventDefault();e.stopPropagation();close(false);return}
      if(e.key==='Tab'){const f=[...box.querySelectorAll('button:not([disabled]),input:not([disabled]),a[href]')];if(!f.length)return;const i=f.indexOf(document.activeElement);if(e.shiftKey&&i<=0){e.preventDefault();f[f.length-1].focus()}else if(!e.shiftKey&&i===f.length-1){e.preventDefault();f[0].focus()}}};
    document.addEventListener('keydown',key,true);
    root.addEventListener('click',e=>{if(e.target===root)close(false)});
    return {root,box,close};
  };
  window.askConfirm=function({title,text='',confirm='Ya, lanjutkan',cancel='Batal',danger=false}){
    return new Promise(resolve=>{
      const d=openAppDialog({label:title,className:'confirm',onClose:resolve,html:`<h3>${esc(title)}</h3>${text?`<p>${esc(text)}</p>`:''}<footer><button type="button" data-dialog-cancel>${esc(cancel)}</button><button type="button" class="${danger?'is-danger':'primary'}" data-dialog-ok>${esc(confirm)}</button></footer>`});
      d.box.querySelector('[data-dialog-cancel]').onclick=()=>d.close(false);
      d.box.querySelector('[data-dialog-ok]').onclick=()=>d.close(true);
      d.box.querySelector('[data-dialog-ok]').focus();
    });
  };
})();
