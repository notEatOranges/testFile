/* 自绘日历/日期时间弹层 —— 替换浏览器原生控件（桌面精确指针；触屏保留原生体验） */
(function () {
  'use strict';
  if (!window.matchMedia || !window.matchMedia('(pointer: fine)').matches) return;
  var pop = null, curInput = null, view = null;

  function pad2(n) { return (n < 10 ? '0' : '') + n; }
  function fmtDate(d) { return d.getFullYear() + '-' + pad2(d.getMonth() + 1) + '-' + pad2(d.getDate()); }
  function parseVal(v) {
    var m = String(v || '').match(/^(\d{4})-(\d{2})-(\d{2})/);
    return m ? new Date(+m[1], +m[2] - 1, +m[3]) : null;
  }
  function close() { if (pop) pop.classList.remove('open'); curInput = null; }

  function ensurePop() {
    if (pop) return pop;
    pop = document.createElement('div');
    pop.className = 'cal-pop';
    pop.addEventListener('click', function (e) { e.stopPropagation(); });
    document.body.appendChild(pop);
    document.addEventListener('click', close);
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape') close(); });
    window.addEventListener('scroll', close, true);
    window.addEventListener('resize', close);
    return pop;
  }

  function open(input) {
    curInput = input;
    var base = parseVal(input.value) || new Date();
    view = { y: base.getFullYear(), m: base.getMonth() };
    var p = ensurePop();
    build(p, input);
    p.style.left = '0px'; p.style.top = '0px'; p.classList.add('open');
    var r = input.getBoundingClientRect();
    var ph = p.offsetHeight;
    p.style.left = Math.max(8, Math.min(r.left, window.innerWidth - 276)) + 'px';
    p.style.top = (r.bottom + 6 + ph > window.innerHeight - 8 ? Math.max(8, r.top - ph - 6) : r.bottom + 6) + 'px';
  }

  function build(p, input) {
    var isDT = input.type === 'datetime-local';
    var val = parseVal(input.value);
    var today = new Date();
    var html = '<div class="cal-head"><button type="button" class="cal-nav" data-a="prev">\u2039</button>' +
      '<b class="cal-title">' + view.y + '\u5e74' + (view.m + 1) + '\u6708</b>' +
      '<button type="button" class="cal-nav" data-a="next">\u203a</button></div><div class="cal-week">';
    ['\u4e00', '\u4e8c', '\u4e09', '\u56db', '\u4e94', '\u516d', '\u65e5'].forEach(function (w) { html += '<span>' + w + '</span>'; });
    html += '</div><div class="cal-grid">';
    var off = (new Date(view.y, view.m, 1).getDay() + 6) % 7;  // 周一为首页
    var start = new Date(view.y, view.m, 1 - off);
    for (var i = 0; i < 42; i++) {
      var d = new Date(start.getFullYear(), start.getMonth(), start.getDate() + i);
      var cls = 'cal-d' + (d.getMonth() !== view.m ? ' dim' : '') +
        (fmtDate(d) === fmtDate(today) ? ' today' : '') +
        (val && fmtDate(d) === fmtDate(val) ? ' sel' : '');
      html += '<button type="button" class="' + cls + '" data-d="' + fmtDate(d) + '">' + d.getDate() + '</button>';
    }
    html += '</div>';
    if (isDT) {
      var tv = input.value.match(/T(\d{2}):(\d{2})/);
      var hh = tv ? tv[1] : '09', mm = tv ? tv[2] : '00';
      html += '<div class="cal-time"><span>\u65f6\u95f4</span><select class="cal-hh">';
      for (var h = 0; h < 24; h++) { var H = pad2(h); html += '<option' + (H === hh ? ' selected' : '') + '>' + H + '</option>'; }
      html += '</select>:<select class="cal-mm">';
      for (var mi = 0; mi < 60; mi++) { var M = pad2(mi); html += '<option' + (M === mm ? ' selected' : '') + '>' + M + '</option>'; }
      html += '</select></div>';
    }
    html += '<div class="cal-foot"><button type="button" class="cal-act" data-a="clear">\u6e05\u9664</button>' +
      '<span class="cal-spring"></span>' +
      '<button type="button" class="cal-act" data-a="now">\u6b64\u523b</button></div>';
    p.innerHTML = html;

    p.querySelector('.cal-head').addEventListener('click', function (e) {
      var b = e.target.closest('button'); if (!b) return;
      if (b.dataset.a === 'prev') { view.m--; if (view.m < 0) { view.m = 11; view.y--; } }
      else { view.m++; if (view.m > 11) { view.m = 0; view.y++; } }
      build(p, input);
    });
    p.querySelector('.cal-grid').addEventListener('click', function (e) {
      var b = e.target.closest('.cal-d'); if (!b || !b.dataset.d) return;
      setValue(input, b.dataset.d, isDT);
      close();
    });
    p.querySelector('.cal-foot').addEventListener('click', function (e) {
      var b = e.target.closest('button'); if (!b) return;
      if (b.dataset.a === 'clear') { input.value = ''; fire(input); }
      else { var n = new Date(); setValue(input, fmtDate(n), isDT, n); }
      close();
    });
  }

  function setValue(input, dateStr, isDT, now) {
    if (isDT) {
      var hSel = pop.querySelector('.cal-hh'), mSel = pop.querySelector('.cal-mm');
      var tv = input.value.match(/T(\d{2}):(\d{2})/);
      var hh = hSel ? hSel.value : (now ? pad2(now.getHours()) : (tv ? tv[1] : '09'));
      var mm = mSel ? mSel.value : (now ? pad2(now.getMinutes()) : (tv ? tv[2] : '00'));
      input.value = dateStr + 'T' + hh + ':' + mm;
    } else input.value = dateStr;
    fire(input);
  }
  function fire(input) {
    ['input', 'change'].forEach(function (ev) { input.dispatchEvent(new Event(ev, { bubbles: true })); });
  }

  function scan(root) {
    (root || document).querySelectorAll('input[type="date"], input[type="datetime-local"]').forEach(function (input) {
      if (input.getAttribute('data-cal')) return;
      input.setAttribute('data-cal', '1');
      var wrapEl = document.createElement('span');
      wrapEl.className = 'cal';
      input.parentNode.insertBefore(wrapEl, input);
      wrapEl.appendChild(input);
      var icon = document.createElement('button');
      icon.type = 'button'; icon.className = 'cal-icon'; icon.title = '\u9009\u62e9\u65e5\u671f';
      icon.innerHTML = '<svg viewBox="0 0 16 16" width="13" height="13"><path fill="currentColor" d="M3.5 0a.5.5 0 0 1 .5.5V1h8V.5a.5.5 0 0 1 1 0V1h1a2 2 0 0 1 2 2v11a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2V3a2 2 0 0 1 2-2h1V.5a.5.5 0 0 1 .5-.5zM1 4v10a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V4H1z"/></svg>';
      wrapEl.appendChild(icon);
      function toggle(e) {
        e.preventDefault(); e.stopPropagation();
        if (curInput === input && pop && pop.classList.contains('open')) close();
        else open(input);
      }
      icon.addEventListener('click', toggle);
      input.addEventListener('click', toggle);
      input.addEventListener('input', function () { if (pop && pop.classList.contains('open') && curInput === input) close(); });
    });
  }

  window.CalPicker = { scan: scan };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', function () { scan(document); });
  else scan(document);
})();
