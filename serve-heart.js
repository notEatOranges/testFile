/**
 * serve-heart.js — 零依赖静态文件托管服务
 * 用途：稳定托管 heart-3d.html，供 chrome-devtools-mcp 打开、手机局域网访问、本地调试。
 *
 * 运行：  node serve-heart.js
 * 停止：  Ctrl + C
 *
 * 特性：
 *  - 默认 5500 端口，被占用则自动顺延到空闲端口
 *  - 绑定 0.0.0.0：手机与电脑同 Wi-Fi 即可访问（便于真机测试）
 *  - .mjs / .js 一律 text/javascript（保证 ES Module + importmap 正常）
 *  - 开启 CORS：MCP / 任意客户端都能取
 *  - Cache-Control: no-cache：改完 HTML 刷新即生效
 *  - 防目录穿越
 */
'use strict';

const http = require('http');
const fs   = require('fs');
const path = require('path');
const net  = require('net');
const os   = require('os');

const ROOT          = __dirname;          // 托管目录 = 本脚本所在目录
const DEFAULT_PORT  = 5500;
const DEFAULT_ENTRY = '/heart-3d.html';   // 访问 / 时默认给爱心页

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.htm' : 'text/html; charset=utf-8',
  '.js'  : 'text/javascript; charset=utf-8',
  '.mjs' : 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.css' : 'text/css; charset=utf-8',
  '.png' : 'image/png',
  '.jpg' : 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif' : 'image/gif',
  '.webp': 'image/webp',
  '.svg' : 'image/svg+xml',
  '.ico' : 'image/x-icon',
  '.csv' : 'text/csv; charset=utf-8',
  '.xls' : 'application/vnd.ms-excel',
  '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  '.map' : 'application/json; charset=utf-8',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
};

/** 防目录穿越：解析后的路径必须仍在 ROOT 之内 */
function safeJoin(target) {
  const p = path.normalize(path.join(ROOT, target));
  return p.startsWith(ROOT) ? p : null;
}

/** 从 start 起找空闲端口 */
function findFreePort(start) {
  return new Promise((resolve) => {
    let port = start;
    const tryOnce = () => {
      const srv = net.createServer();
      srv.unref();
      srv.on('error', () => { port += 1; tryOnce(); });
      srv.listen(port, '0.0.0.0', () => srv.close(() => resolve(port)));
    };
    tryOnce();
  });
}

/** 取本机局域网 IPv4 */
function lanIPs() {
  const out = [];
  for (const name of Object.keys(os.networkInterfaces())) {
    for (const it of os.networkInterfaces()[name]) {
      if (it.family === 'IPv4' && !it.internal) out.push(it.address);
    }
  }
  return out;
}

const server = http.createServer((req, res) => {
  // CORS —— 让 MCP / 浏览器 / 手机都能取
  res.setHeader('Access-Control-Allow-Origin',  '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  if (req.method === 'OPTIONS') { res.writeHead(204); return res.end(); }

  let urlPath = decodeURIComponent(req.url.split('?')[0]);
  if (urlPath === '/' || urlPath === '') urlPath = DEFAULT_ENTRY;

  const filePath = safeJoin(urlPath);
  if (!filePath) { res.writeHead(403); return res.end('403 Forbidden'); }

  const respond = (fp) => {
    fs.stat(fp, (e, st) => {
      if (e || !st.isFile()) {
        res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
        return res.end('404 Not Found: ' + urlPath);
      }
      const ext = path.extname(fp).toLowerCase();
      res.writeHead(200, {
        'Content-Type'  : MIME[ext] || 'application/octet-stream',
        'Cache-Control' : 'no-cache',
      });
      fs.createReadStream(fp).pipe(res);
    });
  };
  fs.stat(filePath, (err, stat) => {
    // 目录请求 → 自动定位到目录下的 index.html（支持子项目，如 /love-h5/）
    if (!err && stat.isDirectory()) filePath = path.join(filePath, 'index.html');
    respond(filePath);
  });
});

(async () => {
  const port = await findFreePort(DEFAULT_PORT);
  server.listen(port, '0.0.0.0', () => {
    const line = '─'.repeat(52);
    console.log('\n' + line);
    console.log('  ❤  心形页面托管服务已启动');
    console.log(line);
    console.log('  本机访问   : http://127.0.0.1:' + port + '/heart-3d.html');
    for (const ip of lanIPs()) {
      console.log('  局域网(手机): http://' + ip + ':' + port + '/heart-3d.html');
    }
    console.log(line);
    console.log('  托管目录   : ' + ROOT);
    console.log('  停止服务   : Ctrl + C\n');
  });
})();
