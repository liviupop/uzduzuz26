import { handleMcp } from "./mcp.js";

// uzinaduzina.org · Cloudflare Worker.
//
// Two responsibilities:
//
//   1. Static asset proxy.
//      Every request not aimed at /mcp is forwarded to env.ASSETS (the
//      Cloudflare Workers Static Assets bundle, configured in wrangler.jsonc)
//      and the response is post-processed to add discovery and security
//      headers that pure static hosting cannot set on its own.
//
//   2. MCP server.
//      Requests to /mcp are handled by src/mcp.js, which speaks JSON-RPC 2.0
//      over Cloudflare's streamable-HTTP transport and exposes two read-only
//      tools (list_notes, fetch_note_markdown). The MCP handler maintains
//      its own CORS and content-type headers; the asset post-processing
//      pipeline is bypassed for /mcp.
//
// What it adds, by content type:
//
//   text/html        Link: response headers (RFC 8288 link relations)
//                    pointing at /.well-known/api-catalog, /llms.txt,
//                    /DOCUMENTATION.md, /content/, /sitemap.xml, plus
//                    Vary: Accept for future content negotiation.
//
//   *.md             Content-Type: text/markdown; charset=utf-8 (so agents
//                    treat it as markdown, not text/plain or octet-stream).
//
//   /.well-known/    Content-Type: application/linkset+json
//   api-catalog
//
//   /.well-known/    Content-Type: application/json
//   agent-skills/
//   index.json
//
//   any              Referrer-Policy: strict-origin-when-cross-origin
//                    X-Content-Type-Options: nosniff
//
// The Worker does not implement content negotiation (Accept: text/markdown
// rewriting). Cloudflare's "Markdown for Agents" toggle handles that
// natively; or a future pass can add it here. The Worker also does not
// expose any state, mutate any storage, or call out to third parties.

const LINK_HEADERS = [
  '</.well-known/api-catalog>; rel="api-catalog"; type="application/linkset+json"',
  '</.well-known/agent-skills/index.json>; rel="https://agentskills.io/discovery"; type="application/json"',
  '</.well-known/mcp/server-card.json>; rel="https://modelcontextprotocol.io/server-card"; type="application/json"',
  '</.well-known/oauth-protected-resource>; rel="oauth-protected-resource"; type="application/json"',
  '</DOCUMENTATION.md>; rel="service-doc"; type="text/markdown"; title="Site documentation"',
  '</README.md>; rel="service-doc"; type="text/markdown"; title="Quickstart"',
  '</llms.txt>; rel="describedby"; type="text/plain"',
  '</content/>; rel="alternate"; type="text/markdown"',
  '</sitemap.xml>; rel="sitemap"; type="application/xml"',
];

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    // The MCP server lives at /mcp. It handles its own CORS, content type,
    // method validation, and JSON-RPC framing — let it answer directly
    // without going through the asset proxy or post-processing pipeline.
    if (url.pathname === "/mcp") {
      return handleMcp(request, env);
    }

    // Markdown for Agents: content negotiation on the SPA shell.
    // Requests with Accept: text/markdown that target / or /?n=slug receive
    // the underlying markdown source instead of the HTML shell. HTML stays
    // the default for browsers; this only triggers when the client opts in.
    const accept = (request.headers.get("accept") || "").toLowerCase();
    const wantsMarkdown =
      accept.includes("text/markdown") || accept.includes("application/markdown");
    if (wantsMarkdown && (url.pathname === "/" || url.pathname === "/index.html")) {
      const md = await markdownForSpa(url, request, env);
      if (md) return md;
    }

    const response = await env.ASSETS.fetch(request);

    // Only post-process successful or 304 responses; pass others through
    // unchanged so error pages from the assets layer keep their semantics.
    if (response.status >= 400) {
      return response;
    }

    const path = url.pathname;
    const contentType = (response.headers.get("content-type") || "").toLowerCase();
    const isHtml = contentType.startsWith("text/html");
    const isMarkdown = path.endsWith(".md");
    const isApiCatalog = path === "/.well-known/api-catalog";
    const isAgentSkills = path === "/.well-known/agent-skills/index.json";
    const isOauthProtectedResource = path === "/.well-known/oauth-protected-resource";
    const isMcpServerCard = path === "/.well-known/mcp/server-card.json";

    // Fast path: no header changes needed.
    if (!isHtml && !isMarkdown && !isApiCatalog && !isAgentSkills && !isOauthProtectedResource && !isMcpServerCard) {
      return response;
    }

    const newHeaders = new Headers(response.headers);

    if (isHtml) {
      // Append each Link relation as a separate header value (a single header
      // with comma-separated values is also allowed by RFC 8288, but separate
      // values is friendlier to naive parsers).
      for (const link of LINK_HEADERS) {
        newHeaders.append("Link", link);
      }
      const vary = newHeaders.get("Vary");
      newHeaders.set("Vary", vary ? `${vary}, Accept` : "Accept");
    }

    if (isMarkdown && !contentType.startsWith("text/markdown")) {
      newHeaders.set("Content-Type", "text/markdown; charset=utf-8");
    }

    if (isApiCatalog) {
      newHeaders.set("Content-Type", "application/linkset+json; charset=utf-8");
    }

    if (isAgentSkills || isMcpServerCard || isOauthProtectedResource) {
      newHeaders.set("Content-Type", "application/json; charset=utf-8");
    }

    if (!newHeaders.has("Referrer-Policy")) {
      newHeaders.set("Referrer-Policy", "strict-origin-when-cross-origin");
    }
    if (!newHeaders.has("X-Content-Type-Options")) {
      newHeaders.set("X-Content-Type-Options", "nosniff");
    }

    return new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers: newHeaders,
    });
  },
};

// Resolve a markdown response for a request to the SPA shell. Picks the
// "active" slug from ?n= and ?a=, fetches /content/<slug>.md from the
// assets binding, falls back to /llms.txt when no specific note is named.
// Returns null if no markdown is available so the caller can fall through
// to the normal HTML response.
async function markdownForSpa(url, request, env) {
  const n = url.searchParams.get("n");
  let slug = null;
  if (n) {
    const slugs = n.split(",").filter(Boolean);
    let active = slugs.length - 1;
    const aRaw = url.searchParams.get("a");
    if (aRaw !== null) {
      const aN = parseInt(aRaw, 10);
      if (!Number.isNaN(aN) && aN >= 0 && aN < slugs.length) active = aN;
    }
    const candidate = slugs[active];
    if (candidate && /^[\w-]+$/.test(candidate)) slug = candidate;
  }

  // Try the specific note first; fall back to llms.txt.
  const candidates = [];
  if (slug) candidates.push(`/content/${slug}.md`);
  candidates.push("/llms.txt");

  for (const path of candidates) {
    const r = await env.ASSETS.fetch(new Request(new URL(path, request.url)));
    if (!r.ok) continue;
    const text = await r.text();
    return new Response(text, {
      status: 200,
      headers: {
        "Content-Type": "text/markdown; charset=utf-8",
        "Vary": "Accept",
        // Rough token estimate: ~4 chars per token (OpenAI/Anthropic
        // tokenizers cluster around this for English prose).
        "X-Markdown-Tokens": String(Math.max(1, Math.ceil(text.length / 4))),
        "Cache-Control": "public, max-age=300",
        "Referrer-Policy": "strict-origin-when-cross-origin",
        "X-Content-Type-Options": "nosniff",
        "X-Markdown-Source": path,
      },
    });
  }
  return null;
}
