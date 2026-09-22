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