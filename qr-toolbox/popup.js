/* popup：输入即生成，保持极简；完整功能去 index.html */
(function () {
  'use strict';
  var $ = function (id) { return document.getElementById(id); };
  var SIZE = 190;
  var LS = 'qrtb.popup.text';
  var qr = null, timer = null;

  function toast(m) {
    var t = $('toast'); t.textContent = m; t.classList.add('show');
    clearTimeout(toast._t); toast._t = setTimeout(function () { t.classList.remove('show'); }, 1800);
  }
  function render() {
    var v = $('txt').value.trim();
    var box = $('pv');
    try { localStorage.setItem(LS, $('txt').value); } catch (e) {}
    if (!v) {
      box.innerHTML = '';
      var p = document.createElement('div'); p.className = 'placeholder';
      p.textContent = '输入内容后这里实时出码'; box.appendChild(p); qr = null; return;
    }
    var opts = {
      width: SIZE, height: SIZE, type: 'canvas', data: v, margin: 10,
      qrOptions: { errorCorrectionLevel: 'M' },
      dotsOptions: { color: '#000000', type: 'square' },
      cornersSquareOptions: { color: '#000000', type: 'square' },
      cornersDotOptions: { color: '#000000', type: 'square' },
      backgroundOptions: { color: '#ffffff' }
    };
    if (qr) qr.update(opts);
    else { box.innerHTML = ''; qr = new QRCodeStyling(opts); qr.append(box); }
  }
  function canvas() { return $('pv').querySelector('canvas'); }

  $('txt').value = '';
  try { $('txt').value = localStorage.getItem(LS) || ''; } catch (e) {}
  $('txt').addEventListener('input', function () { clearTimeout(timer); timer = setTimeout(render, 150); });
  $('btnSave').addEventListener('click', function () {
    var c = canvas(); if (!c) { toast('先输入内容'); return; }
    var a = document.createElement('a');
    a.download = 'qrcode-' + SIZE + 'px.png'; a.href = c.toDataURL('image/png'); a.click();
  });
  $('btnCopy').addEventListener('click', function () {
    var c = canvas(); if (!c) { toast('先输入内容'); return; }
    if (!navigator.clipboard || !window.ClipboardItem) { toast('此环境不支持复制图片'); return; }
    c.toBlob(function (b) {
      if (!b) { toast('复制失败'); return; }
      navigator.clipboard.write([new ClipboardItem({ 'image/png': b })])
        .then(function () { toast('已复制'); })
        .catch(function () { toast('复制失败，请下载'); });
    }, 'image/png');
  });
  render();
})();
