const qs=(s)=>document.querySelector(s);
const qsa=(s)=>[...document.querySelectorAll(s)];

const textarea=qs("#verifyText");
const count=qs("#charCount");
const results=qs("#resultsSection");
const claimList=qs("#claimList");
const tabs=qsa(".tab");
const panels=qsa(".mode-panel");
let mode="text";

const exampleText="قال الله تعالى: «قُلْ هُوَ اللَّهُ أَحَدٌ». وقال رسول الله ﷺ: «إنما الأعمال بالنيات». ويقال إن جميع العلماء اتفقوا على أن كل مسألة خلافية لها قول واحد فقط.";

tabs.forEach(tab=>tab.addEventListener("click",()=>{
  tabs.forEach(t=>t.classList.remove("active"));
  tab.classList.add("active");
  mode=tab.dataset.mode;
  panels.forEach(p=>p.classList.toggle("active",p.dataset.panel===mode));
}));

textarea?.addEventListener("input",()=>count.textContent=String(textarea.value.length));

qs("#exampleBtn")?.addEventListener("click",()=>{
  mode="text";
  tabs.forEach(t=>t.classList.toggle("active",t.dataset.mode==="text"));
  panels.forEach(p=>p.classList.toggle("active",p.dataset.panel==="text"));
  textarea.value=exampleText;
  count.textContent=String(textarea.value.length);
  textarea.focus();
});

const demo=[
  {type:"قرآن",text:"قُلْ هُوَ اللَّهُ أَحَدٌ",status:"supported",label:"مدعوم",reason:"تطابق النص مع المرجع القرآني.",source:"Tanzil Project",location:"سورة 112، آية 1",evidence:"قُلْ هُوَ ٱللَّهُ أَحَدٌ"},
  {type:"حديث",text:"إنما الأعمال بالنيات",status:"supported",label:"مدعوم",reason:"ظهرت نتيجة حديثية متقاربة نصيًا في المصدر.",source:"الدرر السنية",location:"نتيجة بحث حديثية",evidence:"إنما الأعمال بالنيات..."},
  {type:"قول/نسبة علمية",text:"جميع العلماء اتفقوا على أن كل مسألة خلافية لها قول واحد فقط",status:"review",label:"مراجعة مختص",reason:"دعوى اتفاق واسعة لا ينبغي حسمها دون مصدر صريح ومراجعة بشرية.",source:"—",location:"—",evidence:"لم يُعتمد مصدر حاسم في المعاينة."}
];

function badge(s){
  return s==="supported"?"supported":s==="partial"?"partial":s==="unsupported"?"unsupported":"review";
}

function render(){
  qs("#scoreValue").textContent="67%";
  qs("#supportedCount").textContent="2";
  qs("#partialCount").textContent="0";
  qs("#unsupportedCount").textContent="0";
  qs("#reviewCount").textContent="1";

  claimList.innerHTML=demo.map((x,i)=>`
    <article class="claim-card real-claim">
      <div class="claim-head">
        <div><small class="claim-type">${x.type}</small><h3>${i+1}. ${x.text}</h3></div>
        <em class="tag ${badge(x.status)}">${x.label}</em>
      </div>
      <p class="claim-explanation">${x.reason}</p>
      <div class="evidence-list">
        <div class="evidence-card">
          <div class="evidence-top"><b>${x.source}</b><span>${x.location}</span></div>
          <p>${x.evidence}</p>
        </div>
      </div>
      ${x.status==="review"?'<div class="human-review-note">هذه الحالة تحتاج مراجعة بشرية قبل الاعتماد.</div>':""}
    </article>`).join("");

  results.classList.remove("hidden");
  results.scrollIntoView({behavior:"smooth",block:"start"});
}

qs("#verifyBtn")?.addEventListener("click",()=>{
  if(mode!=="text"){
    alert("هذه الخاصية ستتوفر في النسخة التشغيلية.");
    return;
  }
  if(!textarea.value.trim()) textarea.value=exampleText;
  count.textContent=String(textarea.value.length);
  render();
});

qs("#copyReport")?.addEventListener("click",()=>navigator.clipboard?.writeText("عَزْو — تقرير معاينة توضيحي"));

qs("#downloadReport")?.addEventListener("click",()=>{
  const blob=new Blob([JSON.stringify({preview:true,claims:demo},null,2)],{type:"application/json"});
  const a=document.createElement("a");
  a.href=URL.createObjectURL(blob);
  a.download="azwo-preview.json";
  a.click();
  URL.revokeObjectURL(a.href);
});
