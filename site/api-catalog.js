const $=(s)=>document.querySelector(s);
const esc=(v)=>String(v??"").replaceAll("&","&amp;").replaceAll("<","&lt;").replaceAll(">","&gt;").replaceAll('"',"&quot;").replaceAll("'","&#039;");
let page=0,top20=false,timer=null,lastCount=0;

const statusLabels={
  discovered:"Discovered",relevant:"Relevant",reviewed:"Reviewed",tested:"Tested",
  approved:"Approved",rejected:"Rejected",needs_review:"Needs Review"
};

async function requireSession(){
  const session=await window.AZWO_DATA?.getSession?.();
  if(window.AZWO_DATA?.mode!=="demo"&&!session){
    location.href="./login.html";
    return false;
  }
  return true;
}

async function loadStats(){
  const s=await window.AZWO_DATA.getApiCatalogStats();
  $("#apiTotal").textContent=s.total.toLocaleString("ar-SA");
  $("#apiRelevant").textContent=s.relevant.toLocaleString("ar-SA");
  $("#apiTested").textContent=s.tested.toLocaleString("ar-SA");
  $("#apiApproved").textContent=s.approved.toLocaleString("ar-SA");
  $("#apiStopped").textContent=s.stopped.toLocaleString("ar-SA");
  $("#apiNeedsKey").textContent=s.needsKey.toLocaleString("ar-SA");
}

async function loadOptions(){
  const o=await window.AZWO_DATA.getApiCatalogFilterOptions();
  const fill=(id,items)=>{const el=$(id);items.forEach(v=>el.insertAdjacentHTML("beforeend",`<option value="${esc(v)}">${esc(v)}</option>`));};
  fill("#categoryFilter",o.categories);
  fill("#authFilter",o.authTypes);
  fill("#useCaseFilter",o.useCases);
}

function filters(){
  return {
    search:$("#apiSearch").value.trim(),
    category:$("#categoryFilter").value,
    authType:$("#authFilter").value,
    minScore:$("#scoreFilter").value,
    status:$("#statusFilter").value,
    useCase:$("#useCaseFilter").value,
    page,pageSize:50,top20
  };
}

function renderRows(rows){
  const host=$("#apiCatalogBody");
  if(!rows.length){
    host.innerHTML='<tr><td colspan="7" class="catalog-loading">لا توجد نتائج بهذه الفلاتر.</td></tr>';
    return;
  }
  host.innerHTML=rows.map(x=>`
    <tr>
      <td class="api-name-cell">
        <a href="${esc(x.documentation_url)}" target="_blank" rel="noopener noreferrer">${esc(x.name)}</a>
        <p>${esc(x.description||"")}</p>
        <small>HTTPS: ${x.https?"نعم":"لا"} · CORS: ${esc(x.cors||"—")}</small>
      </td>
      <td><span class="catalog-chip">${esc(x.category||"—")}</span></td>
      <td>${esc(x.auth_type||"—")}</td>
      <td><div class="score-cell"><b>${Number(x.relevance_score||0).toFixed(0)}</b><span><i style="width:${Math.min(100,Number(x.relevance_score||0))}%"></i></span></div></td>
      <td>${esc(x.azwo_use_case||"—")}</td>
      <td><span class="status-pill status-${esc(x.verification_status)}">${esc(statusLabels[x.verification_status]||x.verification_status)}</span><small class="integration-state">${esc(x.integration_status)}</small></td>
      <td>
        <div class="catalog-actions">
          <button disabled title="يتاح في المرحلة التالية">فحص</button>
          <button disabled title="يتاح بعد المراجعة">اختبار الاتصال</button>
          <button disabled title="لا اعتماد قبل الاختبار">اعتماد</button>
          <button disabled title="يتاح في مرحلة المراجعة">رفض</button>
          <button disabled title="لا Connector قبل Approved">إنشاء Connector</button>
        </div>
      </td>
    </tr>`).join("");
}

async function loadRows(){
  $("#apiCatalogBody").innerHTML='<tr><td colspan="7" class="catalog-loading">جارٍ التحميل…</td></tr>';
  const out=await window.AZWO_DATA.listApiCatalog(filters());
  lastCount=out.count;
  renderRows(out.rows);
  $("#catalogCount").textContent=top20
    ? `أفضل ${out.rows.length} نتيجة حسب relevance_score`
    : `${out.count.toLocaleString("ar-SA")} نتيجة مطابقة`;
  $("#pageLabel").textContent=top20?"أفضل 20":`صفحة ${page+1}`;
  $("#prevPage").disabled=top20||page===0;
  $("#nextPage").disabled=top20||((page+1)*out.pageSize>=out.count);
}

function refresh(){
  page=0;
  loadRows().catch(showError);
}
function showError(err){
  $("#apiCatalogBody").innerHTML=`<tr><td colspan="7" class="catalog-loading">تعذر تحميل الدليل: ${esc(err.message||err)}</td></tr>`;
}

(async()=>{
  if(!(await requireSession()))return;
  try{
    await Promise.all([loadStats(),loadOptions()]);
    await loadRows();
  }catch(err){showError(err)}
})();

["#categoryFilter","#authFilter","#scoreFilter","#statusFilter","#useCaseFilter"].forEach(id=>$(id).addEventListener("change",refresh));
$("#apiSearch").addEventListener("input",()=>{clearTimeout(timer);timer=setTimeout(refresh,300)});
$("#top20Toggle").addEventListener("click",()=>{
  top20=!top20;
  $("#top20Toggle").classList.toggle("active",top20);
  $("#top20Toggle").textContent=top20?"عرض كل النتائج":"أفضل 20 فقط";
  refresh();
});
$("#prevPage").addEventListener("click",()=>{if(page>0){page--;loadRows().catch(showError)}});
$("#nextPage").addEventListener("click",()=>{page++;loadRows().catch(showError)});
