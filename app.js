(function(root){
 'use strict';
 function matches(item,query,category,source){
  const words=query.normalize('NFKC').toLocaleLowerCase().trim().split(/\s+/).filter(Boolean);
  const text=item.search.normalize('NFKC').toLocaleLowerCase();
  return (category==='全部'||item.category===category)&&(source==='全部'||item.source===source)&&words.every(word=>text.includes(word));
 }
 function matchResult(fields,query){
  const words=[...new Set(query.normalize('NFKC').toLocaleLowerCase().trim().split(/\s+/).filter(Boolean))];
  if(!words.length)return null;
  let best=null;
  for(const field of fields){
   const text=field.text.normalize('NFKC').replace(/\s+/g,' '),lower=text.toLocaleLowerCase();
   const positions=words.map(word=>lower.indexOf(word)).filter(index=>index>=0);
   if(positions.length&&(!best||positions.length>best.score))best={label:field.label,section:field.section,text,score:positions.length,index:Math.min(...positions)};
  }
  if(!best)return null;
  const start=Math.max(0,best.index-20),end=Math.min(best.text.length,start+110);
  const section=['forecast','facts','analysis','basis','watch','sources'].includes(best.section)?best.section:'facts';
  return {section,text:`匹配片段 · ${best.label}：${start?'…':''}${best.text.slice(start,end)}${end<best.text.length?'…':''}`};
 }
 function matchExcerpt(fields,query){return matchResult(fields,query)?.text||'';}
 function freshness(iso,now=Date.now()){
  const collected=Date.parse(iso),age=now-collected;
  if(!Number.isFinite(collected)||!Number.isFinite(now))return {state:'unknown',text:'无法计算内容年龄，请核对上方采集时间。'};
  if(age < -300000)return {state:'unknown',text:'设备时间与采集时间不一致，请核对设备时钟。'};
  const hours=Math.floor(Math.max(0,age)/3600000);
  if(hours>=36)return {state:'stale',text:`距上次采集已 ${hours} 小时。这是较早快照，请先查看原始来源的最新进展。`};
  return {state:'recent',text:hours<1?'采集不足 1 小时；各条新闻仍有独立发布时间。':`距上次采集 ${hours} 小时；采集时间不代表新闻刚刚发生。`};
 }
 if(typeof module!=='undefined')module.exports={matches,freshness,matchExcerpt,matchResult};
 if(!root.document)return;
 const doc=root.document, search=doc.getElementById('search');
 const freshnessBox=doc.getElementById('freshness'),ageText=doc.getElementById('freshness-age');
 if(freshnessBox&&ageText){
  const updateAge=()=>{const value=freshness(freshnessBox.dataset.collected);freshnessBox.dataset.state=value.state;ageText.textContent=value.text;};
  updateAge();
  if(doc.addEventListener)doc.addEventListener('visibilitychange',()=>{if(!doc.hidden)updateAge();});
 }
 if(!search){
  const state=new URLSearchParams(root.location.hash.slice(1)).get('return');
  if(state){
   const parsed=new URLSearchParams(state),safe=new URLSearchParams();
   for(const key of ['q','category','source'])if(parsed.has(key))safe.set(key,parsed.get(key));
   if(['brief','watch'].includes(parsed.get('view')))safe.set('view',parsed.get('view'));
   if(['archive','search'].includes(parsed.get('origin')))safe.set('origin',parsed.get('origin'));
   if(/^[a-f0-9]{16}$/.test(parsed.get('item')||''))safe.set('item',parsed.get('item'));
   doc.querySelectorAll('.return-to-list').forEach(a=>{
    const origin=safe.get('origin');
    const base=origin==='search'&&a.dataset?.searchHref?a.dataset.searchHref:origin==='archive'&&a.dataset?.archiveHref?a.dataset.archiveHref:a.getAttribute('href').split('#')[0];
    a.href=base+'#'+safe.toString();
    a.textContent=origin==='search'?'← 返回跨期搜索':origin==='archive'?'← 返回本期归档':'← 返回新闻列表';
   });
   doc.querySelectorAll('.sequence-link').forEach(a=>{const fragment=new URLSearchParams({return:safe.toString()});a.href=a.getAttribute('href')+'#'+fragment.toString();});
   const sections=['forecast','facts','analysis','basis','watch','sources'];
   doc.querySelectorAll('.article-toc a').forEach(a=>{
    const section=a.getAttribute('href').slice(1);
    if(sections.includes(section))a.href='#'+new URLSearchParams({return:safe.toString(),section}).toString();
   });
   function restoreSection(){
    const section=new URLSearchParams(root.location.hash.slice(1)).get('section');
    if(!sections.includes(section))return;
    const target=doc.getElementById(section);
    if(target){target.setAttribute('tabindex','-1');target.scrollIntoView();target.focus({preventScroll:true});}
   }
   root.addEventListener('hashchange',restoreSection);
   restoreSection();
  }
  return;
 }
 const source=doc.getElementById('source'),cards=[...doc.querySelectorAll('.news-card')],buttons=[...doc.querySelectorAll('[data-filter]')];
 const view=doc.getElementById('view'),grid=doc.getElementById('news-grid');
 const excerpts=new Map(cards.map(card=>{let fields=[];try{const parsed=JSON.parse(card.dataset.matchFields||'[]');if(Array.isArray(parsed))fields=parsed.filter(f=>f&&typeof f.text==='string'&&typeof f.label==='string');}catch(_){}return [card,fields];}));
 let returnItem='',category='全部';
 const recovery=doc.getElementById('clear-filters'),emptyHint=doc.getElementById('empty-hint');
 function apply(writeLocation=true){
  grid.dataset.view=view.value;
  let count=0;
  for(const card of cards){
   const visible=matches(card.dataset,search.value,category,source.value);card.hidden=!visible;if(visible)count++;
   const hint=card.querySelector?.('.match-info');
   if(hint){
    const result=visible?matchResult(excerpts.get(card),search.value):null;
    hint.textContent=result?result.text+' · 查看此处 →':'';
    hint.dataset.section=result?.section||'';hint.hidden=!result;
   }
  }
  buttons.forEach(button=>button.setAttribute('aria-pressed',String(button.dataset.filter===category)));
  doc.getElementById('result-count').textContent=`显示 ${count} / ${cards.length} 条 · 按发布时间排序`;
  doc.getElementById('empty').hidden=count!==0;
  if(recovery&&emptyHint){
   const unfiltered=cards.filter(card=>matches(card.dataset,search.value,'全部','全部')).length;
   const hasQuery=Boolean(search.value.trim());
   recovery.hidden=count!==0||unfiltered===0;
   recovery.textContent=hasQuery?'清除分类与来源，保留关键词':'清除分类与来源';
   if(count===0&&unfiltered>0){
    emptyHint.textContent=hasQuery?`关键词匹配 ${unfiltered} 条，但被分类或来源筛选排除。可保留关键词并清除筛选。`:`当前分类与来源组合没有结果；清除筛选后可显示 ${unfiltered} 条内容。`;
   }else emptyHint.textContent='试试更短的关键词；多个词用空格分隔时，需要同时匹配。';
  }
  const query=new URLSearchParams();
  if(search.value.trim())query.set('q',search.value.trim());
  if(category!=='全部')query.set('category',category);
  if(source.value!=='全部')query.set('source',source.value);
  if(['brief','watch'].includes(view.value))query.set('view',view.value);
  if(returnItem){
   const target=doc.getElementById('item-'+returnItem);
   if(target&&!target.hidden)query.set('item',returnItem);else returnItem='';
  }
  // Keep return context in URL fragments only, never in network query parameters.
  if(doc.querySelectorAll('.news-card a'))doc.querySelectorAll('.news-card a').forEach(a=>{
   const base=(a.dataset.baseHref||(a.dataset.baseHref=a.getAttribute('href').split('#')[0]));
   const context=new URLSearchParams(query);
   if(['archive','search'].includes(grid.dataset.listKind))context.set('origin',grid.dataset.listKind);
   if(/^[a-f0-9]{16}$/.test(a.dataset.item||''))context.set('item',a.dataset.item);
   const fragment=new URLSearchParams({return:context.toString()});
   if(['forecast','facts','analysis','basis','watch','sources'].includes(a.dataset.section))fragment.set('section',a.dataset.section);
   a.href=base+(context.size?'#'+fragment.toString():'');
  });
  if(writeLocation)try{root.history.replaceState(null,'',root.location.pathname+(query.size?'#'+query.toString():''));}catch(_){}
 }
 function change(){returnItem='';apply();}
 search.addEventListener('input',change);source.addEventListener('change',change);
 view.addEventListener('change',change);
 buttons.forEach(button=>button.addEventListener('click',()=>{category=button.dataset.filter;change();}));
 doc.getElementById('reset').addEventListener('click',()=>{category='全部';search.value='';source.value='全部';view.value='analysis';change();search.focus();});
 if(recovery)recovery.addEventListener('click',()=>{category='全部';source.value='全部';change();search.focus();});
 function restoreList(initial=false){
  const hash=root.location.hash,params=new URLSearchParams(hash.slice(1));
  const nativeItem=/^#item-([a-f0-9]{16})$/.exec(hash);
  // Ordinary page anchors must not reset a reader's active filters.
  const ordinaryAnchor=Boolean(hash&&!nativeItem&&!['q','category','source','view','item'].some(key=>params.has(key)));
  if(!initial&&ordinaryAnchor)return;
  returnItem=/^[a-f0-9]{16}$/.test(params.get('item')||'')?params.get('item'):(nativeItem?nativeItem[1]:'');
  view.value=['brief','watch'].includes(params.get('view'))?params.get('view'):'analysis';
  category=['全部','金融','科技'].includes(params.get('category'))?params.get('category'):'全部';
  search.value=params.get('q')||'';
  source.value=[...source.options].some(o=>o.value===params.get('source'))?params.get('source'):'全部';
  apply(!ordinaryAnchor);
  if(returnItem){
   const target=doc.getElementById('item-'+returnItem);
   target.setAttribute('tabindex','-1');target.scrollIntoView({block:'start'});target.focus({preventScroll:true});
  }
 }
 // Initial ordinary anchors still need the default list and article return links.
 restoreList(true);
 if(root.addEventListener){
  root.addEventListener('hashchange',()=>restoreList());
  root.addEventListener('pageshow',event=>{if(event.persisted)restoreList();});
 }
})(typeof window==='undefined'?globalThis:window);
