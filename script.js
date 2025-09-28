const buildBtn=document.getElementById('buildBtn');
const openBtn=document.getElementById('openBtn');
const copyBtn=document.getElementById('copyBtn');
const urlBox=document.getElementById('urlBox');
function buildUrl(){
  const kw=document.getElementById('keywords').value.trim();
  const loc=document.getElementById('location').value.trim();
  const mode=document.querySelector('input[name="dateMode"]:checked').value;
  const n=parseInt(document.getElementById('lookbackValue').value,10);
  const unit=document.getElementById('lookbackUnit').value;
  const fWT=document.getElementById('f_WT').value;
  const fE=document.getElementById('f_E').value;
  const fJT=document.getElementById('f_JT').value;
  const fAL=document.getElementById('f_AL').value;
  const distance=document.getElementById('distance').value;
  const sortBy=document.getElementById('sortBy').value;
  const params=new URLSearchParams();
  if(kw)params.set('keywords',kw);
  if(loc)params.set('location',loc);
  if(mode==='lookback' && n>0){
    const secs=unit==='hours'?n*3600:n*86400;
    params.set('f_TPR','r'+secs);
  }
  if(fWT)params.set('f_WT',fWT);
  if(fE)params.set('f_E',fE);
  if(fJT)params.set('f_JT',fJT);
  if(fAL)params.set('f_AL',fAL);
  if(distance)params.set('distance',distance);
  if(sortBy)params.set('sortBy',sortBy);
  const url='https://www.linkedin.com/jobs/search/?'+params.toString();
  urlBox.innerHTML='<a href="'+url+'" target="_blank">Generated LinkedIn Job Link</a>';
  openBtn.disabled=false;copyBtn.disabled=false;
  return url;
}
buildBtn.addEventListener('click',buildUrl);
openBtn.addEventListener('click',()=>{const url=buildUrl();window.open(url,'_blank')});
copyBtn.addEventListener('click',async()=>{const url=buildUrl();try{await navigator.clipboard.writeText(url);copyBtn.textContent='Copied!';setTimeout(()=>copyBtn.textContent='Copy URL',2000);}catch(e){}});
