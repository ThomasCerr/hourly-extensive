function extractKeywords(text){
  text=text.toLowerCase().replace(/[^a-z0-9\s]/g,'');
  const words=text.split(/\s+/).filter(w=>w.length>3);
  const stop=['with','have','this','that','from','will','your','into','their','about','after','also','only','such','than','then','they','them','some','more','most','many','each'];
  const freq={};
  words.forEach(w=>{if(!stop.includes(w)){freq[w]=(freq[w]||0)+1}});
  return Object.entries(freq).sort((a,b)=>b[1]-a[1]).slice(0,30).map(x=>x[0]);
}
document.getElementById('extractBtn').addEventListener('click',()=>{
  const text=document.getElementById('jobText').value.trim();
  if(!text)return;
  const keys=extractKeywords(text);
  const list=document.getElementById('keywordsList');
  list.innerHTML='';keys.forEach(k=>{const span=document.createElement('span');span.textContent=k;list.appendChild(span)});
  const hidden='<span style="font-size:1px;color:white">'+keys.join(' ')+'</span>';
  document.getElementById('hiddenBlock').value=hidden;
});
document.getElementById('copyHidden').addEventListener('click',async()=>{
  const block=document.getElementById('hiddenBlock').value;
  try{await navigator.clipboard.writeText(block);alert('Copied hidden block!')}catch(e){alert('Copy failed')}
});
