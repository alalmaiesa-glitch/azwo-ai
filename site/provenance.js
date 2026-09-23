const $=(s)=>document.querySelector(s);
const esc=(v)=>String(v??"").replaceAll("&","&amp;").replaceAll("<","&lt;").replaceAll(">","&gt;").replaceAll('"',"&quot;").replaceAll("'","&#039;");
const typeLabels={text:"نص",document:"وثيقة",image:"صورة",manuscript:"مخطوط",audio:"صوت",video:"فيديو",url:"رابط",dataset:"بيانات"};
let selectedAsset=null;

async function requireSession(){
  const session=await window.AZWO_DATA?.getSession?.();
  if(window.AZWO_DATA?.mode!=="demo"&&!session){location.href="./login.html";return false}
  return true;
}
async function loadStats(){
  const s=await window.AZWO_DATA.getProvenanceStats();
  $("#provAssets").textContent=s.assets.toLocaleString("ar-SA");
  $("#provSegments").textContent=s.segments.toLocaleString("ar-SA");
  $("#provExtractions").textContent=s.extractions.toLocaleString("ar-SA");
  $("#provEntities").textContent=s.entities.toLocaleString("ar-SA");
  $("#provRelations").textContent=s.relations.toLocaleString("ar-SA");
  $("#provEvidence").textContent=s.evidence.toLocaleString("ar-SA");
}
function renderAssets(rows){
  const host=$("#assetList");
  if(!rows.length){
    host.innerHTML='<div class="empty-graph"><b>لا توجد أصول بعد</b><p>شغّل عملية تأصيل نص جديدة؛ الإصدار 2 من المحرك سيكتبها تلقائيًا في Provenance Graph.</p></div>';
    return;
  }
  host.innerHTML=rows.map(x=>`
    <button class="asset-row ${selectedAsset===x.id?"active":""}" data-id="${esc(x.id)}">
      <span class="asset-type">${esc(typeLabels[x.asset_type]||x.asset_type)}</span>
      <b>${esc(x.title||x.original_filename||"أصل بلا عنوان")}</b>
      <small>${new Date(x.created_at).toLocaleString("ar-SA")} · ${esc(x.status)}</small>
    </button>`).join("");
  host.querySelectorAll(".asset-row").forEach(btn=>btn.addEventListener("click",()=>selectAsset(btn.dataset.id)));
}
function block(title,items,render){
  return `<section class="graph-detail-block"><div class="graph-detail-title"><b>${esc(title)}</b><span>${items.length}</span></div>${items.length?'<div class="graph-detail-list">'+items.map(render).join("")+'</div>':'<p class="graph-empty-line">لا توجد سجلات.</p>'}</section>`;
}
async function selectAsset(id){
  selectedAsset=id;
  const rows=await window.AZWO_DATA.listContentAssets();
  renderAssets(rows);
  $("#assetDetails").innerHTML='<div class="catalog-loading">جارٍ بناء الخريطة…</div>';
  const g=await window.AZWO_DATA.getAssetProvenance(id);
  if(!g){$("#assetDetails").innerHTML='<div class="empty-graph">الأصل غير موجود.</div>';return}
  const a=g.asset;
  $("#assetDetails").innerHTML=`
    <header class="asset-detail-head">
      <div><span class="asset-type">${esc(typeLabels[a.asset_type]||a.asset_type)}</span><h3>${esc(a.title||"أصل رقمي")}</h3></div>
      <span class="status-pill status-reviewed">${esc(a.status)}</span>
    </header>
    <div class="asset-fingerprint"><b>SHA-256</b><code>${esc(a.sha256||"—")}</code></div>
    ${block("Segments",g.segments,x=>`<div><b>${esc(x.segment_type)}</b><small>${esc(x.extracted_text?.slice(0,170)||x.folio_label||"")}</small></div>`)}
    ${block("Extractions",g.extractions,x=>`<div><b>${esc(x.extraction_type)}</b><small>${esc([x.provider,x.model,x.status].filter(Boolean).join(" · "))}</small></div>`)}
    ${block("Entities",g.entities,x=>`<div><b>${esc(x.entity_type)}</b><small>${esc(x.title||x.canonical_id||x.external_uri||"")}</small></div>`)}
    ${block("Relations",g.relations,x=>`<div><b>${esc(x.relation_type)}</b><small>${esc(x.review_status)} · confidence: ${x.confidence??"—"}</small></div>`)}
    ${block("Evidence",g.evidence,x=>`<div><b>${esc(x.verification_status)}</b><small>${esc(x.locator||x.external_uri||"")}</small><p>${esc(x.excerpt?.slice(0,220)||"")}</p></div>`)}
  `;
}
async function refresh(){
  await loadStats();
  const rows=await window.AZWO_DATA.listContentAssets();
  renderAssets(rows);
  if(selectedAsset&&rows.some(x=>x.id===selectedAsset))await selectAsset(selectedAsset);
}
$("#refreshProvenance")?.addEventListener("click",()=>refresh().catch(showError));
function showError(err){$("#assetDetails").innerHTML=`<div class="empty-graph"><b>تعذر التحميل</b><p>${esc(err.message||err)}</p></div>`}
(async()=>{if(await requireSession())await refresh()})().catch(showError);
