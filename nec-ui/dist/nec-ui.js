/* nec-ui v1.0.0 组件层 —— 自绘下拉 / 日历 / toast（零依赖）
   用法：
   NUI.toast('消息')
   NUI.enhanceSelect(rootEl)   把 root 内所有 <select> 升级为自绘弹层下拉（触屏自动跳过）
   NUI.calendar.scan(rootEl)   把 root 内 date/datetime-local 升级为自绘日历（触屏自动跳过）
   外部程序化改 select.value 后调用 sel._nuiSync() 同步按钮文字。 */
(function () {
  'use strict';
  var finePointer = window.matchMedia && window.matchMedia('(pointer: fine)').matches;

  /* ---------- toast ---------- */
  var toastEl = null, toastTimer = null;
  function toast(msg) {
    if (!toastEl) { toastEl = document.createElement('div'); toastEl.className = 'nui-toast'; document.body.appendChild(toastEl); }
    toastEl.textContent = msg; toastEl.classList.add('show');
    clearTimeout(toastTimer); toastTimer = setTimeout(function () { toastEl.classList.remove('show'); }, 2400);
  }

  /* ---------- 自绘下拉 ---------- */
  function closeAllDd() {
    var open = document.querySelectorAll('.nui-dd-list.open');
    for (var i = 0; i < open.length; i++) open[i].classList.remove('open');
  }
  function enhanceSelect(sel) {
    if (!finePointer || !sel || sel.tagName !== 'SELECT' || sel.getAttribute('data-nui-dd')) return;
    sel.setAttribute('data-nui-dd', '1');
    var wrap = document.createElement('div');
    wrap.className = 'nui-dd';
    sel.parentNode.insertBefore(wrap, sel);
    wrap.appendChild(sel);
    var btn = document.createElement('button');
    btn.type = 'button'; btn.className = 'nui-dd-btn';
    var list = document.createElement('div');
    list.className = 'nui-dd-list';
    function sync() {
      var opt = sel.options[sel.selectedIndex];
      btn.textContent = (opt && opt.textContent) || '';
      for (var i = 0; i < list.children.length; i++) list.children[i].classList.toggle('on', i === sel.selectedIndex);
    }
    function build() {
      list.innerHTML = '';
      for (var i = 0; i < sel.options.length; i++) {
        (function (o) {
          var li = document.createElement('div');
          li.className = 'nui-dd-opt' + (o.selected ? ' on' : '');
          li.textContent = o.textContent;
          li.addEventListener('click', function (e) {
            e.stopPropagation();
            sel.value = o.value;
            sel.dispatchEvent(new Event('change', { bubbles: false }));
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
      if (!isOpen) {
        build(); sync();
        var rect = btn.getBoundingClientRect();
        list.style.left = rect.left + 'px';
        list.style.top = (rect.bottom + 4) + 'px';
        list.style.width = rect.width + 'px';
        list.style.maxHeight = Math.max(160, window.innerHeight - rect.bottom - 16) + 'px';
        list.classList.add('open');
      }
    });
    wrap.appendChild(btn); wrap.appendChild(list);
    sel.style.display = 'none';
    sel._nuiSync = sync;
    sync();
  }
  function enhanceSelectAll(root) {
    if (!finePointer) return;
    (root || document).querySelectorAll('select').forEach(enhanceSelect);
  }
  document.addEventListener('click', closeAllDd);
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') closeAllDd(); });
  window.addEventListener('scroll', closeAllDd, true);
  window.addEventListener('resize', closeAllDd);

  /* ---------- 自绘日历 ---------- */
  var calPop = null, calInput = null, calView = null;
  function pad2(n) { return (n < 10 ? '0' : '') + n; }
  function fmtDate(d) { return d.getFullYear() + '-' + pad2(d.getMonth() + 1) + '-' + pad2(d.getDate()); }
  function parseVal(v) {
    var m = String(v || '').match(/^(\d{4})-(\d{2})-(\d{2})/);
    return m ? new Date(+m[1], +m[2] - 1, +m[3]) : null;
  }
  function calClose() { if (calPop) calPop.classList.remove('open'); calInput = null; }
  function calEnsure() {
    if (calPop) return calPop;
    calPop = document.createElement('div');
    calPop.className = 'nui-cal-pop';
    calPop.addEventListener('click', function (e) { e.stopPropagation(); });
    document.body.appendChild(calPop);
    document.addEventListener('click', calClose);
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape') calClose(); });
    window.addEventListener('scroll', calClose, true);
    window.addEventListener('resize', calClose);
    return calPop;
  }
  function calOpen(input) {
    calInput = input;
    var base = parseVal(input.value) || new Date();
    calView = { y: base.getFullYear(), m: base.getMonth() };
    var p = calEnsure();
    calBuild(p, input);
    p.classList.add('open');
    var r = input.getBoundingClientRect();
    p.style.left = '0px'; p.style.top = '0px';
    var ph = p.offsetHeight;
    p.style.left = Math.max(8, Math.min(r.left, window.innerWidth - 276)) + 'px';
    p.style.top = (r.bottom + 6 + ph > window.innerHeight - 8 ? Math.max(8, r.top - ph - 6) : r.bottom + 6) + 'px';
  }
  function calBuild(p, input) {
    var isDT = input.type === 'datetime-local';
    var val = parseVal(input.value);
    var today = new Date();
    var html = '<div class="nui-cal-head"><button type="button" class="nui-cal-nav" data-a="prev">\u2039</button>' +
      '<b class="nui-cal-title">' + calView.y + '\u5e74' + (calView.m + 1) + '\u6708</b>' +
      '<button type="button" class="nui-cal-nav" data-a="next">\u203a</button></div><div class="nui-cal-week">';
    ['\u4e00', '\u4e8c', '\u4e09', '\u56db', '\u4e94', '\u516d', '\u65e5'].forEach(function (w) { html += '<span>' + w + '</span>'; });
    html += '</div><div class="nui-cal-grid">';
    var off = (new Date(calView.y, calView.m, 1).getDay() + 6) % 7;
    var start = new Date(calView.y, calView.m, 1 - off);
    for (var i = 0; i < 42; i++) {
      var d = new Date(start.getFullYear(), start.getMonth(), start.getDate() + i);
      var cls = 'nui-cal-d' + (d.getMonth() !== calView.m ? ' dim' : '') +
        (fmtDate(d) === fmtDate(today) ? ' today' : '') +
        (val && fmtDate(d) === fmtDate(val) ? ' sel' : '');
      html += '<button type="button" class="' + cls + '" data-d="' + fmtDate(d) + '">' + d.getDate() + '</button>';
    }
    html += '</div>';
    if (isDT) {
      var tv = input.value.match(/T(\d{2}):(\d{2})/);
      var hh = tv ? tv[1] : '09', mm = tv ? tv[2] : '00';
      html += '<div class="nui-cal-time"><span>\u65f6\u95f4</span><select class="nui-cal-hh">';
      for (var h = 0; h < 24; h++) { var H = pad2(h); html += '<option' + (H === hh ? ' selected' : '') + '>' + H + '</option>'; }
      html += '</select>:<select class="nui-cal-mm">';
      for (var mi = 0; mi < 60; mi++) { var M = pad2(mi); html += '<option' + (M === mm ? ' selected' : '') + '>' + M + '</option>'; }
      html += '</select></div>';
    }
    html += '<div class="nui-cal-foot"><button type="button" class="nui-cal-act" data-a="clear">\u6e05\u9664</button>' +
      '<span class="nui-cal-spring"></span>' +
      '<button type="button" class="nui-cal-act" data-a="now">\u6b64\u523b</button></div>';
    p.innerHTML = html;

    p.querySelector('.nui-cal-head').addEventListener('click', function (e) {
      var b = e.target.closest('button'); if (!b) return;
      if (b.dataset.a === 'prev') { calView.m--; if (calView.m < 0) { calView.m = 11; calView.y--; } }
      else { calView.m++; if (calView.m > 11) { calView.m = 0; calView.y++; } }
      calBuild(p, input);
    });
    p.querySelector('.nui-cal-grid').addEventListener('click', function (e) {
      var b = e.target.closest('.nui-cal-d'); if (!b || !b.dataset.d) return;
      calSetValue(input, b.dataset.d, isDT);
      calClose();
    });
    p.querySelector('.nui-cal-foot').addEventListener('click', function (e) {
      var b = e.target.closest('button'); if (!b) return;
      if (b.dataset.a === 'clear') { input.value = ''; calFire(input); }
      else { var n = new Date(); calSetValue(input, fmtDate(n), isDT, n); }
      calClose();
    });
  }
  function calSetValue(input, dateStr, isDT, now) {
    if (isDT) {
      var hSel = calPop.querySelector('.nui-cal-hh'), mSel = calPop.querySelector('.nui-cal-mm');
      var tv = input.value.match(/T(\d{2}):(\d{2})/);
      var hh = hSel ? hSel.value : (now ? pad2(now.getHours()) : (tv ? tv[1] : '09'));
      var mm = mSel ? mSel.value : (now ? pad2(now.getMinutes()) : (tv ? tv[2] : '00'));
      input.value = dateStr + 'T' + hh + ':' + mm;
    } else input.value = dateStr;
    ['input', 'change'].forEach(function (ev) { input.dispatchEvent(new Event(ev, { bubbles: true })); });
  }
  function calScan(root) {
    if (!finePointer) return;
    (root || document).querySelectorAll('input[type="date"], input[type="datetime-local"]').forEach(function (input) {
      if (input.getAttribute('data-nui-cal')) return;
      input.setAttribute('data-nui-cal', '1');
      var wrapEl = document.createElement('span');
      wrapEl.className = 'nui-cal-wrap';
      input.parentNode.insertBefore(wrapEl, input);
      wrapEl.appendChild(input);
      var icon = document.createElement('button');
      icon.type = 'button'; icon.className = 'nui-cal-icon'; icon.title = '\u9009\u62e9\u65e5\u671f';
      icon.innerHTML = '<svg viewBox="0 0 16 16" width="13" height="13"><path fill="currentColor" d="M3.5 0a.5.5 0 0 1 .5.5V1h8V.5a.5.5 0 0 1 1 0V1h1a2 2 0 0 1 2 2v11a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2V3a2 2 0 0 1 2-2h1V.5a.5.5 0 0 1 .5-.5zM1 4v10a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V4H1z"/></svg>';
      wrapEl.appendChild(icon);
      function toggle(e) {
        e.preventDefault(); e.stopPropagation();
        if (calInput === input && calPop && calPop.classList.contains('open')) calClose();
        else calOpen(input);
      }
      icon.addEventListener('click', toggle);
      input.addEventListener('click', toggle);
      input.addEventListener('input', function () { if (calPop && calPop.classList.contains('open') && calInput === input) calClose(); });
    });
  }

  /* ---------- 导出 ---------- */
  window.NUI = {
    toast: toast,
    enhanceSelect: enhanceSelectAll,
    enhanceOne: enhanceSelect,
    calendar: { scan: calScan }
  };
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () { enhanceSelectAll(document); calScan(document); });
  } else {
    enhanceSelectAll(document); calScan(document);
  }
})();
