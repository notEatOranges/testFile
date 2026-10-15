// qr-toolbox 共享 logo API —— Cloudflare Worker，写入 GitHub 仓库（git 即真相，Pages 自动上线）
// 存储：testFile 仓库 qr-toolbox/shared-logos/（<id>.<ext> 文件 + index.json 清单）
// 前端读取不走本 Worker，直接 fetch 静态 shared-logos/index.json
// POST   /logos        {name, dataUrl}  上传（commit 文件 + 更新清单）  需 X-Key
// PUT    /logos/<id>   {name}           改名（更新清单）                需 X-Key
// DELETE /logos/<id>                    删除（删文件 + 更新清单）        需 X-Key
// OPTIONS *                             CORS 预检
const REPO = '/repos/notEatOranges/testFile/contents/qr-toolbox/shared-logos/';
const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type,X-Key',
};
const MAX_BYTES = 500 * 1024;
const EXT = { 'image/png': 'png', 'image/jpeg': 'jpg', 'image/webp': 'webp', 'image/gif': 'gif', 'image/svg+xml': 'svg' };

function json(obj, status) {
  return new Response(JSON.stringify(obj), {
    status: status || 200,
    headers: Object.assign({ 'Content-Type': 'application/json; charset=utf-8' }, CORS),
  });
}
const b64e = (s) => btoa(unescape(encodeURIComponent(s)));
const b64d = (s) => decodeURIComponent(escape(atob(s.replace(/\n/g, ''))));

async function gh(path, opts, env) {
  opts = opts || {};
  return fetch('https://api.github.com' + path, {
    method: opts.method || 'GET',
    headers: Object.assign({
      Authorization: 'Bearer ' + (env.GITHUB_TOKEN || ''),
      Accept: 'application/vnd.github+json',
      'User-Agent': 'qr-logos-worker',
      'X-GitHub-Api-Version': '2022-11-28',
    }, opts.headers || {}),
    body: opts.body,
  });
}
async function getIndex(env) {
  const r = await gh(REPO + 'index.json', {}, env);
  if (!r.ok) return { sha: null, items: [] };
  const j = await r.json();
  let items = [];
  try { items = JSON.parse(b64d(j.content)); } catch (e) {}
  return { sha: j.sha, items: Array.isArray(items) ? items : [] };
}
async function putIndex(env, prevSha, items, msg) {
  const r = await gh(REPO + 'index.json', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message: msg, content: b64e(JSON.stringify(items, null, 1) + '\n'), sha: prevSha || undefined }),
  }, env);
  return r.ok;
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: CORS });
    if (url.pathname === '/' || url.pathname === '') return json({ service: 'qr-toolbox-logos(git)' });

    // 公开只读：在线图标搜索代理（Iconify 聚合 API，无需登录；iconfont 本站接口需登录故不可用）
    if (url.pathname === '/iconsearch' && request.method === 'GET') {
      const q = (url.searchParams.get('q') || '').trim().slice(0, 40);
      if (!q) return json([]);
      const sr = await fetch('https://api.iconify.design/search?query=' + encodeURIComponent(q) + '&limit=40', {
        headers: { 'User-Agent': 'qr-toolbox-logos' },
      });
      if (!sr.ok) return json({ error: 'iconify search failed' }, 502);
      const j = await sr.json();
      const icons = (j.icons || []).slice(0, 40);  // Worker 单请求子请求上限 50，留余量
      const items = await Promise.all(icons.map(async (ic) => {
        try {
          const r2 = await fetch('https://api.iconify.design/' + ic + '.svg?height=64', {
            headers: { 'User-Agent': 'qr-toolbox-logos' },
          });
          if (!r2.ok) return null;
          const svg = await r2.text();
          if (!svg || svg.length > 8000 || svg.indexOf('<svg') !== 0) return null;
          const name = ic.split(':')[1] || ic;
          return { id: ic, n: name, svg: svg };
        } catch (e) { return null; }
      }));
      return json(items.filter(Boolean));
    }

    const authed = env.SHARE_KEY && request.headers.get('X-Key') === env.SHARE_KEY;
    if (!authed) return json({ error: 'unauthorized' }, 401);

    try {
      if (url.pathname === '/logos' && request.method === 'POST') {
        const body = await request.json();
        const name = String(body.name || '共享Logo').slice(0, 24);
        const dataUrl = String(body.dataUrl || '');
        const m = dataUrl.match(/^data:(image\/(?:png|jpe?g|webp|gif|svg\+xml));base64,([A-Za-z0-9+/=]+)$/);
        if (!m) return json({ error: 'dataUrl 必须是 base64 图片' }, 400);
        if (dataUrl.length > MAX_BYTES) return json({ error: '图片超过 500KB' }, 413);
        const ext = EXT[m[1]] || 'png';
        const id = Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
        const up = await gh(REPO + id + '.' + ext, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ message: 'shared-logo: add ' + name, content: m[2] }),
        }, env);
        if (!up.ok) return json({ error: 'github commit failed', status: up.status }, 502);
        const idx = await getIndex(env);
        idx.items.unshift({ id, n: name, ext });
        if (!(await putIndex(env, idx.sha, idx.items, 'shared-logo: index + ' + name))) {
          return json({ error: 'index update failed（文件已提交，可手动补清单）' }, 502);
        }
        return json({ ok: true, id, ext });
      }

      const mm = url.pathname.match(/^\/logos\/([a-z0-9]+)$/);
      if (mm) {
        const id = mm[1];
        const idx = await getIndex(env);
        const ent = idx.items.filter(function (x) { return x.id === id; })[0];
        if (!ent) return json({ error: 'not found' }, 404);

        if (request.method === 'PUT') {
          const body = await request.json();
          const name = String(body.name || '').trim().slice(0, 24);
          if (!name) return json({ error: 'name required' }, 400);
          idx.items.forEach(function (x) { if (x.id === id) x.n = name; });
          if (!(await putIndex(env, idx.sha, idx.items, 'shared-logo: rename ' + id + ' -> ' + name))) {
            return json({ error: 'index update failed' }, 502);
          }
          return json({ ok: true });
        }

        if (request.method === 'DELETE') {
          const fr = await gh(REPO + ent.id + '.' + ent.ext, {}, env);
          if (fr.ok) {
            const fj = await fr.json();
            await gh(REPO + ent.id + '.' + ent.ext, {
              method: 'DELETE',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ message: 'shared-logo: remove ' + ent.n, sha: fj.sha }),
            }, env);
          }
          const idx2 = await getIndex(env);
          const items2 = idx2.items.filter(function (x) { return x.id !== id; });
          await putIndex(env, idx2.sha, items2, 'shared-logo: index - ' + id);
          return json({ ok: true });
        }
      }

      return json({ error: 'not found' }, 404);
    } catch (e) {
      return json({ error: String(e && e.message || e) }, 500);
    }
  },
};
