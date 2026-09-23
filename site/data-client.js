(function(){
  const config=window.AZWO_CONFIG||{demoMode:true};
  const hasSupabase=Boolean(config.supabaseUrl&&config.supabaseAnonKey&&window.supabase);
  const client=hasSupabase?window.supabase.createClient(config.supabaseUrl,config.supabaseAnonKey):null;

  const historyKey="azwo_demo_history";
  function demoHistory(){try{return JSON.parse(localStorage.getItem(historyKey)||"[]")}catch{return []}}
  function saveDemo(row){const list=demoHistory();list.unshift(row);localStorage.setItem(historyKey,JSON.stringify(list.slice(0,20)));}

  async function currentUser(){
    if(!client)return null;
    const {data}=await client.auth.getUser();
    return data.user||null;
  }

  async function firstOrganization(){
    if(!client)return null;
    const user=await currentUser();
    if(!user)return null;
    const {data,error}=await client
      .from("organization_members")
      .select("organization_id, role, organizations(id,name,slug,type)")
      .eq("user_id",user.id)
      .limit(1)
      .maybeSingle();
    if(error)throw error;
    return data||null;
  }

  window.AZWO_DATA={
    mode: hasSupabase&&!config.demoMode?"supabase":"demo",
    client,

    async getSession(){
      if(!client)return null;
      const {data}=await client.auth.getSession();
      return data.session||null;
    },

    async getUser(){ return currentUser(); },

    async signUp(email,password,fullName){
      if(!client)throw new Error("Supabase غير مهيأ بعد");
      return client.auth.signUp({
        email,password,
        options:{data:{full_name:fullName||""}}
      });
    },

    async signIn(email,password){
      if(!client)throw new Error("Supabase غير مهيأ بعد");
      return client.auth.signInWithPassword({email,password});
    },

    async signOut(){if(client)return client.auth.signOut();},

    async getCurrentOrganization(){return firstOrganization();},

    async createOrganization(name){
      if(!client)throw new Error("Supabase غير مهيأ");
      const user=await currentUser();
      if(!user)throw new Error("يجب تسجيل الدخول أولًا");
      const slug=(name||"azwo-org")
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9؀-ۿ]+/g,"-")
        .replace(/^-|-$/g,"")+"-"+Date.now().toString().slice(-5);
      const {data,error}=await client
        .from("organizations")
        .insert({name,slug,created_by:user.id})
        .select()
        .single();
      if(error)throw error;
      return data;
    },

    async runEngine(payload){
      if(!client)throw new Error("Supabase غير مهيأ");
      const {data:{session}}=await client.auth.getSession();
      if(!session)throw new Error("يلزم تسجيل الدخول لتشغيل محرك التأصيل الحقيقي");
      const response=await fetch(`${config.supabaseUrl}/functions/v1/azwo-engine`,{
        method:"POST",
        headers:{
          Authorization:`Bearer ${session.access_token}`,
          apikey:config.supabaseAnonKey,
          "Content-Type":"application/json"
        },
        body:JSON.stringify(payload)
      });
      const data=await response.json();
      if(!response.ok)throw new Error(data.error||"تعذر تشغيل محرك التأصيل");
      return data;
    },

    async createVerification(payload){
      if(!client||config.demoMode){
        const row={id:"DEMO-"+Date.now(),...payload,status:"completed",created_at:new Date().toISOString()};
        saveDemo(row);return row;
      }
      const user=await currentUser();
      const membership=await firstOrganization();
      if(!user||!membership){
        const row={id:"LOCAL-"+Date.now(),...payload,status:"completed",created_at:new Date().toISOString()};
        saveDemo(row);return row;
      }
      const row={
        organization_id:membership.organization_id,
        created_by:user.id,
        input_type:payload.input_type,
        input_text:payload.input_text||null,
        input_url:payload.input_url||null,
        domain:payload.domain||null,
        language:payload.language||"ar",
        status:"draft",
        metadata:{source:"website-v1"}
      };
      const {data,error}=await client.from("verification_jobs").insert(row).select().single();
      if(error)throw error;
      return data;
    },

    async listRecent(){
      if(!client||config.demoMode)return demoHistory();
      const membership=await firstOrganization();
      if(!membership)return demoHistory();
      const {data,error}=await client
        .from("verification_jobs")
        .select("*")
        .eq("organization_id",membership.organization_id)
        .order("created_at",{ascending:false})
        .limit(20);
      if(error)throw error;
      return data||[];
    },

    async listReviewQueue(){
      if(!client)throw new Error("Supabase غير مهيأ");
      const membership=await firstOrganization();
      if(!membership)return [];
      const {data,error}=await client
        .from("claims")
        .select("id,ordinal,claim_text,claim_type,status,explanation,requires_human_review,created_at,verification_jobs!inner(id,organization_id,created_at)")
        .eq("verification_jobs.organization_id",membership.organization_id)
        .or("requires_human_review.eq.true,status.eq.partial,status.eq.human_review")
        .order("created_at",{ascending:false})
        .limit(50);
      if(error)throw error;
      return data||[];
    },

    async submitReview(claimId,decision,comment=""){
      if(!client)throw new Error("Supabase غير مهيأ");
      const user=await currentUser();
      if(!user)throw new Error("يلزم تسجيل الدخول");

      const {data:claimRow,error:claimReadError}=await client
        .from("claims")
        .select("id,job_id")
        .eq("id",claimId)
        .single();
      if(claimReadError)throw claimReadError;

      const {data,error}=await client.from("reviews").insert({
        claim_id:claimId,
        reviewer_id:user.id,
        decision,
        comment,
        is_final:true
      }).select().single();
      if(error)throw error;

      const {error:claimError}=await client
        .from("claims")
        .update({
          status:decision,
          requires_human_review:decision==="human_review"
        })
        .eq("id",claimId);
      if(claimError)throw claimError;

      if(decision!=="human_review"){
        const {data:pending,error:pendingError}=await client
          .from("claims")
          .select("id")
          .eq("job_id",claimRow.job_id)
          .or("requires_human_review.eq.true,status.eq.partial,status.eq.human_review")
          .limit(1);
        if(pendingError)throw pendingError;
        if(!pending?.length){
          await client
            .from("verification_jobs")
            .update({status:"completed",completed_at:new Date().toISOString()})
            .eq("id",claimRow.job_id);
        }
      }
      return data;
    },

    async listSources(){
      if(!client||config.demoMode)return [];
      const membership=await firstOrganization();
      let query=client.from("sources").select("*").order("created_at",{ascending:false});
      if(!membership){
        query=query.eq("is_public",true).eq("status","approved");
      }
      const {data,error}=await query;
      if(error)throw error;
      return data||[];
    },

    async getQuranVerse(surah,ayah){
      if(!client)throw new Error("Supabase غير مهيأ");
      const {data,error}=await client
        .from("quran_verses")
        .select("surah,ayah,text_uthmani,source_version")
        .eq("surah",Number(surah))
        .eq("ayah",Number(ayah))
        .maybeSingle();
      if(error)throw error;
      return data;
    },

    async searchQuranQuote(query,limit=10){
      if(!client)throw new Error("Supabase غير مهيأ");
      const {data,error}=await client.rpc("search_quran_quote",{q:query,limit_count:limit});
      if(error)throw error;
      return data||[];
    },

    async invokeFreeSource(params){
      if(!client)throw new Error("Supabase غير مهيأ");
      const {data:{session}}=await client.auth.getSession();
      if(!session)throw new Error("سجل الدخول لاستخدام المصادر الخارجية");
      const qs=new URLSearchParams(params).toString();
      const response=await fetch(`${config.supabaseUrl}/functions/v1/azwo-sources?${qs}`,{
        headers:{
          Authorization:`Bearer ${session.access_token}`,
          apikey:config.supabaseAnonKey
        }
      });
      const payload=await response.json();
      if(!response.ok)throw new Error(payload.error||"تعذر الاتصال بالمصدر");
      return payload;
    },

    async searchDorar(query){
      return this.invokeFreeSource({provider:"dorar",q:query});
    },

    async listQuranEnc(language="ar"){
      return this.invokeFreeSource({provider:"quranenc",mode:"list",language});
    },

    async getQuranEncAya(translation,sura,aya){
      return this.invokeFreeSource({provider:"quranenc",mode:"aya",translation,sura:String(sura),aya:String(aya)});
    },

    async getApiCatalogStats(){
      if(!client)throw new Error("Supabase غير مهيأ");
      const countQuery=async(apply)=>{
        let query=client.from("api_catalog").select("id",{count:"exact",head:true});
        if(apply)query=apply(query);
        const {count,error}=await query;
        if(error)throw error;
        return count||0;
      };
      const [total,relevant,tested,approved,stopped,needsKey]=await Promise.all([
        countQuery(),
        countQuery(q=>q.eq("verification_status","relevant")),
        countQuery(q=>q.eq("verification_status","tested")),
        countQuery(q=>q.eq("verification_status","approved")),
        countQuery(q=>q.in("integration_status",["disabled","error"])),
        countQuery(q=>q.ilike("auth_type","%apiKey%"))
      ]);
      return {total,relevant,tested,approved,stopped,needsKey};
    },

    async getApiCatalogFilterOptions(){
      if(!client)throw new Error("Supabase غير مهيأ");
      const fetchRange=async(from,to)=>{
        const {data,error}=await client
          .from("api_catalog")
          .select("category,auth_type,azwo_use_case,verification_status")
          .order("category")
          .range(from,to);
        if(error)throw error;
        return data||[];
      };
      const chunks=await Promise.all([fetchRange(0,999),fetchRange(1000,1999)]);
      const data=chunks.flat();
      const uniq=(key)=>[...new Set(data.map(x=>x[key]).filter(Boolean))]
        .sort((a,b)=>String(a).localeCompare(String(b),"ar"));
      return {
        categories:uniq("category"),
        authTypes:uniq("auth_type"),
        useCases:uniq("azwo_use_case"),
        statuses:uniq("verification_status")
      };
    },

    async listApiCatalog(filters={}){
      if(!client)throw new Error("Supabase غير مهيأ");
      const page=Math.max(0,Number(filters.page||0));
      const pageSize=Math.min(100,Math.max(10,Number(filters.pageSize||50)));
      let query=client
        .from("api_catalog")
        .select("id,name,description,category,auth_type,https,cors,documentation_url,source,relevance_score,azwo_use_case,verification_status,integration_status,enabled,last_checked_at,updated_at",{count:"exact"})
        .order("relevance_score",{ascending:false})
        .order("name",{ascending:true});

      if(filters.category)query=query.eq("category",filters.category);
      if(filters.authType)query=query.eq("auth_type",filters.authType);
      if(filters.status)query=query.eq("verification_status",filters.status);
      if(filters.useCase)query=query.eq("azwo_use_case",filters.useCase);
      if(filters.minScore!==undefined&&filters.minScore!==null&&filters.minScore!==""){
        query=query.gte("relevance_score",Number(filters.minScore));
      }
      if(filters.search){
        const safe=String(filters.search).replace(/[%_,()]/g," ").trim();
        if(safe)query=query.or(`name.ilike.%${safe}%,description.ilike.%${safe}%`);
      }
      if(filters.top20)query=query.limit(20);
      else query=query.range(page*pageSize,page*pageSize+pageSize-1);

      const {data,count,error}=await query;
      if(error)throw error;
      return {rows:data||[],count:count||0,page,pageSize};
    },

    async getKnowledgeRepositoryStats(){
      if(!client)throw new Error("Supabase غير مهيأ");
      const {data,error}=await client
        .from("knowledge_repository_catalog")
        .select("repository_type,arabic_support,iiif_support,verification_status,integration_status,media_types,enabled");
      if(error)throw error;
      const rows=data||[];
      return {
        total:rows.length,
        researched:rows.filter(x=>x.verification_status==="researched").length,
        approved:rows.filter(x=>x.verification_status==="approved").length,
        connected:rows.filter(x=>x.integration_status==="connected"&&x.enabled).length,
        arabicStrong:rows.filter(x=>["native","substantial"].includes(x.arabic_support)).length,
        iiif:rows.filter(x=>!["none","unknown",null].includes(x.iiif_support)).length,
        multimodal:rows.filter(x=>(x.media_types||[]).some(v=>["image","audio","video","3d","manuscript","map","photograph"].includes(v))).length
      };
    },

    async getKnowledgeRepositoryFilterOptions(){
      if(!client)throw new Error("Supabase غير مهيأ");
      const {data,error}=await client
        .from("knowledge_repository_catalog")
        .select("repository_type,domains,media_types,arabic_support,iiif_support,azwo_use_cases,verification_status")
        .order("relevance_score",{ascending:false});
      if(error)throw error;
      const rows=data||[];
      const uniq=(values)=>[...new Set(values.filter(Boolean))]
        .sort((a,b)=>String(a).localeCompare(String(b),"ar"));
      return {
        types:uniq(rows.map(x=>x.repository_type)),
        domains:uniq(rows.flatMap(x=>x.domains||[])),
        mediaTypes:uniq(rows.flatMap(x=>x.media_types||[])),
        arabic:uniq(rows.map(x=>x.arabic_support)),
        iiif:uniq(rows.map(x=>x.iiif_support)),
        useCases:uniq(rows.flatMap(x=>x.azwo_use_cases||[])),
        statuses:uniq(rows.map(x=>x.verification_status))
      };
    },

    async listKnowledgeRepositories(filters={}){
      if(!client)throw new Error("Supabase غير مهيأ");
      let query=client
        .from("knowledge_repository_catalog")
        .select("*",{count:"exact"})
        .order("relevance_score",{ascending:false})
        .order("name",{ascending:true});

      if(filters.type)query=query.eq("repository_type",filters.type);
      if(filters.arabic)query=query.eq("arabic_support",filters.arabic);
      if(filters.iiif)query=query.eq("iiif_support",filters.iiif);
      if(filters.status)query=query.eq("verification_status",filters.status);
      if(filters.mediaType)query=query.contains("media_types",[filters.mediaType]);
      if(filters.domain)query=query.contains("domains",[filters.domain]);
      if(filters.useCase)query=query.contains("azwo_use_cases",[filters.useCase]);
      if(filters.minScore!==undefined&&filters.minScore!==null&&filters.minScore!==""){
        query=query.gte("relevance_score",Number(filters.minScore));
      }
      if(filters.search){
        const safe=String(filters.search).replace(/[%_,()]/g," ").trim();
        if(safe)query=query.or(`name.ilike.%${safe}%,description.ilike.%${safe}%`);
      }

      const {data,count,error}=await query;
      if(error)throw error;
      return {rows:data||[],count:count||0};
    },

    async getProvenanceStats(){
      if(!client)throw new Error("Supabase غير مهيأ");
      const membership=await firstOrganization();
      if(!membership)return {assets:0,segments:0,extractions:0,entities:0,relations:0,evidence:0};

      const org=membership.organization_id;
      const count=async(table)=>{
        const {count,error}=await client.from(table)
          .select("id",{count:"exact",head:true})
          .eq("organization_id",org);
        if(error)throw error;
        return count||0;
      };
      const [assets,segments,extractions,entities,relations,evidence]=await Promise.all([
        count("content_assets"),
        count("asset_segments"),
        count("content_extractions"),
        count("provenance_entities"),
        count("provenance_relations"),
        count("provenance_evidence")
      ]);
      return {assets,segments,extractions,entities,relations,evidence};
    },

    async listContentAssets(limit=50){
      if(!client)throw new Error("Supabase غير مهيأ");
      const membership=await firstOrganization();
      if(!membership)return [];
      const {data,error}=await client
        .from("content_assets")
        .select("id,asset_type,title,original_filename,canonical_url,mime_type,language,sha256,status,metadata,created_at,updated_at")
        .eq("organization_id",membership.organization_id)
        .order("created_at",{ascending:false})
        .limit(Math.min(100,Math.max(1,Number(limit)||50)));
      if(error)throw error;
      return data||[];
    },

    async getAssetProvenance(assetId){
      if(!client)throw new Error("Supabase غير مهيأ");
      const membership=await firstOrganization();
      if(!membership)return null;
      const org=membership.organization_id;

      const {data:asset,error:assetErr}=await client
        .from("content_assets")
        .select("*")
        .eq("id",assetId)
        .eq("organization_id",org)
        .maybeSingle();
      if(assetErr)throw assetErr;
      if(!asset)return null;

      const [segmentsQ,extractionsQ,entitiesQ,activitiesQ,evidenceQ]=await Promise.all([
        client.from("asset_segments").select("*").eq("asset_id",assetId).eq("organization_id",org).order("ordinal"),
        client.from("content_extractions").select("*").eq("asset_id",assetId).eq("organization_id",org).order("created_at"),
        client.from("provenance_entities").select("*").eq("asset_id",assetId).eq("organization_id",org).order("created_at"),
        client.from("provenance_activities").select("*").eq("asset_id",assetId).eq("organization_id",org).order("created_at"),
        client.from("provenance_evidence").select("*").eq("organization_id",org).order("created_at")
      ]);
      for(const q of [segmentsQ,extractionsQ,entitiesQ,activitiesQ,evidenceQ])if(q.error)throw q.error;

      const entityIds=(entitiesQ.data||[]).map(x=>x.id);
      let relations=[];
      if(entityIds.length){
        const {data,error}=await client
          .from("provenance_relations")
          .select("*")
          .eq("organization_id",org)
          .in("subject_entity_id",entityIds)
          .order("created_at");
        if(error)throw error;
        relations=data||[];
      }
      const relationIds=new Set(relations.map(x=>x.id));
      const relevantEvidence=(evidenceQ.data||[]).filter(x=>
        (x.entity_id&&entityIds.includes(x.entity_id))||
        (x.relation_id&&relationIds.has(x.relation_id))
      );

      return {
        asset,
        segments:segmentsQ.data||[],
        extractions:extractionsQ.data||[],
        entities:entitiesQ.data||[],
        activities:activitiesQ.data||[],
        relations,
        evidence:relevantEvidence
      };
    },

    async createSource(payload){
      if(!client)throw new Error("Supabase غير مهيأ");
      const user=await currentUser();
      const membership=await firstOrganization();
      if(!user||!membership)throw new Error("يلزم حساب مؤسسي");
      const {data,error}=await client.from("sources").insert({
        organization_id:membership.organization_id,
        title:payload.title,
        author:payload.author||null,
        source_type:payload.source_type,
        canonical_url:payload.canonical_url||null,
        license_name:payload.license_name||null,
        status:"draft",
        is_public:false,
        created_by:user.id
      }).select().single();
      if(error)throw error;
      return data;
    }
  };
})();