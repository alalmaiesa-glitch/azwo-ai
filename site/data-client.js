(function(){
  const config=window.AZWO_CONFIG||{demoMode:true};
  const hasSupabase=Boolean(config.supabaseUrl&&config.supabaseAnonKey&&window.supabase);
  const client=hasSupabase?window.supabase.createClient(config.supabaseUrl,config.supabaseAnonKey):null;

  const key="azwo_demo_history";
  function demoHistory(){try{return JSON.parse(localStorage.getItem(key)||"[]")}catch{return []}}
  function saveDemo(row){const list=demoHistory();list.unshift(row);localStorage.setItem(key,JSON.stringify(list.slice(0,20)));}

  window.AZWO_DATA={
    mode: hasSupabase&&!config.demoMode?"supabase":"demo",
    client,
    async getSession(){
      if(!client)return null;
      const {data}=await client.auth.getSession();return data.session||null;
    },
    async signIn(email,password){
      if(!client)throw new Error("Supabase غير مهيأ بعد");
      return client.auth.signInWithPassword({email,password});
    },
    async signOut(){if(client)return client.auth.signOut();},
    async createVerification(payload){
      if(!client||config.demoMode){
        const row={id:"DEMO-"+Date.now(),...payload,status:"completed",created_at:new Date().toISOString()};
        saveDemo(row);return row;
      }
      const {data,error}=await client.from("verification_jobs").insert(payload).select().single();
      if(error)throw error;return data;
    },
    async listRecent(orgId){
      if(!client||config.demoMode)return demoHistory();
      const {data,error}=await client.from("verification_jobs").select("*").eq("organization_id",orgId).order("created_at",{ascending:false}).limit(20);
      if(error)throw error;return data;
    }
  };
})();