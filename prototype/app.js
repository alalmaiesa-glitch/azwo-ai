const input=document.getElementById('contentInput');
const count=document.getElementById('wordCount');
const results=document.getElementById('results');
const cards=document.getElementById('claimCards');
const demoText='ورد في المادة: «قُلْ هُوَ اللَّهُ أَحَدٌ». كما نُسب حديث إلى المرجع التجريبي HD-FIX-03. ويقرر النص أن هذا الحكم ينطبق على جميع الصور بلا استثناء، وأن جميع العلماء اتفقوا عليه، ويستشهد أيضًا بالمرجع HD-MISSING-09.';
const fixtures=[
 {id:'C1',claim:'«قُلْ هُوَ اللَّهُ أَحَدٌ»',status:'SUPPORTED',label:'مدعوم مباشرة',source:'Fixture: quran:112:1',evidence:'مطابقة تجريبية مع مرجع fixture للآية.',note:'في النسخة الحقيقية ستكون المطابقة حتمية مع مصدر قرآني معتمد.'},
 {id:'C2',claim:'نسبة حديث إلى HD-FIX-03',status:'SUPPORTED',label:'مدعوم مباشرة',source:'Fixture: HD-FIX-03',evidence:'مرجع تجريبي موجود في بيانات العرض.',note:'ليس حديثًا حقيقيًا ولا حكمًا على حديث.'},
 {id:'C3',claim:'الحكم ينطبق على جميع الصور بلا استثناء',status:'PARTIAL',label:'مدعوم جزئيًا',source:'Fixture: KNOW-07',evidence:'النص التجريبي يؤيد أصل الفكرة ولا يثبت التعميم.',note:'مثال على تجاوز صياغة الادعاء لما يسنده الدليل.'},
 {id:'C4',claim:'جميع العلماء اتفقوا عليه',status:'HUMAN_REVIEW',label:'مراجعة مختص',source:'لا يوجد مصدر حاسم في fixtures',evidence:'دعوى إجماع واسعة تتطلب مرجعًا صريحًا ومراجعة بشرية.',note:'النظام لا يحول عدم العثور إلى حكم شرعي.'},
 {id:'C5',claim:'الاستشهاد بالمرجع HD-MISSING-09',status:'UNSUPPORTED',label:'غير مسند',source:'Fixture: missing reference',evidence:'المرجع غير موجود ضمن مجموعة العرض.',note:'لا يتم اختراع مرجع بديل.'}
];
function words(){const v=input.value.trim();count.textContent=v?v.split(/\s+/).length:0}words();input.addEventListener('input',words);
document.getElementById('fillDemo').onclick=()=>{input.value=demoText;words()};
const badgeClass=s=>s==='PARTIAL'?'partial':s==='UNSUPPORTED'?'unsupported':s==='HUMAN_REVIEW'?'review':'';
function render(){cards.innerHTML=fixtures.map(x=>`<article class="claim"><div class="claim-head"><h3>${x.id} — ${x.claim}</h3><span class="badge ${badgeClass(x.status)}">${x.label}</span></div><dl><dt>المصدر</dt><dd>${x.source}</dd><dt>الدليل</dt><dd>${x.evidence}</dd><dt>ملاحظة</dt><dd>${x.note}</dd></dl></article>`).join('')}
async function run(){const steps=[1,2,3,4];for(const n of steps){const el=document.getElementById('s'+n).closest('.step');el.classList.add('running');document.getElementById('s'+n).textContent='جارٍ العرض';await new Promise(r=>setTimeout(r,250));el.classList.remove('running');el.classList.add('done');document.getElementById('s'+n).textContent='تم'}render();results.classList.remove('hidden');results.scrollIntoView({behavior:'smooth',block:'start'})}
document.getElementById('analyzeBtn').onclick=run;
document.getElementById('downloadJson').onclick=()=>{const payload={audit_id:'AZW-DEMO-2026-001',mode:'synthetic-fixture-demo',warning:'Not real verification',claims:fixtures};const blob=new Blob([JSON.stringify(payload,null,2)],{type:'application/json'});const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download='azwo-demo-audit.json';a.click();URL.revokeObjectURL(a.href)};