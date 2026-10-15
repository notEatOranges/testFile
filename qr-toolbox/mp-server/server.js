// 小程序码/链接服务 —— Node 内置模块零依赖，部署于 NEC8(VM103) docker
// 配置 /data/config.json: {"appid":"wx...","secret":"...","shareKey":"qrl_..."}
// GET  /health                        服务/配置状态（公开）
// POST /api/wxacode                   生成小程序码(葵花码)图片 base64，需 X-Key
// POST /api/scheme                    生成 URL Scheme，需 X-Key
// POST /api/urllink                   生成 URL Link，需 X-Key
const http = require('http');
const https = require('https');
const fs = require('fs');

const CFG_PATH = process.env.MP_CONFIG || '/data/config.json';
let cfg;
try { cfg = JSON.parse(fs.readFileSync(CFG_PATH, 'utf8')); }
catch (e) { console.error('config load failed:', e.message); cfg = { appid: '', secret: '', shareKey: '' }; }
let tokenCache = { token: null, expiresAt: 0 };

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type,X-Key',
};
function json(res, obj, status) {
  res.writeHead(status || 200, Object.assign({ 'Content-Type': 'application/json; charset=utf-8' }, CORS));
  res.end(JSON.stringify(obj));
}
function reqHttps(host, path, method, headers, body) {
  return new Promise((resolve, reject) => {
    const r = https.request({ hostname: host, path, method, headers: headers || {} }, res => {
      const chunks = [];
      res.on('data', c => chunks.push(c));
      res.on('end', () => resolve({ status: res.statusCode, contentType: res.headers['content-type'] || '', buf: Buffer.concat(chunks) }));
    });
    r.on('error', reject);
    r.setTimeout(15000, () => r.destroy(new Error('微信接口超时')));
    if (body) r.write(body);
    r.end();
  });
}
function configured() {
  return cfg.appid && cfg.secret && !/^YOUR_/.test(cfg.appid);
}
async function getAccessToken() {
  if (tokenCache.token && Date.now() < tokenCache.expiresAt) return tokenCache.token;
  if (!configured()) throw new Error('服务端未配置小程序 AppID/secret（在 NEC8 编辑 /home/dev/mpcode/config.json 后 docker restart mpcode）');
  const r = await reqHttps('api.weixin.qq.com',
    '/cgi-bin/token?grant_type=client_credential&appid=' + encodeURIComponent(cfg.appid) + '&secret=' + encodeURIComponent(cfg.secret),
    'GET', {}, null);
  const j = JSON.parse(r.buf.toString('utf8'));
  if (!j.access_token) throw new Error('获取 access_token 失败：' + JSON.stringify(j));
  tokenCache = { token: j.access_token, expiresAt: Date.now() + ((j.expires_in || 7200) - 300) * 1000 };
  return tokenCache.token;
}
async function wxPost(path, obj) {
  const token = await getAccessToken();
  const body = JSON.stringify(obj || {});
  return reqHttps('api.weixin.qq.com', path + '?access_token=' + encodeURIComponent(token), 'POST',
    { 'Content-Type': 'application/json' }, body);
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, 'http://x');
  if (req.method === 'OPTIONS') { res.writeHead(204, CORS); return res.end(); }

  if (url.pathname === '/health') {
    return json(res, { ok: true, service: 'mpcode', configured: configured() });
  }

  const authed = cfg.shareKey && req.headers['x-key'] === cfg.shareKey;
  if (!authed) return json(res, { error: 'unauthorized（口令不对或未填）' }, 401);

  try {
    let body = '';
    for await (const c of req) body += c;
    let data = {};
    try { data = body ? JSON.parse(body) : {}; } catch (e) { return json(res, { error: 'bad json' }, 400); }

    if (url.pathname === '/api/wxacode' && req.method === 'POST') {
      const scene = String(data.scene || '').slice(0, 32);
      if (!scene) return json(res, { error: 'scene 必填（≤32 可见字符）' }, 400);
      const payload = {
        scene,
        width: Math.min(1280, Math.max(280, parseInt(data.width) || 430)),
        auto_color: !!data.auto_color,
        is_hyaline: !!data.is_hyaline,
        check_path: data.env_version === 'release',
      };
      if (!data.auto_color && Array.isArray(data.line_color)) payload.line_color = data.line_color;
      if (data.page) payload.page = String(data.page);
      if (data.env_version && data.env_version !== 'release') payload.env_version = data.env_version;
      const r = await wxPost('/wxa/getwxacodeunlimit', payload);
      if (r.contentType.indexOf('image/') === 0) {
        return json(res, { ok: true, image: 'data:image/' + (r.contentType.includes('jpg') ? 'jpeg' : 'png') + ';base64,' + r.buf.toString('base64') });
      }
      let j = {}; try { j = JSON.parse(r.buf.toString('utf8')); } catch (e) {}
      if (j.errcode === 40001 || j.errcode === 42001) { tokenCache = { token: null, expiresAt: 0 }; }
      return json(res, { error: '微信返回 ' + j.errcode + ': ' + (j.errmsg || '未知错误') }, 502);
    }

    if ((url.pathname === '/api/scheme' || url.pathname === '/api/urllink') && req.method === 'POST') {
      const jump = {
        path: String(data.path || '').slice(0, 128) || '',
        query: String(data.query || '').slice(0, 1024) || '',
        is_expire: !!data.is_expire,
      };
      if (data.env_version && data.env_version !== 'release') jump.env_version = data.env_version;
      if (jump.is_expire) { jump.expire_type = 1; jump.expire_interval = Math.min(30, Math.max(1, parseInt(data.expire_days) || 30)); }
      const path2 = url.pathname === '/api/scheme' ? '/wxa/generatescheme' : '/wxa/generate_urllink';
      const r = await wxPost(path2, { jump_wxa: jump });
      const j = JSON.parse(r.buf.toString('utf8'));
      if (j.errcode && j.errcode !== 0) {
        if (j.errcode === 40001 || j.errcode === 42001) tokenCache = { token: null, expiresAt: 0 };
        return json(res, { error: '微信返回 ' + j.errcode + ': ' + (j.errmsg || '未知错误') }, 502);
      }
      const link = j.openlink || j.url_link;
      if (!link) return json(res, { error: '微信未返回链接：' + JSON.stringify(j) }, 502);
      return json(res, { ok: true, link });
    }

    return json(res, { error: 'not found' }, 404);
  } catch (e) {
    return json(res, { error: String(e && e.message || e) }, 500);
  }
});
server.listen(8080, () => console.log('mpcode listening 8080; configured=' + configured()));
