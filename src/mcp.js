// uzinaduzina.org · Model Context Protocol server (read-only).
//
// Speaks JSON-RPC 2.0 over Cloudflare's streamable-HTTP transport at /mcp.
// Stateless: no sessions, no GET long-poll, no batched requests, no SSE.
// Two tools, both read-only:
//
//   list_notes              → returns the index of every published note
//   fetch_note_markdown     → returns the markdown source of one note
//
// Both tools call env.ASSETS internally — they do not reach out to the
// public network — so the server cannot leak anything beyond what is
// already published as static content.
//
// Spec: https://modelcontextprotocol.io/specification/2025-06-18

const PROTOCOL_VERSION = "2025-06-18";

const SERVER_INFO = {
  name: "uzinaduzina-content",
  version: "0.1.0",
};

const INSTRUCTIONS =
  "Read-only access to the editorial content of uzinaduzina.org. " +
  "Two tools: list_notes returns the full index of every published note " +
  "(projects, team, manifesto principles, partners, curiosities, organisation pages), " +
  "fetch_note_markdown returns the markdown source of a single note by slug. " +
  "Slugs follow the convention: project-<slug>, team-<slug>, partner-<slug>, " +
  "manifesto-<slug>, curiosity-<slug>, or top-level slugs like who-we-are.";

const TOOLS = [
  {
    name: "list_notes",
    description:
      "Return the index of every published note on uzinaduzina.org with type, title, kicker, summary, and slug. " +
      "Use this first to discover what is available, then call fetch_note_markdown for the bodies you want.",
    inputSchema: {
      type: "object",
      properties: {},
      additionalProperties: false,
    },
  },
  {
    name: "fetch_note_markdown",
    description:
      "Fetch the original Markdown source for a single note by slug (e.g. \"project-democraicy\", " +
      "\"manifesto-living-heritage\", \"team-liviu-pop\"). Returns YAML front matter plus body verbatim.",
    inputSchema: {
      type: "object",
      properties: {
        slug: {
          type: "string",
          description:
            "Note slug, no .md extension. Must match ^[\\w-]+$. See list_notes for available slugs.",
        },
      },
      required: ["slug"],
      additionalProperties: false,
    },
  },
];

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
  "Access-Control-Allow-Headers":
    "Content-Type, Mcp-Session-Id, Mcp-Protocol-Version, Authorization",
  "Access-Control-Expose-Headers": "Mcp-Session-Id, Mcp-Protocol-Version",
  "Access-Control-Max-Age": "86400",
};

function jsonResponse(body, status = 200, extra = {}) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Mcp-Protocol-Version": PROTOCOL_VERSION,
      ...CORS_HEADERS,
      ...extra,
    },
  });
}

function rpcError(id, code, message, data) {
  return jsonResponse({
    jsonrpc: "2.0",
    id: id ?? null,
    error: { code, message, ...(data !== undefined ? { data } : {}) },
  });
}

function rpcResult(id, result) {
  return jsonResponse({ jsonrpc: "2.0", id, result });
}

function ackNotification() {
  return new Response(null, {
    status: 202,
    headers: { ...CORS_HEADERS, "Mcp-Protocol-Version": PROTOCOL_VERSION },
  });
}

export async function handleMcp(request, env) {
  // CORS preflight.
  if (request.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: CORS_HEADERS });
  }

  // GET: friendly discovery for humans / curl. The actual protocol is JSON-RPC
  // over POST, but a GET to /mcp returns a brief summary so a developer can
  // verify the endpoint is alive and what it claims to expose.
  if (request.method === "GET") {
    return jsonResponse({
      message: "uzinaduzina MCP server",
      transport: "streamable-http (JSON-RPC 2.0 over POST)",
      protocolVersion: PROTOCOL_VERSION,
      serverInfo: SERVER_INFO,
      capabilities: { tools: { listChanged: false } },
      tools: TOOLS.map((t) => ({ name: t.name, description: t.description })),
      serverCard: "https://uzinaduzina.org/.well-known/mcp/server-card.json",
      docs: "https://uzinaduzina.org/DOCUMENTATION.md",
    });
  }

  if (request.method !== "POST") {
    return rpcError(null, -32600, "POST required");
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return rpcError(null, -32700, "Parse error");
  }

  // Batch requests are valid in JSON-RPC 2.0 but not in MCP's streamable-HTTP
  // transport. Reject with a clear error.
  if (Array.isArray(body)) {
    return rpcError(null, -32600, "Batch requests are not supported");
  }

  return await dispatch(body, request, env);
}

