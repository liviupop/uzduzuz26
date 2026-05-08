// uzinaduzina.org · /admin · password-gated content editor.
//
// Lives at /admin/* on the deployed Worker. Reads and writes content/*.md
// via the GitHub API, so every save lands as a commit on main and triggers
// Cloudflare's auto-deploy (~60 s to live).
//
// Required Cloudflare Worker secrets (set in dashboard or via wrangler):
//   ADMIN_USERS      — JSON map of username → password, e.g.
//                      {"username": "password", "alice": "..."}
//   SESSION_SECRET   — random string used to HMAC-sign session cookies
//   GITHUB_TOKEN     — GitHub Personal Access Token (fine-grained, scope:
//                      Contents Read & Write on liviupop/uzduzuz26)
//
// Multi-user: append more entries to ADMIN_USERS. Each user's commits are
// authored under their own name in the git log (committer.name = username).

const REPO_OWNER = "liviupop";
const REPO_NAME = "uzduzuz26";
const REPO_BRANCH = "main";
const COOKIE_NAME = "uzd_admin_session";
const SESSION_TTL_SECONDS = 7 * 24 * 60 * 60; // 7 days

const TYPE_PREFIXES = {
  project: "project-",
  person: "team-",
  partner: "partner-",
  principle: "manifesto-",
  curiosity: "curiosity-",
};

const ACCENTS = ["indigo", "ochre", "green"];

export async function handleAdmin(request, env) {
  if (!env.ADMIN_USERS || !env.SESSION_SECRET || !env.GITHUB_TOKEN) {
    return errorPage(
      "Admin not configured",
      "The Worker is missing one or more required secrets: ADMIN_USERS, SESSION_SECRET, GITHUB_TOKEN. Set them in the Cloudflare dashboard (Workers → uzduzuz26 → Settings → Variables and Secrets) or via wrangler.",
      503
    );
  }

  const url = new URL(request.url);
  const path = url.pathname;
  const method = request.method;

  if (path === "/admin/login" && method === "POST") return await handleLogin(request, env);
  if (path === "/admin/logout") return handleLogout();

  const session = await validateSession(request, env);

  if (!session) {
    if (path === "/admin" || path === "/admin/") return loginPage();
    return Response.redirect(new URL("/admin", url).toString(), 302);
  }

  if (path === "/admin" || path === "/admin/") return Response.redirect(new URL("/admin/notes", url).toString(), 302);
  if (path === "/admin/notes") return await notesListPage(env, session);
  if (path === "/admin/edit") return await editorPage(url, env, session);
  if (path === "/admin/save" && method === "POST") return await handleSave(request, env, session);
  if (path === "/admin/delete" && method === "POST") return await handleDelete(request, env, session);
  if (path === "/admin/new" && method === "GET") return newNotePage(session);
  if (path === "/admin/new" && method === "POST") return await handleNewNote(request, env, session);
  if (path === "/admin/images/upload" && method === "POST") return await handleImageUpload(request, env, session);
  if (path === "/admin/images/delete" && method === "POST") return await handleImageDelete(request, env, session);

  return errorPage("Not found", `No admin route matches ${path}.`, 404);
}

// ---------------------------------------------------------------- auth ---

async function handleLogin(request, env) {
  const form = await request.formData();
  const username = String(form.get("username") || "").trim();
  const password = String(form.get("password") || "");

  if (!username || !password) return loginPage("Missing username or password.");

  let users;
  try {
    users = JSON.parse(env.ADMIN_USERS);
  } catch {
    return errorPage("Server misconfigured", "ADMIN_USERS secret is not valid JSON.", 500);
  }

  if (!Object.prototype.hasOwnProperty.call(users, username) || users[username] !== password) {
    return loginPage("Invalid username or password.");
  }

  const cookie = await createSessionCookie(username, env);
  const headers = new Headers({
    Location: "/admin/notes",
    "Set-Cookie": cookie,
  });
  return new Response(null, { status: 302, headers });
}

function handleLogout() {
  const headers = new Headers({
    Location: "/admin",
    "Set-Cookie": `${COOKIE_NAME}=; Path=/admin; HttpOnly; Secure; SameSite=Strict; Max-Age=0`,
  });
  return new Response(null, { status: 302, headers });
}

async function createSessionCookie(username, env) {
  const expiresAt = Date.now() + SESSION_TTL_SECONDS * 1000;
  const payload = `${username}:${expiresAt}`;
  const sig = await hmacSign(payload, env.SESSION_SECRET);
  const token = b64url(payload) + "." + sig;
  return `${COOKIE_NAME}=${token}; Path=/admin; HttpOnly; Secure; SameSite=Strict; Max-Age=${SESSION_TTL_SECONDS}`;
}

async function validateSession(request, env) {
  const cookieHeader = request.headers.get("Cookie") || "";
  const m = cookieHeader.match(new RegExp(`(?:^|; )${COOKIE_NAME}=([^;]+)`));
  if (!m) return null;

  const [encodedPayload, signature] = m[1].split(".");
  if (!encodedPayload || !signature) return null;

  let payload;
  try {
    payload = b64urlDecode(encodedPayload);
  } catch {
    return null;
  }

  const expected = await hmacSign(payload, env.SESSION_SECRET);
  if (!constantTimeEqual(expected, signature)) return null;

  const colonIdx = payload.lastIndexOf(":");
  if (colonIdx < 0) return null;
  const username = payload.slice(0, colonIdx);
  const expiresAt = parseInt(payload.slice(colonIdx + 1), 10);
  if (!Number.isFinite(expiresAt) || Date.now() >= expiresAt) return null;

  return { username, expiresAt };
}

