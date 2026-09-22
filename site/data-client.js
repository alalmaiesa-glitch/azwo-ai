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
      return this.invokeFreeSource({provider:"quranenc",mode:"aya",translation,String:sura,aya:String(aya)});
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