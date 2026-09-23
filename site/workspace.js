(async()=>{
  const session=await window.AZWO_DATA?.getSession?.();
  const demo=JSON.parse(localStorage.getItem("azwo_demo_user")||"null");

  if(window.AZWO_DATA.mode!=="demo"&&!session){
    location.href="./login.html";
    return;
  }

  const membership=await window.AZWO_DATA?.getCurrentOrganization?.();
  const onboarding=document.getElementById("orgOnboarding");

  if(membership?.organizations){
    document.getElementById("orgName").textContent=membership.organizations.name||"مؤسسة";
    onboarding?.classList.add("hidden");
  }else if(window.AZWO_DATA.mode==="supabase"){
    document.getElementById("orgName").textContent="لا توجد مؤسسة";
    onboarding?.classList.remove("hidden");
  }

  const rows=await window.AZWO_DATA.listRecent();
  document.getElementById("jobsCount").textContent=rows.length;
  try{const reviewRows=await window.AZWO_DATA.listReviewQueue();document.getElementById("reviewMetric").textContent=reviewRows.length}catch{}
  try{
    const apiStats=await window.AZWO_DATA.getApiCatalogStats();
    document.getElementById("apiCatalogTotal").textContent=apiStats.total.toLocaleString("ar-SA");
    document.getElementById("apiCatalogRelevant").textContent=apiStats.relevant.toLocaleString("ar-SA");
    document.getElementById("apiCatalogApproved").textContent=apiStats.approved.toLocaleString("ar-SA");
  }catch{}
  const host=document.getElementById("workspaceJobs");
  if(rows.length){
    host.innerHTML=rows.slice(0,8).map(row=>`
      <div class="workspace-job">
        <div><strong>${row.input_type==="text"?"تحقق من نص":"عملية تحقق"}</strong><small>${new Date(row.created_at).toLocaleString("ar-SA")}</small></div>
        <em class="tag supported">${row.status||"محفوظ"}</em>
      </div>`).join("");
  }
})();

document.getElementById("createOrgBtn")?.addEventListener("click",async()=>{
  const input=document.getElementById("newOrgName"),msg=document.getElementById("orgMessage");
  const name=input.value.trim();
  if(!name){msg.textContent="أدخل اسم المؤسسة.";return}
  try{
    msg.textContent="";
    await window.AZWO_DATA.createOrganization(name);
    location.reload();
  }catch(err){
    msg.textContent=err.message||"تعذر إنشاء المؤسسة";
  }
});

document.getElementById("signOut").onclick=async()=>{
  localStorage.removeItem("azwo_demo_user");
  await window.AZWO_DATA?.signOut?.();
  location.href="./login.html";
};