
// Simpan postingan, like, dan balasan milik pengguna di localStorage agar tidak hilang saat refresh.
(()=>{
  const POSTS='temmoo_my_posts_v1',LIKES='temmoo_likes_v1',REPLIES='temmoo_replies_v1';
  const read=(k,d)=>{try{return JSON.parse(localStorage.getItem(k))??d}catch{return d}};
  const write=(k,v)=>{try{localStorage.setItem(k,JSON.stringify(v))}catch{}};
  const liked=new Set(read(LIKES,[])),replies=read(REPLIES,{});
  const keyOf=card=>card&&(card.querySelector('.post-head b')?.textContent.trim()+'|'+card.querySelector('.post-text')?.textContent.trim());

  function savePosts(){
    posts.forEach(p=>{if(p[1]==='@iwang'&&!p.createdAt)p.createdAt=Date.now()});
    write(POSTS,posts.filter(p=>p[1]==='@iwang').map(p=>({post:[...p.slice(0,4),'baru',...p.slice(5)],at:p.createdAt})));
  }
  const baseRender=render;
  render=function(){savePosts();return baseRender.apply(this,arguments)};

  function applyLikes(root){
    root.querySelectorAll?.('.post').forEach(card=>{
      if(card.dataset.likeApplied)return;card.dataset.likeApplied='1';
      const btn=card.querySelector('.post-actions [data-like]');
      if(!btn||!liked.has(keyOf(card))||btn.classList.contains('liked'))return;
      btn.classList.add('liked');const i=btn.querySelector('i');if(i)i.textContent=Number(i.textContent)+1;
    });
  }
  function replyMarkup(text){return `<article class="thread-comment"><div class="avatar">I</div><div class="comment-body"><div class="comment-head"><b>iwang</b><span class="muted">baru</span><span class="more muted" data-thread-menu>···</span></div><p>${escapeText(text)}</p><div class="comment-actions"><button data-like>${actionIcon('like')}<i>0</i></button><button data-comment>${actionIcon('comment')}<i>0</i></button><button data-repost>${actionIcon('repost')}</button><button data-share-post>${actionIcon('share')}</button></div></div></article>`}
  function applyReplies(){
    const list=document.querySelector('#threadComments');if(!list||list.dataset.repliesApplied)return;
    list.dataset.repliesApplied='1';
    (replies[keyOf(document.querySelector('.thread-main .post'))]||[]).forEach(t=>list.insertAdjacentHTML('afterbegin',replyMarkup(t)));
  }
  new MutationObserver(()=>{applyLikes(document);applyReplies()}).observe(document.body,{childList:true,subtree:true});
  applyLikes(document);

  document.addEventListener('click',e=>{
    const btn=e.target.closest('.post-actions [data-like]');if(!btn)return;
    const key=keyOf(btn.closest('.post'));if(!key)return;
    btn.classList.contains('liked')?liked.add(key):liked.delete(key);write(LIKES,[...liked]);
  });
  document.addEventListener('submit',e=>{
    if(e.target.id!=='threadReply')return;
    // Handler asli sudah mengosongkan input; ambil teks dari balasan yang baru disisipkan.
    const text=document.querySelector('#threadComments .thread-comment p')?.textContent;
    const key=keyOf(document.querySelector('.thread-main .post'));
    if(!text||!key)return;(replies[key]=replies[key]||[]).push(text);write(REPLIES,replies);
  });
})();
