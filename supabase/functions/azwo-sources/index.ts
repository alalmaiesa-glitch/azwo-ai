import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json; charset=utf-8" },
  });

const stripHtml = (value: string) =>
  value
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'")
    .replace(/&amp;/g, "&")
    .replace(/\s+/g, " ")
    .trim();

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "GET") return json({ error: "GET only" }, 405);

  try {
    const url = new URL(req.url);
    const provider = url.searchParams.get("provider");

    if (provider === "dorar") {
      const q = (url.searchParams.get("q") || "").trim();
      if (q.length < 2) return json({ error: "q is required" }, 400);

      const upstream = await fetch(
        "https://dorar.net/dorar_api.json?skey=" + encodeURIComponent(q),
        { headers: { "User-Agent": "AZWO/1.0 knowledge-verification" } },
      );
      if (!upstream.ok) return json({ error: "Dorar upstream error", status: upstream.status }, 502);
      const data = await upstream.json();
      const rawItems = Array.isArray(data?.ahadith) ? data.ahadith : [];
      const items = rawItems.map((item: Record<string, unknown>, index: number) => {
        const html = typeof item.th === "string" ? item.th : "";
        return {
          id: index + 1,
          text: stripHtml(html),
          raw: item,
        };
      });

      return json({
        provider: "dorar",
        source: "الموسوعة الحديثية - الدرر السنية",
        source_url: "https://dorar.net/",
        query: q,
        count: items.length,
        items,
      });
    }

    if (provider === "quranenc") {
      const mode = url.searchParams.get("mode") || "list";
      const translation = url.searchParams.get("translation") || "";
      const sura = url.searchParams.get("sura") || "";
      const aya = url.searchParams.get("aya") || "";
      let endpoint = "https://quranenc.com/api/v1/translations/list";

      if (mode === "list") {
        const language = url.searchParams.get("language");
        if (language) endpoint += "/" + encodeURIComponent(language);
      } else if (mode === "sura") {
        if (!translation || !sura) return json({ error: "translation and sura are required" }, 400);
        endpoint = `https://quranenc.com/api/v1/translation/sura/${encodeURIComponent(translation)}/${encodeURIComponent(sura)}`;
      } else if (mode === "aya") {
        if (!translation || !sura || !aya) return json({ error: "translation, sura and aya are required" }, 400);
        endpoint = `https://quranenc.com/api/v1/translation/aya/${encodeURIComponent(translation)}/${encodeURIComponent(sura)}/${encodeURIComponent(aya)}`;
      } else {
        return json({ error: "invalid quranenc mode" }, 400);
      }

      const upstream = await fetch(endpoint, { headers: { "User-Agent": "AZWO/1.0" } });
      if (!upstream.ok) return json({ error: "QuranEnc upstream error", status: upstream.status }, 502);
      const data = await upstream.json();

      return json({
        provider: "quranenc",
        source: "موسوعة القرآن الكريم - QuranEnc",
        source_url: "https://quranenc.com/",
        endpoint_mode: mode,
        data,
      });
    }

    if (provider === "quran") {
      const sura = Number(url.searchParams.get("sura"));
      const aya = Number(url.searchParams.get("aya"));
      if (!Number.isInteger(sura) || !Number.isInteger(aya)) {
        return json({ error: "numeric sura and aya are required" }, 400);
      }

      const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
      const anonKey = Deno.env.get("SUPABASE_ANON_KEY") || "";
      const upstream = await fetch(
        `${supabaseUrl}/rest/v1/quran_verses?surah=eq.${sura}&ayah=eq.${aya}&select=surah,ayah,text_uthmani,source_version`,
        {
          headers: {
            apikey: anonKey,
            Authorization: req.headers.get("Authorization") || `Bearer ${anonKey}`,
          },
        },
      );
      if (!upstream.ok) return json({ error: "Quran database error", status: upstream.status }, 502);
      const data = await upstream.json();
      const verse = Array.isArray(data) ? data[0] : null;
      if (!verse) return json({ error: "verse not found" }, 404);

      return json({
        provider: "quran",
        source: "Tanzil Project",
        source_url: "https://tanzil.net/",
        license: "CC BY 3.0 — verbatim text; modification prohibited",
        verse,
      });
    }

    return json({
      error: "provider is required",
      providers: ["quran", "dorar", "quranenc"],
    }, 400);
  } catch (error) {
    return json({ error: error instanceof Error ? error.message : "unknown error" }, 500);
  }
});