async function hmacSign(message, secret) {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    enc.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const sig = await crypto.subtle.sign("HMAC", key, enc.encode(message));
  return b64urlBytes(new Uint8Array(sig));
}

function constantTimeEqual(a, b) {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

function b64url(str) {
  return btoa(unescape(encodeURIComponent(str)))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

function b64urlBytes(bytes) {
  let s = "";
  for (const b of bytes) s += String.fromCharCode(b);
  return btoa(s).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function b64urlDecode(str) {
  const padded = str.replace(/-/g, "+").replace(/_/g, "/") + "===".slice((str.length + 3) % 4);
  return decodeURIComponent(escape(atob(padded)));
}

// ------------------------------------------------------- github plumbing ---

async function ghFetch(pathAndQuery, options, env) {
  const url = `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}${pathAndQuery}`;
  const headers = {
    Authorization: `Bearer ${env.GITHUB_TOKEN}`,
    Accept: "application/vnd.github+json",
    "X-GitHub-Api-Version": "2022-11-28",
    "User-Agent": "uzinaduzina-admin",
    ...(options && options.headers ? options.headers : {}),
  };
  return fetch(url, { ...(options || {}), headers });
}

async function listContentDir(env) {
  const r = await ghFetch(`/contents/content?ref=${REPO_BRANCH}`, {}, env);
  if (!r.ok) throw new Error(`GitHub list failed: HTTP ${r.status}`);
  const data = await r.json();
  return data
    .filter((f) => f.type === "file" && f.name.endsWith(".md") && !f.name.startsWith("_"))
    .map((f) => ({ name: f.name, slug: f.name.replace(/\.md$/, ""), sha: f.sha, size: f.size, path: f.path }));
}

async function readContentFile(slug, env) {
  const r = await ghFetch(`/contents/content/${slug}.md?ref=${REPO_BRANCH}`, {}, env);
  if (r.status === 404) return null;
  if (!r.ok) throw new Error(`GitHub read failed: HTTP ${r.status}`);
  const data = await r.json();
  const text = decodeURIComponent(escape(atob(data.content.replace(/\n/g, ""))));
  return { content: text, sha: data.sha };
}

async function writeContentFile({ slug, content, sha, message, username, env }) {
  const body = {
    message,
    content: btoa(unescape(encodeURIComponent(content))),
    branch: REPO_BRANCH,
    committer: { name: username, email: `${username}@admin.uzinaduzina.org` },
    author: { name: username, email: `${username}@admin.uzinaduzina.org` },
  };
  if (sha) body.sha = sha;

  const r = await ghFetch(
    `/contents/content/${encodeURIComponent(slug)}.md`,
    { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) },
    env
  );
  if (!r.ok) {
    const errBody = await r.text();
    throw new Error(`GitHub PUT failed: HTTP ${r.status} ${errBody}`);
  }
  return await r.json();
}

// List the image files at assets/images/<slug>/. Returns [] if the
// directory does not exist yet. Sorted by filename so the order matches
// what the renderer shows.
async function listImages(slug, env) {
  const r = await ghFetch(`/contents/assets/images/${encodeURIComponent(slug)}?ref=${REPO_BRANCH}`, {}, env);
  if (r.status === 404) return [];
  if (!r.ok) throw new Error(`GitHub image list failed: HTTP ${r.status}`);
  const data = await r.json();
  if (!Array.isArray(data)) return [];
  return data
    .filter((f) => f.type === "file" && /\.(jpe?g|png|webp|gif|avif)$/i.test(f.name))
    .map((f) => ({ name: f.name, sha: f.sha, size: f.size, path: f.path }))
    .sort((a, b) => a.name.localeCompare(b.name));
}

async function writeBinaryFile({ path, base64Content, sha, message, username, env }) {
  const body = {
    message,
    content: base64Content,
    branch: REPO_BRANCH,
    committer: { name: username, email: `${username}@admin.uzinaduzina.org` },
    author: { name: username, email: `${username}@admin.uzinaduzina.org` },
  };
  if (sha) body.sha = sha;
  const r = await ghFetch(
    `/contents/${path.split("/").map(encodeURIComponent).join("/")}`,
    { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) },
    env
  );
  if (!r.ok) {
    const errBody = await r.text();
    throw new Error(`GitHub binary PUT failed: HTTP ${r.status} ${errBody}`);
  }
  return await r.json();
}

async function deleteFileAtPath({ path, sha, message, username, env }) {
  const body = {
    message,
    sha,
    branch: REPO_BRANCH,
    committer: { name: username, email: `${username}@admin.uzinaduzina.org` },
    author: { name: username, email: `${username}@admin.uzinaduzina.org` },
  };
  const r = await ghFetch(
    `/contents/${path.split("/").map(encodeURIComponent).join("/")}`,
    { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) },
    env
  );
  if (!r.ok) {
    const errBody = await r.text();
    throw new Error(`GitHub DELETE failed: HTTP ${r.status} ${errBody}`);
  }
  return await r.json();
}

