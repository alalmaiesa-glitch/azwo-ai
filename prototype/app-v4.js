window.__TAATHEEL_BUILD__='V1-INGEST-UI-1';

const input=document.getElementById('contentInput');
let count=document.getElementById('wordCount');
const results=document.getElementById('results');
const cards=document.getElementById('claimCards');
const uploadArea=document.getElementById('uploadArea');
const fileInput=document.getElementById('fileInput');
const mediaQueryInput=document.getElementById('mediaQueryInput');
const uploadTitle=document.getElementById('uploadTitle');
const uploadMeta=document.getElementById('uploadMeta');
const selectedFile=document.getElementById('selectedFile');
const inputMeta=document.getElementById('inputMeta');
const analyzeBtn=document.getElementById('analyzeBtn');

let activeType='text';
let lastItems=[];
let lastPayload=null;

const demoText='النبي ﷺ يقول: لا تزال طائفة من أمتي على الحق منصورة';

const typeConfig={
  text:{label:'النص',accept:'text/plain,.txt,.md,.doc,.docx,.pdf'},
  image:{label:'الصورة',accept:'image/*'},
  audio:{label:'الصوت',accept:'audio/*'},
  video:{label:'الفيديو',accept:'video/*'},
  manuscript:{label:'المخطوط',accept:'image/*,.pdf'},
  document:{label:'الوثيقة',accept:'.pdf,.doc,.docx,.txt,image/*'}
};

function syncWordCount(){
  count=document.getElementById('wordCount');
  if(!count) return;
  const v=input.value.trim();
  count.textContent=v ? v.split(/\s+/).length : 0;
}
syncWordCount();
input.addEventListener('input',syncWordCount);

function setActiveType(type){
  activeType=type;
  document.querySelectorAll('.media-tab').forEach(btn=>btn.classList.toggle('active',btn.dataset.type===type));
  const isText=type==='text';
  input.classList.toggle('hidden',!isText);
  uploadArea.classList.toggle('hidden',isText);
  mediaQueryInput.classList.toggle('hidden',isText);
  selectedFile.textContent='';
  fileInput.value='';

  if(isText){
    inputMeta.innerHTML='<b id="wordCount">0</b> كلمة';
    syncWordCount();
  }else{
    const cfg=typeConfig[type];
    fileInput.accept=cfg.accept;
    uploadTitle.textContent='اختر '+cfg.label;
    uploadMeta.textContent='ارفع ملفًا فعليًا؛ سيُحفظ مؤقتًا لمدة 24 ساعة وتُستخرج منه البيانات المتاحة.';
    mediaQueryInput.placeholder=type==='manuscript'
      ? 'اكتب عنوان المخطوط أو الصق رابط IIIF Manifest…'
      : 'اكتب عنوانًا أو وصفًا أو رابطًا يساعد في العثور على الأصل…';
    inputMeta.textContent='يمكن البحث بالوصف دون اختيار ملف';
  }
  results.classList.add('hidden');
}

document.querySelectorAll('.media-tab').forEach(btn=>{
  btn.addEventListener('click',()=>setActiveType(btn.dataset.type));
});

fileInput.addEventListener('change',()=>{
  if(!fileInput.files.length) return;
  const file=fileInput.files[0];
  selectedFile.textContent=file.name;
  if(!mediaQueryInput.value.trim()){
    mediaQueryInput.value=file.name.replace(/\.[^.]+$/,'').replace(/[_-]+/g,' ');
  }
  inputMeta.textContent='الملف جاهز للرفع الفعلي عند بدء التأثيل';
});

document.getElementById('fillDemo').addEventListener('click',()=>{
  setActiveType('text');
  input.value=demoText;
  syncWordCount();
  input.focus();
  const end=input.value.length;
  input.setSelectionRange(end,end);
});

