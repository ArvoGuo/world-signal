/* Local URL reload only. No requests, tracking or publication controls. */
(function (root) {
  'use strict';
  function createGesture(threshold = 88) {
    let state = null;
    return {
      start(x, y, count, atTop, excluded) { state = count === 1 && atTop && !excluded ? {x,y,dy:0} : null; },
      move(x, y, count, atTop) {
        if (!state) return {active:false};
        const dx=x-state.x, dy=y-state.y;
        if (count !== 1 || !atTop || dy < -6 || (Math.abs(dx)>10 && Math.abs(dx)>Math.abs(dy)*0.6)) { state=null; return {active:false}; }
        state.dy=Math.max(0,dy);
        return {active:dy>10, ready:dy>=threshold, amount:Math.max(0,dy)};
      },
      end(atTop) { const fire=!!state && atTop && state.dy>=threshold; state=null; return fire; },
      cancel() { state=null; }
    };
  }
  function useCustomGesture(navigator, supported, coarse) {
    const ua=navigator.userAgent || '';
    const ios=/iPad|iPhone|iPod/i.test(ua) || (navigator.platform==='MacIntel' && navigator.maxTouchPoints>1);
    return !!supported && !!coarse && !ios && /Android/i.test(ua) && /Chrome\//.test(ua) && !/; wv\)|Firefox|FxiOS|CriOS|EdgiOS|OPiOS/i.test(ua);
  }
  if (typeof module === 'object' && module.exports) module.exports={createGesture,useCustomGesture};
  if (!root.document) return;
  const document=root.document, button=document.querySelector('[data-local-refresh]'), status=document.getElementById('local-refresh-status');
  if (!button || !status) return;
  let pending=false;
  const gesture=createGesture();
  const atTop=()=>root.scrollY<=1 && (document.scrollingElement?.scrollTop || 0)<=1;
  function clear() { gesture.cancel();status.hidden=true;status.textContent=''; }
  function reload() {
    if (pending) return;
    pending=true;clear();button.disabled=true;status.hidden=false;status.textContent='正在重新载入本页…';
    root.location.reload();
  }
  button.addEventListener('click',reload);
  function restore() { clear();pending=false;button.disabled=false; }
  root.addEventListener('pagehide',restore,{passive:true});
  root.addEventListener('pageshow',restore,{passive:true});
  root.addEventListener('blur',clear,{passive:true});
  document.addEventListener('visibilitychange',()=>{if(document.hidden)clear();});
  const supported=root.CSS?.supports('overscroll-behavior-y','contain');
  const coarse=root.matchMedia('(pointer: coarse)').matches;
  // If native overscroll cannot be suppressed reliably, retain native gesture + explicit button.
  if (!useCustomGesture(root.navigator,supported,coarse)) return;
  document.documentElement.classList.add('ws-ptr-enabled');
  function excluded(target) {
    if (!(target instanceof root.Element)) return true;
    if (target.closest('a,button,input,textarea,select,summary,details,[contenteditable],[role="button"],[role="slider"],[role="textbox"],[data-no-pull-refresh]')) return true;
    for(let el=target;el && el!==document.body;el=el.parentElement) {
      if (el.scrollHeight>el.clientHeight+1 && /auto|scroll/.test(root.getComputedStyle(el).overflowY)) return true;
    }
    return false;
  }
  document.addEventListener('touchstart',event=>{
    clear();if(pending)return;
    const t=event.touches[0];if(!t)return;
    gesture.start(t.clientX,t.clientY,event.touches.length,atTop(),excluded(event.target));
  },{passive:true});
  document.addEventListener('touchmove',event=>{
    const t=event.touches[0];if(!t){clear();return;}
    const state=gesture.move(t.clientX,t.clientY,event.touches.length,atTop());
    if(!state.active){status.hidden=true;return;}
    if(!event.cancelable){clear();return;}
    event.preventDefault();status.hidden=false;
    const text=state.ready?'松开刷新本页':'继续下拉刷新';
    if(status.textContent!==text)status.textContent=text;
  },{passive:false});
  document.addEventListener('touchend',event=>{
    if(event.touches.length){clear();return;}
    const fire=gesture.end(atTop());clear();if(fire)reload();
  },{passive:true});
  document.addEventListener('touchcancel',clear,{passive:true});
  root.addEventListener('scroll',()=>{if(!atTop())clear();},{passive:true});

})(typeof window!=='undefined'?window:globalThis);
