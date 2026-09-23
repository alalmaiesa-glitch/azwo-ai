const input=document.getElementById('contentInput');
const count=document.getElementById('wordCount');
const results=document.getElementById('results');
const cards=document.getElementById('claimCards');
const uploadHint=document.getElementById('uploadHint');
const demoText='تذكر المادة أن صورة أرشيفية نُشرت أول مرة في سجل IMG-FIX-14، وتنسب اقتباسًا إلى المرجع TXT-FIX-07، ثم تقرر أن الرواية نفسها تكررت في جميع المصادر اللاحقة، وتشير أيضًا إلى المرجع ARC-MISSING-09.';

const fixtures=[
 {id:'T1',claim:'نسبة الصورة الأرشيفية إلى السجل IMG-FIX-14',status:'SUPPORTED',label:'مدعوم مباشرة',source:'سجل تجريبي: IMG-FIX-14',evidence:'توجد مطابقة تجريبية بين العنصر والسجل المرجعي.',note:'في النسخة الحقيقية يُحفظ الأصل والموضع والبيانات الوصفية معًا.'},
 {id:'T2',claim:'نسبة الاقتباس إلى المرجع TXT-FIX-07',status:'SUPPORTED',label:'مدعوم مباشرة',source:'سجل تجريبي: TXT-FIX-07',evidence:'الاقتباس مرتبط بمرجع موجود في بيانات العرض.',note:'هذا مثال تقني وليس توثيقًا حقيقيًا لمصدر خارجي.'},
 {id:'T3',claim:'الرواية نفسها تكررت في جميع المصادر اللاحقة',status:'PARTIAL',label:'دعم جزئي',source:'سجل تجريبي: ARC-07',evidence:'تظهر الشواهد في بعض السجلات فقط، ولا تثبت التعميم.',note:'يُظهر تَأْثِيل الفارق بين ما يقوله المحتوى وما يثبته الدليل.'},
 {id:'T4',claim:'اتساق السياق التاريخي لجميع النسخ',status:'HUMAN_REVIEW',label:'تحتاج مراجعة',source:'لا يوجد دليل حاسم في بيانات العرض',evidence:'الحكم يتطلب فحصًا أوسع للسياق والتسلسل الزمني.',note:'عند نقص الدليل لا يحوّل النظام الاحتمال إلى حقيقة.'},
 {id:'T5',claim:'الاستشهاد بالمرجع ARC-MISSING-09',status:'UNSUPPORTED',label:'غير مسند',source:'مرجع غير موجود في بيانات العرض',evidence:'لم يُعثر على سجل مطابق ضمن مجموعة الاختبار.',note:'محرك عَزْو لا ينشئ مرجعًا بديلًا لسد الفجوة.'}
];

function words(){
  const v=input.value.trim();
  count.textContent=v?v.split(/\s+/).length:0;
}
words();
input.addEventListener('input',words);

document.getElementById('fillDemo').onclick=()=>{
  document.querySelector('[data-type="text"]').click();
  input.value=demoText;
  words();
};

document.querySelectorAll('.media-tab').forEach(btn=>{
  btn.addEventListener('click',()=>{
    document.querySelectorAll('.media-tab').forEach(x=>x.classList.remove('active'));
    btn.classList.add('active');
    const isText=btn.dataset.type==='text';
    input.classList.toggle('hidden',!isText);
    uploadHint.classList.toggle('hidden',isText);
    document.getElementById('analyzeBtn').disabled=!isText;
    document.getElementById('analyzeBtn').style.opacity=isText?'1':'.55';
  });
});

const badgeClass=s=>s==='PARTIAL'?'partial':s==='UNSUPPORTED'?'unsupported':s==='HUMAN_REVIEW'?'review':'';

function render(){
  cards.innerHTML=fixtures.map(x=>`<article class="claim">
    <div class="claim-head">
      <h3>${x.id} — ${x.claim}</h3>
      <span class="badge ${badgeClass(x.status)}">${x.label}</span>
    </div>
    <dl>
      <dt>الأصل/المصدر</dt><dd>${x.source}</dd>
      <dt>الدليل</dt><dd>${x.evidence}</dd>
      <dt>حدود النتيجة</dt><dd>${x.note}</dd>
    </dl>
  </article>`).join('');
}

async function run(){
  const steps=[1,2,3,4];
  for(const n of steps){
    const status=document.getElementById('s'+n);
    const el=status.closest('.step');
    el.classList.remove('done');
    el.classList.add('running');
    status.textContent='جارٍ التأثيل';
    await new Promise(r=>setTimeout(r,260));
    el.classList.remove('running');
    el.classList.add('done');
    status.textContent='تم';
  }
  render();
  results.classList.remove('hidden');
  results.scrollIntoView({behavior:'smooth',block:'start'});
}

document.getElementById('analyzeBtn').onclick=run;

document.getElementById('downloadJson').onclick=()=>{
  const payload={
    platform:'تَأْثِيل',
    engine:'عَزْو',
    audit_id:'TAT-DEMO-2026-001',
    mode:'synthetic-fixture-demo',
    warning:'نتيجة تجريبية وليست تحققًا حيًا',
    claims:fixtures
  };
  const blob=new Blob([JSON.stringify(payload,null,2)],{type:'application/json'});
  const a=document.createElement('a');
  a.href=URL.createObjectURL(blob);
  a.download='taatheel-demo-audit.json';
  a.click();
  URL.revokeObjectURL(a.href);
};