import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

type ClaimStatus = "supported" | "partial" | "unsupported" | "multiple" | "human_review";
type ClaimType = "quran" | "hadith" | "scholarly_quote" | "general";

type Candidate = {
  text: string;
  context: string;
  type: ClaimType;
  start: number;
  end: number;
  cue?: string;
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

const normalizeArabic = (s: string) =>
  s
    .normalize("NFKD")
    .replace(/[\u064B-\u065F\u0670\u06D6-\u06ED]/g, "")
    .replace(/[ٱأإآ]/g, "ا")
    .replace(/ى/g, "ي")
    .replace(/ة/g, "ه")
    .replace(/ؤ/g, "و")
    .replace(/ئ/g, "ي")
    .replace(/ـ/g, "")
    .replace(/[^\u0621-\u064A0-9]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();

const tokens = (s: string) =>
  normalizeArabic(s)
    .split(" ")
    .filter((x) => x.length > 1);

const similarity = (a: string, b: string) => {
  const A = new Set(tokens(a));
  const B = new Set(tokens(b));
  if (!A.size || !B.size) return 0;
  let inter = 0;
  for (const x of A) if (B.has(x)) inter++;
  return inter / Math.max(A.size, 1);
};

const quranCue = /(قال\s+(?:الله|تعالى|سبحانه|عز\s+وجل)|في\s+قوله\s+تعالى|قال\s+جل\s+وعلا|الآية\s+الكريمة)/;
const hadithCue = /(قال\s+(?:رسول\s+الله|النبي)|عن\s+النبي|رسول\s+الله\s*[ﷺﷻ]?|النبي\s*[ﷺ]?|رواه\s+(?:البخاري|مسلم|الترمذي|أبو\s+داود|النسائي|ابن\s+ماجه)|حديث\s+النبي|ورد\s+عن\s+النبي)/;
const scholarCue = /(قال\s+(?:الإمام|الشيخ|ابن\s+[أ-ي]+)|ذكر\s+(?:الإمام|الشيخ|ابن\s+[أ-ي]+)|نقل\s+عن|نُقل\s+عن|أجمع\s+(?:العلماء|أهل)|اتفق\s+(?:العلماء|الفقهاء))/;

function quotedSpans(text: string) {
  const out: { text: string; start: number; end: number }[] = [];
  const re = /[«“"]([^»”"]{4,500})[»”"]/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(text))) {
    out.push({ text: m[1].trim(), start: m.index, end: re.lastIndex });
  }
  return out;
}

function sentenceSpans(text: string) {
  const out: { text: string; start: number; end: number }[] = [];
  const re = /[^\n.!؟?؛;]+(?:[.!؟?؛;]|$)/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(text))) {
    const v = m[0].trim();
    if (v.length >= 12) out.push({ text: v, start: m.index, end: re.lastIndex });
  }
  return out;
}

function contextAround(text: string, start: number, end: number) {
  const from = Math.max(0, start - 100);
  const to = Math.min(text.length, end + 100);
  return text.slice(from, to).trim();
}

function extractCandidates(text: string): Candidate[] {
  const candidates: Candidate[] = [];
  const used = new Set<string>();

  for (const q of quotedSpans(text)) {
    const context = contextAround(text, q.start, q.end);
    let type: ClaimType = "general";
    let cue = "quoted";
    if (quranCue.test(context)) { type = "quran"; cue = "quran_cue"; }
    else if (hadithCue.test(context)) { type = "hadith"; cue = "hadith_cue"; }
    else if (scholarCue.test(context)) { type = "scholarly_quote"; cue = "scholar_cue"; }
    const key = normalizeArabic(q.text).slice(0, 120);
    if (key && !used.has(key)) {
      used.add(key);
      candidates.push({ text: q.text, context, type, start: q.start, end: q.end, cue });
    }
  }

  for (const s of sentenceSpans(text)) {
    const norm = normalizeArabic(s.text);
    if (norm.split(" ").length < 5) continue;
    let type: ClaimType | null = null;
    let cue = "";
    if (quranCue.test(s.text)) { type = "quran"; cue = "quran_cue"; }
    else if (hadithCue.test(s.text)) { type = "hadith"; cue = "hadith_cue"; }
    else if (scholarCue.test(s.text)) { type = "scholarly_quote"; cue = "scholar_cue"; }
    else if (/(ثبت|ورد|يعد|يُعد|يعني|يدل|سبب|حكم|من\s+المعلوم|الصحيح\s+أن|المشهور\s+أن)/.test(s.text)) {
      type = "general"; cue = "factual_cue";
    }
    if (!type) continue;
    const key = norm.slice(0, 120);
    if (key && !used.has(key)) {
      used.add(key);
      candidates.push({ text: s.text, context: s.text, type, start: s.start, end: s.end, cue });
    }
  }

  return candidates.slice(0, 25);
}

