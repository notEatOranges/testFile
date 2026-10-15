/* 小程序码工作台 —— 三模式 + 美化合成 */
(function () {
  'use strict';
  var $ = function (id) { return document.getElementById(id); };
  var API = 'https://mp.1996818.xyz';
  var mode = 'wxacode';
  var codeImg = null;      // 葵花码 Image 对象（服务端返回）
  var linkStr = '';        // scheme/urllink 生成的链接
  var qr = null;           // 链接模式 QRCodeStyling 实例
  var bgImg = null;        // 背景图
  var logoImg = null;      // 链接模式 logo（上传）
  var wechatImg = null;    // 微信图标

  function toast(m) { var t = $('toast'); t.textContent = m; t.classList.add('show');
    clearTimeout(toast._t); toast._t = setTimeout(function () { t.classList.remove('show'); }, 2400); }
  function getKey(force) {
    var k = '';
    try { k = localStorage.getItem('mpc.key') || ''; } catch (e) {}
    if (!k || force) {
      k = (window.prompt('小程序码服务口令（见 NEC8_KEYs/keys/mpcode-vault.md）：') || '').trim();
      if (k) { try { localStorage.setItem('mpc.key', k); } catch (e) {} }
    }
    return k;
  }
  function api(path, data) {
    return fetch(API + path, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Key': getKey(false) },
      body: JSON.stringify(data)
    }).then(function (r) {
      if (r.status === 401) {
        try { localStorage.removeItem('mpc.key'); } catch (e) {}
        throw new Error('口令不对，已清除，请重试再输入');
      }
      return r.json();
    }).then(function (j) {
      if (!j || j.error) throw new Error((j && j.error) || '请求失败');
      return j;
    });
  }

  /* ---------- 小程序应用管理 ---------- */
  var appsList = [];
  function loadApps() {
    return fetch(API + '/api/apps', { headers: { 'X-Key': getKey(false) } }).then(function (r) {
      if (r.status === 401) { try { localStorage.removeItem('mpc.key'); } catch (e) {} throw new Error('口令不对'); }
      return r.json();
    }).then(function (list) {
      appsList = list || [];
      var sel = $('appSel');
      var cur = sel.value;
      sel.innerHTML = '';
      if (!appsList.length) {
        var o = document.createElement('option');
        o.value = ''; o.textContent = '（无应用，点「添加/更新」）';
        sel.appendChild(o);
      } else {
        appsList.forEach(function (a) {
          var o = document.createElement('option');
          o.value = a.name;
          o.textContent = a.name + '（' + a.appid + (a.valid ? '' : ' · 未配置') + '）';
          sel.appendChild(o);
        });
        if (appsList.some(function (a) { return a.name === cur; })) sel.value = cur;
      }
      syncValidMark();
    }).catch(function (e) { toast('应用列表加载失败：' + e.message + '，可点「刷新」重试'); });
  }
  function syncValidMark() {
    var a = appsList.filter(function (x) { return x.name === $('appSel').value; })[0];
    $('appValid').checked = !!(a && a.valid);
  }
  $('appSel').addEventListener('change', syncValidMark);
  $('btnAppReload').addEventListener('click', function () { loadApps().then(function () { toast('已刷新'); }); });
  $('btnAppAdd').addEventListener('click', function () {
    var cur = appsList.filter(function (x) { return x.name === $('appSel').value; })[0];
    $('appForm').classList.remove('hidden');
    $('a_name').value = cur ? cur.name : '';
    $('a_appid').value = cur ? cur.appid : '';
    $('a_secret').value = '';
  });
  $('btnAppCancel').addEventListener('click', function () { $('appForm').classList.add('hidden'); });
  $('btnAppSave').addEventListener('click', function () {
    var name = $('a_name').value.trim();
    var appid = $('a_appid').value.trim();
    var secret = $('a_secret').value;
    var exists = appsList.some(function (x) { return x.name === name; });
    if (!name || !appid) { toast('名称和 AppID 必填'); return; }
    if (!secret && !exists) { toast('新应用需要填 secret'); return; }
    api('/api/apps', { name: name, appid: appid, secret: secret || '•••保留原值•••' })
      .then(function (j) {
        $('appForm').classList.add('hidden');
        $('a_secret').value = '';
        toast(j.added ? '已添加「' + name + '」' : '已更新「' + name + '」');
        return loadApps();
      }).then(function () { $('appSel').value = name; syncValidMark(); })
      .catch(function (e) { toast(e.message); });
  });
  $('btnAppDel').addEventListener('click', function () {
    var name = $('appSel').value;
    if (!name) { toast('没有可删除的应用'); return; }
    if (!window.confirm('确定删除应用「' + name + '」？')) return;
    api('/api/apps/delete', { name: name }).then(function (j) {
      toast('已删除，剩余 ' + j.total + ' 个');
      loadApps();
    }).catch(function (e) { toast(e.message); });
  });

  /* ---------- 模式切换 ---------- */
  var HINTS = {
    wxacode: '生成的是官方「小程序码」，需在 mp.weixin.qq.com 用小程序 AppID 调用（服务端已代填）。',
    scheme: 'URL Scheme：微信外拉起小程序的 weixin:// 短串。生成后可直接出二维码，微信扫一扫进入。',
    urllink: 'URL Link：https://wxaurl.cn/xx 短链。生成后可直接出二维码，微信扫码进入。'
  };
  function setMode(m) {
    mode = m;
    var btns = $('modeSwitch').querySelectorAll('button');
    for (var i = 0; i < btns.length; i++) btns[i].classList.toggle('active', btns[i].dataset.mode === m);
    $('formWxacode').classList.toggle('hidden', m !== 'wxacode');
    $('formLink').classList.toggle('hidden', m === 'wxacode');
    $('beauWxacode').classList.toggle('hidden', m !== 'wxacode');
    $('beauLink').classList.toggle('hidden', m === 'wxacode');
    $('paramTitle').childNodes[0].nodeValue =
      m === 'wxacode' ? '小程序码参数 ' : (m === 'scheme' ? 'URL Scheme 参数 ' : 'URL Link 参数 ');
    $('modeHint').textContent = HINTS[m];
    $('beauSub').textContent = m === 'wxacode' ? '海报合成' : '二维码样式';
    // 葵花码画布仅在已生成图片后显示；占位文字反之
    $('poster').classList.toggle('hidden', m !== 'wxacode' || !codeImg);
    $('ph').classList.toggle('hidden', m === 'wxacode' && !!codeImg);
    $('qrBox').classList.toggle('hidden', m === 'wxacode');
    if (m !== 'wxacode') renderLinkQr();
    else renderPoster();
  }
  $('modeSwitch').addEventListener('click', function (e) {
    var b = e.target.closest('button'); if (!b) return;
    setMode(b.dataset.mode);
  });

  /* ---------- 葵花码：请求 + 海报合成 ---------- */
  function bindColorHex(colorId, hexId) {
    $(hexId).addEventListener('change', function () {
      if (/^#[0-9a-fA-F]{6}$/.test(this.value)) $(colorId).value = this.value;
    });
  }
  bindColorHex('f_line', 'f_linehex');

  $('f_scene').addEventListener('input', function () { $('sceneCount').textContent = this.value.length + '/32'; });

  $('btnGenCode').addEventListener('click', function () {
    var scene = $('f_scene').value.trim();
    if (!scene) { toast('先填 scene 码内容'); return; }
    $('btnGenCode').disabled = true;
    toast('请求微信接口生成中…');
    api('/api/wxacode', {
      scene: scene,
      app: $('appSel').value,
      page: $('f_page').value.trim(),
      env_version: $('f_env').value,
      width: parseInt($('f_width').value) || 430,
      auto_color: $('f_auto').checked,
      is_hyaline: $('f_hyaline').checked,
      line_color: hexToRgb($('f_line').value)
    }).then(function (j) {
      var img = new Image();
      img.onload = function () {
        codeImg = img;
        $('ph').classList.add('hidden');
        renderPoster();
        toast('小程序码已生成');
      };
      img.onerror = function () { toast('图片解码失败'); };
      img.src = j.image;
    }).catch(function (e) { $('err').textContent = e.message; toast(e.message); })
      .finally(function () { $('btnGenCode').disabled = false; });
  });

  function hexToRgb(hex) {
    var m = /^#?([0-9a-fA-F]{6})$/.exec(hex || '');
    if (!m) return [0, 0, 0];
    return [parseInt(m[1].slice(0, 2), 16), parseInt(m[1].slice(2, 4), 16), parseInt(m[1].slice(4, 6), 16)];
  }

  function renderPoster() {
    if (mode !== 'wxacode' || !codeImg) return;
    var W = parseInt($('b_size').value) || 960, H = Math.round(W * 1.25);
    var cv = $('poster'); cv.width = W; cv.height = H;
    $('poster').classList.remove('hidden');
    $('ph').classList.add('hidden');
    var ctx = cv.getContext('2d');
    // 背景
    if (bgImg) {
      var s = Math.max(W / bgImg.width, H / bgImg.height);
      var iw = bgImg.width * s, ih = bgImg.height * s;
      ctx.drawImage(bgImg, (W - iw) / 2, (H - ih) / 2, iw, ih);
    } else if ($('b_grad').checked) {
      var g = ctx.createLinearGradient(0, 0, W, H);
      g.addColorStop(0, $('b_bg1').value); g.addColorStop(1, $('b_bg2').value);
      ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    } else {
      ctx.fillStyle = $('b_bg1').value; ctx.fillRect(0, 0, W, H);
    }
    var traySize = W * parseInt($('b_traySize').value) / 100;
    var cx = W / 2, cy = H * 0.46;
    var shape = $('b_tray').value;
    if (shape !== 'none') {
      if ($('b_shadow').checked) { ctx.shadowColor = 'rgba(35,37,46,.22)'; ctx.shadowBlur = W * 0.04; ctx.shadowOffsetY = W * 0.012; }
      ctx.fillStyle = '#ffffff';
      if (shape === 'round') {
        ctx.beginPath(); ctx.arc(cx, cy, traySize / 2, 0, Math.PI * 2); ctx.fill();
      } else {
        rr(ctx, cx - traySize / 2, cy - traySize / 2, traySize, traySize, traySize * 0.14); ctx.fill();
      }
      ctx.shadowColor = 'transparent'; ctx.shadowBlur = 0; ctx.shadowOffsetY = 0;
    }
    var codeSize = traySize * parseInt($('b_codeSize').value) / 100;
    ctx.drawImage(codeImg, cx - codeSize / 2, cy - codeSize / 2, codeSize, codeSize);
    // 文字
    var t1 = $('b_t1').value.trim();
    if (t1) {
      ctx.fillStyle = $('b_t1c').value;
      ctx.font = '700 ' + (parseInt($('b_t1s').value) * W / 960) + 'px -apple-system, "Microsoft YaHei", sans-serif';
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText(t1, cx, H * 0.16);
    }
    var t2 = $('b_t2').value.trim();
    if (t2) {
      ctx.fillStyle = $('b_t2c').value;
      ctx.font = (26 * W / 960) + 'px -apple-system, "Microsoft YaHei", sans-serif';
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText(t2, cx, H * 0.9);
    }
  }
  function rr(ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  }

  /* ---------- Scheme / URL Link ---------- */
  $('btnGenLink').addEventListener('click', function () {
    var isExp = $('l_expire').value !== '0';
    $('btnGenLink').disabled = true;
    toast('请求微信接口生成中…');
    api(mode === 'scheme' ? '/api/scheme' : '/api/urllink', {
      app: $('appSel').value,
      path: $('l_path').value.trim(),
      query: $('l_query').value.trim(),
      env_version: $('l_env').value,
      is_expire: isExp,
      expire_days: parseInt($('l_expire').value) || 30
    }).then(function (j) {
      linkStr = j.link;
      $('linkOut').textContent = linkStr;
      toast('链接已生成，正在出码');
      renderLinkQr();
    }).catch(function (e) { $('err').textContent = e.message; toast(e.message); })
      .finally(function () { $('btnGenLink').disabled = false; });
  });

  function loadWechatImg(cb) {
    if (wechatImg) return cb(wechatImg);
    var img = new Image();
    img.onload = function () { wechatImg = img; cb(img); };
    img.src = 'logos/b-wechat.svg';
  }
  function currentLogo(cb) {
    var lv = $('q_logo').value;
    if (lv === 'none') return cb(null);
    if (lv === 'wechat') return loadWechatImg(cb);
    if (logoImg) return cb(logoImg);
    cb(null);
  }
  function renderLinkQr() {
    if (mode === 'wxacode' || !linkStr) {
      var box = $('qrBox');
      if (!linkStr && mode !== 'wxacode') {
        box.innerHTML = '';
        var ph = document.createElement('div'); ph.className = 'placeholder';
        ph.textContent = '先点「生成链接并出码」'; box.appendChild(ph);
      }
      return;
    }
    var grad = $('q_grad').checked;
    var opts = {
      width: 640, height: 640, type: 'canvas', data: linkStr, margin: parseInt($('q_margin').value) || 12,
      qrOptions: { errorCorrectionLevel: $('q_logo').value === 'none' ? 'M' : 'H' },
      dotsOptions: grad
        ? { type: $('q_dots').value, gradient: { type: 'linear', rotation: Math.PI / 4, colorStops: [{ offset: 0, color: $('q_fg').value }, { offset: 1, color: $('q_fg2').value }] } }
        : { type: $('q_dots').value, color: $('q_fg').value },
      cornersSquareOptions: { type: $('q_cs').value, color: $('q_fg').value },
      cornersDotOptions: { type: $('q_cs').value === 'dot' ? 'dot' : 'square', color: $('q_fg').value },
      backgroundOptions: { color: $('q_bg').value }
    };
    currentLogo(function (img) {
      if (img) {
        opts.image = img.src;
        opts.imageOptions = { hideBackgroundDots: true, imageSize: parseInt($('q_logoSize').value) / 100, margin: 2 };
      }
      if (qr) qr.update(opts);
      else { $('qrBox').innerHTML = ''; qr = new QRCodeStyling(opts); qr.append($('qrBox')); }
      $('ph').classList.add('hidden');
    });
  }

  /* ---------- 美化控件绑定（改动即重绘） ---------- */
  ['b_bg1', 'b_bg2', 'b_grad', 'b_tray', 'b_traySize', 'b_codeSize', 'b_shadow', 'b_t1', 'b_t2', 'b_t1c', 'b_t2c', 'b_size']
    .forEach(function (id) {
      $(id).addEventListener(id.indexOf('b_') === 0 && /Size|t1s/.test(id) ? 'input' : 'change', function () {
        if (id === 'b_traySize') $('v_tray').textContent = this.value + '%';
        if (id === 'b_codeSize') $('v_code').textContent = this.value + '%';
        if (id === 'b_t1s') $('v_t1s').textContent = this.value;
        renderPoster();
      });
    });
  $('b_bgimg').addEventListener('change', function () {
    if (!this.files || !this.files[0]) return;
    var rd = new FileReader();
    rd.onload = function () {
      var img = new Image();
      img.onload = function () { bgImg = img; renderPoster(); toast('背景图已应用'); };
      img.src = rd.result;
    };
    rd.readAsDataURL(this.files[0]);
    this.value = '';
  });
  ['q_dots', 'q_cs', 'q_fg', 'q_fg2', 'q_grad', 'q_bg', 'q_logo', 'q_logoSize', 'q_margin']
    .forEach(function (id) {
      $(id).addEventListener(id === 'q_logoSize' || id === 'q_margin' ? 'input' : 'change', function () {
        if (id === 'q_logoSize') $('q_lsz').textContent = this.value + '%';
        if (id === 'q_margin') $('q_mg').textContent = this.value;
        renderLinkQr();
      });
    });
  $('q_logoFile').addEventListener('change', function () {
    if (!this.files || !this.files[0]) return;
    var rd = new FileReader();
    rd.onload = function () {
      var img = new Image();
      img.onload = function () { logoImg = img; renderLinkQr(); };
      img.src = rd.result;
    };
    rd.readAsDataURL(this.files[0]);
    this.value = '';
  });
  $('q_logo').addEventListener('change', function () {
    if (this.value === 'upload') $('q_logoFile').click();
  });

  /* ---------- 下载 ---------- */
  $('btnDown').addEventListener('click', function () {
    var a = document.createElement('a');
    if (mode === 'wxacode') {
      var cv = $('poster');
      if (!codeImg) { toast('还没有生成小程序码'); return; }
      a.download = 'wxacode-poster-' + cv.width + '.png';
      a.href = cv.toDataURL('image/png');
    } else {
      var c = $('qrBox').querySelector('canvas');
      if (!c || !linkStr) { toast('还没有生成链接二维码'); return; }
      a.download = (mode === 'scheme' ? 'scheme' : 'urllink') + '-qr.png';
      a.href = c.toDataURL('image/png');
    }
    a.click();
    toast('已下载 PNG');
  });

  /* ---------- 启动 ---------- */
  setMode('wxacode');
  loadApps();

  /* 调试句柄 */
  window.__mpdbg = {
    setCode: function (img) { codeImg = img; renderPoster(); },
    get state() { return { mode: mode, hasCode: !!codeImg }; }
  };
})();
