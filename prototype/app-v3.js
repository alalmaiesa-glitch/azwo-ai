window.__TAATHEEL_BUILD__='2026.09.23.CONNECTORS1';
const input = document.getElementById('contentInput');
let count = document.getElementById('wordCount');
const results = document.getElementById('results');
const cards = document.getElementById('claimCards');
const uploadArea = document.getElementById('uploadArea');
const fileInput = document.getElementById('fileInput');
const mediaQueryInput = document.getElementById('mediaQueryInput');
const uploadTitle = document.getElementById('uploadTitle');
const uploadMeta = document.getElementById('uploadMeta');
const selectedFile = document.getElementById('selectedFile');
const inputMeta = document.getElementById('inputMeta');
const analyzeBtn = document.getElementById('analyzeBtn');

let activeType = 'text';
let lastItems = [];
let lastMode = 'none';

const typeConfig = {
  text: { label:'النص', accept:'text/plain,.txt,.md,.doc,.docx,.pdf' },
  image: { label:'الصورة', accept:'image/*' },
  audio: { label:'الصوت', accept:'audio/*' },
  video: { label:'الفيديو', accept:'video/*' },
  manuscript: { label:'المخطوط', accept:'image/*,.pdf' },
  document: { label:'الوثيقة', accept:'.pdf,.doc,.docx,.txt,image/*' }
};

const demoText = 'تذكر المادة أن الصورة الأرشيفية نُشرت أول مرة في سجل IMG-FIX-14، وتنسب اقتباسًا إلى المرجع TXT-FIX-07، ثم تقرر أن الرواية نفسها تكررت في جميع المصادر اللاحقة، وتشير أيضًا إلى المرجع ARC-MISSING-09.';

