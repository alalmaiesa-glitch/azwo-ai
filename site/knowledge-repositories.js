const $=(s)=>document.querySelector(s);
const esc=(v)=>String(v??"")
  .replaceAll("&","&amp;").replaceAll("<","&lt;").replaceAll(">","&gt;")
  .replaceAll('"',"&quot;").replaceAll("'","&#039;");

const labels={
  knowledge_graph:"Knowledge Graph",
  scholarly_knowledge_graph:"Scholarly Graph",
  scholarly_metadata_registry:"Metadata Registry",
  citation_graph:"Citation Graph",
  media_repository:"Media Repository",
  digital_archive:"Digital Archive",
  national_library:"National Library",
  regional_digital_library:"Regional Library",
  manuscript_repository:"Manuscript Repository",
  cultural_heritage_aggregator:"Cultural Heritage",
  specialized_digital_library:"Specialized Library",
  arabic_text_corpus:"Arabic Corpus",
  museum_open_access_repository:"Museum Open Access",
  digital_library_aggregator:"Library Aggregator",
  open_bibliographic_catalog:"Bibliographic Catalog",
  research_literature_repository:"Research Literature",
  preprint_repository:"Preprint Repository",
  open_access_research_aggregator:"Open Access Research",
  commercial_book_catalog:"Book Catalog"
};
const arabicLabels={native:"أصلي",substantial:"قوي",partial:"جزئي",incidental:"محدود",limited:"محدود",unknown:"غير معلوم"};
const iiifLabels={yes:"يدعم IIIF",presentation:"IIIF Presentation",partial:"IIIF جزئي",none:"لا يدعم",unknown:"غير معلوم"};

let timer=null;

async function requireSession(){
  const session=await window.AZWO_DATA?.getSession?.();
  if(window.AZWO_DATA?.mode!=="demo"&&!session){location.href="./login.html";return false}
  return true;
}

function chips(items,cls="repo-chip"){
  return (items||[]).slice(0,5).map(x=>`<span class="${cls}">${esc(x)}</span>`).join("");
}

function render(rows){
  const host=$("#knowledgeRepoGrid");
  if(!rows.length){
    host.innerHTML='<div class="catalog-loading">لا توجد نتائج بهذه الفلاتر.</div>';
    return;
  }
  host.innerHTML=rows.map(x=>`
    <article class="knowledge-repo-card">
      <div class="repo-card-head">
        <div>
          <span class="repo-type">${esc(labels[x.repository_type]||x.repository_type)}</span>
          <h3><a href="${esc(x.homepage_url)}" target="_blank" rel="noopener noreferrer">${esc(x.name)}</a></h3>
        </div>
        <div class="repo-score"><strong>${Number(x.relevance_score||0).toFixed(0)}</strong><small>/100</small></div>
      </div>

      <p class="repo-description">${esc(x.description||"")}</p>

      <div class="repo-flags">
        <span class="repo-flag arabic">العربية: ${esc(arabicLabels[x.arabic_support]||x.arabic_support)}</span>
        <span class="repo-flag iiif">${esc(iiifLabels[x.iiif_support]||x.iiif_support)}</span>
        <span class="repo-flag bulk">${x.bulk_access?"Bulk متاح":"Bulk غير مؤكد"}</span>
      </div>

      <div class="repo-section">
        <b>الوسائط</b>
        <div class="repo-chips">${chips(x.media_types)}</div>
      </div>

      <div class="repo-section">
        <b>استخدامه المحتمل في تَأْثِيل</b>
        <div class="repo-chips usecase">${chips(x.azwo_use_cases,"repo-chip use")}</div>
      </div>

      <dl class="repo-meta">
        <dt>الوصول</dt><dd>${esc((x.access_methods||[]).join(" · ")||"—")}</dd>
        <dt>الحقوق</dt><dd>${esc(x.license_summary||"—")}</dd>
        <dt>تجاريًا</dt><dd>${esc(x.commercial_use_status||"—")}</dd>
        <dt>Provenance</dt><dd>${esc(x.provenance_support||"—")}</dd>
        <dt>الحجم</dt><dd>${esc(x.size_estimate||"—")}</dd>
      </dl>

      <div class="repo-card-footer">
        <div>
          <span class="status-pill status-reviewed">Researched</span>
          <small>${esc(x.integration_status)}</small>
        </div>
        <div class="repo-links">
          ${x.api_url?`<a href="${esc(x.api_url)}" target="_blank" rel="noopener noreferrer">واجهة الوصول</a>`:""}
          ${x.source_repository?`<a href="${esc(x.source_repository)}" target="_blank" rel="noopener noreferrer">GitHub</a>`:""}
        </div>
      </div>

      <div class="catalog-actions repo-actions">
        <button disabled>مراجعة الحقوق</button>
        <button disabled>اختبار الوصول</button>
        <button disabled>اعتماد</button>
        <button disabled>إنشاء Connector</button>
      </div>
    </article>
  `).join("");
}

function filters(){
  return {
    search:$("#repoSearch").value.trim(),
    type:$("#repoType").value,
    mediaType:$("#repoMedia").value,
    arabic:$("#repoArabicFilter").value,
    iiif:$("#repoIiifFilter").value,
    minScore:$("#repoScore").value
  };
}

async function loadRows(){
  const out=await window.AZWO_DATA.listKnowledgeRepositories(filters());
  $("#repoCount").textContent=`${out.count.toLocaleString("ar-SA")} مستودع مطابق`;
  render(out.rows);
}

async function init(){
  if(!(await requireSession()))return;
  const [stats,opts]=await Promise.all([
    window.AZWO_DATA.getKnowledgeRepositoryStats(),
    window.AZWO_DATA.getKnowledgeRepositoryFilterOptions()
  ]);
  $("#repoTotal").textContent=stats.total.toLocaleString("ar-SA");
  $("#repoResearched").textContent=stats.researched.toLocaleString("ar-SA");
  $("#repoArabic").textContent=stats.arabicStrong.toLocaleString("ar-SA");
  $("#repoIiif").textContent=stats.iiif.toLocaleString("ar-SA");
  $("#repoMultimodal").textContent=stats.multimodal.toLocaleString("ar-SA");
  $("#repoConnected").textContent=stats.connected.toLocaleString("ar-SA");

  const fill=(id,items,map={})=>{
    const el=$(id);
    items.forEach(v=>el.insertAdjacentHTML("beforeend",`<option value="${esc(v)}">${esc(map[v]||labels[v]||arabicLabels[v]||iiifLabels[v]||v)}</option>`));
  };
  fill("#repoType",opts.types);
  fill("#repoMedia",opts.mediaTypes);
  fill("#repoArabicFilter",opts.arabic);
  fill("#repoIiifFilter",opts.iiif);
  await loadRows();
}

["#repoType","#repoMedia","#repoArabicFilter","#repoIiifFilter","#repoScore"].forEach(id=>$(id).addEventListener("change",()=>loadRows().catch(showError)));
$("#repoSearch").addEventListener("input",()=>{clearTimeout(timer);timer=setTimeout(()=>loadRows().catch(showError),250)});
function showError(err){
  $("#knowledgeRepoGrid").innerHTML=`<div class="catalog-loading">تعذر تحميل المستودعات: ${esc(err.message||err)}</div>`;
}
init().catch(showError);
