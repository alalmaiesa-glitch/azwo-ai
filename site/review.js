const host=document.getElementById("reviewQueue");
const count=document.getElementById("queueCount");

const labels={
  partial:"دعم جزئي",
  human_review:"مراجعة مختص",
  unsupported:"غير مسند",
  supported:"مدعوم",
  multiple:"متعدد"
};

const esc=(v)=>String(v??"")
  .replaceAll("&","&amp;")
  .replaceAll("<","&lt;")
  .replaceAll(">","&gt;")
  .replaceAll('"',"&quot;")
  .replaceAll("'","&#039;");

function render(items){
  count.textContent=items.length;
  if(!items.length){
    host.innerHTML='<div class="workspace-panel"><strong>لا توجد حالات معلقة.</strong><p class="muted">تمت مراجعة جميع الحالات الحالية أو لم تُجرَ عمليات تأصيل بعد.</p></div>';
    return;
  }
  host.innerHTML=items.map(x=>`
    <article class="review-item" data-id="${esc(x.id)}">
      <div class="review-item-head">
        <div><small class="claim-type">${esc(x.claim_type||"general")}</small><h3>${esc(x.claim_text)}</h3></div>
        <span class="risk">${esc(labels[x.status]||x.status||"مراجعة")}</span>
      </div>
      <div class="review-evidence">
        <div><b>نتيجة محرك عَزْو الداخلي</b><p>${esc(x.explanation||"تحتاج هذه الحالة إلى قرار بشري.")}</p></div>
        <div><b>حالة المعالجة</b><p>القرار الآلي: ${esc(labels[x.status]||x.status||"—")}</p></div>
      </div>
      <label class="review-comment">ملاحظة المراجع<textarea rows="2" placeholder="سبب القرار أو ملاحظة علمية..."></textarea></label>
      <div class="review-actions">
        <button class="decision-btn" data-decision="supported">اعتماد كمدعوم</button>
        <button class="decision-btn" data-decision="partial">دعم جزئي</button>
        <button class="decision-btn" data-decision="unsupported">غير مسند</button>
        <button class="decision-btn" data-decision="multiple">تعدد أقوال</button>
        <button class="decision-btn" data-decision="human_review">إبقاء للمراجعة</button>
      </div>
    </article>`).join("");
}

async function loadQueue(){
  host.innerHTML='<div class="workspace-panel"><p class="muted">جارٍ تحميل طابور المراجعة…</p></div>';
  try{
    const session=await window.AZWO_DATA.getSession();
    if(!session){
      host.innerHTML='<div class="workspace-panel"><strong>يلزم تسجيل الدخول.</strong><p class="muted">ادخل إلى حساب المؤسسة لعرض الحالات التي تحتاج مراجعة.</p><a class="primary-btn" href="./login.html">تسجيل الدخول</a></div>';
      count.textContent="0";
      return;
    }
    const items=await window.AZWO_DATA.listReviewQueue();
    render(items);
  }catch(err){
    host.innerHTML=`<div class="workspace-panel"><strong>تعذر تحميل المراجعات.</strong><p class="muted">${esc(err.message||"")}</p></div>`;
  }
}

host.addEventListener("click",async e=>{
  const btn=e.target.closest(".decision-btn");
  if(!btn)return;
  const card=btn.closest(".review-item");
  const id=card.dataset.id;
  const comment=card.querySelector("textarea")?.value.trim()||"";
  const original=btn.textContent;
  btn.disabled=true;
  btn.textContent="جارٍ الحفظ…";
  try{
    await window.AZWO_DATA.submitReview(id,btn.dataset.decision,comment);
    card.remove();
    count.textContent=String(Math.max(0,Number(count.textContent||0)-1));
    if(!host.querySelector(".review-item")){
      host.innerHTML='<div class="workspace-panel"><strong>اكتملت المراجعات الحالية.</strong><p class="muted">لا توجد حالات معلقة الآن.</p></div>';
    }
  }catch(err){
    alert(err.message||"تعذر حفظ قرار المراجعة");
    btn.disabled=false;
    btn.textContent=original;
  }
});

loadQueue();