const fixtures = {
  text: [
    {id:'T1',claim:'نسبة الصورة الأرشيفية إلى السجل IMG-FIX-14',status:'SUPPORTED',label:'مدعوم مباشرة',source:'سجل تجريبي: IMG-FIX-14',location:'صفحة مرجعية تجريبية',evidence:'توجد مطابقة تجريبية بين العنصر والسجل المرجعي.',note:'في النسخة الحقيقية يُحفظ الأصل والموضع والبيانات الوصفية معًا.'},
    {id:'T2',claim:'نسبة الاقتباس إلى المرجع TXT-FIX-07',status:'SUPPORTED',label:'مدعوم مباشرة',source:'سجل تجريبي: TXT-FIX-07',location:'فقرة 3',evidence:'الاقتباس مرتبط بمرجع موجود في بيانات العرض.',note:'هذا مثال تقني وليس توثيقًا حقيقيًا لمصدر خارجي.'},
    {id:'T3',claim:'الرواية نفسها تكررت في جميع المصادر اللاحقة',status:'PARTIAL',label:'دعم جزئي',source:'سجل تجريبي: ARC-07',location:'عدة مواضع',evidence:'تظهر الشواهد في بعض السجلات فقط، ولا تثبت التعميم.',note:'يظهر تَأْثِيل الفرق بين صياغة المحتوى وما يثبته الدليل.'},
    {id:'T4',claim:'اتساق السياق التاريخي لجميع النسخ',status:'HUMAN_REVIEW',label:'تحتاج مراجعة',source:'لا يوجد دليل حاسم',location:'—',evidence:'الحكم يتطلب فحصًا أوسع للسياق والتسلسل الزمني.',note:'عند نقص الدليل لا يحوّل النظام الاحتمال إلى حقيقة.'},
    {id:'T5',claim:'الاستشهاد بالمرجع ARC-MISSING-09',status:'UNSUPPORTED',label:'غير مسند',source:'مرجع غير موجود في بيانات العرض',location:'—',evidence:'لم يُعثر على سجل مطابق ضمن مجموعة الاختبار.',note:'لا ينشئ النظام مرجعًا بديلًا لسد الفجوة.'}
  ],
  image: [
    {id:'I1',claim:'العثور على نسخة أقدم بصريًا من الصورة',status:'SUPPORTED',label:'مدعوم مباشرة',source:'أرشيف صور تجريبي IMG-03',location:'نسخة 2019',evidence:'تشابه بصري مرتفع في بيانات العرض.',note:'النتيجة التجريبية لا تمثل بحثًا عكسيًا حيًا.'},
    {id:'I2',claim:'سياق النشر مطابق للوصف الحالي',status:'PARTIAL',label:'دعم جزئي',source:'سجل وصف تجريبي META-02',location:'العنوان الوصفي',evidence:'المكان متطابق بينما التاريخ غير محسوم.',note:'اختلاف عنصر واحد يمنع توصيف النتيجة كدعم كامل.'},
    {id:'I3',claim:'تحديد المصور الأصلي',status:'HUMAN_REVIEW',label:'تحتاج مراجعة',source:'عدة نسب متعارضة',location:'—',evidence:'لا يوجد اسم واحد حاسم ضمن السجلات التجريبية.',note:'تظهر المنصة التعارض بدل اختيار نسبة غير مؤكدة.'}
  ],
  audio: [
    {id:'A1',claim:'مطابقة المقطع مع تسجيل مرجعي أقدم',status:'SUPPORTED',label:'مدعوم مباشرة',source:'AUDIO-FIX-11',location:'01:12–01:29',evidence:'مطابقة بصمة تجريبية.',note:'العرض الحالي لا ينفذ بصمة صوتية فعلية.'},
    {id:'A2',claim:'نسبة المتحدث',status:'HUMAN_REVIEW',label:'تحتاج مراجعة',source:'بيانات وصف غير كافية',location:'—',evidence:'السجلات المتاحة لا تكفي لإثبات الهوية.',note:'لا تُستنتج الهوية من الصوت وحده في هذه التجربة.'}
  ],
  video: [
    {id:'V1',claim:'العثور على نسخة أقدم من اللقطة',status:'SUPPORTED',label:'مدعوم مباشرة',source:'VIDEO-FIX-04',location:'00:18–00:31',evidence:'المشهد موجود في سجل تجريبي أقدم.',note:'عرض واجهة فقط.'},
    {id:'V2',claim:'الوصف الحالي يطابق سياق الحدث',status:'PARTIAL',label:'دعم جزئي',source:'ARCHIVE-FIX-22',location:'وصف الأرشيف',evidence:'الحدث متطابق لكن زمن التصوير مختلف.',note:'السياق لا يُختزل في تشابه المشهد.'}
  ],
  manuscript: [
    {id:'M1',claim:'ربط الصفحة بفهرس نسخة محفوظة',status:'SUPPORTED',label:'مدعوم مباشرة',source:'MS-FIX-02',location:'ورقة 17ب',evidence:'رقم الورقة والعنوان متطابقان في العرض.',note:'بيانات تجريبية فقط.'},
    {id:'M2',claim:'إثبات تاريخ النسخ',status:'HUMAN_REVIEW',label:'تحتاج مراجعة',source:'وصف فهرسي غير حاسم',location:'—',evidence:'التاريخ تقريبي ولا يوجد نص صريح كافٍ.',note:'يُحال الحكم للمختص عند ضعف البيانات.'}
  ],
  document: [
    {id:'D1',claim:'العثور على إصدار أقدم من الوثيقة',status:'SUPPORTED',label:'مدعوم مباشرة',source:'DOC-FIX-08',location:'الإصدار 1.2',evidence:'تطابق تجريبي في العنوان والبنية.',note:'لا يوجد مستودع وثائق حي في هذه النسخة.'},
    {id:'D2',claim:'الفقرة الحالية موجودة حرفيًا في الإصدار السابق',status:'UNSUPPORTED',label:'غير مسند',source:'لم توجد مطابقة كاملة',location:'—',evidence:'توجد صياغة قريبة فقط.',note:'التشابه لا يُعامل كمطابقة حرفية.'}
  ]
};