function hadithQuery(candidate: string) {
  return candidate
    .replace(/^(قال\s+(رسول\s+الله|النبي)[^:：-]*[:：-]?\s*)/,"")
    .replace(/^(عن\s+النبي[^:：-]*[:：-]?\s*)/,"")
    .replace(/[«»“”"]/g,"")
    .split(/\s+/)
    .slice(0, 16)
    .join(" ")
    .trim();
}

function extractHadithMatn(cleaned: string) {
  const split = cleaned.split(/الراوي\s*:/);
  return split[0].replace(/^\s*[-–—]?\s*/, "").trim();
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "POST only" }, 405);

  try {
    const auth = req.headers.get("Authorization") || "";
    const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY") || "";
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";

    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: auth } },
    });
    const service = createClient(supabaseUrl, serviceKey);

    const { data: userData, error: userErr } = await userClient.auth.getUser();
    if (userErr || !userData.user) return json({ error: "unauthorized" }, 401);
    const user = userData.user;

    const body = await req.json();
    const text = String(body?.text || "").trim();
    if (text.length < 10) return json({ error: "النص قصير جدًا" }, 400);
    if (text.length > 30000) return json({ error: "الحد الحالي 30000 حرف" }, 400);

    let organizationId = body?.organization_id || null;
    if (!organizationId) {
      const { data: membership } = await userClient
        .from("organization_members")
        .select("organization_id")
        .eq("user_id", user.id)
        .limit(1)
        .maybeSingle();
      organizationId = membership?.organization_id || null;
    }
    if (!organizationId) return json({ error: "أنشئ مساحة مؤسسة أولًا" }, 400);

    const { data: membershipCheck } = await userClient
      .from("organization_members")
      .select("organization_id,role")
      .eq("organization_id", organizationId)
      .eq("user_id", user.id)
      .maybeSingle();
    if (!membershipCheck) return json({ error: "لا تملك صلاحية لهذه المؤسسة" }, 403);

    const { data: job, error: jobErr } = await service
      .from("verification_jobs")
      .insert({
        organization_id: organizationId,
        created_by: user.id,
        input_type: "text",
        input_text: text,
        domain: body?.domain || "عام",
        language: body?.language || "ar",
        status: "processing",
        started_at: new Date().toISOString(),
        metadata: { engine: "azwo-engine-v0.1", extraction: "deterministic" },
      })
      .select()
      .single();
    if (jobErr) throw jobErr;

    const { data: sourceRows } = await service
      .from("sources")
      .select("id,title,canonical_url")
      .in("title", [
        "Tanzil Quran Text",
        "الدرر السنية - الموسوعة الحديثية API",
        "OpenITI Corpus",
        "المكتبة الشاملة",
      ]);
    const sourceMap = new Map((sourceRows || []).map((x: any) => [x.title, x]));

    const candidates = extractCandidates(text);
    const results: any[] = [];
    let ordinal = 1;

    for (const c of candidates) {
      let type: ClaimType = c.type;
      let status: ClaimStatus = "human_review";
      let explanation = "";
      let evidence: any[] = [];
      let requiresHuman = false;

      // Any quoted span can still be a Quran verse even without an explicit cue.
      if (type === "general" || type === "scholarly_quote") {
        const { data: qMatches } = await service.rpc("search_quran_quote", {
          q: c.text,
          limit_count: 3,
        });
        if (qMatches?.length) type = "quran";
      }

      if (type === "quran") {
        const query = c.text
          .replace(/قال\s+(?:الله|تعالى|سبحانه|عز\s+وجل)[^:：-]*[:：-]?/g, "")
          .replace(/[«»“”"]/g, "")
          .trim();
        const { data: qMatches, error: qErr } = await service.rpc("search_quran_quote", {
          q: query,
          limit_count: 5,
        });
        if (qErr) throw qErr;
        if (qMatches?.length) {
          const top = qMatches[0];
          status = "supported";
          explanation = "تم العثور على تطابق في النص القرآني المرجعي المحفوظ من Tanzil.";
          const score = similarity(query, top.text_uthmani);
          evidence = qMatches.slice(0, 3).map((v: any) => ({
            source_id: sourceMap.get("Tanzil Quran Text")?.id || null,
            passage: v.text_uthmani,
            location_text: `سورة ${v.surah}، آية ${v.ayah}`,
            relation: "quran_text_match",
            retrieval_score: score,
            metadata: { provider: "Tanzil", version: v.source_version },
          }));
        } else {
          status = c.cue === "quran_cue" ? "unsupported" : "human_review";
          explanation = c.cue === "quran_cue"
            ? "لم يُعثر على هذا النص ضمن المرجع القرآني المتصل. هذا حكم على المطابقة النصية فقط."
            : "لم يثبت أنه نص قرآني ضمن المرجع المتصل.";
          requiresHuman = status === "human_review";
        }
      } else if (type === "hadith") {
        const query = hadithQuery(c.text);
        if (query.length < 4) {
          status = "human_review";
          requiresHuman = true;
          explanation = "النص المرشح للحديث قصير أو غير واضح بما يكفي للبحث.";
        } else {
          try {
            const upstream = await fetch(
              "https://dorar.net/dorar_api.json?skey=" + encodeURIComponent(query),
              { headers: { "User-Agent": "AZWO/0.1 knowledge-verification" } },
            );
            if (!upstream.ok) throw new Error("Dorar HTTP " + upstream.status);
            const data = await upstream.json();
            const items = Array.isArray(data?.ahadith) ? data.ahadith : [];
            const parsed = items
              .map((item: any) => {
                const cleaned = stripHtml(String(item?.th || ""));
                const matn = extractHadithMatn(cleaned);
                return { cleaned, matn, score: similarity(query, matn), raw: item };
              })
              .sort((a: any, b: any) => b.score - a.score);

            if (parsed.length) {
              const top = parsed[0];
              if (top.score >= 0.55) {
                status = "supported";
                explanation = "وجدت الدرر السنية نتيجة حديثية ذات تشابه نصي مرتفع مع النص.";
              } else if (top.score >= 0.25) {
                status = "partial";
                explanation = "وجدت الدرر السنية نتيجة قريبة، لكن التطابق النصي ليس كافيًا لاعتماد النسبة دون مراجعة.";
                requiresHuman = true;
              } else {
                status = "human_review";
                explanation = "ظهرت نتائج في الدرر السنية، لكنها ليست متقاربة نصيًا بدرجة كافية.";
                requiresHuman = true;
              }
              evidence = parsed.slice(0, 3).map((x: any) => ({
                source_id: sourceMap.get("الدرر السنية - الموسوعة الحديثية API")?.id || null,
                passage: x.cleaned,
                location_text: "نتيجة بحث في الموسوعة الحديثية",
                relation: "hadith_search_match",
                retrieval_score: x.score,
                metadata: { provider: "Dorar", query },
              }));
            } else {
              status = "unsupported";
              explanation = "لم تظهر نتائج لهذا النص في بحث الدرر السنية ضمن الاستعلام الحالي. لا يعني ذلك بالضرورة بطلان الحديث.";
            }
          } catch (err) {
            status = "human_review";
            requiresHuman = true;
            explanation = "تعذر الوصول إلى مصدر الحديث أثناء هذه العملية.";
          }
        }
      } else if (type === "scholarly_quote") {
        status = "human_review";
        requiresHuman = true;
        explanation = "النص يتضمن نسبة علمية أو دعوى إجماع/اتفاق، ولم يُربط بعد بمصدر تراثي مفتوح صالح لهذا المسار.";
      } else {
        status = "human_review";
        requiresHuman = true;
        explanation = "هذه معلومة عامة؛ المصادر المجانية المتصلة حاليًا لا تكفي لتأصيلها آليًا.";
      }

      const { data: claim, error: claimErr } = await service
        .from("claims")
        .insert({
          job_id: job.id,
          ordinal,
          claim_text: c.text,
          claim_type: type,
          start_offset: c.start,
          end_offset: c.end,
          risk_level: type === "quran" || type === "hadith" ? "high" : "medium",
          status,
          explanation,
          requires_human_review: requiresHuman,
          model_metadata: { extractor: "rules-v0.1", cue: c.cue || null },
        })
        .select()
        .single();
      if (claimErr) throw claimErr;

      for (const ev of evidence) {
        await service.from("evidence").insert({ claim_id: claim.id, ...ev });
      }

      results.push({
        id: claim.id,
        ordinal,
        text: c.text,
        type,
        status,
        explanation,
        requires_human_review: requiresHuman,
        evidence,
      });
      ordinal++;
    }

    const summary = {
      total: results.length,
      supported: results.filter((x) => x.status === "supported").length,
      partial: results.filter((x) => x.status === "partial").length,
      unsupported: results.filter((x) => x.status === "unsupported").length,
      human_review: results.filter((x) => x.status === "human_review").length,
      multiple: results.filter((x) => x.status === "multiple").length,
    };
    const evidenceCoverage = summary.total
      ? Math.round(((summary.supported + summary.partial) / summary.total) * 100)
      : 0;

    await service
      .from("verification_jobs")
      .update({
        status: summary.human_review > 0 || summary.partial > 0 ? "needs_review" : "completed",
        technical_score: evidenceCoverage,
        completed_at: new Date().toISOString(),
        metadata: {
          engine: "azwo-engine-v0.1",
          extraction: "deterministic",
          evidence_coverage: evidenceCoverage,
          source_scope: ["Tanzil", "Dorar"],
        },
      })
      .eq("id", job.id);

    await service.from("reports").upsert({
      job_id: job.id,
      summary: {
        ...summary,
        evidence_coverage: evidenceCoverage,
        note: "مؤشر التغطية لا يعني صحة شرعية نهائية.",
      },
      report_version: "0.1",
      published_at: null,
    });

    return json({
      engine: "azwo-engine-v0.1",
      job_id: job.id,
      summary: { ...summary, evidence_coverage: evidenceCoverage },
      claims: results,
      limitations: [
        "لا يستخدم النموذج اللغوي كمصدر.",
        "الآيات تعتمد على Tanzil.",
        "الأحاديث تعتمد على بحث الدرر السنية.",
        "الأقوال والمعلومات العامة تحتاج مصادر إضافية أو مراجعة بشرية حاليًا.",
      ],
    });
  } catch (error) {
    console.error(error);
    return json({ error: error instanceof Error ? error.message : "unknown error" }, 500);
  }
});