async function dispatch(req, request, env) {
  const { jsonrpc, id, method, params } = req || {};
  if (jsonrpc !== "2.0") return rpcError(id, -32600, 'jsonrpc must be "2.0"');
  if (typeof method !== "string")
    return rpcError(id, -32600, "method must be a string");

  const isNotification = id === undefined || id === null;

  try {
    switch (method) {
      case "initialize": {
        const result = {
          protocolVersion: PROTOCOL_VERSION,
          serverInfo: SERVER_INFO,
          capabilities: { tools: { listChanged: false } },
          instructions: INSTRUCTIONS,
        };
        return isNotification ? ackNotification() : rpcResult(id, result);
      }

      // Client-side notifications we accept and ignore.
      case "notifications/initialized":
      case "notifications/cancelled":
      case "notifications/progress":
      case "notifications/roots/list_changed":
        return ackNotification();

      case "ping":
        return isNotification ? ackNotification() : rpcResult(id, {});

      case "tools/list":
        if (isNotification)
          return rpcError(id, -32600, "method must not be a notification");
        return rpcResult(id, { tools: TOOLS });

      case "tools/call": {
        if (isNotification)
          return rpcError(id, -32600, "method must not be a notification");
        const name = params && params.name;
        const args = (params && params.arguments) || {};
        if (typeof name !== "string")
          return rpcError(id, -32602, "params.name (string) is required");
        const result = await callTool(name, args, request, env);
        return rpcResult(id, result);
      }

      // Resources and prompts are not implemented; surface that explicitly so
      // clients don't keep retrying.
      case "resources/list":
      case "resources/read":
      case "prompts/list":
      case "prompts/get":
        return rpcError(id, -32601, `Method not implemented: ${method}`);

      default:
        return rpcError(id, -32601, `Method not found: ${method}`);
    }
  } catch (e) {
    return rpcError(
      id,
      -32603,
      `Internal error: ${(e && e.message) || String(e)}`
    );
  }
}

async function callTool(name, args, request, env) {
  if (name === "list_notes") {
    const url = new URL("/content/_index.json", request.url);
    const r = await env.ASSETS.fetch(new Request(url));
    if (!r.ok) {
      return {
        isError: true,
        content: [
          { type: "text", text: `Failed to fetch index (HTTP ${r.status})` },
        ],
      };
    }
    const text = await r.text();
    let notes;
    try {
      notes = JSON.parse(text);
    } catch {
      return {
        isError: true,
        content: [{ type: "text", text: "Index parse error" }],
      };
    }
    return {
      content: [{ type: "text", text }],
      structuredContent: { notes },
    };
  }

  if (name === "fetch_note_markdown") {
    const slug = args.slug;
    if (typeof slug !== "string" || !/^[\w-]+$/.test(slug)) {
      return {
        isError: true,
        content: [
          { type: "text", text: "Invalid slug; must match ^[\\w-]+$." },
        ],
      };
    }
    const url = new URL(`/content/${slug}.md`, request.url);
    const r = await env.ASSETS.fetch(new Request(url));
    if (!r.ok) {
      return {
        isError: true,
        content: [
          { type: "text", text: `Note not found: ${slug} (HTTP ${r.status})` },
        ],
      };
    }
    const markdown = await r.text();
    return {
      content: [{ type: "text", text: markdown }],
      structuredContent: { slug, markdown },
    };
  }

  return {
    isError: true,
    content: [{ type: "text", text: `Tool not found: ${name}` }],
  };
}
