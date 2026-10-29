
// Preview Claude memuat halaman di iframe sandbox tanpa izin "allow-forms", sehingga browser
// membatalkan semua pengiriman form sebelum event submit sempat terjadi. Semua handler di aplikasi
// ini hanya memakai event submit (tidak pernah benar-benar mengirim ke server), jadi tombol kirim
// & tombol Enter ditangani di sini: validasi form, lalu kirim event submit buatan langsung ke form.
(()=>{
  const fire=(form,submitter)=>{
    // formnovalidate (mis. "Simpan draft") boleh menyimpan form yang belum lengkap.
    if(!submitter?.formNoValidate&&!form.noValidate&&!form.reportValidity())return;
    const ev=typeof SubmitEvent==='function'?new SubmitEvent('submit',{bubbles:true,cancelable:true,submitter:submitter||null}):new Event('submit',{bubbles:true,cancelable:true});
    form.dispatchEvent(ev);
  };
  window.addEventListener('click',e=>{
    const btn=e.target.closest('button,input[type=submit],input[type=image]');
    if(!btn||!btn.form||btn.disabled)return;
    const type=(btn.getAttribute('type')||'submit').toLowerCase();
    if(type!=='submit'&&type!=='image')return;
    e.preventDefault();fire(btn.form,btn);
  },true);
  window.addEventListener('keydown',e=>{
    const el=e.target;
    if(e.key!=='Enter'||e.isComposing||e.shiftKey||!el.form||el.tagName!=='INPUT')return;
    if(['button','submit','reset','checkbox','radio','file','image','color','range'].includes(el.type))return;
    const submit=el.form.querySelector('button:not([type]),button[type=submit],input[type=submit]');
    if(submit?.disabled)return;
    e.preventDefault();fire(el.form,submit);
  },true);
})();
