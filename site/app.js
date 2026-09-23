const $=(s)=>document.querySelector(s);
const textarea=$("#verifyText");
const count=$("#charCount");
const results=$("#resultsSection");
const claimList=$("#claimList");
let latestReport=null;

const esc=(v)=>String(v??"")
  .replaceAll("&","&amp;")
  .replaceAll("<","&lt;")
  .replaceAll(">","&gt;")
  .replaceAll('"',"&quot;")
  .replaceAll("'","&#039;");

const statusLabels={
  supported:"مدعوم",
  partial:"دعم جزئي",
  unsupported:"غير مسند",
  multiple:"متعدد",
  human_review:"مراجعة مختص"
};
const typeLabels={
  quran:"قرآن",
  hadith:"حديث",
  scholarly_quote:"قول/نسبة علمية",
  general:"معلومة عامة"
};
const providerLabels={
  Tanzil:"Tanzil",
  Dorar:"الدرر السنية"
};
const badgeClass=(s)=>s==="supported"?"supported":s==="partial"?"partial":s==="unsupported"?"unsupported":"review";

textarea?.addEventListener("input",()=>{
  if(count) count.textContent=String(textarea.value.length);
});

function renderEvidence(items=[]){
  if(!items.length) return '<div class="evidence-empty">لا يوجد دليل متصل لهذه الحالة حاليًا.</div>';
  return items.map((ev)=>{
    const provider=providerLabels[ev?.metadata?.provider]||ev?.metadata?.provider||"مصدر متصل";
    const score=Number.isFinite(Number(ev.retrieval_score))?Math.round(Number(ev.retrieval_score)*100)+"%":"—";
    return `
      <div class="evidence-card">
        <div class="evidence-top"><b>${esc(provider)}</b><span>${esc(ev.location_text||"")}</span></div>
        <p>${esc(ev.passage||"")}</p>
        <div class="evidence-meta"><span>التشابه: ${esc(score)}</span></div>
      </div>`;
  }).join("");
}

function renderMiniResult(report){
  const claims=report?.claims||[];
  const evidenceCount=claims.reduce((n,c)=>n+(c.evidence?.length||0),0);
  const headline=$("#miniHeadline");
  const subline=$("#miniSubline");
  const status=$("#miniResultStatus");
  const list=$("#miniSourceList");

  if(status) status.textContent="نتيجة موصّلة";
  if(headline) headline.textContent=claims.length?"تم التأصيل بنجاح":"لم تُستخرج معلومات واضحة";
  if(subline) subline.textContent=claims.length
    ? `تم استخراج ${claims.length} معلومة والعثور على ${evidenceCount} دليل/نتيجة مصدر.`
    : "جرّب نصًا يتضمن آية أو حديثًا أو نسبة علمية واضحة.";

  if(list && claims.length){
    list.innerHTML=claims.slice(0,3).map((c,i)=>{
      const ev=(c.evidence||[])[0];
      const provider=providerLabels[ev?.metadata?.provider]||ev?.metadata?.provider||typeLabels[c.type]||"مصدر";
      const location=ev?.location_text||statusLabels[c.status]||"مراجعة";
      return `<div><span class="num">${i+1}</span><p><b>${esc(provider)}</b><small>${esc(location)}</small></p></div>`;
    }).join("");
  }
}

function renderMiniNotice(title,subtitle,state="جاهز"){
  if($("#miniResultStatus")) $("#miniResultStatus").textContent=state;
  if($("#miniHeadline")) $("#miniHeadline").textContent=title;
  if($("#miniSubline")) $("#miniSubline").textContent=subtitle;
}

function renderEngineResults(report){
  latestReport=report;
  const summary=report.summary||{};
  $("#scoreValue").textContent=(summary.evidence_coverage??0)+"%";
  $("#supportedCount").textContent=summary.supported??0;
  $("#partialCount").textContent=summary.partial??0;
  $("#unsupportedCount").textContent=summary.unsupported??0;
  $("#reviewCount").textContent=(summary.human_review??0)+(summary.multiple??0);

  const claims=report.claims||[];
  renderMiniResult(report);

  if(!claims.length){
    claimList.innerHTML='<div class="empty-analysis"><strong>لم يستخرج تَأْثِيل عناصر قابلة للتتبّع من النص الحالي.</strong><p>جرّب نصًا يحتوي على آية أو حديث أو نسبة علمية واضحة.</p></div>';
  }else{
    claimList.innerHTML=claims.map((x)=>`
      <article class="claim-card real-claim">
        <div class="claim-head">
          <div><small class="claim-type">${esc(typeLabels[x.type]||x.type)}</small><h3>${esc(x.ordinal)}. ${esc(x.text)}</h3></div>
          <em class="tag ${badgeClass(x.status)}">${esc(statusLabels[x.status]||x.status)}</em>
        </div>
        <p class="claim-explanation">${esc(x.explanation||"")}</p>
        <div class="evidence-list">${renderEvidence(x.evidence)}</div>
        ${x.requires_human_review?'<div class="human-review-note">هذه الحالة تحتاج مراجعة بشرية قبل اعتمادها.</div>':""}
      </article>`).join("");
  }
  results.classList.remove("hidden");
  setTimeout(()=>results.scrollIntoView({behavior:"smooth",block:"start"}),80);
}

