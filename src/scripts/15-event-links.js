
openEvent=function(ref){activeEvent=eventIndexFromRef(ref);openFlow(18)};
document.addEventListener('click',event=>{
  const link=event.target.closest('[data-event-name]');
  if(!link)return;
  event.preventDefault();
  event.stopImmediatePropagation();
  openEvent(link.dataset.eventName);
},true);