function syncWordCount(){
  count = document.getElementById('wordCount');
  if(!count) return;
  const v = input.value.trim();
  count.textContent = v ? v.split(/\s+/).length : 0;
}
syncWordCount();
input.addEventListener('input', syncWordCount);

function setActiveType(type){
  activeType = type;
  document.querySelectorAll('.media-tab').forEach(btn => btn.classList.toggle('active', btn.dataset.type === type));

  const isText = type === 'text';
  input.classList.toggle('hidden', !isText);
  uploadArea.classList.toggle('hidden', isText);
  mediaQueryInput.classList.toggle('hidden', isText);
  selectedFile.textContent = '';
  fileInput.value = '';

  if(isText){
    inputMeta.innerHTML = '<b id="wordCount">0</b> كلمة';
    syncWordCount();
  } else {
    const cfg = typeConfig[type];
    fileInput.accept = cfg.accept;
    uploadTitle.textContent = 'اختر ' + cfg.label;
    uploadMeta.textContent = 'يمكن اختيار ملف، والبحث الحالي يعتمد على الوصف أو اسم الملف حتى تتفعّل المطابقة بالبصمة.';
    mediaQueryInput.placeholder = type==='manuscript' ? 'اكتب عنوان المخطوط أو الصق رابط IIIF Manifest…' : 'اكتب عنوانًا أو وصفًا أو رابطًا يساعد في العثور على الأصل…';
    inputMeta.textContent = 'يمكن البحث بالوصف دون اختيار ملف';
  }
  results.classList.add('hidden');
}

document.querySelectorAll('.media-tab').forEach(btn => {
  btn.addEventListener('click', () => setActiveType(btn.dataset.type));
});

fileInput.addEventListener('change', () => {
  if(!fileInput.files.length) return;
  const file = fileInput.files[0];
  selectedFile.textContent = file.name;
  if(!mediaQueryInput.value.trim()) mediaQueryInput.value = file.name.replace(/\.[^.]+$/,'').replace(/[_-]+/g,' ');
  inputMeta.textContent = 'سيُستخدم اسم الملف للبحث الوصفي ما لم تعدّل الوصف';
});

document.getElementById('fillDemo').addEventListener('click', () => {
  setActiveType('text');
  input.value = demoText;
  syncWordCount();
  input.focus();
  const end = input.value.length;
  input.setSelectionRange(end, end);
});

function badgeClass(status){
  if(status === 'PARTIAL') return 'partial';
  if(status === 'UNSUPPORTED') return 'unsupported';
  if(status === 'HUMAN_REVIEW') return 'review';
  return '';
}

