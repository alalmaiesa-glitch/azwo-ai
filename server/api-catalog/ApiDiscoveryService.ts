import type { PublicApiCatalogEntry } from "./types";

export type DiscoveryInput = Pick<
  PublicApiCatalogEntry,
  "name" | "description" | "category" | "auth_type" | "https" | "cors" | "documentation_url"
>;

const trustedProviders = new Set([
  "Crossref Metadata Search",
  "OpenAlex",
  "Semantic Scholar",
  "Europe PMC",
  "arXiv",
  "CORE",
  "Open Science Framework",
  "Open Library",
  "Google Books",
  "Archive.org",
  "Wiktionary",
  "Europeana",
  "Smithsonian Open Access",
  "Trove",
  "British National Bibliography",
]);

const academicCategories = new Set(["Books", "Science & Math", "Open Data"]);
const archiveCategories = new Set(["Open Data", "News", "Art & Design", "Books"]);

export class ApiDiscoveryService {
  static evaluate(api: DiscoveryInput): {
    relevance_score: number;
    azwo_use_case: string | null;
    verification_status: "discovered" | "relevant";
  } {
    const text = `${api.name} ${api.description}`.toLowerCase();
    let base = 0;
    let useCase: string | null = null;

    if (/quran|hadith|sunnah|tafsir|rijal/.test(text)) {
      base = 80;
      useCase =
        /quran/.test(text) && /(hadith|sunnah|tafsir|rijal)/.test(text)
          ? "Quran Verification / Hadith Verification"
          : /quran/.test(text)
            ? "Quran Verification"
            : "Hadith Verification";
    } else if (academicCategories.has(api.category) && (/\bdoi\b|crossref/.test(text))) {
      base = 76;
      useCase = "DOI Lookup / Citation Verification";
    } else if (
      academicCategories.has(api.category) &&
      (/\bcitations?\b|bibliograph/.test(text))
    ) {
      base = 72;
      useCase = "Citation Verification";
    } else if (/\bocr\b|optical character|text recognition/.test(text)) {
      base = 72;
      useCase = "OCR";
    } else if (
      api.category === "Books" &&
      /book|books|library|e-book|ebook|catalog|metadata|manuscript/.test(text)
    ) {
      base = 64;
      useCase = "Book Metadata";
    } else if (
      academicCategories.has(api.category) &&
      /scholarly|academic|research|researcher|research-sharing|research papers|journal|publication|preprint|manuscript/.test(text)
    ) {
      base = 68;
      useCase = "Academic Research";
    } else if (api.category === "Dictionaries") {
      base = 64;
      useCase = "Dictionary";
    } else if (
      archiveCategories.has(api.category) &&
      /archive|historic|historical|digitised|museum|collection metadata|open access digital media/.test(text)
    ) {
      base = 65;
      useCase = "Archive Search";
    } else if (api.category === "Text Analysis" && /translation|translate/.test(text)) {
      base = 62;
      useCase = "Translation";
    } else if (
      ["Text Analysis", "Machine Learning"].includes(api.category) &&
      /natural language|\bnlp\b|text analysis|language/.test(text)
    ) {
      base = 58;
      useCase = "Arabic Language Processing / Text Analysis";
    } else if (
      api.category === "Documents & Productivity" &&
      /extract text|document|pdf/.test(text)
    ) {
      base = 55;
      useCase = "Document Analysis";
    } else if (
      api.category === "Open Data" &&
      /metadata|knowledge|archive/.test(text)
    ) {
      base = 52;
      useCase = "Metadata / General Knowledge";
    } else if (api.category === "Books") {
      base = 44;
      useCase = "Book Metadata";
    }

    if (!base) {
      return { relevance_score: 0, azwo_use_case: null, verification_status: "discovered" };
    }

    let score = base;

    // Phase-one technical signals available in the Public APIs catalog.
    if (api.https) score += 6;
    if (api.auth_type === "No") score += 6;
    else if (/apiKey/i.test(api.auth_type)) score += 3;
    else if (/OAuth/i.test(api.auth_type)) score += 1;

    if (api.cors === "Yes") score += 1;
    if (/^https:\/\//i.test(api.documentation_url)) score += 2;

    // Provider-trust heuristic only. Real trust, licensing, rate limits and
    // commercial-use checks are intentionally deferred to Reviewed/Tested.
    if (trustedProviders.has(api.name)) score += 8;

    if (/rapidapi\.com|herokuapp\.com|vercel\.app/i.test(api.documentation_url)) {
      score -= 3;
    }

    score = Math.max(0, Math.min(100, score));

    return {
      relevance_score: score,
      azwo_use_case: useCase,
      verification_status: score >= 60 ? "relevant" : "discovered",
    };
  }
}