function renderEngineError(message){
  latestReport=null;
  ["scoreValue","supportedCount","partialCount","unsupportedCount","reviewCount"].forEach((id)=>{
    const el=$("#"+id); if(el) el.textContent=id==="scoreValue"?"—":"0";
  });
  renderMiniNotice("يتطلب تشغيل المحرك حسابًا","سجّل الدخول لاستخدام محرك التأصيل الحقيقي وحفظ التقارير.","يتطلب دخول");
  claimList.innerHTML=`
    <div class="engine-error">
      <strong>تعذر تشغيل التأصيل الحقيقي</strong>
      <p>${esc(message)}</p>
      <div class="engine-error-actions">
        <a class="primary-btn" href="./login.html">تسجيل الدخول</a>
        <a class="secondary-btn" href="./signup.html">إنشاء حساب</a>
      </div>
    </div>`;
  results.classList.remove("hidden");
  results.scrollIntoView({behavior:"smooth",block:"start"});
}

async function runVerification(){
  const value=textarea?.value.trim()||"";
  if(!value){
    textarea?.focus();
    if(textarea) textarea.placeholder="أدخل نصًا أولًا ليبدأ تَأْثِيل عملية التتبّع.";
    return;
  }

  const btn=$("#verifyBtn");
  const original=btn?.innerHTML||"تأصيل النص";
  if(btn){btn.disabled=true;btn.innerHTML="جارٍ التأصيل…";}

  try{
    const session=await window.AZWO_DATA?.getSession?.();
    if(!session){
      throw new Error("سجّل الدخول أولًا لتشغيل محرك عَزْو الداخلي في تَأْثِيل. يمكنك استخدام «جرّب مثالًا» لمعاينة شكل النتائج.");
    }
    const report=await window.AZWO_DATA.runEngine({
      text:value,
      domain:$("#domainSelect")?.value||"عام",
      language:$("#langSelect")?.value==="الإنجليزية"?"en":"ar"
    });
    renderEngineResults(report);
  }catch(err){
    renderEngineError(err?.message||"تعذر تشغيل محرك عَزْو الداخلي");
  }finally{
    if(btn){btn.disabled=false;btn.innerHTML=original;}
  }
}

$("#verifyBtn")?.addEventListener("click",runVerification);

const exampleText="قال الله تعالى: «قُلْ هُوَ اللَّهُ أَحَدٌ». وقال رسول الله ﷺ: «إنما الأعمال بالنيات». ويقال إن جميع العلماء اتفقوا على أن كل مسألة خلافية لها قول واحد فقط.";
$("#exampleBtn")?.addEventListener("click",()=>{
  textarea.value=exampleText;
  if(count) count.textContent=String(textarea.value.length);
  textarea.focus();

  const demo={
    summary:{evidence_coverage:67,supported:2,partial:0,unsupported:0,human_review:1,multiple:0},
    claims:[
      {ordinal:1,type:"quran",text:"قُلْ هُوَ اللَّهُ أَحَدٌ",status:"supported",explanation:"تطابق النص مع المرجع القرآني المتصل.",evidence:[{passage:"قُلْ هُوَ ٱللَّهُ أَحَدٌ",location_text:"سورة 112، آية 1",retrieval_score:1,metadata:{provider:"Tanzil"}}]},
      {ordinal:2,type:"hadith",text:"إنما الأعمال بالنيات",status:"supported",explanation:"مثال توضيحي لنتيجة حديثية متصلة بالمصدر.",evidence:[{passage:"إنما الأعمال بالنيات...",location_text:"نتيجة بحث حديثية",retrieval_score:.9,metadata:{provider:"Dorar"}}]},
      {ordinal:3,type:"scholarly_quote",text:"جميع العلماء اتفقوا على أن كل مسألة خلافية لها قول واحد فقط",status:"human_review",explanation:"دعوى اتفاق واسعة تحتاج مصدرًا صريحًا ومراجعة بشرية.",requires_human_review:true,evidence:[]}
    ]
  };
  renderEngineResults(demo);
});

$("#downloadReport")?.addEventListener("click",()=>{
  if(!latestReport)return;
  const blob=new Blob([JSON.stringify(latestReport,null,2)],{type:"application/json"});
  const a=document.createElement("a");
  a.href=URL.createObjectURL(blob);
  a.download=`azwo-report-${latestReport.job_id||Date.now()}.json`;
  a.click();
  URL.revokeObjectURL(a.href);
});

$("#copyReport")?.addEventListener("click",async()=>{
  if(!latestReport)return;
  const text=(latestReport.claims||[]).map(x=>{
    const source=(x.evidence||[])[0];
    return `${x.ordinal}. ${x.text}\nالحالة: ${statusLabels[x.status]||x.status}\nالمصدر: ${providerLabels[source?.metadata?.provider]||source?.metadata?.provider||"—"}\n${source?.location_text||""}`;
  }).join("\n\n");
  await navigator.clipboard?.writeText(text);
  const btn=$("#copyReport");
  if(btn){btn.textContent="تم النسخ";setTimeout(()=>btn.textContent="نسخ التقرير",1500);}
});