function escapeHtml(value=''){
  return String(value)
    .replace(/&/g,'&amp;')
    .replace(/</g,'&lt;')
    .replace(/>/g,'&gt;')
    .replace(/"/g,'&quot;')
    .replace(/'/g,'&#039;');
}

function badgeClass(status){
  if(status==='PARTIAL') return 'partial';
  if(status==='UNSUPPORTED') return 'unsupported';
  if(status==='HUMAN_REVIEW') return 'review';
  return '';
}

function verdictUi(verdict){
  const map={
    DIRECT_MATCH:{status:'SUPPORTED',label:'مطابقة مباشرة'},
    STRONG_SUPPORT:{status:'SUPPORTED',label:'دعم قوي'},
    PARTIAL_SUPPORT:{status:'PARTIAL',label:'دعم جزئي'},
    CANDIDATE_SOURCE:{status:'PARTIAL',label:'مصدر مرشح'},
    CONFLICT:{status:'UNSUPPORTED',label:'تعارض'},
    NOT_FOUND:{status:'UNSUPPORTED',label:'لم يُعثر'},
    HUMAN_REVIEW:{status:'HUMAN_REVIEW',label:'تحتاج مراجعة'}
  };
  return map[verdict] || {status:'HUMAN_REVIEW',label:'تحتاج مراجعة'};
}

function mapRouterResults(payload){
  return (payload.results||[]).map(x=>{
    const ui=verdictUi(x.verdict);
    const sourceName=x.source?.name || '—';
    const sourceId=x.source?.identifier ? ' — '+x.source.identifier : '';
    return {
      id:x.id || '—',
      claim:x.title || 'نتيجة تأثيل',
      status:ui.status,
      label:ui.label,
      source:sourceName+sourceId,
      location:x.locator || '—',
      evidence:x.evidence || '—',
      note:x.limitations || '—',
      url:x.source?.url || '',
      confidence:typeof x.confidence==='number' ? x.confidence : null,
      verdict:x.verdict,
      match_type:x.match_type
    };
  });
}

function setResultHeading(label,auditId){
  const labelEl=document.querySelector('.results-head .section-label');
  if(labelEl) labelEl.textContent=label;
  document.getElementById('auditId').textContent=auditId || 'TAT-V1-PENDING';
}

function render(items){
  lastItems=items;
  cards.innerHTML=items.map(x=>`
    <article class="claim">
      <div class="claim-head">
        <h4>${escapeHtml(x.id)} — ${escapeHtml(x.claim)}</h4>
        <span class="badge ${badgeClass(x.status)}">${escapeHtml(x.label)}</span>
      </div>
      <dl>
        <dt>الأصل / المصدر</dt><dd>${escapeHtml(x.source)}</dd>
        <dt>الموضع</dt><dd>${escapeHtml(x.location)}</dd>
        <dt>الدليل</dt><dd>${escapeHtml(x.evidence)}</dd>
        <dt>حدود النتيجة</dt><dd>${escapeHtml(x.note)}</dd>
      </dl>
      ${x.url?'<a class="claim-source-link" href="'+escapeHtml(x.url)+'" target="_blank" rel="noopener noreferrer">فتح المصدر والبحث الأصلي ↗</a>':''}
    </article>`
  ).join('');

  const statuses=items.map(x=>x.status);
  document.getElementById('statTotal').textContent=items.length;
  document.getElementById('statSupported').textContent=statuses.filter(x=>x==='SUPPORTED').length;
  document.getElementById('statPartial').textContent=statuses.filter(x=>x==='PARTIAL').length;
  document.getElementById('statUnsupported').textContent=statuses.filter(x=>x==='UNSUPPORTED').length;
  document.getElementById('statReview').textContent=statuses.filter(x=>x==='HUMAN_REVIEW').length;
}

function renderUnavailable(message,auditId='TAT-V1-PENDING'){
  setResultHeading('حالة التأثيل',auditId);
  render([{
    id:'—',
    claim:'لم يصدر تَأْثِيل حكمًا دون دليل كافٍ',
    status:'HUMAN_REVIEW',
    label:'تحتاج مراجعة',
    source:'—',
    location:'—',
    evidence:message,
    note:'عند تعذر المصدر أو نقص الدليل، لا يستبدل تَأْثِيل النتيجة ببيانات تجريبية.'
  }]);
}

function setStep(n,state,text){
  const status=document.getElementById('s'+n);
  const row=status.closest('.process-row');
  row.classList.remove('running','done');
  if(state) row.classList.add(state);
  status.textContent=text;
}

async function callRouter(contentType,query){
  const response=await fetch('https://kywffsqebvjoyuswxtiz.supabase.co/functions/v1/taatheel-router',{
    method:'POST',
    headers:{
      'Content-Type':'application/json',
      'apikey':'sb_publishable_vNFWU3vMDfb04KxO80DHVA_N4I5UPTx'
    },
    body:JSON.stringify({content_type:contentType,query})
  });
  let data=null;
  try{data=await response.json();}catch(e){}
  if(!response.ok || !data || data.ok!==true){
    const err=new Error(data?.message || data?.error || 'router_unavailable');
    err.auditId=data?.audit_id || null;
    throw err;
  }
  return data;
}

function fileToBase64(file){
  return new Promise((resolve,reject)=>{
    const reader=new FileReader();
    reader.onload=()=>resolve(String(reader.result||'').split(',')[1]||'');
    reader.onerror=()=>reject(new Error('file_read_failed'));
    reader.readAsDataURL(file);
  });
}

async function callIngest(file,assetType){
  const base64=await fileToBase64(file);
  const response=await fetch('https://kywffsqebvjoyuswxtiz.supabase.co/functions/v1/taatheel-ingest',{
    method:'POST',
    headers:{'Content-Type':'application/json','apikey':'sb_publishable_vNFWU3vMDfb04KxO80DHVA_N4I5UPTx'},
    body:JSON.stringify({filename:file.name,mime_type:file.type||'application/octet-stream',asset_type:assetType,base64})
  });
  let data=null;
  try{data=await response.json();}catch(e){}
  if(!response.ok || !data || data.ok!==true) throw new Error(data?.message||data?.error||'ingest_unavailable');
  return data;
}

async function run(){
  const textValue=input.value.trim();
  const mediaValue=mediaQueryInput ? mediaQueryInput.value.trim() : '';
  const fileName=fileInput.files.length
    ? fileInput.files[0].name.replace(/\.[^.]+$/,'').replace(/[_-]+/g,' ')
    : '';
  let query=activeType==='text' ? textValue : (mediaValue || fileName);
  const selected=fileInput.files.length ? fileInput.files[0] : null;

  if(!query && !selected){
    (activeType==='text' ? input : mediaQueryInput).focus();
    inputMeta.textContent=activeType==='text' ? 'أدخل نصًا أولًا' : 'أدخل وصفًا أو عنوانًا أو رابطًا، أو اختر ملفًا.';
    return;
  }

  analyzeBtn.disabled=true;
  analyzeBtn.style.opacity='.72';
  results.classList.add('hidden');

  try{
    setStep(1,'running','تصنيف');
    await new Promise(r=>setTimeout(r,120));
    setStep(1,'done','تم');

    setStep(2,'running',selected?'رفع واستخراج':'توجيه');
    if(selected){
      const ingest=await callIngest(selected,activeType);
      const extracted=String(ingest?.extraction?.text||'').trim();
      if(extracted) query=extracted.slice(0,500);
      else query=mediaValue || fileName;
      inputMeta.textContent=ingest?.extraction?.status==='completed' ? 'تم رفع الملف واستخراج محتواه' : 'تم رفع الملف؛ الاستخراج المتخصص قيد الاستكمال';
    }
    const data=await callRouter(activeType,query);
    setStep(2,'done','تم');

    setStep(3,'running','مطابقة');
    const mapped=mapRouterResults(data);
    await new Promise(r=>setTimeout(r,120));
    setStep(3,'done','تم');

    setStep(4,'done','تم');
    lastPayload=data;

    const heading=data.classification?.domain==='islamic_hadith'
      ? 'نتيجة حديثية مباشرة'
      : (mapped.length ? 'نتيجة التأثيل' : 'حالة التأثيل');

    setResultHeading(heading,data.audit_id);

    if(!mapped.length){
      renderUnavailable('لم تعثر الموصلات النشطة على نتيجة كافية لهذا الإدخال.',data.audit_id);
    }else{
      render(mapped);
    }

    results.classList.remove('hidden');
    results.scrollIntoView({behavior:'smooth',block:'start'});
  }catch(err){
    setStep(2,'done','تعذر');
    setStep(3,'done','امتناع');
    setStep(4,'done','لا حكم');
    lastPayload=null;
    renderUnavailable('تعذر إكمال مسار التأثيل عبر Router V1. لم تُعرض بيانات بديلة أو تجريبية.',err.auditId || 'TAT-V1-ERROR');
    results.classList.remove('hidden');
    results.scrollIntoView({behavior:'smooth',block:'start'});
  }finally{
    analyzeBtn.disabled=false;
    analyzeBtn.style.opacity='1';
  }
}

analyzeBtn.addEventListener('click',run);

document.getElementById('downloadJson').addEventListener('click',()=>{
  const payload=lastPayload || {
    schema_version:'taatheel.result.v1',
    audit_id:document.getElementById('auditId').textContent,
    content_type:activeType,
    results:lastItems
  };
  const blob=new Blob([JSON.stringify(payload,null,2)],{type:'application/json'});
  const a=document.createElement('a');
  a.href=URL.createObjectURL(blob);
  a.download='taatheel-v1-audit.json';
  a.click();
  URL.revokeObjectURL(a.href);
});