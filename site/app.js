const $=(s)=>document.querySelector(s), $$=(s)=>[...document.querySelectorAll(s)];
const textarea=$("#verifyText"), count=$("#charCount"), results=$("#resultsSection"), claimList=$("#claimList");
const tabs=$$(".tab"), panels=$$(".mode-panel"), menuBtn=$("#menuBtn"), sidebar=$("#sidebar");
let mode="text";

tabs.forEach(tab=>tab.addEventListener("click",()=>{
  tabs.forEach(t=>t.classList.remove("active"));tab.classList.add("active");mode=tab.dataset.mode;
  panels.forEach(p=>p.classList.toggle("active",p.dataset.panel===mode));
}));

textarea.addEventListener("input",()=>count.textContent=textarea.value.length);
menuBtn?.addEventListener("click",()=>sidebar.classList.toggle("open"));

const fixtures=[
 {title:"اقتباس قرآني",status:"supported",label:"مدعوم",source:"القرآن الكريم — مرجع تجريبي",evidence:"تم العثور على نص مطابق ضمن المصدر المرجعي التجريبي.",note:"في النسخة التشغيلية تتم المطابقة مع مصدر قرآني معتمد."},
 {title:"نسبة معلومة إلى مصدر",status:"supported",label:"مدعوم",source:"المكتبة المعرفية — مصدر تجريبي",evidence:"المصدر يدعم أصل المعلومة بوضوح.",note:"يعرض عَزْو موضع الدليل مع بيانات المصدر."},
 {title:"تعميم يتجاوز الدليل",status:"partial",label:"دعم جزئي",source:"المكتبة المعرفية — مصدر تجريبي",evidence:"الدليل يؤيد جزءًا من العبارة لكنه لا يثبت التعميم.",note:"يفضل تعديل الصياغة أو إرفاق مصدر أقوى."},
 {title:"عبارة تحتاج مراجعة علمية",status:"review",label:"مراجعة مختص",source:"لا يوجد مصدر حاسم في العرض التجريبي",evidence:"المسألة مركبة ولا يكفي الاسترجاع الآلي لإصدار حكم.",note:"عَزْو يحيل هذه الحالة للمراجع البشري بدل الجزم."}
];

function renderClaims(){
 claimList.innerHTML=fixtures.map((x,i)=>`
 <article class="claim-card">
   <div class="claim-head"><h3>${i+1}. ${x.title}</h3><em class="tag ${x.status}">${x.label}</em></div>
   <dl class="claim-meta"><dt>المصدر</dt><dd>${x.source}</dd><dt>الدليل</dt><dd>${x.evidence}</dd><dt>ملاحظة</dt><dd>${x.note}</dd></dl>
 </article>`).join("");
 $("#supportedCount").textContent=fixtures.filter(x=>x.status==="supported").length;
 $("#partialCount").textContent=fixtures.filter(x=>x.status==="partial").length;
 $("#reviewCount").textContent=fixtures.filter(x=>x.status==="review").length;
}

$("#verifyBtn").addEventListener("click",async()=>{
  const value=mode==="text"?textarea.value.trim():"uploaded";
  if(!value){textarea.focus();textarea.placeholder="أدخل نصًا أولًا ليبدأ عَزْو عملية التأصيل.";return}
  try{\n    await window.AZWO_DATA?.createVerification?.({input_type:mode,input_text:mode==="text"?textarea.value:null,input_url:mode==="link"?$("#linkInput")?.value:null,domain:$("#domainSelect")?.value||"عام",language:$("#langSelect")?.value||"العربية"});\n  }catch(err){console.warn("AZWO data layer:",err)}\n  renderClaims();results.classList.remove("hidden");setTimeout(()=>results.scrollIntoView({behavior:"smooth",block:"start"}),70);
});

$("#downloadReport").addEventListener("click",()=>{
  const payload={product:"AZWO",tagline:"تأصيل المعرفة",mode:"demo",generated_at:new Date().toISOString(),claims:fixtures};
  const blob=new Blob([JSON.stringify(payload,null,2)],{type:"application/json"});
  const a=document.createElement("a");a.href=URL.createObjectURL(blob);a.download="azwo-demo-report.json";a.click();URL.revokeObjectURL(a.href);
});
$("#copyReport").addEventListener("click",async()=>{
  const text=fixtures.map(x=>`${x.title}: ${x.label} — ${x.source}`).join("\n");
  await navigator.clipboard?.writeText(text);$("#copyReport").textContent="تم النسخ";setTimeout(()=>$("#copyReport").textContent="نسخ التقرير",1500);
});


async function refreshRecentHistory(){
  const host=document.querySelector(".recent-panel");
  if(!host||!window.AZWO_DATA)return;
  try{
    const rows=await window.AZWO_DATA.listRecent();
    if(!rows?.length)return;
    const existing=[...host.querySelectorAll(".history-row")];
    existing.forEach(el=>el.remove());
    rows.slice(0,3).forEach(row=>{
      const div=document.createElement("div");
      div.className="history-row";
      const when=new Date(row.created_at||Date.now()).toLocaleString("ar-SA",{dateStyle:"short",timeStyle:"short"});
      div.innerHTML=`<span class="status ok"></span><div><strong>${row.input_type==="text"?"تحقق من نص":"عملية تحقق"}</strong><small>${when}</small></div><em class="tag supported">محفوظ</em>`;
      host.appendChild(div);
    });
  }catch(err){console.warn(err)}
}
refreshRecentHistory();