async function deleteContentFile({ slug, sha, message, username, env }) {
  const body = {
    message,
    sha,
    branch: REPO_BRANCH,
    committer: { name: username, email: `${username}@admin.uzinaduzina.org` },
    author: { name: username, email: `${username}@admin.uzinaduzina.org` },
  };
  const r = await ghFetch(
    `/contents/content/${encodeURIComponent(slug)}.md`,
    { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) },
    env
  );
  if (!r.ok) {
    const errBody = await r.text();
    throw new Error(`GitHub DELETE failed: HTTP ${r.status} ${errBody}`);
  }
  return await r.json();
}

// ----------------------------------------------------- index lookup ---

async function loadIndexBySlug(env) {
  // Pull _index.json from the live site so we can decorate the file list with
  // titles/kickers without parsing front matter ourselves.
  try {
    const r = await env.ASSETS.fetch(new Request("https://uzinaduzina.org/content/_index.json"));
    if (!r.ok) return new Map();
    const arr = await r.json();
    const m = new Map();
    for (const entry of arr) m.set(entry.slug, entry);
    return m;
  } catch {
    return new Map();
  }
}

function inferType(slug) {
  for (const [type, prefix] of Object.entries(TYPE_PREFIXES)) {
    if (slug.startsWith(prefix)) return type;
  }
  return "note";
}

// ------------------------------------------------------------ pages ---

function htmlResponse(html, status = 200, extraHeaders = {}) {
  return new Response(html, {
    status,
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "no-store",
      "Referrer-Policy": "strict-origin-when-cross-origin",
      "X-Content-Type-Options": "nosniff",
      ...extraHeaders,
    },
  });
}

