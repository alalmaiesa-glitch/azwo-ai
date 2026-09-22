const key="azwo_demo_sources";
const fallbackSources=[
{id:"S1",title:"القرآن الكريم",source_type:"قرآن",is_public:true,canonical_url:"مرجع وقفي عام",license_name:"وفق شروط المصدر",status:"approved"},
{id:"S2",title:"مجموعة حديثية مرجعية",source_type:"حديث",is_public:true,canonical_url:"مصدر خارجي",license_name:"يُراجع قبل الربط",status:"restricted"},
{id:"S3",title:"دليل المؤسسة التحريري",source_type:"مرجع عام",is_public:false,canonical_url:"خاص بالمؤسسة",license_name:"ملكية المؤسسة",status:"approved"}
];
let list=[];
const grid=document.getElementById("sourcesGrid");

function cardScope(x){return x.is_public?"public":"org"}
function render(filter="all"){
  const rows=list.filter(x=>filter==="all"||cardScope(x)===filter);
  grid.innerHTML=rows.length?rows.map(x=>`
    <article class="source-card">
      <div class="source-card-head">
        <h3>${x.title}</h3>
        <span class="scope ${cardScope(x)}">${x.is_public?"وقفي عام":"خاص"}</span>
      </div>
      <dl class="source-meta">
        <dt>النوع</dt><dd>${x.source_type||"—"}</dd>
        <dt>الموقع</dt><dd>${x.canonical_url||"—"}</dd>
        <dt>الترخيص</dt><dd>${x.license_name||"—"}</dd>
      </dl>
      <div class="source-state">
        <span class="approved">${x.status==="approved"?"معتمد":x.status==="restricted"?"مقيّد":"قيد المراجعة"}</span>
        <button class="secondary-btn">تفاصيل</button>
      </div>
    </article>`).join(""):'<div class="workspace-panel"><p class="muted">لا توجد مصادر في هذا التصنيف.</p></div>';
}

async function loadSources(){
  try{
    const remote=await window.AZWO_DATA?.listSources?.();
    if(remote?.length){list=remote}
    else{
      list=JSON.parse(localStorage.getItem(key)||"null")||fallbackSources;
    }
  }catch(err){
    console.warn(err);
    list=JSON.parse(localStorage.getItem(key)||"null")||fallbackSources;
  }
  render();
}

document.querySelectorAll(".source-tabs button").forEach(b=>b.onclick=()=>{
  document.querySelectorAll(".source-tabs button").forEach(x=>x.classList.remove("active"));
  b.classList.add("active");
  render(b.dataset.filter);
});

const dialog=document.getElementById("sourceDialog");
document.getElementById("newSourceBtn").onclick=()=>dialog.showModal();
document.getElementById("sourceForm").addEventListener("submit",async e=>{
  if(e.submitter?.value==="cancel")return;
  e.preventDefault();
  const title=document.getElementById("sourceTitle").value.trim();
  if(!title)return;
  const payload={
    title,
    source_type:document.getElementById("sourceType").value,
    canonical_url:document.getElementById("sourceUrl").value||null,
    license_name:document.getElementById("sourceLicense").value||null
  };
  try{
    if(window.AZWO_DATA?.mode==="supabase"){
      const created=await window.AZWO_DATA.createSource(payload);
      list.unshift(created);
    }else{
      const created={id:"D"+Date.now(),...payload,is_public:false,status:"draft"};
      list.unshift(created);
      localStorage.setItem(key,JSON.stringify(list));
    }
    render();
    dialog.close();
    e.target.reset();
  }catch(err){
    alert(err.message||"تعذر حفظ المصدر");
  }
});

loadSources();

async function ensureSourceLabAuth(){
  if(window.AZWO_DATA?.mode!=="supabase") return true;
  const session=await window.AZWO_DATA.getSession();
  return Boolean(session);
}

document.getElementById("quranLookup")?.addEventListener("click",async()=>{
  const box=document.getElementById("quranResult");
  const sura=document.getElementById("quranSura").value;
  const aya=document.getElementById("quranAya").value;
  box.textContent="جارٍ التحميل...";
  try{
    const verse=await window.AZWO_DATA.getQuranVerse(sura,aya);
    if(!verse){box.textContent="لم يتم العثور على الآية.";return}
    box.innerHTML=`<div class="quran-text">${verse.text_uthmani}</div><small>سورة ${verse.surah}، آية ${verse.ayah} — ${verse.source_version} · Tanzil Project</small>`;
  }catch(err){box.textContent=err.message||"تعذر تحميل الآية"}
});

document.getElementById("dorarSearch")?.addEventListener("click",async()=>{
  const box=document.getElementById("dorarResult");
  const q=document.getElementById("dorarQuery").value.trim();
  if(q.length<2){box.textContent="أدخل كلمتين على الأقل.";return}
  box.textContent="جارٍ البحث...";
  try{
    if(!(await ensureSourceLabAuth())){box.textContent="سجل الدخول أولًا لاستخدام البحث الخارجي.";return}
    const res=await window.AZWO_DATA.searchDorar(q);
    const items=(res.items||[]).slice(0,5);
    box.innerHTML=items.length
      ?items.map(x=>`<div class="result-item">${x.text||"نتيجة"}</div>`).join("")
      :"لا توجد نتائج.";
  }catch(err){box.textContent=err.message||"تعذر البحث في الدرر السنية"}
});

document.getElementById("quranEncLoad")?.addEventListener("click",async()=>{
  const box=document.getElementById("quranEncResult");
  const lang=document.getElementById("quranEncLang").value;
  box.textContent="جارٍ التحميل...";
  try{
    if(!(await ensureSourceLabAuth())){box.textContent="سجل الدخول أولًا لاستخدام المصدر الخارجي.";return}
    const res=await window.AZWO_DATA.listQuranEnc(lang);
    const data=Array.isArray(res.data)?res.data:(res.data?.translations||[]);
    box.innerHTML=data.slice(0,12).map(x=>`<div class="result-item"><b>${x.title||x.key}</b><br><small>${x.key||""} ${x.version?"· "+x.version:""}</small></div>`).join("")||"لا توجد ترجمات.";
  }catch(err){box.textContent=err.message||"تعذر تحميل الترجمات"}
});


document.getElementById("quranQuoteSearch")?.addEventListener("click",async()=>{
  const box=document.getElementById("quranResult");
  const q=document.getElementById("quranQuote").value.trim();
  if(q.length<3){box.textContent="أدخل جزءًا من الآية.";return}
  box.textContent="جارٍ البحث...";
  try{
    const rows=await window.AZWO_DATA.searchQuranQuote(q,8);
    box.innerHTML=rows.length
      ?rows.map(v=>`<div class="result-item"><div class="quran-text">${v.text_uthmani}</div><small>سورة ${v.surah}، آية ${v.ayah} — ${v.source_version}</small></div>`).join("")
      :"لم يتم العثور على تطابق.";
  }catch(err){box.textContent=err.message||"تعذر البحث في النص القرآني"}
});
