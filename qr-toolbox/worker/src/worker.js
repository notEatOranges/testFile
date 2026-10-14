// qr-toolbox 共享 logo API —— Cloudflare Worker + KV
// GET    /logos        列出全部共享 logo（公开，只读）
// POST   /logos        上传 {name, dataUrl}，需请求头 X-Key = SHARE_KEY secret
// DELETE /logos/<id>   删除，需 X-Key
// OPTIONS *            CORS 预检
const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET,POST,DELETE,OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type,X-Key',
};
const MAX_BYTES = 500 * 1024; // dataUrl 上限

function json(obj, status) {
  return new Response(JSON.stringify(obj), {
    status: status || 200,
    headers: Object.assign({ 'Content-Type': 'application/json; charset=utf-8' }, CORS),
  });
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: CORS });
    if (url.pathname === '/' || url.pathname === '') {
      return json({ service: 'qr-toolbox-logos', ok: true });
    }

    if (url.pathname === '/logos' && request.method === 'GET') {
      const list = await env.QR_LOGOS.list({ limit: 500 });
      const items = [];
      await Promise.all(list.keys.map(async (k) => {
        const v = await env.QR_LOGOS.get(k.name, 'json');
        if (v && v.n && v.d) items.push({ id: k.name, n: v.n, d: v.d });
      }));
      items.sort((a, b) => (a.id < b.id ? 1 : -1));
      return json(items);
    }

    if (url.pathname === '/logos' && request.method === 'POST') {
      if (!env.SHARE_KEY || request.headers.get('X-Key') !== env.SHARE_KEY) return json({ error: 'unauthorized' }, 401);
      let body;
      try { body = await request.json(); } catch (e) { return json({ error: 'bad json' }, 400); }
      const name = String(body.name || '共享Logo').slice(0, 24);
      const dataUrl = String(body.dataUrl || '');
      if (!/^data:image\/(png|jpe?g|webp|svg\+xml|gif);base64,[A-Za-z0-9+/=]+$/.test(dataUrl)) {
        return json({ error: 'dataUrl 必须是 base64 图片' }, 400);
      }
      if (dataUrl.length > MAX_BYTES) return json({ error: '图片超过 500KB' }, 413);
      const id = Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
      await env.QR_LOGOS.put(id, JSON.stringify({ n: name, d: dataUrl }));
      return json({ ok: true, id });
    }

    const m = url.pathname.match(/^\/logos\/([a-z0-9]+)$/);
    if (m && request.method === 'DELETE') {
      if (!env.SHARE_KEY || request.headers.get('X-Key') !== env.SHARE_KEY) return json({ error: 'unauthorized' }, 401);
      await env.QR_LOGOS.delete(m[1]);
      return json({ ok: true });
    }

    return json({ error: 'not found' }, 404);
  },
};