function shell(title, bodyHtml, session) {
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex, nofollow">
<title>${escapeHtml(title)} · uzinaduzina admin</title>
<link rel="stylesheet" href="/assets/tokens.css">
<style>
  body { background: var(--bg); color: var(--ink); margin: 0; font-family: var(--font-body); padding-bottom: 96px; }
  .admin-chrome {
    position: sticky; top: 0; z-index: 5;
    display: flex; align-items: baseline; gap: 16px;
    padding: 14px 24px;
    background: var(--bg); border-bottom: 1px solid var(--rule);
  }
  .admin-chrome .title { font-family: var(--font-display); font-weight: 900; font-size: 22px; letter-spacing: -0.02em; }
  .admin-chrome .who { font-family: var(--font-ui); font-size: 12px; color: var(--ink-muted); margin-left: auto; }
  .admin-chrome a { color: var(--accent); text-decoration: none; padding: 6px 10px; border-radius: 2px; }
  .admin-chrome a:hover { background: var(--bg-paper); }
  main { max-width: 880px; margin: 0 auto; padding: 32px 24px; }
  h1 { font-family: var(--font-display); font-weight: 900; font-size: 36px; line-height: 1.1; margin: 0 0 24px; }
  h2 { font-family: var(--font-display); font-weight: 800; font-size: 22px; margin: 32px 0 12px; color: var(--ink); }
  h2 .count { font-family: var(--font-ui); font-size: 12px; font-weight: 500; color: var(--ink-muted); margin-left: 8px; }
  ul.files { list-style: none; margin: 0; padding: 0; border-top: 1px solid var(--rule); }
  ul.files li { border-bottom: 1px solid var(--rule); padding: 12px 0; display: grid; grid-template-columns: 1fr auto; gap: 8px; align-items: baseline; }
  ul.files li:hover { background: var(--bg-paper); padding-left: 8px; }
  ul.files a.tt { font-family: var(--font-display); font-weight: 700; font-size: 18px; color: var(--ink); text-decoration: none; }
  ul.files a.tt:hover { color: var(--accent); }
  ul.files .meta { font-family: var(--font-ui); font-size: 11px; color: var(--ink-muted); letter-spacing: 0.04em; text-transform: uppercase; }
  ul.files .slug { font-family: var(--font-mono); font-size: 12px; color: var(--ink-muted); margin-top: 2px; }
  .toolbar { display: flex; gap: 12px; align-items: center; margin: 0 0 24px; flex-wrap: wrap; }
  .btn {
    display: inline-block; padding: 10px 16px; background: var(--ink); color: var(--bg);
    text-decoration: none; border-radius: 2px; font-family: var(--font-ui); font-size: 13px;
    border: 0; cursor: pointer; font-weight: 500;
  }
  .btn:hover { background: var(--accent); }
  .btn.ghost { background: transparent; color: var(--ink); border: 1px solid var(--rule); }
  .btn.ghost:hover { border-color: var(--accent); color: var(--accent); background: transparent; }
  .btn.danger { background: transparent; color: var(--ink-muted); border: 1px solid var(--rule); }
  .btn.danger:hover { background: #c44; color: white; border-color: #c44; }
  textarea { width: 100%; box-sizing: border-box; min-height: 60vh; padding: 16px; border: 1px solid var(--rule); border-radius: 4px; background: var(--bg); color: var(--ink); font-family: var(--font-mono); font-size: 14px; line-height: 1.55; resize: vertical; }
  input[type=text], input[type=password], select { padding: 10px 12px; border: 1px solid var(--rule); border-radius: 2px; background: var(--bg); color: var(--ink); font-family: var(--font-body); font-size: 14px; box-sizing: border-box; }
  label { display: block; font-family: var(--font-ui); font-size: 12px; letter-spacing: 0.04em; text-transform: uppercase; color: var(--ink-muted); margin: 12px 0 4px; }
  .stack { display: grid; gap: 12px; }
  .stack input, .stack select, .stack textarea { width: 100%; }
  .row { display: flex; gap: 12px; align-items: center; flex-wrap: wrap; margin-top: 16px; }
  .alert { padding: 12px 16px; border-radius: 4px; margin: 16px 0; font-family: var(--font-body); font-size: 14px; }
  .alert.error { background: #fde7e7; color: #842; border: 1px solid #f5c8c8; }
  .alert.success { background: var(--green-soft); color: var(--green); border: 1px solid var(--green); }
  .alert.info { background: var(--bg-paper); color: var(--ink); border: 1px solid var(--rule); }
  .login-card { max-width: 380px; margin: 64px auto; padding: 32px; border: 1px solid var(--rule); border-radius: 8px; background: var(--bg-paper); }
  .login-card h1 { font-size: 24px; margin: 0 0 16px; }
  .commit-msg { font-family: var(--font-ui); font-size: 12px; color: var(--ink-muted); margin: 8px 0; }
  .commit-msg input { width: 100%; }
  .hint { font-family: var(--font-ui); font-size: 13px; color: var(--ink-muted); margin: 8px 0 16px; }
  .hint code { background: var(--bg-paper); padding: 1px 4px; border-radius: 2px; }
  .upload-form { margin: 16px 0 24px; }
  .dropzone {
    display: flex; flex-direction: column; align-items: center; justify-content: center;
    gap: 6px; padding: 32px; margin: 0 0 12px;
    border: 2px dashed var(--rule); border-radius: 6px;
    background: var(--bg-paper); cursor: pointer;
    transition: border-color 150ms var(--ease-out), background 150ms var(--ease-out);
  }
  .dropzone:hover { border-color: var(--accent); background: var(--bg); }
  .dropzone input[type=file] { position: absolute; opacity: 0; pointer-events: none; }
  .dropzone-text { font-family: var(--font-ui); font-size: 14px; color: var(--ink); }
  .dropzone-hint { font-family: var(--font-ui); font-size: 11px; color: var(--ink-muted); }
  .img-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(160px, 1fr)); gap: 12px; margin: 16px 0; }
  .img-tile {
    display: flex; flex-direction: column; gap: 6px;
    padding: 8px; background: var(--bg-paper); border: 1px solid var(--rule); border-radius: 4px;
  }
  .img-tile img { width: 100%; aspect-ratio: 1 / 1; object-fit: cover; border-radius: 2px; background: var(--bg); }
  .img-name {
    font-family: var(--font-mono); font-size: 11px; color: var(--ink-muted);
    overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
  }
  .btn-mini {
    padding: 4px 8px; font-size: 11px; font-family: var(--font-ui);
    background: transparent; color: var(--ink-muted);
    border: 1px solid var(--rule); border-radius: 2px; cursor: pointer;
  }
  .btn-mini:hover { background: #c44; color: white; border-color: #c44; }
</style>
</head>
<body>
<header class="admin-chrome">
  <span class="title">uzinaduzina · admin</span>
  <a href="/admin/notes">notes</a>
  <a href="/admin/new">new note</a>
  <a href="/" target="_blank">view site ↗</a>
  <span class="who">${session ? `signed in as <strong>${escapeHtml(session.username)}</strong> · <a href="/admin/logout">log out</a>` : ""}</span>
</header>
<main>
${bodyHtml}
</main>
</body>
</html>`;
}

function loginPage(error) {
  const errorHtml = error ? `<div class="alert error">${escapeHtml(error)}</div>` : "";
  const body = `
<div class="login-card">
  <h1>sign in</h1>
  ${errorHtml}
  <form method="POST" action="/admin/login" class="stack">
    <div>
      <label for="username">username</label>
      <input id="username" name="username" type="text" autocomplete="username" required autofocus>
    </div>
    <div>
      <label for="password">password</label>
      <input id="password" name="password" type="password" autocomplete="current-password" required>
    </div>
    <div class="row">
      <button class="btn" type="submit">sign in</button>
    </div>
  </form>
</div>`;
  return htmlResponse(shell("Sign in", body, null), error ? 401 : 200);
}

async function notesListPage(env, session) {
  let files, indexBySlug;
  try {
    [files, indexBySlug] = await Promise.all([listContentDir(env), loadIndexBySlug(env)]);
  } catch (e) {
    return errorPage("Failed to list notes", e.message, 502);
  }

  const groups = { project: [], person: [], partner: [], principle: [], curiosity: [], note: [] };
  for (const f of files) {
    const meta = indexBySlug.get(f.slug) || {};
    const type = meta.type || inferType(f.slug);
    (groups[type] || groups.note).push({ ...f, ...meta });
  }
  const order = ["project", "person", "principle", "partner", "curiosity", "note"];
  const labels = {
    project: "projects", person: "team", principle: "manifesto · fundamentals",
    partner: "partners", curiosity: "curiosities", note: "other"
  };

  let body = `
<h1>notes</h1>
<div class="toolbar">
  <a href="/admin/new" class="btn">+ new note</a>
  <a href="/" target="_blank" class="btn ghost">view site ↗</a>
</div>
`;

  for (const type of order) {
    const list = groups[type] || [];
    if (!list.length) continue;
    list.sort((a, b) => (a.order ?? 99) - (b.order ?? 99) || a.slug.localeCompare(b.slug));
    body += `<h2>${labels[type]}<span class="count">${list.length}</span></h2><ul class="files">`;
    for (const f of list) {
      body += `<li>
        <div>
          <a class="tt" href="/admin/edit?slug=${encodeURIComponent(f.slug)}">${escapeHtml(f.title || f.slug)}</a>
          <div class="slug">${escapeHtml(f.slug)}.md · ${escapeHtml(f.kicker || "")}</div>
        </div>
        <div class="meta">${(f.size / 1024).toFixed(1)} KB</div>
      </li>`;
    }
    body += `</ul>`;
  }

  return htmlResponse(shell("Notes", body, session));
}

async function editorPage(url, env, session) {
  const slug = url.searchParams.get("slug") || "";
  if (!/^[\w-]+$/.test(slug)) return errorPage("Invalid slug", "Slug must match ^[\\w-]+$.", 400);

  let file;
  let images = [];
  try {
    file = await readContentFile(slug, env);
    images = await listImages(slug, env);
  } catch (e) {
    return errorPage("Failed to load note", e.message, 502);
  }
  if (!file) return errorPage("Note not found", `No file at content/${slug}.md.`, 404);

  const saved = url.searchParams.get("saved");
  const uploaded = url.searchParams.get("uploaded");
  const removed = url.searchParams.get("removed");
  let alert = "";
  if (saved === "1") {
    const sha = url.searchParams.get("sha") || "";
    alert = `<div class="alert success">Saved to GitHub${sha ? ` (commit <code>${escapeHtml(sha.slice(0, 7))}</code>)` : ""}. Cloudflare will redeploy in ~60 s.</div>`;
  } else if (uploaded) {
    alert = `<div class="alert success">Uploaded ${escapeHtml(uploaded)} image(s). Cloudflare will redeploy in ~60 s.</div>`;
  } else if (removed) {
    alert = `<div class="alert info">Deleted ${escapeHtml(removed)}.</div>`;
  }

  const imagesHtml = renderImagesPanel(slug, images);

  const body = `
<h1>edit · ${escapeHtml(slug)}</h1>
${alert}
<div class="commit-msg">
  <a href="/admin/notes" class="btn ghost" style="margin-right: 8px;">← back</a>
  <a href="/?n=${encodeURIComponent(slug)}" target="_blank" class="btn ghost">preview on live site ↗</a>
</div>
<form method="POST" action="/admin/save" class="stack">
  <input type="hidden" name="slug" value="${escapeHtml(slug)}">
  <input type="hidden" name="sha" value="${escapeHtml(file.sha)}">
  <textarea name="content" autofocus spellcheck="false">${escapeHtml(file.content)}</textarea>
  <div>
    <label for="commit">commit message (optional)</label>
    <input id="commit" name="commit" type="text" placeholder="${escapeHtml(`Edit ${slug}.md via /admin`)}">
  </div>
  <div class="row">
    <button class="btn" type="submit">save</button>
    <button class="btn danger" type="button" onclick="if (confirm('Delete ${escapeHtml(slug)}.md? This cannot be undone except via git history.')) { document.getElementById('del').submit(); }">delete</button>
  </div>
</form>
<form id="del" method="POST" action="/admin/delete" style="display:none">
  <input type="hidden" name="slug" value="${escapeHtml(slug)}">
  <input type="hidden" name="sha" value="${escapeHtml(file.sha)}">
</form>

${imagesHtml}`;

  return htmlResponse(shell(`Edit ${slug}`, body, session));
}

function renderImagesPanel(slug, images) {
  const list = images.map((im) => `
    <div class="img-tile">
      <img src="/assets/images/${encodeURIComponent(slug)}/${encodeURIComponent(im.name)}" alt="">
      <div class="img-name">${escapeHtml(im.name)}</div>
      <form method="POST" action="/admin/images/delete" style="margin:0">
        <input type="hidden" name="slug" value="${escapeHtml(slug)}">
        <input type="hidden" name="filename" value="${escapeHtml(im.name)}">
        <input type="hidden" name="sha" value="${escapeHtml(im.sha)}">
        <button type="submit" class="btn-mini" onclick="return confirm('Delete ${escapeHtml(im.name)}?')">delete</button>
      </form>
    </div>
  `).join("");

  const noteOnFrontMatter = images.length === 0
    ? `<p class="hint">No images yet. Upload a few. They'll be saved to <code>assets/images/${escapeHtml(slug)}/</code> and listed in this note's <code>images:</code> front-matter array — the slideshow will then appear automatically on the live note.</p>`
    : `<p class="hint">Slideshow auto-advances every 5 s. The <code>images:</code> array in the note's front matter controls the order — edit it in the textarea above to reorder. Files live at <code>assets/images/${escapeHtml(slug)}/</code>.</p>`;

  return `
<h2 style="margin-top: 48px;">images <span class="count">${images.length}</span></h2>
${noteOnFrontMatter}

<form method="POST" action="/admin/images/upload" enctype="multipart/form-data" class="upload-form">
  <input type="hidden" name="slug" value="${escapeHtml(slug)}">
  <label class="dropzone">
    <input type="file" name="files" accept="image/*" multiple required>
    <span class="dropzone-text">drop image(s) here, or click to choose</span>
    <span class="dropzone-hint">JPG / PNG / WEBP / GIF · max ~5 MB each</span>
  </label>
  <div class="row">
    <button type="submit" class="btn">upload</button>
    <span class="hint">Each upload is one commit; multiple files in one upload are batched into a single commit when possible.</span>
  </div>
</form>

${images.length ? `<div class="img-grid">${list}</div>` : ""}
`;
}

async function handleSave(request, env, session) {
  const form = await request.formData();
  const slug = String(form.get("slug") || "");
  const sha = String(form.get("sha") || "");
  const content = String(form.get("content") || "");
  const commitMsg = String(form.get("commit") || "").trim() || `Edit ${slug}.md via /admin`;

  if (!/^[\w-]+$/.test(slug)) return errorPage("Invalid slug", "Slug must match ^[\\w-]+$.", 400);
  if (!sha) return errorPage("Missing sha", "Stale request: no sha provided.", 400);

  let result;
  try {
    result = await writeContentFile({
      slug,
      content,
      sha,
      message: commitMsg,
      username: session.username,
      env,
    });
  } catch (e) {
    return errorPage("Save failed", e.message, 502);
  }
  const newSha = result?.commit?.sha || "";
  return Response.redirect(
    new URL(`/admin/edit?slug=${encodeURIComponent(slug)}&saved=1&sha=${encodeURIComponent(newSha)}`, request.url).toString(),
    302
  );
}

async function handleDelete(request, env, session) {
  const form = await request.formData();
  const slug = String(form.get("slug") || "");
  const sha = String(form.get("sha") || "");

  if (!/^[\w-]+$/.test(slug)) return errorPage("Invalid slug", "Slug must match ^[\\w-]+$.", 400);
  if (!sha) return errorPage("Missing sha", "Stale request: no sha provided.", 400);

  try {
    await deleteContentFile({
      slug,
      sha,
      message: `Delete ${slug}.md via /admin`,
      username: session.username,
      env,
    });
  } catch (e) {
    return errorPage("Delete failed", e.message, 502);
  }
  return Response.redirect(new URL("/admin/notes", request.url).toString(), 302);
}

function newNotePage(session, error) {
  const errorHtml = error ? `<div class="alert error">${escapeHtml(error)}</div>` : "";
  const types = Object.keys(TYPE_PREFIXES);
  const body = `
<h1>new note</h1>
${errorHtml}
<form method="POST" action="/admin/new" class="stack">
  <div>
    <label for="type">type</label>
    <select id="type" name="type" required>
      ${types.map((t) => `<option value="${t}">${t} (filename starts with <code>${TYPE_PREFIXES[t]}</code>)</option>`).join("")}
      <option value="other">other (no prefix)</option>
    </select>
  </div>
  <div>
    <label for="slug">slug (kebab-case, [a-z0-9-]+)</label>
    <input id="slug" name="slug" type="text" required pattern="[a-z0-9-]+" placeholder="my-new-thing">
  </div>
  <div>
    <label for="title">title</label>
    <input id="title" name="title" type="text" required placeholder="My new thing">
  </div>
  <div>
    <label for="kicker">kicker (the small label above the title)</label>
    <input id="kicker" name="kicker" type="text" placeholder="project · 2026 · lead">
  </div>
  <div>
    <label for="accent">accent</label>
    <select id="accent" name="accent">
      ${ACCENTS.map((a) => `<option value="${a}">${a}</option>`).join("")}
    </select>
  </div>
  <div>
    <label for="summary">summary (one-line tagline shown in the index)</label>
    <input id="summary" name="summary" type="text">
  </div>
  <div class="row">
    <button class="btn" type="submit">create and edit</button>
    <a href="/admin/notes" class="btn ghost">cancel</a>
  </div>
</form>`;
  return htmlResponse(shell("New note", body, session));
}

async function handleNewNote(request, env, session) {
  const form = await request.formData();
  const type = String(form.get("type") || "");
  const slugRaw = String(form.get("slug") || "").trim().toLowerCase();
  const title = String(form.get("title") || "").trim();
  const kicker = String(form.get("kicker") || "").trim();
  const accent = String(form.get("accent") || "indigo").trim();
  const summary = String(form.get("summary") || "").trim();

  if (!/^[a-z0-9-]+$/.test(slugRaw)) return newNotePage(session, "Slug must be kebab-case ([a-z0-9-]+).");
  if (!title) return newNotePage(session, "Title is required.");

  const prefix = TYPE_PREFIXES[type] || "";
  const slug = prefix && !slugRaw.startsWith(prefix) ? `${prefix}${slugRaw}` : slugRaw;

  // Refuse to overwrite.
  let existing;
  try {
    existing = await readContentFile(slug, env);
  } catch {
    existing = null;
  }
  if (existing) {
    return newNotePage(session, `A note with slug ${slug} already exists. Edit it directly or pick a different slug.`);
  }

  const content = renderTemplate({ slug, type, title, kicker, accent, summary });

  try {
    await writeContentFile({
      slug,
      content,
      sha: null,
      message: `Create ${slug}.md via /admin`,
      username: session.username,
      env,
    });
  } catch (e) {
    return errorPage("Create failed", e.message, 502);
  }
  return Response.redirect(new URL(`/admin/edit?slug=${encodeURIComponent(slug)}`, request.url).toString(), 302);
}

function renderTemplate({ slug, type, title, kicker, accent, summary }) {
  const realType = type === "other" ? "" : type;
  const realKicker = kicker || (type === "project" ? "project · 2026" : type || "");
  const realAccent = accent || "indigo";

  const fmLines = [];
  fmLines.push(`title: ${jsonStr(title)}`);
  fmLines.push(`slug: ${slug}`);
  if (realType) fmLines.push(`type: ${realType}`);
  if (realKicker) fmLines.push(`kicker: ${jsonStr(realKicker)}`);
  fmLines.push(`accent: ${realAccent}`);
  if (type === "project") fmLines.push(`role: lead`);
  fmLines.push(`order: 99`);
  if (summary) fmLines.push(`summary: ${jsonStr(summary)}`);
  fmLines.push(`pills:`);
  fmLines.push(`  - draft`);

  return `---
${fmLines.join("\n")}
---

${summary || "First paragraph: this becomes the lede (italic, accent-coloured left rule)."}

## what it is

Body. Standard Markdown.

## read alongside

- [Manifesto](manifesto)
- [Projects](projects)
`;
}

function jsonStr(s) {
  return JSON.stringify(s);
}

// ------------------------------------------ image upload + delete ---

const MAX_IMAGE_BYTES = 5 * 1024 * 1024; // 5 MB per file
const ALLOWED_IMAGE_EXT = /\.(jpe?g|png|webp|gif|avif)$/i;

async function handleImageUpload(request, env, session) {
  let form;
  try {
    form = await request.formData();
  } catch {
    return errorPage("Bad request", "Could not parse multipart form.", 400);
  }
  const slug = String(form.get("slug") || "");
  if (!/^[\w-]+$/.test(slug)) return errorPage("Invalid slug", "Slug must match ^[\\w-]+$.", 400);

  const files = form.getAll("files").filter((f) => typeof f === "object" && f && f.size > 0);
  if (!files.length) return errorPage("No files", "No files were uploaded.", 400);

  // Compute the next sequential number from existing files. Anything already
  // matching <slug>-NN.<ext> contributes its number to the "used" set; new
  // uploads slot into the lowest unused number, padded to 2 digits.
  let existing = [];
  try {
    existing = await listImages(slug, env);
  } catch (e) {
    return errorPage("Could not check existing images", e.message, 502);
  }
  const slugRe = new RegExp(`^${escapeRegExp(slug)}-(\\d+)\\.`);
  const used = new Set();
  for (const im of existing) {
    const m = im.name.match(slugRe);
    if (m) used.add(parseInt(m[1], 10));
  }
  let nextNum = 1;
  while (used.has(nextNum)) nextNum++;

  const uploaded = [];
  for (const file of files) {
    const origName = file.name || "image";
    if (!ALLOWED_IMAGE_EXT.test(origName)) {
      return errorPage("Bad file type", `${origName}: only jpg, png, webp, gif, avif are allowed.`, 415);
    }
    if (file.size > MAX_IMAGE_BYTES) {
      return errorPage("File too large", `${origName}: ${(file.size / 1024 / 1024).toFixed(1)} MB exceeds the 5 MB limit.`, 413);
    }
    const ext = (origName.match(/\.[a-z0-9]+$/i) || [".jpg"])[0].toLowerCase();
    const newName = `${slug}-${String(nextNum).padStart(2, "0")}${ext}`;
    used.add(nextNum);
    nextNum++;
    while (used.has(nextNum)) nextNum++;

    const buffer = await file.arrayBuffer();
    const b64 = arrayBufferToBase64(buffer);
    try {
      await writeBinaryFile({
        path: `assets/images/${slug}/${newName}`,
        base64Content: b64,
        sha: null,
        message: `Upload ${newName} via /admin`,
        username: session.username,
        env,
      });
      uploaded.push(newName);
    } catch (e) {
      return errorPage("Upload failed", `${origName} → ${newName}: ${e.message}`, 502);
    }
  }

  // Append the new filenames to the note's front-matter `images:` list so the
  // renderer picks them up. If the .md isn't found, skip silently — the user
  // may be uploading images for a slug whose .md hasn't been authored yet.
  try {
    await appendImagesToFrontMatter(slug, uploaded, session.username, env);
  } catch (e) {
    return errorPage(
      "Images uploaded, but front-matter update failed",
      `${e.message}\n\nThe image files are on disk; you can also add them to the note's images: list manually.`,
      502
    );
  }

  const url = new URL(request.url);
  return Response.redirect(
    new URL(`/admin/edit?slug=${encodeURIComponent(slug)}&uploaded=${uploaded.length}`, url).toString(),
    302
  );
}

async function handleImageDelete(request, env, session) {
  const form = await request.formData();
  const slug = String(form.get("slug") || "");
  const filename = String(form.get("filename") || "");
  const sha = String(form.get("sha") || "");

  if (!/^[\w-]+$/.test(slug)) return errorPage("Invalid slug", "Slug must match ^[\\w-]+$.", 400);
  if (!filename || filename.includes("/") || filename.includes("..")) {
    return errorPage("Invalid filename", "Bad filename.", 400);
  }
  if (!sha) return errorPage("Missing sha", "Stale request: no sha provided.", 400);

  try {
    await deleteFileAtPath({
      path: `assets/images/${slug}/${filename}`,
      sha,
      message: `Delete ${filename} from ${slug} via /admin`,
      username: session.username,
      env,
    });
  } catch (e) {
    return errorPage("Delete failed", e.message, 502);
  }

  // Remove from the note's front-matter `images:` list if present.
  try {
    await removeImageFromFrontMatter(slug, filename, session.username, env);
  } catch {
    // Non-fatal: the binary is gone; the array may still reference it. The
    // editor textarea lets the user clean up by hand.
  }

  const url = new URL(request.url);
  return Response.redirect(
    new URL(`/admin/edit?slug=${encodeURIComponent(slug)}&removed=${encodeURIComponent(filename)}`, url).toString(),
    302
  );
}

async function appendImagesToFrontMatter(slug, newFiles, username, env) {
  if (!newFiles.length) return;
  const file = await readContentFile(slug, env);
  if (!file) return;
  const { content, sha } = file;
  const updated = patchFrontMatterImages(content, (current) => {
    const merged = [...current];
    for (const f of newFiles) if (!merged.includes(f)) merged.push(f);
    return merged;
  });
  if (updated === content) return;
  await writeContentFile({
    slug,
    content: updated,
    sha,
    message: `Update ${slug}.md images list (+${newFiles.length}) via /admin`,
    username,
    env,
  });
}

async function removeImageFromFrontMatter(slug, filename, username, env) {
  const file = await readContentFile(slug, env);
  if (!file) return;
  const { content, sha } = file;
  const updated = patchFrontMatterImages(content, (current) => current.filter((f) => f !== filename));
  if (updated === content) return;
  await writeContentFile({
    slug,
    content: updated,
    sha,
    message: `Update ${slug}.md images list (-${filename}) via /admin`,
    username,
    env,
  });
}

// Given the full text of a content/<slug>.md file, transform the
// `images:` array in its YAML-ish front matter and return the new text.
// Works with both the indented form (`images:\n  - foo\n  - bar`) and an
// inline list (`images: [foo, bar]`). Inserts a fresh `images:` block
// before the closing `---` if none exists.
function patchFrontMatterImages(text, transform) {
  const fmMatch = text.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n([\s\S]*)$/);
  if (!fmMatch) return text;
  const fm = fmMatch[1];
  const rest = fmMatch[2];
  const eol = text.includes("\r\n") ? "\r\n" : "\n";

  const current = readImagesFromFm(fm);
  const next = transform(current);

  let newFm = stripImagesFromFm(fm, eol);
  if (next.length) {
    const block = "images:" + eol + next.map((n) => `  - ${n}`).join(eol);
    newFm = newFm.replace(/[\r\n]+$/, "") + eol + block;
  }
  return `---${eol}${newFm}${eol}---${eol}${rest}`;
}

