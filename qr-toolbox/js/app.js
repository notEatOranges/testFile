/* 二维码·条形码生成器 主逻辑（无框架、无内联事件，兼容 MV3 CSP） */
(function () {
  'use strict';
  var $ = function (id) { return document.getElementById(id); };

  /* ================= 状态 ================= */
  var LS_KEY = 'qrtb.state.v3';
  var DEFAULT_VALUES = function () {
    return {
      text: { text: '' },
      url: { url: 'https://' },
      wifi: { ssid: '', password: '', enc: 'WPA/WPA2', hidden: false },
      vcard: { name: '', org: '', title: '', tel: '', email: '', url: '', addr: '', note: '' },
      event: { title: '', loc: '', start: '', end: '', desc: '' },
      email: { to: '', subject: '', body: '' },
      geo: { lat: '', lng: '' }, tel: { num: '' }, sms: { num: '', body: '' }
    };
  };
  var state = {
    mode: 'qr', type: 'text',
    values: DEFAULT_VALUES(),
    size: 200, margin: 16, ec: 'M',
    dots: 'square', cornerSquare: 'square', cornerDot: 'square',
    fg: '#000000', bg: '#ffffff', transparent: false,
    grad: { on: false, type: 'linear', c1: '#5b5fef', c2: '#c44fe0', rot: 45 },
    logo: { src: null, raw: null, name: '', presetId: null, size: 0.4, pad: false, hideDots: true },
    bc: { format: 'CODE128', value: 'NEC8-2026', width: 2, height: 100, showText: true }
  };
  try {
    var saved = JSON.parse(localStorage.getItem(LS_KEY) || 'null');
    if (saved) { deepMerge(state, saved); }
  } catch (e) { /* 忽略坏数据 */ }
  // 清理历史默认值：早期版本把 https://1996818.xyz 存为默认文本，按用户令不再作为默认
  (function () {
    if (state.values.text && state.values.text.text === 'https://1996818.xyz') state.values.text.text = '';
  })();
  // 防御：任何类型的 values 必须是「字段名->值」对象，坏结构回退默认
  (function () {
    var dv = DEFAULT_VALUES();
    for (var k in dv) {
      var cur = state.values[k];
      if (!cur || typeof cur !== 'object' || Array.isArray(cur)) state.values[k] = dv[k];
    }
  })();
  function deepMerge(dst, src) {
    for (var k in src) {
      if (!Object.prototype.hasOwnProperty.call(dst, k)) continue;
      if (dst[k] && typeof dst[k] === 'object' && src[k] && typeof src[k] === 'object') deepMerge(dst[k], src[k]);
      else dst[k] = src[k];
    }
  }
  var saveTimer = null;
  function persist() {
    clearTimeout(saveTimer);
    saveTimer = setTimeout(function () {
      try { localStorage.setItem(LS_KEY, JSON.stringify(state)); } catch (e) { /* 超额忽略 */ }
    }, 300);
  }

  function toast(msg) {
    var t = $('toast'); t.textContent = msg; t.classList.add('show');
    clearTimeout(toast._t); toast._t = setTimeout(function () { t.classList.remove('show'); }, 2200);
  }

  /* ================= 内容类型定义 ================= */
  var TYPES = [
    { k: 'text', label: '文本', hint: '任意文本都会被编码进二维码；放网址则扫码可直接打开。' },
    { k: 'url', label: '网址', hint: '建议带上 https:// 前缀，扫码即跳转。' },
    { k: 'wifi', label: 'WiFi', hint: '扫码后手机可直接加入此 WiFi（iOS/安卓相机原生支持）。' },
    { k: 'vcard', label: '名片', hint: '生成 vCard 电子名片，扫码可直接存入通讯录。' },
    { k: 'event', label: '日程', hint: '生成 iCalendar 日程，扫码可添加到日历。' },
    { k: 'email', label: '邮件', hint: '扫码拉起邮件客户端并预填主题与正文。' },
    { k: 'geo', label: '位置', hint: '扫码打开地图定位；纬度/经度可从地图分享链接里复制。' },
    { k: 'tel', label: '电话', hint: '扫码拉起拨号盘。' },
    { k: 'sms', label: '短信', hint: '扫码拉起短信编辑（SMSTO 格式，安卓/iOS 兼容）。' },
    { k: 'decode', label: '📷 识图转码', hint: '以图生图：上传已有二维码图片 → 本地识别 → 自动重新出码，可任意换肤美化再导出。' }
  ];
  var F = { // 字段快捷定义
    t: function (k, label, ph) { return { k: k, label: label, type: 'text', ph: ph || '' }; },
    ta: function (k, label, ph) { return { k: k, label: label, type: 'textarea', ph: ph || '' }; },
    sel: function (k, label, opts) { return { k: k, label: label, type: 'select', opts: opts }; },
    dt: function (k, label) { return { k: k, label: label, type: 'datetime' }; },
    chk: function (k, label) { return { k: k, label: label, type: 'checkbox' }; }
  };
  var TYPE_FIELDS = {
    decode: [],
    text: [{ k: 'text', label: '文本内容', type: 'textarea', ph: '输入任意文本、网址、JSON……' }],
    url: [F.t('url', '网址', 'https://example.com')],
    wifi: [F.t('ssid', '网络名称 SSID', '例如：Orange-5G'), F.t('password', '密码', '无密码可留空'),
      F.sel('enc', '加密方式', ['WPA/WPA2', 'WEP', '无密码']), F.chk('hidden', '隐藏网络')],
    vcard: [F.t('name', '姓名', '张三'), F.t('org', '公司', ''), F.t('title', '职位', ''),
      F.t('tel', '手机', '13800000000'), F.t('email', '邮箱', 'a@b.com'), F.t('url', '个人主页', ''),
      F.t('addr', '地址', ''), F.ta('note', '备注', '')],
    event: [F.t('title', '日程标题', '周会'), F.t('loc', '地点', '会议室 A'),
      F.dt('start', '开始时间'), F.dt('end', '结束时间'), F.ta('desc', '描述', '')],
    email: [F.t('to', '收件人邮箱', 'a@b.com'), F.t('subject', '主题', ''), F.ta('body', '正文', '')],
    geo: [F.t('lat', '纬度', '39.9042'), F.t('lng', '经度', '116.4074')],
    tel: [F.t('num', '电话号码', '+8613800000000')],
    sms: [F.t('num', '电话号码', '+8613800000000'), F.ta('body', '短信内容', '')]
  };

  /* ================= 内容构建 ================= */
  function escWifi(s) { return String(s == null ? '' : s).replace(/([\\;,:"])/g, '\\$1'); }
  function vcardLine(arr) { return arr.filter(function (l) { return l && l.length; }).join('\n'); }
  function dtToIcal(v) { return v ? String(v).replace(/[-:]/g, '').replace(/\.\d+$/, '') : ''; }

  function buildContent() {
    var v = state.values[state.type] || {};
    switch (state.type) {
      case 'text': return (v.text || '').trim();
      case 'url': return (v.url || '').trim();
      case 'wifi':
        if (!(v.ssid || '').trim()) return '';
        var enc = v.enc === '无密码' ? 'nopass' : (v.enc === 'WEP' ? 'WEP' : 'WPA');
        return 'WIFI:T:' + enc + ';S:' + escWifi(v.ssid) + ';P:' + escWifi(v.password || '') +
          (v.hidden ? ';H:true' : '') + ';;';
      case 'vcard':
        if (!(v.name || '').trim()) return '';
        return vcardLine(['BEGIN:VCARD', 'VERSION:3.0',
          'N:' + v.name.trim() + ';;;', 'FN:' + v.name.trim(),
          v.org ? 'ORG:' + v.org : '', v.title ? 'TITLE:' + v.title : '',
          v.tel ? 'TEL;TYPE=CELL:' + v.tel : '', v.email ? 'EMAIL:' + v.email : '',
          v.url ? 'URL:' + v.url : '', v.addr ? 'ADR;TYPE=WORK:;;' + v.addr + ';;;;' : '',
          v.note ? 'NOTE:' + v.note : '', 'END:VCARD']);
      case 'event':
        if (!(v.title || '').trim()) return '';
        return vcardLine(['BEGIN:VCALENDAR', 'VERSION:2.0', 'BEGIN:VEVENT',
          'SUMMARY:' + v.title.trim(), v.loc ? 'LOCATION:' + v.loc : '',
          v.start ? 'DTSTART:' + dtToIcal(v.start) : '', v.end ? 'DTEND:' + dtToIcal(v.end) : '',
          v.desc ? 'DESCRIPTION:' + v.desc.replace(/\n/g, '\\n') : '',
          'END:VEVENT', 'END:VCALENDAR']);
      case 'email':
        if (!(v.to || '').trim()) return '';
        var q = [];
        if (v.subject) q.push('subject=' + encodeURIComponent(v.subject));
        if (v.body) q.push('body=' + encodeURIComponent(v.body));
        return 'mailto:' + v.to.trim() + (q.length ? '?' + q.join('&') : '');
      case 'geo':
        if (!v.lat || !v.lng) return '';
        return 'geo:' + v.lat + ',' + v.lng;
      case 'tel': return (v.num || '').trim() ? 'tel:' + v.num.trim() : '';
      case 'sms':
        if (!(v.num || '').trim()) return '';
        return 'SMSTO:' + v.num.trim() + ':' + (v.body || '');
      case 'decode':
        return (state.values.text && state.values.text.text) || '';
    }
    return '';
  }

  /* ================= 表单渲染 ================= */
  function renderTypeTabs() {
    var box = $('typeTabs'); box.innerHTML = '';
    TYPES.forEach(function (t) {
      var b = document.createElement('button');
      b.type = 'button'; b.className = 'type-tab' + (state.type === t.k ? ' active' : '');
      b.textContent = t.label;
      b.addEventListener('click', function () { state.type = t.k; persist(); renderTypeTabs(); renderForm(); schedule(); });
      box.appendChild(b);
    });
    var cur = TYPES.filter(function (t) { return t.k === state.type; })[0] || TYPES[0];
    $('typeHint').textContent = cur.hint; $('typeHint').classList.remove('hidden');
    $('quickParse').classList.toggle('hidden', state.type === 'decode' || state.mode !== 'qr');
    $('quickParseInput').placeholder = KV_PLACEHOLDER[state.type] || '粘贴内容解析填充';
  }

  function renderForm() {
    var box = $('typeForms');
    var pane = $('decodePane');
    if (state.type === 'decode') {
      box.innerHTML = '';
      pane.classList.remove('hidden');
      return;
    }
    pane.classList.add('hidden');
    box.innerHTML = '';
    var grid = document.createElement('div'); grid.className = 'form-grid';
    TYPE_FIELDS[state.type].forEach(function (f) {
      var w = document.createElement('label');
      w.className = 'field' + ((f.type === 'textarea') ? ' span2' : '');
      var v = state.values[state.type];
      if (f.type === 'checkbox') {
        w.classList.add('check-inline');
        var cb = document.createElement('input'); cb.type = 'checkbox'; cb.checked = !!v[f.k];
        cb.addEventListener('change', function () { v[f.k] = cb.checked; persist(); schedule(); });
        w.appendChild(cb); w.appendChild(document.createTextNode(' ' + f.label));
      } else {
        var sp = document.createElement('span'); sp.textContent = f.label; w.appendChild(sp);
        var inp;
        if (f.type === 'select') {
          inp = document.createElement('select');
          f.opts.forEach(function (o) { var op = document.createElement('option'); op.value = op.textContent = o; inp.appendChild(op); });
          inp.value = v[f.k] || f.opts[0];
          inp.addEventListener('change', function () { v[f.k] = inp.value; persist(); schedule(); });
        } else if (f.type === 'textarea') {
          inp = document.createElement('textarea'); inp.placeholder = f.ph; inp.value = v[f.k] || '';
          inp.addEventListener('input', function () { v[f.k] = inp.value; persist(); schedule(); });
        } else {
          inp = document.createElement('input');
          inp.type = f.type === 'datetime' ? 'datetime-local' : 'text';
          inp.placeholder = f.ph; inp.value = v[f.k] || ''; inp.spellcheck = false;
          inp.addEventListener('input', function () { v[f.k] = inp.value; persist(); schedule(); });
        }
        w.appendChild(inp);
      }
      grid.appendChild(w);
    });
    box.appendChild(grid);
    enhanceAllSelects(box);
  }

  /* ================= 马卡龙配色 ================= */
  var MACARONS = [
    { n: '树莓粉', fg: '#b23a5e', bg: '#fce8ee' },
    { n: '海盐蓝', fg: '#2e6e8e', bg: '#e8f4fa' },
    { n: '抹茶绿', fg: '#4f7b58', bg: '#edf6ec' },
    { n: '焦糖橙', fg: '#a8601c', bg: '#fbf0e3' },
    { n: '香芋紫', fg: '#7b5aa6', bg: '#f3edfa' },
    { n: '柠檬黄', fg: '#9c831d', bg: '#fbf7dc' },
    { n: '黑芝麻', fg: '#26262b', bg: '#f2f1ec' },
    { n: '可可棕', fg: '#6b4a32', bg: '#f5ede5' }
  ];
  function renderMacarons() {
    var row = $('macaronRow'); row.innerHTML = '';
    MACARONS.forEach(function (m) {
      var b = document.createElement('button'); b.type = 'button'; b.className = 'macaron';
      var d = document.createElement('span'); d.className = 'dot';
      d.style.background = 'linear-gradient(135deg,' + m.fg + ' 50%,' + m.bg + ' 50%)';
      b.appendChild(d); b.appendChild(document.createTextNode(m.n));
      b.title = m.fg + ' / ' + m.bg;
      b.addEventListener('click', function () {
        state.fg = m.fg; state.bg = m.bg; state.transparent = false;
        $('inpFgColor').value = m.fg; $('inpFgHex').value = m.fg;
        $('inpBgColor').value = m.bg; $('inpBgHex').value = m.bg;
        $('chkTransparent').checked = false;
        persist(); schedule(); retintLogo();
      });
      row.appendChild(b);
    });
  }

  /* ================= Logo 选择器 ================= */
  function renderLogoPicker() {
    rebuildLogoCats();
    drawLogoGrid();
    bindGridAutoLoad();
    $('logoSearch').addEventListener('input', function () { if (onlineMode) onlineClear(); drawLogoGrid(); });
    $('logoCat').addEventListener('change', function () { if (onlineMode) onlineClear(); drawLogoGrid(); });
    $('btnOnlineSearch').addEventListener('click', onlineSearch);
    $('btnOnlineClear').addEventListener('click', onlineClear);
    $('logoSearch').addEventListener('keydown', function (e) {
      if (e.key === 'Enter') { e.preventDefault(); onlineSearch(); }
    });
  }
  /* 全量 logo 池：精选100（内嵌）+ 集合9900（文件化索引）+ 共享（git 库） */
  function logoPool() {
    var all = (window.LOGO_PRESETS || []).concat(window.LOGO_EXTRA || []);
    (window.LOGO_SHARED || []).forEach(function (s) { all.push(s); });
    return all;
  }
  function logoSrc(it) {
    if (it.d) return it.d;
    if (it.sh) return 'shared-logos/' + it.f;   // 共享库（git 存储）
    return 'logos/' + it.f;                     // 内置集合文件
  }
  var GRID_BATCH = 120;
  var gridState = { list: [], drawn: 0 };
  var onlineMode = false;

  /* ================= 在线图标搜索（Iconify 经 Worker 代理；iconfont 本站需登录不可用） ================= */
  function b64svg(svgText) {
    return 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgText)));
  }
  function onlineSearch() {
    var q = $('logoSearch').value.trim();
    if (!q) { toast('先输入要搜索的关键词'); return; }
    toast('在线搜索中…');
    fetch(SHARE_API + '/iconsearch?q=' + encodeURIComponent(q))
      .then(function (r) { return r.ok ? r.json() : null; })
      .then(function (items) {
        if (!items) { toast('在线搜索失败，稍后再试'); return; }
        if (!items.length) { toast('在线库没有找到「' + q + '」'); return; }
        var pool = items.map(function (it) {
          return { id: 'if:' + it.id, n: it.n, c: '在线', a: it.n + ',' + (it.id.split(':')[0]), d: b64svg(it.svg) };
        });
        gridState.list = pool; gridState.drawn = 0;
        onlineMode = true;
        $('onlineBar').classList.remove('hidden');
        $('onlineInfo').textContent = '在线结果 ' + pool.length + ' 个（点击即用，自动染码色）';
        var grid = $('logoGrid'); grid.innerHTML = '';
        appendLogoBatch();
        grid.scrollTop = 0;
        toast('在线搜到 ' + pool.length + ' 个图标');
      })
      .catch(function () { toast('网络异常，在线搜索失败'); });
  }
  function onlineClear() {
    onlineMode = false;
    $('onlineBar').classList.add('hidden');
    drawLogoGrid();
  }
  function rebuildLogoCats() {
    var pool = logoPool();
    var cats = ['全部'];
    pool.forEach(function (it) { if (cats.indexOf(it.c) < 0) cats.push(it.c); });
    var sel = $('logoCat');
    var cur = sel.value || '全部';
    sel.innerHTML = '';
    cats.forEach(function (c) { var o = document.createElement('option'); o.value = o.textContent = c; sel.appendChild(o); });
    sel.value = cats.indexOf(cur) >= 0 ? cur : '全部';
    var shared = 0;
    pool.forEach(function (it) { if (it.sh) shared++; });
    var base = pool.length - shared;
    $('logoSub').textContent = shared ? (base.toLocaleString() + ' 款内置 + ' + shared + ' 款共享') : base.toLocaleString() + ' 款内置';
  }
  function drawLogoGrid() {
    if (onlineMode) return;                     // 在线结果列表不被本地过滤覆盖，点「返回本地库」退出
    var q = $('logoSearch').value.trim().toLowerCase();
    var cat = $('logoCat').value;
    var pool = logoPool();
    var list = pool.filter(function (it) {
      if (cat !== '全部' && it.c !== cat) return false;
      if (!q) return true;
      return (it.n + ',' + (it.a || '') + ',' + it.id).toLowerCase().indexOf(q) >= 0;
    });
    gridState.list = list; gridState.drawn = 0;
    var grid = $('logoGrid'); grid.innerHTML = '';
    if (!list.length) {
      var e = document.createElement('div'); e.className = 'placeholder';
      e.style.cssText = 'grid-column:1/-1;text-align:center;padding:20px 0';
      e.textContent = '没有匹配的 logo，试试上传自定义'; grid.appendChild(e); return;
    }
    appendLogoBatch();
    grid.scrollTop = 0;
  }
  function appendLogoBatch() {
    var grid = $('logoGrid');
    var list = gridState.list;
    if (gridState.drawn >= list.length) return;
    var end = Math.min(list.length, gridState.drawn + GRID_BATCH);
    for (var i = gridState.drawn; i < end; i++) {
      (function (it) {
        var d = document.createElement('div');
        d.className = 'logo-item' + (state.logo.presetId === it.id ? ' active' : '');
        d.setAttribute('data-id', it.id);
        var img = document.createElement('img'); img.src = logoSrc(it); img.alt = it.n; img.loading = 'lazy';
        var sp = document.createElement('span'); sp.textContent = it.n;
        d.title = it.n + '（' + it.c + '）';
        d.appendChild(img); d.appendChild(sp);
        d.addEventListener('click', function () { applyLogo(logoSrc(it), it.n, it.id); });
        if (it.sh) d.addEventListener('dblclick', function () { renameSharedLogo(it); });
        grid.appendChild(d);
      })(list[i]);
    }
    gridState.drawn = end;
    var more = grid.querySelector('.logo-more');
    if (more) more.remove();
    if (gridState.drawn < list.length) {
      more = document.createElement('div');
      more.className = 'logo-more';
      more.textContent = '上滑或点击加载更多（已显示 ' + gridState.drawn + '/' + list.length + '）';
      more.addEventListener('click', function () { appendLogoBatch(); });
      grid.appendChild(more);
    }
  }
  function bindGridAutoLoad() {
    var grid = $('logoGrid'), ticking = false;
    grid.addEventListener('scroll', function () {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(function () {
        ticking = false;
        if (gridState.drawn < gridState.list.length &&
            grid.scrollTop + grid.clientHeight >= grid.scrollHeight - 90) {
          appendLogoBatch();
        }
      });
    });
  }
  function roundRectPath(ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  }
  function rasterize(src, pad, cb) {
    var img = new Image();
    img.onload = function () {
      var S = 512, c = document.createElement('canvas'); c.width = c.height = S;
      var ctx = c.getContext('2d');
      if (pad) { ctx.fillStyle = '#ffffff'; roundRectPath(ctx, 0, 0, S, S, S * 0.22); ctx.fill(); }
      var p = pad ? Math.round(S * 0.16) : 0, inner = S - p * 2;
      ctx.drawImage(img, p, p, inner, inner);
      cb(c.toDataURL('image/png'));
    };
    img.onerror = function () { toast('该图片无法解析，请换一张'); };
    img.src = src;
  }
  /* SVG 预设 logo 染色：跟随「码颜色」（渐变时用起始色），图标与码面浑然一体 */
  function tintSvg(svgText, color) {
    return svgText
      .replace(/currentColor/g, color)
      .replace(/#111111/gi, color)
      .replace(/#000(?![0-9a-fA-F])/g, color);
  }
  function isSvgSrc(src) {
    return /\.svg(\?|$)/.test(src) || /^data:image\/svg\+xml/.test(src);
  }
  function decodeDataSvg(dataUrl) {
    try {
      var b64 = dataUrl.replace(/^data:image\/svg\+xml;base64,/, '');
      return decodeURIComponent(escape(atob(b64)));
    } catch (e) { return null; }
  }
  function prepareLogoSrc(src, cb) {
    if (!isSvgSrc(src)) { cb(src, null); return; }
    var done = function (svgText) {
      if (!svgText) { cb(src, null); return; }
      var color = state.grad.on ? state.grad.c1 : state.fg;
      var tinted = tintSvg(svgText, color);
      state.logo.rawSvg = svgText;                    // 保留原始文本供换色重染
      cb('data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(tinted))), null);
    };
    var local = decodeDataSvg(src);
    if (local !== null && local !== undefined) { done(local); return; }
    if (window.fetch) {
      fetch(src).then(function (r) { return r.ok ? r.text() : null; })
        .then(function (t) { done(t); })
        .catch(function () { cb(src, null); });
    } else cb(src, null);
  }
  function retintLogo() {
    if (!state.logo.rawSvg || !state.logo.src) return;
    var color = state.grad.on ? state.grad.c1 : state.fg;
    var tinted = tintSvg(state.logo.rawSvg, color);
    var url = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(tinted)));
    rasterize(url, state.logo.pad, function (png) { state.logo.src = png; schedule(); persist(); });
  }
  function applyLogo(src, name, presetId) {
    state.logo.raw = src; state.logo.rawSvg = null;
    prepareLogoSrc(src, function (prepared) {
      rasterize(prepared, state.logo.pad, function (png) {
        state.logo.src = png; state.logo.name = name || '自定义 Logo'; state.logo.presetId = presetId || null;
        updateLogoUI(); maybeBumpEc(); persist(); schedule();
        toast('已应用 logo：' + state.logo.name);
      });
    });
  }
  function updateLogoActive() {
    var act = state.logo.presetId;
    var items = document.querySelectorAll('#logoGrid .logo-item');
    for (var i = 0; i < items.length; i++) {
      items[i].classList.toggle('active', !!act && items[i].getAttribute('data-id') === act);
    }
  }
  function updateLogoUI() {
    var el = $('logoCurrent'), rm = $('btnLogoRemove');
    if (state.logo.src) { el.textContent = '当前：' + state.logo.name; rm.classList.remove('hidden'); }
    else { el.textContent = '未使用'; rm.classList.add('hidden'); }
    updateLogoActive();
  }
  function maybeBumpEc() {
    if (state.logo.src && state.ec !== 'H') {
      state.ec = 'H'; $('selEc').value = 'H';
    }
  }


  /* ================= 快捷粘贴解析（编码 KV 串 + 标准内容串双向解码） ================= */
  var KV_MAP = {
    wifi: { ssid: ['ssid', '名称', '网络', '网络名称', 'wifi名', 'wifi名称'],
            password: ['密码', 'password', 'pass', 'pw'],
            enc: ['加密', '加密方式', 'encryption', '安全', 'security'],
            hidden: ['隐藏', '隐藏网络', 'hidden'] },
    vcard: { name: ['姓名', '名字', 'name'], org: ['公司', '单位', 'org', 'organization'],
             title: ['职位', '职称', '岗位', 'title'], tel: ['手机', '手机号', '电话', 'tel', 'phone'],
             email: ['邮箱', 'email', 'mail', '电子邮件'], url: ['网址', '主页', '个人主页', 'url', '网站', '链接'],
             addr: ['地址', '住址', 'addr', 'address'], note: ['备注', 'note', '说明'] },
    event: { title: ['标题', '日程', '主题', '事件', 'summary'],
             loc: ['地点', '位置', '场所', 'location'],
             start: ['开始', '开始时间', 'start', '起始'], end: ['结束', '结束时间', 'end'],
             desc: ['描述', '说明', 'description', '内容'] },
    email: { to: ['收件人', '收件人邮箱', '邮箱', 'to', 'email'], subject: ['主题', '标题', 'subject'],
             body: ['正文', '内容', 'body'] },
    geo: { lat: ['纬度', 'lat', 'latitude'], lng: ['经度', 'lng', 'lon', 'longitude'],
           raw: ['位置', '坐标', 'position', 'location'] },
    tel: { num: ['号码', '电话', '手机', '手机号', 'tel', 'phone'] },
    sms: { num: ['号码', '电话', '手机', '手机号', 'tel', 'phone'], body: ['内容', '短信', '正文', 'body', '信息'] },
    url: { url: ['网址', '地址', 'url', '链接', 'link', '网站'] }
  };
  var KV_PLACEHOLDER = {
    wifi: '粘贴：SSID=我家WiFi，密码=12345678，加密=WPA（也认 WIFI:T:… 标准串）',
    vcard: '粘贴：姓名=张三，公司=XX科技，手机=138…（也认 BEGIN:VCARD 名片串）',
    event: '粘贴：标题=周会，地点=会议室A，开始=2026-01-01 09:00（也认 VCALENDAR 串）',
    email: '粘贴：收件人=a@b.com，主题=你好（也认 mailto: 链接）',
    geo: '粘贴：纬度=39.9042，经度=116.4074 或 位置=39.9042,116.4074（也认 geo: 串）',
    tel: '粘贴：号码=+8613800000000（也认 tel: 串）',
    sms: '粘贴：号码=10086，内容=查询余额（也认 SMSTO: 串）',
    url: '粘贴：网址=https://example.com 或任意链接',
    text: '粘贴 WIFI:/名片/网址/geo:/SMSTO: 等内容串可自动识别为对应类型',
    decode: ''
  };
  function normKey(s) { return String(s || '').trim().toLowerCase().replace(/[\s：:]/g, ''); }
  function unesc(s) { return String(s || '').replace(/\\([;,:\\])/g, '$1'); }
  function parseKV(str, type) {
    var map = KV_MAP[type];
    if (!map) return null;
    var out = {};
    String(str).split(/[，,；;\n]+/).forEach(function (part) {
      var m = part.match(/^([^=：:=]{1,12})[=：:]\s*(.+)$/);
      if (!m) return;
      var key = normKey(m[1]);
      var val = m[2].trim().replace(/^["'「]|["'」]$/g, '');
      Object.keys(map).forEach(function (f) {
        if (map[f].indexOf(key) >= 0 && out[f] === undefined) out[f] = val;
      });
    });
    return Object.keys(out).length ? out : null;
  }
  function icalToLocal(v) {
    var m = String(v).match(/^(\d{4})(\d{2})(\d{2})T?(\d{2})?(\d{2})?/);
    if (!m) return '';
    return m[1] + '-' + m[2] + '-' + m[3] + (m[4] ? 'T' + m[4] + ':' + (m[5] || '00') : '');
  }
  function parseStandard(str) {
    var s = String(str).trim();
    var mw = s.match(/^WIFI:\s*([\s\S]*?)\s*;?\s*$/i);
    if (mw) {
      var v = { enc: 'WPA/WPA2', ssid: '', password: '', hidden: false };
      var VAL = /((?:\\.|[^;])*)/;
      var t = mw[1].match(new RegExp('T:' + VAL.source, 'i'));
      var ss = mw[1].match(new RegExp('S:' + VAL.source, 'i'));
      var pp = mw[1].match(new RegExp('P:' + VAL.source, 'i'));
      var hh = mw[1].match(/H:(true|false)/i);
      if (t) { var te = unesc(t[1]).toUpperCase(); v.enc = te === 'WEP' ? 'WEP' : (te === 'NOPASS' ? '无密码' : 'WPA/WPA2'); }
      if (ss) v.ssid = unesc(ss[1]);
      if (pp) v.password = unesc(pp[1]);
      if (hh) v.hidden = hh[1] === 'true';
      if (v.ssid) return { type: 'wifi', values: v };
    }
    if (/^BEGIN:VCARD/i.test(s)) {
      var v2 = {}, fn = '';
      s.split(/\r?\n/).forEach(function (line) {
        var mm = line.match(/^(FN|ORG|TITLE|TEL[^:]*|EMAIL[^:]*|URL|ADR[^:]*|NOTE|N):([\s\S]*)$/);
        if (!mm) return;
        var val = unesc(mm[2].trim());
        if (mm[1] === 'FN') fn = val;
        else if (mm[1] === 'N') { if (!fn) v2.name = val.replace(/;+$/, ''); }
        else if (mm[1] === 'ORG') v2.org = val;
        else if (mm[1] === 'TITLE') v2.title = val;
        else if (mm[1].indexOf('TEL') === 0) v2.tel = v2.tel || val;
        else if (mm[1].indexOf('EMAIL') === 0) v2.email = v2.email || val;
        else if (mm[1] === 'URL') v2.url = v2.url || val;
        else if (mm[1].indexOf('ADR') === 0) v2.addr = val.replace(/^;+/, '');
        else if (mm[1] === 'NOTE') v2.note = val;
      });
      if (fn) v2.name = fn;
      if (v2.name) return { type: 'vcard', values: v2 };
    }
    if (/^BEGIN:VCALENDAR/i.test(s)) {
      var v3 = {};
      s.split(/\r?\n/).forEach(function (line) {
        var mm = line.match(/^(SUMMARY|LOCATION|DESCRIPTION|DTSTART|DTEND)[^:]*:([\s\S]*)$/);
        if (!mm) return;
        var val = unesc(mm[2].trim()).replace(/\\n/g, '\n');
        if (mm[1] === 'SUMMARY') v3.title = val;
        else if (mm[1] === 'LOCATION') v3.loc = val;
        else if (mm[1] === 'DESCRIPTION') v3.desc = val;
        else if (mm[1] === 'DTSTART') v3.start = icalToLocal(val);
        else if (mm[1] === 'DTEND') v3.end = icalToLocal(val);
      });
      if (v3.title) return { type: 'event', values: v3 };
    }
    var me = s.match(/^mailto:([^?]+)(\?subject=([^&]*))?(?:&body=([\s\S]*))?$/i);
    if (me) {
      var v4 = { to: decodeURIComponent(me[1]) };
      try {
        if (me[3]) v4.subject = decodeURIComponent(me[3]);
        if (me[4]) v4.body = decodeURIComponent(me[4]);
      } catch (e) {}
      return { type: 'email', values: v4 };
    }
    var mg = s.match(/^geo:([\d.+-]+),([\d.+-]+)/i);
    if (mg) return { type: 'geo', values: { lat: mg[1], lng: mg[2] } };
    var mt = s.match(/^tel:(.+)$/i);
    if (mt) return { type: 'tel', values: { num: mt[1] } };
    var ms = s.match(/^SMSTO:([^:]*):([\s\S]*)$/i);
    if (ms) return { type: 'sms', values: { num: ms[1], body: ms[2] || '' } };
    if (/^https?:\/\/./.test(s)) return { type: 'url', values: { url: s } };
    return null;
  }
  function typeName(k) {
    var hit = TYPES.filter(function (x) { return x.k === k; })[0];
    return hit ? hit.label : k;
  }
  function quickParseAction() {
    var raw = $('quickParseInput').value.trim();
    if (!raw) { toast('先粘贴内容再解析'); return; }
    var std = parseStandard(raw);
    if (std) {
      state.mode = 'qr';
      state.type = std.type;
      Object.keys(std.values).forEach(function (k) {
        if (state.values[std.type][k] !== undefined) state.values[std.type][k] = std.values[k];
      });
      setModeUI(); renderTypeTabs(); renderForm(); persist(); schedule();
      toast('已识别为「' + typeName(std.type) + '」并填充字段');
      return;
    }
    var kv = parseKV(raw, state.type);
    if (!kv) { toast('没能解析，试试 WIFI:/网址 等标准串，或检查字段名'); return; }
    if (kv.enc !== undefined) {
      var e = kv.enc.toLowerCase();
      kv.enc = /wep/.test(e) ? 'WEP' : (/无|nopass|none/.test(e) ? '无密码' : 'WPA/WPA2');
    }
    if (kv.hidden !== undefined) kv.hidden = /^(true|1|是|y|yes|√)$/i.test(kv.hidden);
    if (kv.raw !== undefined) {
      var g = kv.raw.split(/[,，\s]+/);
      if (g.length >= 2 && !isNaN(parseFloat(g[0])) && !isNaN(parseFloat(g[1]))) {
        if (kv.lat === undefined) kv.lat = g[0];
        if (kv.lng === undefined) kv.lng = g[1];
      }
      delete kv.raw;
    }
    Object.keys(kv).forEach(function (k) { state.values[state.type][k] = kv[k]; });
    renderForm(); persist(); schedule();
    toast('已按「' + typeName(state.type) + '」填充 ' + Object.keys(kv).length + ' 个字段');
  }

  /* ================= 渲染 ================= */
  var qr = null, renderTimer = null;
  function schedule() { clearTimeout(renderTimer); renderTimer = setTimeout(render, 120); }

  function buildQrOptions(data) {
    var g = state.grad;
    var grad = g.on ? {
      type: g.type, rotation: (g.type === 'linear' ? g.rot : 0) * Math.PI / 180,
      colorStops: [{ offset: 0, color: g.c1 }, { offset: 1, color: g.c2 }]
    } : undefined;
    function withGrad(base) { var o = { type: base.type }; if (grad) o.gradient = grad; else o.color = state.fg; return o; }
    return {
      width: state.size, height: state.size, type: 'canvas', data: data, margin: state.margin,
      image: state.logo.src || undefined,
      qrOptions: { errorCorrectionLevel: state.ec },
      imageOptions: { hideBackgroundDots: state.logo.pad ? false : state.logo.hideDots, imageSize: state.logo.size, margin: 0, crossOrigin: 'anonymous' },
      dotsOptions: withGrad({ type: state.dots }),
      cornersSquareOptions: withGrad({ type: state.cornerSquare }),
      cornersDotOptions: withGrad({ type: state.cornerDot }),
      backgroundOptions: { color: state.transparent ? 'rgba(0,0,0,0)' : state.bg }
    };
  }

  function render() {
    $('renderErr').textContent = '';
    var isQr = state.mode === 'qr';
    $('qrPreview').classList.toggle('hidden', !isQr);
    $('barcodePreview').classList.toggle('hidden', isQr);
    $('qrStyleCard').classList.toggle('hidden', !isQr);
    $('logoCard').classList.toggle('hidden', !isQr);
    $('barcodeCard').classList.toggle('hidden', isQr);
    if (isQr) renderQr(); else renderBarcode();
  }

  function renderQr() {
    var box = $('qrPreview');
    var data = buildContent();
    if (!data) {
      box.innerHTML = '';
      var ph = document.createElement('div'); ph.className = 'placeholder';
      ph.textContent = '填写左侧内容后自动生成预览';
      box.appendChild(ph); qr = null; return;
    }
    var opts = buildQrOptions(data);
    try {
      if (qr) { qr.update(opts); }
      else { box.innerHTML = ''; qr = new QRCodeStyling(opts); qr.append(box); }
    } catch (e) {
      $('renderErr').textContent = '生成失败：' + (e && e.message ? e.message : e);
    }
  }

  function renderBarcode() {
    var canvas = $('bcCanvas'), hint = $('bcHint'), err = $('renderErr');
    hint.textContent = ''; err.textContent = '';
    var v = state.bc;
    if (!v.value) {
      canvas.style.display = 'none';
      hint.textContent = '请输入条码内容'; return;
    }
    canvas.style.display = '';
    try {
      JsBarcode('#bcCanvas', v.value, {
        format: v.format, width: v.width, height: v.height,
        displayValue: v.showText, fontSize: 16, margin: 10,
        lineColor: state.fg,
        background: state.transparent ? 'transparent' : state.bg,
        valid: function (ok) {
          if (!ok) {
            canvas.style.display = 'none';
            err.textContent = '内容不符合所选编码格式';
            hint.textContent = formatHint(v.format);
          }
        }
      });
      hint.textContent = formatHint(v.format);
    } catch (e) {
      canvas.style.display = 'none';
      err.textContent = '生成失败：' + (e && e.message ? e.message : e);
    }
  }
  function formatHint(fmt) {
    var m = {
      'EAN13': 'EAN-13 需要 12~13 位纯数字', 'EAN8': 'EAN-8 需要 7~8 位纯数字', 'EAN5': 'EAN-5 需要 5 位数字',
      'EAN2': 'EAN-2 需要 2 位数字', 'UPC': 'UPC-A 需要 11~12 位数字', 'UPCE': 'UPC-E 需要 6~8 位数字',
      'CODE39': 'CODE39 只支持大写字母、数字和 - . $ / + % 空格',
      'ITF': 'ITF 需要偶数位数字', 'ITF14': 'ITF-14 需要 13~14 位数字',
      'CODE128C': 'CODE128 C 只支持偶数位纯数字', 'pharmacode': 'Pharmacode 需要 3~131070 之间的数字',
      'codabar': 'Codabar 支持数字与 $ - : / .，可选首尾字母 A-D'
    };
    return m[fmt] || '';
  }

  /* ================= 导出 ================= */
  function activeCanvas() {
    if (state.mode === 'qr') return $('qrPreview').querySelector('canvas');
    var c = $('bcCanvas'); return c.style.display === 'none' ? null : c;
  }
  function download() {
    var c = activeCanvas();
    if (!c) { toast('当前没有可下载的图'); return; }
    var a = document.createElement('a');
    a.download = (state.mode === 'qr' ? 'qrcode-' + state.size + 'px' : 'barcode-' + state.bc.format) + '.png';
    a.href = c.toDataURL('image/png');
    a.click();
    toast('已下载 PNG');
  }
  function copyImage() {
    var c = activeCanvas();
    if (!c) { toast('当前没有可复制的图'); return; }
    if (!navigator.clipboard || !window.ClipboardItem) { toast('当前环境不支持复制图片'); return; }
    c.toBlob(function (blob) {
      if (!blob) { toast('复制失败'); return; }
      navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })])
        .then(function () { toast('已复制到剪贴板'); })
        .catch(function () { toast('复制失败，请直接下载'); });
    }, 'image/png');
  }

  /* ================= 以图生图（识别） ================= */
  function handleDecodeFile(file) {
    if (!file || !/^image\//.test(file.type)) { toast('请选择图片文件'); return; }
    var reader = new FileReader();
    reader.onload = function () { decodeImage(reader.result); };
    reader.readAsDataURL(file);
  }
  function decodeImage(dataUrl) {
    var img = new Image();
    img.onload = function () {
      var MAX = 1800;
      var scale = Math.min(1, MAX / Math.max(img.width, img.height));
      var w = Math.max(1, Math.round(img.width * scale)), h = Math.max(1, Math.round(img.height * scale));
      var c = document.createElement('canvas'); c.width = w; c.height = h;
      var ctx = c.getContext('2d'); ctx.drawImage(img, 0, 0, w, h);
      var id;
      try { id = ctx.getImageData(0, 0, w, h); } catch (e) { toast('图片数据读取失败'); return; }
      var code = jsQR(id.data, w, h, { inversionAttempts: 'attemptBoth' });
      if (!code || !code.data) {
        toast('未识别出二维码，请确保图片清晰完整');
        $('decodeResult').classList.add('hidden'); return;
      }
      $('decodeText').textContent = code.data;
      $('decodeResult').classList.remove('hidden');
      state.values.text = { text: code.data };  // 识图模式下预览区立即按识别内容出码
      persist(); schedule();
      toast('识别成功，预览已更新');
    };
    img.onerror = function () { toast('图片加载失败'); };
    img.src = dataUrl;
  }
  function useDecoded() {
    var txt = $('decodeText').textContent || '';
    if (!txt) return;
    state.mode = 'qr'; state.type = 'text';
    state.values.text = { text: txt };
    setModeUI();
    renderTypeTabs(); renderForm(); persist(); schedule();
    toast('已切到文本模式，可任意编辑换肤');
    if (document.querySelector('.col-right')) document.querySelector('.col-right').scrollTo({ top: 0, behavior: 'smooth' });
  }

  /* ================= 共享 logo（git 仓库存储：Worker 代理 commit，读取走静态 shared-logos/） ================= */
  var SHARE_API = 'https://logos.1996818.xyz';
  function loadSharedLogos() {
    if (!window.fetch) return;
    fetch('shared-logos/index.json', { cache: 'no-cache' }).then(function (r) { return r.ok ? r.json() : null; })
      .then(function (items) {
        window.LOGO_SHARED = (items || []).map(function (it) {
          return { id: 'u_' + it.id, n: it.n, c: '用户共享', a: '共享,上传,custom', f: it.id + '.' + it.ext, sh: 1 };
        });
        rebuildLogoCats(); drawLogoGrid();
      }).catch(function () { /* 离线时静默 */ });
  }
  function shareKey(promptIfMissing) {
    var key = '';
    try { key = localStorage.getItem('qrtb.shareKey') || ''; } catch (e) {}
    if (!key && promptIfMissing) {
      key = (window.prompt('共享操作需要口令（见 NEC8_KEYs/keys/qr-logos-vault.md）：') || '').trim();
      if (key) { try { localStorage.setItem('qrtb.shareKey', key); } catch (e) {} }
    }
    return key;
  }
  function shareFetch(url, opts) {
    opts = opts || {};
    var headers = opts.headers || {};
    headers['X-Key'] = shareKey(true);
    if (!headers['X-Key']) return Promise.reject(new Error('no-key'));
    opts.headers = headers;
    return fetch(url, opts).then(function (r) {
      if (r.status === 401) {
        try { localStorage.removeItem('qrtb.shareKey'); } catch (e) {}
        toast('口令不对，已清除，重试会再询问');
        return null;
      }
      return r.ok ? r.json() : null;
    });
  }
  function uploadSharedLogo(file) {
    if (file.size > 400 * 1024) { toast('图片超过 400KB，请压缩后再共享'); return; }
    var defName = file.name.replace(/\.[^.]+$/, '').slice(0, 24);
    var name = (window.prompt('给这个 logo 起个名字（展示在共享库列表）：', defName || '共享Logo') || '').trim().slice(0, 24);
    if (!name) return;
    var reader = new FileReader();
    reader.onload = function () {
      shareFetch(SHARE_API + '/logos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name, dataUrl: reader.result })
      }).then(function (j) {
        if (!j) { toast('共享上传失败'); return; }
        toast('已提交到 git 仓库，Pages 构建约 1~2 分钟后所有人可见');
      }).catch(function () { toast('网络异常，共享上传失败'); });
    };
    reader.readAsDataURL(file);
  }
  function renameSharedLogo(it) {
    var name = (window.prompt('把「' + it.n + '改名为：', it.n) || '').trim().slice(0, 24);
    if (!name || name === it.n) return;
    shareFetch(SHARE_API + '/logos/' + it.id.slice(2), {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: name })
    }).then(function (j) {
      toast(j ? '已改名，1~2 分钟后生效' : '改名失败');
    }).catch(function () { toast('网络异常，改名失败'); });
  }

  /* ================= 模式切换 & 绑定 ================= */
  function setModeUI() {
    var btns = $('modeSwitch').querySelectorAll('button');
    for (var i = 0; i < btns.length; i++) btns[i].classList.toggle('active', btns[i].dataset.mode === state.mode);
    render();
  }
  function bindControls() {
    $('modeSwitch').addEventListener('click', function (e) {
      var b = e.target.closest('button'); if (!b) return;
      state.mode = b.dataset.mode; persist(); setModeUI();
    });

    /* 数值类 */
    bindNum('inpSize', function (v) { state.size = v; }, 128, 1000);
    bindRange('inpMargin', 'valMargin', function (v) { state.margin = v; });
    bindRange('inpLogoSize', 'valLogoSize', function (v) { state.logo.size = v / 100; });
    $('selEc').addEventListener('change', function () { state.ec = this.value; persist(); schedule(); });

    ['selDots', 'selCornerSquare', 'selCornerDot'].forEach(function (id, i) {
      var keys = ['dots', 'cornerSquare', 'cornerDot'];
      $(id).addEventListener('change', function () { state[keys[i]] = this.value; persist(); schedule(); });
    });

    /* 颜色 */
    function bindColor(colorId, hexId, key, resetsTransparent) {
      var c = $(colorId), hx = $(hexId);
      function set(v, from) {
        if (!/^#[0-9a-fA-F]{6}$/.test(v)) return;
        state[key] = v.toLowerCase();
        if (resetsTransparent) { state.transparent = false; $('chkTransparent').checked = false; }
        if (from !== 'color') c.value = v;
        if (from !== 'hex') hx.value = v.toLowerCase();
        persist(); schedule();
        if (key === 'fg') retintLogo();
      }
      c.addEventListener('input', function () { set(c.value, 'color'); });
      hx.addEventListener('change', function () { set(hx.value.trim(), 'hex'); });
    }
    bindColor('inpFgColor', 'inpFgHex', 'fg', false);
    bindColor('inpBgColor', 'inpBgHex', 'bg', true);
    $('chkTransparent').addEventListener('change', function () { state.transparent = this.checked; persist(); schedule(); });

    /* 渐变 */
    $('chkGrad').addEventListener('change', function () { state.grad.on = this.checked; persist(); schedule(); retintLogo(); });
    $('selGradType').addEventListener('change', function () { state.grad.type = this.value; persist(); schedule(); });
    bindRange('inpGradRot', 'valGradRot', function (v) { state.grad.rot = v; });
    $('inpGrad1').addEventListener('input', function () { state.grad.c1 = this.value; $('inpGrad1Hex').value = this.value; persist(); schedule(); retintLogo(); });
    $('inpGrad1Hex').addEventListener('change', function () {
      if (/^#[0-9a-fA-F]{6}$/.test(this.value)) { state.grad.c1 = this.value.toLowerCase(); $('inpGrad1').value = state.grad.c1; persist(); schedule(); }
    });
    $('inpGrad2').addEventListener('input', function () { state.grad.c2 = this.value; $('inpGrad2Hex').value = this.value; persist(); schedule(); });
    $('inpGrad2Hex').addEventListener('change', function () {
      if (/^#[0-9a-fA-F]{6}$/.test(this.value)) { state.grad.c2 = this.value.toLowerCase(); $('inpGrad2').value = state.grad.c2; persist(); schedule(); }
    });

    /* Logo */
    $('btnLogoRemove').addEventListener('click', function () {
      state.logo.src = null; state.logo.raw = null; state.logo.name = ''; state.logo.presetId = null;
      updateLogoUI(); persist(); schedule(); toast('已移除 logo');
    });
    $('logoFile').addEventListener('change', function () {
      if (this.files && this.files[0]) applyLogoFromFile(this.files[0]);
      this.value = '';
    });
    $('logoShareFile').addEventListener('change', function () {
      if (this.files && this.files[0]) uploadSharedLogo(this.files[0]);
      this.value = '';
    });
    $('inpLogoSize').addEventListener('input', function () { $('valLogoSize').textContent = this.value + '%'; });
    $('chkLogoPad').addEventListener('change', function () {
      state.logo.pad = this.checked;
      if (state.logo.raw) { // 从原图重新衬底/去衬底
        rasterize(state.logo.raw, state.logo.pad, function (png) { state.logo.src = png; persist(); schedule(); });
      } else persist();
    });
    $('chkLogoHide').addEventListener('change', function () { state.logo.hideDots = this.checked; persist(); schedule(); });

    /* 条形码 */
    $('selBcFormat').addEventListener('change', function () { state.bc.format = this.value; persist(); schedule(); });
    $('inpBcValue').addEventListener('input', function () { state.bc.value = this.value; persist(); schedule(); });
    bindRange('inpBcWidth', 'valBcWidth', function (v) { state.bc.width = v; });
    bindRange('inpBcHeight', 'valBcHeight', function (v) { state.bc.height = v; });
    $('chkBcText').addEventListener('change', function () { state.bc.showText = this.checked; persist(); schedule(); });

    /* 导出 */
    $('btnQuickParse').addEventListener('click', quickParseAction);
    $('quickParseInput').addEventListener('keydown', function (e) {
      if (e.key === 'Enter') { e.preventDefault(); quickParseAction(); }
    });

    $('btnDownload').addEventListener('click', download);
    $('btnCopy').addEventListener('click', copyImage);

    /* 识图 */
    $('dropZone').addEventListener('click', function () { $('decodeFile').click(); });
    $('decodeFile').addEventListener('change', function () {
      if (this.files && this.files[0]) handleDecodeFile(this.files[0]);
      this.value = '';
    });
    ['dragover', 'dragenter'].forEach(function (ev) {
      $('dropZone').addEventListener(ev, function (e) { e.preventDefault(); this.classList.add('dragover'); });
    });
    ['dragleave', 'drop'].forEach(function (ev) {
      $('dropZone').addEventListener(ev, function (e) { e.preventDefault(); this.classList.remove('dragover'); });
    });
    $('dropZone').addEventListener('drop', function (e) {
      if (e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files[0]) handleDecodeFile(e.dataTransfer.files[0]);
    });
    document.addEventListener('paste', function (e) {
      var items = e.clipboardData && e.clipboardData.items; if (!items) return;
      for (var i = 0; i < items.length; i++) {
        if (items[i].type && items[i].type.indexOf('image') === 0) {
          var f = items[i].getAsFile(); if (f) { handleDecodeFile(f); e.preventDefault(); }
          return;
        }
      }
    });
    $('btnUseDecoded').addEventListener('click', useDecoded);
  }
  function applyLogoFromFile(file) {
    var reader = new FileReader();
    reader.onload = function () {
      var name = file.name.replace(/\.[^.]+$/, '').slice(0, 24) || '自定义 Logo';
      if (state.logo.pad || /^data:image\/svg/.test(reader.result)) {
        applyLogo(reader.result, name, null);
        return;
      }
      // 透明底模式：位图自动抠掉接近纯白的背景，让 logo 直贴码面
      whiteToTransparent(reader.result, function (png) {
        applyLogo(png, name, null);
        toast('已自动抠除白色背景（可在「白色衬底」开关还原）');
      });
    };
    reader.readAsDataURL(file);
  }
  function whiteToTransparent(src, cb) {
    var img = new Image();
    img.onload = function () {
      var c = document.createElement('canvas');
      c.width = img.naturalWidth || img.width; c.height = img.naturalHeight || img.height;
      var ctx = c.getContext('2d');
      ctx.drawImage(img, 0, 0);
      try {
        var id = ctx.getImageData(0, 0, c.width, c.height);
        for (var i = 0; i < id.data.length; i += 4) {
          if (id.data[i] >= 240 && id.data[i + 1] >= 240 && id.data[i + 2] >= 240) id.data[i + 3] = 0;
        }
        ctx.putImageData(id, 0, 0);
      } catch (e) { /* 读不出像素就原图返回 */ }
      cb(c.toDataURL('image/png'));
    };
    img.onerror = function () { cb(src); };
    img.src = src;
  }
  function bindNum(id, apply, min, max) {
    $(id).addEventListener('change', function () {
      var v = parseInt(this.value, 10);
      if (isNaN(v)) v = min;
      v = Math.min(max, Math.max(min, v));
      this.value = v; apply(v); persist(); schedule();
    });
  }
  function bindRange(id, valId, apply) {
    $(id).addEventListener('input', function () {
      var v = parseInt(this.value, 10);
      if (valId) $(valId).textContent = v;
      apply(v); persist(); schedule();
    });
  }

  /* ================= 从状态回填 UI ================= */
  function restoreUI() {
    $('inpSize').value = state.size;
    $('inpMargin').value = state.margin; $('valMargin').textContent = state.margin;
    $('selEc').value = state.ec;
    $('selDots').value = state.dots; $('selCornerSquare').value = state.cornerSquare; $('selCornerDot').value = state.cornerDot;
    $('inpFgColor').value = state.fg; $('inpFgHex').value = state.fg;
    $('inpBgColor').value = state.bg; $('inpBgHex').value = state.bg;
    $('chkTransparent').checked = state.transparent;
    $('chkGrad').checked = state.grad.on; $('selGradType').value = state.grad.type;
    $('inpGradRot').value = state.grad.rot; $('valGradRot').textContent = state.grad.rot;
    $('inpGrad1').value = state.grad.c1; $('inpGrad1Hex').value = state.grad.c1;
    $('inpGrad2').value = state.grad.c2; $('inpGrad2Hex').value = state.grad.c2;
    $('inpLogoSize').value = Math.round(state.logo.size * 100); $('valLogoSize').textContent = Math.round(state.logo.size * 100) + '%';
    $('chkLogoPad').checked = state.logo.pad; $('chkLogoHide').checked = state.logo.hideDots;
    $('selBcFormat').value = state.bc.format; $('inpBcValue').value = state.bc.value;
    $('inpBcWidth').value = state.bc.width; $('valBcWidth').textContent = state.bc.width;
    $('inpBcHeight').value = state.bc.height; $('valBcHeight').textContent = state.bc.height;
    $('chkBcText').checked = state.bc.showText;
    var sels = document.querySelectorAll('select');
    for (var i = 0; i < sels.length; i++) if (sels[i]._ddSync) sels[i]._ddSync();
  }

  /* ================= 启动 ================= */
  document.addEventListener('DOMContentLoaded', function () {
    renderTypeTabs(); renderForm(); renderMacarons(); renderLogoPicker();
    bindControls(); restoreUI(); updateLogoUI(); setModeUI();
    loadSharedLogos();
    enhanceAllSelects(document);
  });

  /* ================= 下拉框组件（桌面自绘弹层；触屏保留原生滚轮体验） ================= */
  var ddFine = window.matchMedia && window.matchMedia('(pointer: fine)').matches;
  function closeAllDd() {
    var open = document.querySelectorAll('.dd-list.open');
    for (var i = 0; i < open.length; i++) open[i].classList.remove('open');
  }
  function enhanceSelect(sel) {
    if (!ddFine || !sel || sel.tagName !== 'SELECT' || sel.getAttribute('data-dd')) return;
    sel.setAttribute('data-dd', '1');
    var wrap = document.createElement('div');
    wrap.className = 'dd';
    sel.parentNode.insertBefore(wrap, sel);
    wrap.appendChild(sel);
    var btn = document.createElement('button');
    btn.type = 'button'; btn.className = 'dd-btn';
    var list = document.createElement('div');
    list.className = 'dd-list';
    function sync() {
      var opt = sel.options[sel.selectedIndex];
      btn.textContent = (opt && opt.textContent) || '';
      var kids = list.children;
      for (var i = 0; i < kids.length; i++) kids[i].classList.toggle('on', i === sel.selectedIndex);
    }
    function build() {
      list.innerHTML = '';
      for (var i = 0; i < sel.options.length; i++) {
        (function (o) {
          var li = document.createElement('div');
          li.className = 'dd-opt' + (o.selected ? ' on' : '');
          li.textContent = o.textContent;
          li.addEventListener('click', function (e) {
            e.stopPropagation();
            sel.value = o.value;
            sel.dispatchEvent(new Event('change'));
            sync(); closeAllDd();
          });
          list.appendChild(li);
        })(sel.options[i]);
      }
    }
    btn.addEventListener('click', function (e) {
      e.stopPropagation();
      var isOpen = list.classList.contains('open');
      closeAllDd();
      if (!isOpen) { build(); sync(); list.classList.add('open'); }
    });
    wrap.appendChild(btn);
    wrap.appendChild(list);
    sel.style.display = 'none';
    sel._ddSync = sync;
    sync();
  }
  function enhanceAllSelects(root) {
    var sels = (root || document).querySelectorAll('select');
    for (var i = 0; i < sels.length; i++) enhanceSelect(sels[i]);
  }
  document.addEventListener('click', closeAllDd);
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') closeAllDd(); });

  /* 调试/自检句柄 */
  window.__qrtb = { state: state, buildContent: buildContent, render: render };
})();
