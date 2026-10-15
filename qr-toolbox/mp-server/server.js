// 小程序码/链接服务 v2 —— 多小程序管理版
// 配置 /data/config.json: {"shareKey":"...","apps":{"名称":{"appid":"wx...","secret":"..."}}}
// （兼容 v1 顶层 appid/secret：加载时自动迁移为 apps["默认"]）
// GET  /health                 服务/配置状态（公开）
// GET  /api/apps               应用名列表（需 X-Key）
// POST /api/apps               新增/更新应用 {name,appid,secret}（需 X-Key，写回 config.json）
// POST /api/apps/delete        删除应用 {name}（需 X-Key）
// POST /api/wxacode            生成小程序码 {app?, scene, page, ...}（需 X-Key）
// POST /api/scheme|/api/urllink 生成链接 {app?, path, query, ...}（需 X-Key）
const http = require('http');
const https = require('https');
const fs = require('fs');

const CFG_PATH = process.env.MP_CONFIG || '/data/config.json';
let cfg;
try { cfg = JSON.parse(fs.readFileSync(CFG_PATH, 'utf8')); }
catch (e) { console.error('config load failed:', e.message); cfg = { shareKey: '', apps: {} }; }
// v1 兼容迁移
if (!cfg.apps) cfg.apps = {};
if (cfg.appid && cfg.secret) {
  cfg.apps['默认'] = { appid: cfg.appid, secret: cfg.secret };
  delete cfg.appid; delete cfg.secret;
  saveCfg();
}
function saveCfg() {
  const tmp = CFG_PATH + '.tmp';
  fs.writeFileSync(tmp, JSON.stringify({ shareKey: cfg.shareKey, apps: cfg.apps }, null, 2));
  fs.renameSync(tmp, CFG_PATH);
}
function appNames() { return Object.keys(cfg.apps); }
function getApp(name) {
  const n = name && cfg.apps[name] ? name : appNames()[0];
  if (!n) return null;
  return { name: n, entry: cfg.apps[n] };
}
function appValid(entry) {
  return entry && entry.appid && entry.secret && !/^YOUR_/.test(entry.appid) && !/^YOUR_/.test(entry.secret);
}
function configured() { return appNames().some(n => appValid(cfg.apps[n])); }
let tokenCache = {};   // appid -> {token, expiresAt}

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
async function getAccessToken(entry) {
  const c = tokenCache[entry.appid];
  if (c && c.token && Date.now() < c.expiresAt) return c.token;
  const r = await reqHttps('api.weixin.qq.com',
    '/cgi-bin/token?grant_type=client_credential&appid=' + encodeURIComponent(entry.appid) + '&secret=' + encodeURIComponent(entry.secret),
    'GET', {}, null);
  const j = JSON.parse(r.buf.toString('utf8'));
  if (!j.access_token) throw new Error('获取 access_token 失败（' + entry.appid + '）：' + JSON.stringify(j));
  tokenCache[entry.appid] = { token: j.access_token, expiresAt: Date.now() + ((j.expires_in || 7200) - 300) * 1000 };
  return tokenCache[entry.appid].token;
}
async function wxPost(path, obj, entry) {
  const token = await getAccessToken(entry);
  const body = JSON.stringify(obj || {});
  return reqHttps('api.weixin.qq.com', path + '?access_token=' + encodeURIComponent(token), 'POST',
    { 'Content-Type': 'application/json' }, body);
}
function resolveApp(data) {
  const a = getApp(data && data.app);
  if (!a) throw new Error('还没有可用的小程序应用，请先在页面「小程序应用」里添加（AppID+secret）');
  if (!appValid(a.entry)) throw new Error('应用「' + a.name + '」的 AppID/secret 未配置或无效，请在「小程序应用」里更新');
  return a;
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, 'http://x');
  if (req.method === 'OPTIONS') { res.writeHead(204, CORS); return res.end(); }

  if (url.pathname === '/health') {
    return json(res, { ok: true, service: 'mpcode', configured: configured(), apps: appNames().length });
  }

  const authed = cfg.shareKey && req.headers['x-key'] === cfg.shareKey;
  if (!authed) return json(res, { error: 'unauthorized（口令不对或未填）' }, 401);

  try {
    let body = '';
    for await (const c of req) body += c;
    let data = {};
    try { data = body ? JSON.parse(body) : {}; } catch (e) { return json(res, { error: 'bad json' }, 400); }

    /* ---- 应用管理 ---- */
    if (url.pathname === '/api/apps' && req.method === 'GET') {
      const list = appNames().map(n => ({ name: n, appid: cfg.apps[n].appid, valid: appValid(cfg.apps[n]) }));
      return json(res, list);
    }
    if (url.pathname === '/api/apps' && req.method === 'POST') {
      const name = String(data.name || '').trim().slice(0, 24);
      const appid = String(data.appid || '').trim().slice(0, 32);
      const secret = String(data.secret || '').trim().slice(0, 64);
      if (!name || !appid || !secret) return json(res, { error: 'name/appid/secret 必填' }, 400);
      const isNew = !cfg.apps[name];
      cfg.apps[name] = { appid, secret: (secret === '•••保留原值•••' && !isNew) ? cfg.apps[name].secret : secret };
      saveCfg();
      return json(res, { ok: true, added: isNew, total: appNames().length });
    }
    if (url.pathname === '/api/apps/delete' && req.method === 'POST') {
      const name = String(data.name || '');
      const ent = cfg.apps[name];
      if (!ent) return json(res, { error: '应用不存在' }, 404);
      delete cfg.apps[name];
      delete tokenCache[ent.appid];
      saveCfg();
      return json(res, { ok: true, total: appNames().length });
    }

    /* ---- 生成 ---- */
    if (url.pathname === '/api/wxacode' && req.method === 'POST') {
      const scene = String(data.scene || '').slice(0, 32);
      if (!scene) return json(res, { error: 'scene 必填（≤32 可见字符）' }, 400);
      const app = resolveApp(data);
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
      const r = await wxPost('/wxa/getwxacodeunlimit', payload, app);
      if (r.contentType.indexOf('image/') === 0) {
        return json(res, { ok: true, app: app.name, image: 'data:image/' + (r.contentType.includes('jpg') ? 'jpeg' : 'png') + ';base64,' + r.buf.toString('base64') });
      }
      let j = {}; try { j = JSON.parse(r.buf.toString('utf8')); } catch (e) {}
      if (j.errcode === 40001 || j.errcode === 42001) delete tokenCache[app.entry.appid];
      return json(res, { error: '微信返回 ' + j.errcode + ': ' + (j.errmsg || '未知错误') }, 502);
    }

    if ((url.pathname === '/api/scheme' || url.pathname === '/api/urllink') && req.method === 'POST') {
      const app = resolveApp(data);
      const jump = {
        path: String(data.path || '').slice(0, 128) || '',
        query: String(data.query || '').slice(0, 1024) || '',
        is_expire: !!data.is_expire,
      };
      if (data.env_version && data.env_version !== 'release') jump.env_version = data.env_version;
      if (jump.is_expire) { jump.expire_type = 1; jump.expire_interval = Math.min(30, Math.max(1, parseInt(data.expire_days) || 30)); }
      const path2 = url.pathname === '/api/scheme' ? '/wxa/generatescheme' : '/wxa/generate_urllink';
      const r = await wxPost(path2, { jump_wxa: jump }, app);
      const j = JSON.parse(r.buf.toString('utf8'));
      if (j.errcode && j.errcode !== 0) {
        if (j.errcode === 40001 || j.errcode === 42001) delete tokenCache[app.entry.appid];
        return json(res, { error: '微信返回 ' + j.errcode + ': ' + (j.errmsg || '未知错误') }, 502);
      }
      const link = j.openlink || j.url_link;
      if (!link) return json(res, { error: '微信未返回链接：' + JSON.stringify(j) }, 502);
      return json(res, { ok: true, app: app.name, link });
    }

    return json(res, { error: 'not found' }, 404);
  } catch (e) {
    return json(res, { error: String(e && e.message || e) }, 500);
  }
});
server.listen(8080, () => console.log('mpcode v2 listening 8080; apps=' + appNames().length + '; configured=' + configured()));
