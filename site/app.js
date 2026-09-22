const $=(s)=>document.querySelector(s), $$=(s)=>[...document.querySelectorAll(s)];
const textarea=$("#verifyText"), count=$("#charCount"), results=$("#resultsSection"), claimList=$("#claimList");
const tabs=$$(".tab"), panels=$$(".mode-panel"), menuBtn=$("#menuBtn"), sidebar=$("#sidebar");
let mode="text";
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
  Tanzil:"Tanzil Project",
  Dorar:"الدرر السنية"
};
const badgeClass=(s)=>s==="supported"?"supported":s==="partial"?"partial":s==="unsupported"?"unsupported":"review";

tabs.forEach(tab=>tab.addEventListener("click",()=>{
  tabs.forEach(t=>t.classList.remove("active"));
  tab.classList.add("active");
  mode=tab.dataset.mode;
  panels.forEach(p=>p.classList.toggle("active",p.dataset.panel===mode));
}));

textarea.addEventListener("input",()=>count.textContent=textarea.value.length);
menuBtn?.addEventListener("click",()=>sidebar.classList.toggle("open"));

function renderEvidence(items=[]){
  if(!items.length) return '<div class="evidence-empty">لا يوجد دليل متصل لهذه الحالة حاليًا.</div>';
  return items.map((ev)=>{
    const provider=providerLabels[ev?.metadata?.provider]||ev?.metadata?.provider||"مصدر متصل";
    const score=Number.isFinite(Number(ev.retrieval_score))
      ? Math.round(Number(ev.retrieval_score)*100)+"%"
      : "—";
    return `
      <div class="evidence-card">
        <div class="evidence-top">
          <b>${esc(provider)}</b>
          <span>${esc(ev.location_text||"")}</span>
        </div>
        <p>${esc(ev.passage||"")}</p>
        <div class="evidence-meta">
          <span>العلاقة: ${esc(ev.relation||"—")}</span>
          <span>التشابه: ${esc(score)}</span>
        </div>
      </div>`;
  }).join("");
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
  if(!claims.length){
    claimList.innerHTML='<div class="empty-analysis"><strong>لم يستخرج عَزْو معلومات قابلة للتأصيل من النص الحالي.</strong><p>جرّب نصًا يحتوي على آية أو حديث أو نسبة علمية أو معلومة تقريرية واضحة.</p></div>';
  }else{
    claimList.innerHTML=claims.map((x)=>`
      <article class="claim-card real-claim">
        <div class="claim-head">
          <div>
            <small class="claim-type">${esc(typeLabels[x.type]||x.type)}</small>
            <h3>${esc(x.ordinal)}. ${esc(x.text)}</h3>
          </div>
          <em class="tag ${badgeClass(x.status)}">${esc(statusLabels[x.status]||x.status)}</em>
        </div>
        <p class="claim-explanation">${esc(x.explanation||"")}</p>
        <div class="evidence-list">${renderEvidence(x.evidence)}</div>
        ${x.requires_human_review?'<div class="human-review-note">هذه الحالة تحتاج مراجعة بشرية قبل اعتمادها.</div>':""}
      </article>
    `).join("");
  }
  results.classList.remove("hidden");
  setTimeout(()=>results.scrollIntoView({behavior:"smooth",block:"start"}),80);
}

function renderEngineError(message){
  latestReport=null;
  $("#scoreValue").textContent="—";
  $("#supportedCount").textContent="0";
  $("#partialCount").textContent="0";
  $("#unsupportedCount").textContent="0";
  $("#reviewCount").textContent="0";
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

$("#verifyBtn").addEventListener("click",async()=>{
  if(mode!=="text"){
    renderEngineError("النسخة الحالية من المحرك تعالج النص المباشر أولًا. دعم الملفات والروابط والصور يأتي في المرحلة التالية.");
    return;
  }
  const value=textarea.value.trim();
  if(!value){
    textarea.focus();
    textarea.placeholder="أدخل نصًا أولًا ليبدأ عَزْو عملية التأصيل.";
    return;
  }

  const btn=$("#verifyBtn");
  const original=btn.innerHTML;
  btn.disabled=true;
  btn.innerHTML="جارٍ التأصيل…";

  try{
    const report=await window.AZWO_DATA.runEngine({
      text:value,
      domain:$("#domainSelect")?.value||"عام",
      language:$("#langSelect")?.value==="الإنجليزية"?"en":"ar"
    });
    renderEngineResults(report);
    refreshRecentHistory();
  }catch(err){
    renderEngineError(err?.message||"تعذر تشغيل محرك عَزْو");
  }finally{
    btn.disabled=false;
    btn.innerHTML=original;
  }
});

$("#downloadReport").addEventListener("click",()=>{
  if(!latestReport)return;
  const blob=new Blob([JSON.stringify(latestReport,null,2)],{type:"application/json"});
  const a=document.createElement("a");
  a.href=URL.createObjectURL(blob);
  a.download=`azwo-report-${latestReport.job_id||Date.now()}.json`;
  a.click();
  URL.revokeObjectURL(a.href);
});

$("#copyReport").addEventListener("click",async()=>{
  if(!latestReport)return;
  const text=(latestReport.claims||[]).map(x=>{
    const source=(x.evidence||[])[0];
    return `${x.ordinal}. ${x.text}\nالحالة: ${statusLabels[x.status]||x.status}\nالمصدر: ${providerLabels[source?.metadata?.provider]||source?.metadata?.provider||"—"}\n${source?.location_text||""}`;
  }).join("\n\n");
  await navigator.clipboard?.writeText(text);
  $("#copyReport").textContent="تم النسخ";
  setTimeout(()=>$("#copyReport").textContent="نسخ التقرير",1500);
});

async function refreshRecentHistory(){
  const host=document.querySelector(".recent-panel");
  if(!host||!window.AZWO_DATA)return;
  try{
    const rows=await window.AZWO_DATA.listRecent();
    if(!rows?.length)return;
    host.querySelectorAll(".history-row").forEach(el=>el.remove());
    rows.slice(0,3).forEach(row=>{
      const div=document.createElement("div");
      div.className="history-row";
      const when=new Date(row.created_at||Date.now()).toLocaleString("ar-SA",{dateStyle:"short",timeStyle:"short"});
      const label=row.status==="needs_review"?"يحتاج مراجعة":row.status==="completed"?"مكتمل":row.status||"محفوظ";
      const cls=row.status==="needs_review"?"partial":"supported";
      div.innerHTML=`<span class="status ${row.status==="needs_review"?"warn":"ok"}"></span><div><strong>تحقق من نص</strong><small>${esc(when)}</small></div><em class="tag ${cls}">${esc(label)}</em>`;
      host.appendChild(div);
    });
  }catch(err){
    console.warn("AZWO history:",err);
  }
}

refreshRecentHistory();