function readImagesFromFm(fm) {
  // Inline form: images: [a, b, c]
  const inline = fm.match(/^images:\s*\[(.*)\]\s*$/m);
  if (inline) {
    return inline[1]
      .split(",")
      .map((s) => s.trim().replace(/^["']|["']$/g, ""))
      .filter(Boolean);
  }
  // Block form: images:\n  - a\n  - b
  const blockHeader = fm.match(/^images:\s*$/m);
  if (!blockHeader) return [];
  const lines = fm.split(/\r?\n/);
  const startIdx = lines.findIndex((l) => /^images:\s*$/.test(l));
  const out = [];
  for (let i = startIdx + 1; i < lines.length; i++) {
    const line = lines[i];
    if (/^\s+-\s+/.test(line)) {
      out.push(line.trim().replace(/^-\s*/, "").replace(/^["']|["']$/g, ""));
    } else if (/^\S/.test(line)) {
      break;
    }
  }
  return out;
}

function stripImagesFromFm(fm, eol) {
  // Remove inline form
  let out = fm.replace(/^images:\s*\[.*\]\s*$\r?\n?/m, "");
  // Remove block form
  const lines = out.split(/\r?\n/);
  const startIdx = lines.findIndex((l) => /^images:\s*$/.test(l));
  if (startIdx >= 0) {
    let endIdx = startIdx + 1;
    while (endIdx < lines.length && /^\s+-\s+/.test(lines[endIdx])) endIdx++;
    lines.splice(startIdx, endIdx - startIdx);
    out = lines.join(eol);
  }
  return out.replace(/[\r\n]+$/, "");
}

function escapeRegExp(s) {
  return String(s).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function arrayBufferToBase64(buffer) {
  const bytes = new Uint8Array(buffer);
  // btoa chokes on large strings if we materialise the whole thing in one
  // call; chunk through 0x8000-byte windows.
  const CHUNK = 0x8000;
  let s = "";
  for (let i = 0; i < bytes.length; i += CHUNK) {
    s += String.fromCharCode.apply(null, bytes.subarray(i, i + CHUNK));
  }
  return btoa(s);
}

// ----------------------------------------------------------- helpers ---

function escapeHtml(s) {
  return String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function errorPage(title, detail, status = 500) {
  const body = `
<h1>${escapeHtml(title)}</h1>
<div class="alert error">${escapeHtml(detail)}</div>
<div class="row">
  <a href="/admin/notes" class="btn ghost">back to notes</a>
  <a href="/admin" class="btn ghost">admin home</a>
</div>`;
  return htmlResponse(shell(title, body, null), status);
}
