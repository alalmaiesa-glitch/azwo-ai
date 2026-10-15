import { ApiDiscoveryService } from "./ApiDiscoveryService";
import type { PublicApiCatalogEntry } from "./types";

export const PUBLIC_APIS_REPOSITORY = "public-apis/public-apis";
export const PUBLIC_APIS_README =
  "https://raw.githubusercontent.com/public-apis/public-apis/master/README.md";

export function parsePublicApisReadme(
  markdown: string,
  sourceRef: string,
): PublicApiCatalogEntry[] {
  const lines = markdown.split(/\r?\n/);
  let category = "";
  const rows: PublicApiCatalogEntry[] = [];
  const seen = new Set<string>();

  for (const line of lines) {
    const heading = line.match(/^###\s+(.+?)\s*$/);
    if (heading) {
      category = heading[1].replace(/\s*<a.*$/, "").trim();
    }

    if (!line.startsWith("|")) continue;

    const cells = line
      .split("|")
      .slice(1, -1)
      .map((cell) => cell.trim());

    if (cells.length !== 5) continue;

    const link = cells[0].match(/^\[([^\]]+)\]\(([^)]+)\)$/);
    if (!link) continue;

    const httpsRaw = cells[3].replace(/\`/g, "");
    const cors = cells[4].replace(/\`/g, "") as "Yes" | "No" | "Unknown";

    // Excludes non-API five-column tables (for example MCP tables) that do
    // not follow the Public APIs HTTPS/CORS schema.
    if (!["Yes", "No"].includes(httpsRaw)) continue;
    if (!["Yes", "No", "Unknown"].includes(cors)) continue;

    const name = link[1];
    const documentationUrl = link[2];
    const key = `${name}\n${documentationUrl}`;

    // README currently contains a small number of exact duplicates across
    // categories. AZWO keeps one registry record per name + URL.
    if (seen.has(key)) continue;
    seen.add(key);

    const input = {
      name,
      description: cells[1],
      category,
      auth_type:
        cells[2]
          .replace(/\`|\\/g, "")
          .replace(/\u0007/g, "a")
          .trim() || "No",
      https: httpsRaw === "Yes",
      cors,
      documentation_url: documentationUrl,
    };

    const discovery = ApiDiscoveryService.evaluate(input);

    rows.push({
      ...input,
      source: sourceRef,
      ...discovery,
      integration_status: "not_connected",
      enabled: false,
      last_checked_at: null,
    });
  }

  return rows;
}
