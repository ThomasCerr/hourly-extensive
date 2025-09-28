(function(){
  // --- Helpers ---
  const $ = (sel, root=document) => root.querySelector(sel);
  const $$ = (sel, root=document) => Array.from(root.querySelectorAll(sel));
  const getMulti = (select) => Array.from(select.selectedOptions).map(o=>o.value).filter(Boolean);
  const LS = {
    get(k, def){ try{ const v = localStorage.getItem(k); return v? JSON.parse(v):def }catch(e){ return def; } },
    set(k, v){ localStorage.setItem(k, JSON.stringify(v)); }
  };
  const toast = (msg) => { console.log(msg); };

  // --- Tabs ---
  $$('.tab').forEach(btn => {
    btn.addEventListener('click', () => {
      $$('.tab').forEach(b=>b.classList.remove('active'));
      btn.classList.add('active');
      const tab = btn.dataset.tab;
      $$('.panel').forEach(p => p.classList.remove('active'));
      $('#panel-'+tab).classList.add('active');
    });
  });

  // --- Builder elements ---
  const kw = $('#kw'); const loc = $('#loc'); const fWT = $('#f_WT'); const fE = $('#f_E'); const fJT = $('#f_JT');
  const fAL = $('#f_AL'); const fC = $('#f_C'); const fI = $('#f_I'); const distance = $('#distance'); const sortBy = $('#sortBy');
  const dateRadios = $$('input[name="dateMode"]'); const lookbackN = $('#lookbackN'); const lookbackUnit = $('#lookbackUnit');
  const linksBox = $('#links');
  const saveName = $('#saveName');

  function updateDateCtrls(){
    const mode = $('input[name="dateMode"]:checked').value;
    const isLook = mode === 'lookback';
    lookbackN.disabled = !isLook; lookbackUnit.disabled = !isLook;
  }
  dateRadios.forEach(r=>r.addEventListener('change', updateDateCtrls)); updateDateCtrls();

  // --- URL builders ---
  function buildLinkedInURL(cfg){
    const base = 'https://www.linkedin.com/jobs/search/?';
    const p = new URLSearchParams();
    if (cfg.kw) p.set('keywords', cfg.kw);
    if (cfg.loc) p.set('location', cfg.loc);
    // time filter
    if (cfg.dateMode === 'lookback' && cfg.n > 0){
      const secs = (cfg.unit === 'hours' ? cfg.n*3600 : cfg.n*86400);
      p.set('f_TPR','r'+secs);
    }
    // extras
    const wt = (cfg.fWT||[]).filter(v=>v!==""); if (wt.length) p.set('f_WT', wt.join(','));
    const e  = (cfg.fE||[]).filter(v=>v!=="");  if (e.length)  p.set('f_E', e.join(','));
    const jt = (cfg.fJT||[]).filter(v=>v!==""); if (jt.length) p.set('f_JT', jt.join(','));
    if (cfg.fAL) p.set('f_AL', cfg.fAL);
    if (cfg.fC)  p.set('f_C', cfg.fC);
    if (cfg.fI)  p.set('f_I', cfg.fI);
    if (cfg.distance>0) p.set('distance', String(cfg.distance));
    if (cfg.sortBy) p.set('sortBy', cfg.sortBy);
    return base + p.toString();
  }

  function buildIndeedURL(cfg){
    // Indeed doesn't support hours precisely; map hours→days ceil and sort by date
    const base = 'https://www.indeed.com/jobs?';
    const p = new URLSearchParams();
    if (cfg.kw) p.set('q', cfg.kw);
    if (cfg.loc) p.set('l', cfg.loc);
    if (cfg.dateMode === 'lookback' && cfg.n > 0){
      const days = (cfg.unit === 'hours') ? Math.max(1, Math.ceil(cfg.n/24)) : cfg.n;
      p.set('fromage', String(days)); // last N days
    }
    p.set('sort','date'); // most recent
    return base + p.toString();
  }

  function buildWellfoundURL(cfg){
    // Wellfound (AngelList Talent) simple keywords/location; no hour param, but keep page fresh.
    const base = 'https://wellfound.com/jobs?';
    const p = new URLSearchParams();
    if (cfg.kw) p.set('keywords', cfg.kw);
    if (cfg.loc) p.set('location', cfg.loc);
    return base + p.toString();
  }

  function readCfg(){
    return {
      kw: kw.value.trim(),
      loc: loc.value.trim(),
      dateMode: $('input[name="dateMode"]:checked').value,
      n: parseInt(lookbackN.value,10) || 0,
      unit: lookbackUnit.value,
      fWT: getMulti(fWT),
      fE:  getMulti(fE),
      fJT: getMulti(fJT),
      fAL: fAL.value,
      fC:  fC.value.trim(),
      fI:  fI.value.trim(),
      distance: parseInt(distance.value,10)||0,
      sortBy: sortBy.value
    };
  }

  function showLinks(cfg){
    linksBox.innerHTML = '';
    const li = buildLinkedInURL(cfg);
    const ind = buildIndeedURL(cfg);
    const wf = buildWellfoundURL(cfg);
    const make = (label, url)=>{
      const a = document.createElement('a'); a.href=url; a.target='_blank'; a.rel='noopener'; a.textContent = label+': '+url;
      const wrap = document.createElement('div'); wrap.appendChild(a); return wrap;
    };
    linksBox.appendChild(make('LinkedIn', li));
    linksBox.appendChild(make('Indeed', ind));
    linksBox.appendChild(make('Wellfound', wf));
    return [li, ind, wf];
  }

  $('#buildLinkedIn').addEventListener('click', ()=> showLinks(readCfg()));
  $('#buildIndeed').addEventListener('click', ()=> {
    const cfg = readCfg(); linksBox.innerHTML=''; const url = buildIndeedURL(cfg);
    const a = document.createElement('a'); a.href=url; a.target='_blank'; a.textContent='Indeed: '+url; linksBox.appendChild(a);
  });
  $('#buildWellfound').addEventListener('click', ()=> {
    const cfg = readCfg(); linksBox.innerHTML=''; const url = buildWellfoundURL(cfg);
    const a = document.createElement('a'); a.href=url; a.target='_blank'; a.textContent='Wellfound: '+url; linksBox.appendChild(a);
  });
  $('#openAll').addEventListener('click', ()=> {
    const [li, ind, wf] = showLinks(readCfg());
    [li, ind, wf].forEach(u => window.open(u,'_blank'));
  });

  // --- Save searches ---
  const SAVED_KEY = 'fresh_jobs_saved';
  function renderSaved(){
    const list = LS.get(SAVED_KEY, []);
    const box = $('#savedList'); box.innerHTML='';
    if (!list.length){ box.innerHTML = '<p class="muted">No saved searches yet.</p>'; return; }
    list.forEach((item, idx)=>{
      const row = document.createElement('div'); row.className='saved-item';
      const name = document.createElement('div'); name.className='name'; name.textContent = item.name;
      const open = document.createElement('button'); open.className='secondary'; open.textContent='Open';
      open.addEventListener('click', ()=> {
        const urls = showLinks(item.cfg); urls.forEach(u=>window.open(u,'_blank'));
      });
      const load = document.createElement('button'); load.className='secondary'; load.textContent='Load into Builder';
      load.addEventListener('click', ()=> { loadCfg(item.cfg); $('.tab[data-tab="builder"]').click(); });
      const del = document.createElement('button'); del.className='danger'; del.textContent='Delete';
      del.addEventListener('click', ()=>{
        const arr = LS.get(SAVED_KEY, []); arr.splice(idx,1); LS.set(SAVED_KEY, arr); renderSaved();
      });
      row.append(name, open, load, del);
      box.appendChild(row);
    });
  }
  function saveCurrent(){
    const name = saveName.value.trim() || 'Search '+new Date().toLocaleString();
    const cfg = readCfg();
    const arr = LS.get(SAVED_KEY, []);
    arr.unshift({name, cfg});
    LS.set(SAVED_KEY, arr);
    saveName.value = '';
    renderSaved();
    $('.tab[data-tab="saved"]').click();
  }
  $('#saveSearch').addEventListener('click', saveCurrent);
  renderSaved();

  function loadCfg(cfg){
    kw.value = cfg.kw || ''; loc.value = cfg.loc || '';
    (cfg.dateMode==='lookback' ? $$('input[name="dateMode"]')[1] : $$('input[name="dateMode"]')[0]).checked = true;
    lookbackN.value = cfg.n || ''; lookbackUnit.value = cfg.unit || 'hours';
    // Multi selects
    [fWT,fE,fJT].forEach(sel=> Array.from(sel.options).forEach(o=> o.selected = (cfg[sel.id]?.includes(o.value)) ));
    fAL.value = cfg.fAL || ''; fC.value = cfg.fC || ''; fI.value = cfg.fI || '';
    distance.value = cfg.distance || ''; sortBy.value = cfg.sortBy || '';
    updateDateCtrls();
  }

  // --- Presets ---
  const DK_KEY='fresh_jobs_defaults';
  const dKw = $('#dKw'), dLoc = $('#dLoc');
  const def = LS.get(DK_KEY, {kw:'', loc:''}); dKw.value = def.kw; dLoc.value = def.loc;
  dKw.addEventListener('input', ()=> LS.set(DK_KEY, {kw:dKw.value, loc:dLoc.value}));
  dLoc.addEventListener('input', ()=> LS.set(DK_KEY, {kw:dKw.value, loc:dLoc.value}));
  $$('.preset').forEach(btn=>{
    btn.addEventListener('click', ()=> {
      const hours = parseInt(btn.dataset.h,10);
      const cfg = {
        kw: dKw.value.trim(), loc: dLoc.value.trim(),
        dateMode:'lookback', n: hours, unit:'hours',
        fWT:[], fE:[], fJT:[], fAL:'', fC:'', fI:'', distance:0, sortBy:'DD'
      };
      const urls = [
        {label:'LinkedIn', url: buildLinkedInURL(cfg)},
        {label:'Indeed', url: buildIndeedURL(cfg)},
        {label:'Wellfound', url: buildWellfoundURL(cfg)}
      ];
      const box = $('#presetLinks'); box.innerHTML='';
      urls.forEach(u=>{
        const a = document.createElement('a'); a.href=u.url; a.target='_blank'; a.textContent = u.label+': '+u.url;
        const wrap = document.createElement('div'); wrap.appendChild(a); box.appendChild(wrap);
        window.open(u.url,'_blank');
      });
    });
  });

  // --- Tracker ---
  const T_KEY='fresh_jobs_tracker';
  const tTable = $('#tTable tbody');
  function renderTracker(){
    const rows = LS.get(T_KEY, []);
    tTable.innerHTML='';
    rows.forEach((r, idx)=>{
      const tr = document.createElement('tr');
      const linkCell = `<a href="${r.link}" target="_blank">Link</a>`;
      tr.innerHTML = `<td>${r.date}</td><td>${r.title||''}</td><td>${r.company||''}</td><td>${linkCell}</td>
        <td>${r.status||''}</td><td>${r.notes||''}</td>
        <td><button data-i="${idx}" class="danger">Delete</button></td>`;
      tTable.appendChild(tr);
    });
    $$('#tTable .danger').forEach(b=> b.addEventListener('click', ()=>{
      const i = parseInt(b.dataset.i,10);
      const rows = LS.get(T_KEY, []); rows.splice(i,1); LS.set(T_KEY, rows); renderTracker();
    }));
  }
  function addTracker(){
    const title = $('#tTitle').value.trim();
    const company = $('#tCompany').value.trim();
    const link = $('#tLink').value.trim();
    if (!link) return;
    const status = $('#tStatus').value;
    const notes = $('#tNotes').value.trim();
    const row = {date:new Date().toLocaleDateString(), title, company, link, status, notes};
    const rows = LS.get(T_KEY, []); rows.unshift(row); LS.set(T_KEY, rows);
    ['tTitle','tCompany','tLink','tNotes'].forEach(id=> $('#'+id).value='');
    renderTracker();
  }
  $('#tAdd').addEventListener('click', addTracker);
  $('#clearTracker').addEventListener('click', ()=>{ LS.set(T_KEY, []); renderTracker(); });

  function toCSV(rows){
    if (!rows.length) return '';
    const cols = Object.keys(rows[0]);
    const esc = v => ('"'+String(v).replace(/"/g,'""')+'"');
    return [cols.join(','), ...rows.map(r=> cols.map(c=>esc(r[c]||'')).join(','))].join('\n');
  }
  $('#exportCSV').addEventListener('click', ()=>{
    const rows = LS.get(T_KEY, []);
    const blob = new Blob([toCSV(rows)], {type:'text/csv'});
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href=url; a.download='applications.csv'; a.click();
    URL.revokeObjectURL(url);
  });
  $('#exportJSON').addEventListener('click', ()=>{
    const rows = LS.get(T_KEY, []);
    const blob = new Blob([JSON.stringify(rows,null,2)], {type:'application/json'});
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href=url; a.download='applications.json'; a.click();
    URL.revokeObjectURL(url);
  });

  renderTracker();
})();