function escapeHtml(value=''){
  return String(value)
    .replace(/&/g,'&amp;')
    .replace(/</g,'&lt;')
    .replace(/>/g,'&gt;')
    .replace(/"/g,'&quot;')
    .replace(/'/g,'&#039;');
}

function normalizeArabic(value=''){
  return String(value)
    .replace(/[\u064B-\u065F\u0670]/g,'')
    .replace(/ـ/g,'')
    .replace(/[إأآٱ]/g,'ا')
    .replace(/ى/g,'ي')
    .replace(/ؤ/g,'و')
    .replace(/ئ/g,'ي')
    .replace(/\s+/g,' ')
    .trim();
}

function isLikelyHadith(value=''){
  const raw=String(value);
  const n=normalizeArabic(raw);
  return /(ﷺ|صلى الله عليه وسلم|رسول الله|النبي|حديث)/.test(raw)
    || /لا تزال طائفه من امتي/.test(n)
    || /قال رسول الله/.test(n);
}

function prepareHadithQuery(value=''){
  let q=String(value)
    .replace(/صلى الله عليه وسلم/g,' ')
    .replace(/ﷺ/g,' ')
    .replace(/النبي\s*[،,:؛-]*\s*(?:يقول|قال)?/g,' ')
    .replace(/رسول الله\s*[،,:؛-]*\s*(?:يقول|قال)?/g,' ')
    .replace(/^\s*حديث\s*[،,:؛-]*/,' ')
    .replace(/[“”"«»]/g,' ')
    .replace(/\s+/g,' ')
    .trim();
  return q.slice(0,260);
}

function htmlToPlainText(html=''){
  const box=document.createElement('div');
  box.innerHTML=String(html);
  return (box.textContent || box.innerText || '').replace(/\s+/g,' ').trim();
}

function extractDorarField(text,label){
  const labels='الراوي|المحدث|المصدر|الصفحة أو الرقم|خلاصة حكم المحدث|التخريج';
  const re=new RegExp(label+'\\s*:\\s*(.*?)(?=\\s*(?:'+labels+')\\s*:|$)');
  const m=String(text).match(re);
  return m ? m[1].trim().replace(/^\|\s*|\s*\|$/g,'').trim() : '';
}

function classifyGrade(grade=''){
  const g=normalizeArabic(grade);
  if(/موضوع|باطل|مكذوب|لا يصح|لا يثبت|متروك/.test(g)) return 'UNSUPPORTED';
  if(/ضعيف|منكر|منقطع|مرسل/.test(g)) return 'HUMAN_REVIEW';
  if(/صحيح|حسن|ثابت|اسناده جيد|رجاله ثقات/.test(g)) return 'SUPPORTED';
  return 'PARTIAL';
}

function parseDorarResult(item,index,query){
  const text=htmlToPlainText(item && item.th ? item.th : '');
  const beforeRawi=text.split(/الراوي\s*:/)[0] || '';
  const hadith=beforeRawi.replace(/^\s*\d+\s*[-–—]\s*/,'').trim();
  const rawi=extractDorarField(text,'الراوي');
  const mohdith=extractDorarField(text,'المحدث');
  const book=extractDorarField(text,'المصدر');
  const page=extractDorarField(text,'الصفحة أو الرقم');
  const grade=extractDorarField(text,'خلاصة حكم المحدث');
  const source=[book,page].filter(Boolean).join(' — ') || 'الموسوعة الحديثية في الدرر السنية';
  const status=classifyGrade(grade);
  const label=grade || 'نتيجة من الموسوعة الحديثية';
  return {
    id:'H'+(index+1),
    claim:hadith || query,
    status,
    label,
    source,
    location:rawi ? 'الراوي: '+rawi : '—',
    evidence:mohdith ? 'حكم المحدث: '+mohdith : 'نتيجة مسترجعة مباشرة من الموسوعة الحديثية.',
    note:grade ? 'خلاصة الحكم: '+grade : 'راجع المصدر الأصلي قبل اعتماد النتيجة النهائية.',
    url:'https://dorar.net/hadith/search?q='+encodeURIComponent(query)+'&st=w'
  };
}

async function searchDorarLive(query){
  const endpoint='https://kywffsqebvjoyuswxtiz.supabase.co/functions/v1/hadith-search';
  const response=await fetch(endpoint,{
    method:'POST',
    headers:{
      'Content-Type':'application/json',
      'apikey':'sb_publishable_vNFWU3vMDfb04KxO80DHVA_N4I5UPTx'
    },
    body:JSON.stringify({q:query})
  });

  let data=null;
  try{ data=await response.json(); }catch(e){}

  if(!response.ok || !data || data.ok!==true){
    const reason=data && data.error ? data.error : 'proxy_unavailable';
    throw new Error(reason);
  }
  return data;
}

async function searchProvenanceLive(type,query){
  const endpoint='https://kywffsqebvjoyuswxtiz.supabase.co/functions/v1/provenance-search';
  const response=await fetch(endpoint,{
    method:'POST',
    headers:{
      'Content-Type':'application/json',
      'apikey':'sb_publishable_vNFWU3vMDfb04KxO80DHVA_N4I5UPTx'
    },
    body:JSON.stringify({type,query})
  });
  let data=null;
  try{ data=await response.json(); }catch(e){}
  if(!response.ok || !data || data.ok!==true){
    const reason=data && data.error ? data.error : 'provenance_proxy_unavailable';
    throw new Error(reason);
  }
  return data;
}

function generalQuery(value=''){
  return String(value).replace(/\s+/g,' ').trim().slice(0,420);
}

function mapProvenanceItems(items,type){
  const prefix={text:'T',image:'I',audio:'A',video:'V',manuscript:'M',document:'D'}[type] || 'R';
  return (items || []).map((x,index)=>{
    const isIiif=x.kind==='iiif-manifest';
    const location=[x.creator,x.date,x.kind].filter(Boolean).join(' · ') || '—';
    const id=x.identifier ? String(x.identifier) : '';
    return {
      id:prefix+(index+1),
      claim:x.title || 'مصدر محتمل',
      status:isIiif ? 'SUPPORTED' : 'PARTIAL',
      label:isIiif ? 'بيانات أصل مباشرة' : 'مصدر محتمل · '+(x.source || 'مستودع'),
      source:[x.source,id].filter(Boolean).join(' — '),
      location,
      evidence:x.evidence || 'تم العثور على سجل وصفي ذي صلة.',
      note:x.note || 'هذه مطابقة وصفية وتحتاج مراجعة المصدر الأصلي قبل اعتماد النسبة.',
      url:x.url || ''
    };
  });
}

function setResultHeading(label,idPrefix='TAT'){
  const labelEl=document.querySelector('.results-head .section-label');
  if(labelEl) labelEl.textContent=label;
  document.getElementById('auditId').textContent=idPrefix+'-'+new Date().getFullYear()+'-'+String(Math.floor(1000+Math.random()*8999));
}

function render(items){
  lastItems=items;
  cards.innerHTML = items.map(x => `
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
      ${x.url ? '<a class="claim-source-link" href="'+escapeHtml(x.url)+'" target="_blank" rel="noopener noreferrer">فتح المصدر والبحث الأصلي ↗</a>' : ''}
    </article>`
  ).join('');

  const statuses = items.map(x=>x.status);
  document.getElementById('statTotal').textContent = items.length;
  document.getElementById('statSupported').textContent = statuses.filter(x=>x==='SUPPORTED').length;
  document.getElementById('statPartial').textContent = statuses.filter(x=>x==='PARTIAL').length;
  document.getElementById('statUnsupported').textContent = statuses.filter(x=>x==='UNSUPPORTED').length;
  document.getElementById('statReview').textContent = statuses.filter(x=>x==='HUMAN_REVIEW').length;
}

function renderUnavailable(message){
  lastMode='unavailable';
  setResultHeading('حالة التأثيل','TAT-PENDING');
  render([{
    id:'—',
    claim:'لم نعرض نتيجة تجريبية على أنها فحص حقيقي',
    status:'HUMAN_REVIEW',
    label:'المصدر الحي غير متصل',
    source:'—',
    location:'—',
    evidence:message,
    note:'سيبقى تَأْثِيل ممتنعًا عن إصدار حكم حتى يتصل بمصدر مناسب لهذا النوع من المحتوى.'
  }]);
}

function setStep(n,state,text){
  const status=document.getElementById('s'+n);
  const row=status.closest('.process-row');
  row.classList.remove('running','done');
  if(state) row.classList.add(state);
  status.textContent=text;
}

async function run(){
  const textValue=input.value.trim();
  const mediaValue=mediaQueryInput ? mediaQueryInput.value.trim() : '';
  const fileName=fileInput.files.length ? fileInput.files[0].name.replace(/\.[^.]+$/,'').replace(/[_-]+/g,' ') : '';

  if(activeType==='text' && !textValue){
    input.focus();
    return;
  }

  if(activeType!=='text' && !mediaValue && !fileName){
    mediaQueryInput.focus();
    mediaQueryInput.animate(
      [{transform:'translateX(0)'},{transform:'translateX(-5px)'},{transform:'translateX(5px)'},{transform:'translateX(0)'}],
      {duration:260}
    );
    inputMeta.textContent='أدخل وصفًا أو عنوانًا أو رابطًا، أو اختر ملفًا لاستخدام اسمه.';
    return;
  }

  analyzeBtn.disabled=true;
  analyzeBtn.style.opacity='.72';
  results.classList.add('hidden');

  try{
    setStep(1,'running','جارٍ');
    await new Promise(r=>setTimeout(r,160));
    setStep(1,'done','تم');

    if(activeType==='text' && textValue===demoText.trim()){
      lastMode='fixture-demo';
      for(let n=2;n<=4;n++){
        setStep(n,'running','جارٍ');
        await new Promise(r=>setTimeout(r,160));
        setStep(n,'done','تم');
      }
      setResultHeading('نتيجة تجريبية','TAT-DEMO');
      render(fixtures.text);
    } else if(activeType==='text' && isLikelyHadith(textValue)){
      const query=prepareHadithQuery(textValue);
      setStep(2,'running','الدرر');
      const data=await searchDorarLive(query);
      setStep(2,'done','تم');

      const raw=(data && Array.isArray(data.ahadith)) ? data.ahadith : [];
      if(!raw.length){
        setStep(3,'done','لا نتائج');
        setStep(4,'done','امتناع');
        renderUnavailable('لم تُرجع الموسوعة الحديثية نتيجة لهذا النص بصيغته الحالية. جرّب جزءًا مميزًا من متن الحديث أو صياغة أقصر.');
      }else{
        setStep(3,'running','مطابقة');
        await new Promise(r=>setTimeout(r,160));
        const liveItems=raw.slice(0,8).map((item,i)=>parseDorarResult(item,i,query));
        setStep(3,'done','تم');
        setStep(4,'done','تم');
        lastMode='dorar-live';
        setResultHeading('نتيجة حديثية مباشرة','TAT-HADITH');
        render(liveItems);
      }
    } else {
      const query=activeType==='text' ? generalQuery(textValue) : generalQuery(mediaValue || fileName);
      setStep(2,'running','المستودعات');
      const data=await searchProvenanceLive(activeType,query);
      setStep(2,'done','تم');

      const mapped=mapProvenanceItems(data.items,activeType);
      if(!mapped.length){
        setStep(3,'done','لا نتائج');
        setStep(4,'done','امتناع');
        renderUnavailable('لم تعثر الموصلات النشطة على سجل ذي صلة بالوصف الحالي. غيّر كلمات البحث أو استخدم رابط مصدر مباشر.');
      }else{
        setStep(3,'running','ربط');
        await new Promise(r=>setTimeout(r,160));
        setStep(3,'done','تم');
        setStep(4,'done','تم');
        lastMode='provenance-live:'+activeType;
        setResultHeading(activeType==='text' ? 'مصادر معرفية مرشحة' : 'مصادر ونسخ مرشحة','TAT-'+activeType.toUpperCase());
        render(mapped);
      }
    }

    results.classList.remove('hidden');
    results.scrollIntoView({behavior:'smooth',block:'start'});
  }catch(err){
    setStep(2,'done','تعذر');
    setStep(3,'done','امتناع');
    setStep(4,'done','لا حكم');
    renderUnavailable('تعذر الاتصال بأحد المصادر الحية الآن. لم تُستبدل النتيجة ببيانات تجريبية.');
    results.classList.remove('hidden');
    results.scrollIntoView({behavior:'smooth',block:'start'});
  }finally{
    analyzeBtn.disabled=false;
    analyzeBtn.style.opacity='1';
  }
}

analyzeBtn.addEventListener('click', run);

document.getElementById('downloadJson').addEventListener('click', () => {
  const payload = {
    platform:'تَأْثِيل',
    content_type:activeType,
    audit_id:document.getElementById('auditId').textContent,
    mode:lastMode,
    items:lastItems
  };
  const blob = new Blob([JSON.stringify(payload,null,2)],{type:'application/json'});
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'taatheel-audit.json';
  a.click();
  URL.revokeObjectURL(a.href);
});