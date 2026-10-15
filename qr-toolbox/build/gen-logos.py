# -*- coding: utf-8 -*-
"""Build the 10000-icon logo library for qr-toolbox.

Inputs : qr-toolbox/_iconsrc/{tabler-zip,bootstrap,lucide,material}  (build/_logos-candidates.txt for the hand-picked 100)
Outputs: js/logos.js       100 hand-picked icons, inlined as base64 (Chinese names/categories)
         js/logos-index.js window.LOGO_EXTRA = [{id,n,c,a,f}] for the remaining 9900 (SVGs as loose files)
         logos/*.svg       9900 icon files (lazy-loaded via <img>)
         shared-logos/index.json   empty shared-library manifest (git-backed)
Run from repo root:  python build/gen-logos.py
"""
import base64, io, json, os, re, sys

Q = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
ROOT = os.path.dirname(Q)
SRC = os.path.join(Q, '_iconsrc')
CAND = os.path.join(Q, 'build', 'logos-candidates.txt')

PICKED_TOTAL = 100
FILE_TARGET = 9900          # 集合图标数量，加精选 100 = 10000
SETS = [
    # (集合名, 目录, 前缀, 尺寸归一)
    ('Tabler',   os.path.join(SRC, 'tabler-zip', 'svg'),          't', ('24', '24')),
    ('Bootstrap', os.path.join(SRC, 'bootstrap', 'package', 'icons'), 'b', ('128', '128')),
    ('Lucide',   os.path.join(SRC, 'lucide', 'package', 'icons'), 'l', ('24', '24')),
    ('Material', os.path.join(SRC, 'material', 'package', 'rounded'), 'm', ('24', '24')),
    ('Material', os.path.join(SRC, 'material', 'package', 'outlined'), 'mo', ('24', '24')),
]

def die(msg):
    print('FATAL: ' + msg); sys.exit(1)

# ---------- 1) 精选 100（沿用旧逻辑，中文标注） ----------
QUOTA = [
    ('社交品牌', 12), ('通讯办公', 10), ('电商购物', 10), ('科技数码', 13),
    ('出行导航', 8), ('餐饮美食', 7), ('天气自然', 7), ('医疗健康', 6),
    ('媒体创意', 8), ('金融安全', 8), ('教育学习', 5), ('生活服务', 6),
]
rows = []
for ln in io.open(CAND, 'r', encoding='utf-8'):
    ln = ln.strip()
    if not ln or ln.startswith('#'):
        continue
    f, name, cat, alias = ln.split('|')
    rows.append((f.strip(), name.strip(), cat.strip(), alias.strip()))

picked = []
for cat, quota in QUOTA:
    got = [r for r in rows if r[2] == cat][:quota]
    if len(got) < quota:
        die('quota short for ' + cat)
    picked.extend(got)
if len(picked) != PICKED_TOTAL:
    die('picked=%d' % len(picked))

items = []
for f, name, cat, alias in picked:
    svg = io.open(os.path.join(SRC, 'bootstrap', 'package', 'icons', f + '.svg'), 'r', encoding='utf-8').read()
    svg = svg.replace('width="16" height="16"', 'width="128" height="128"').replace('fill="currentColor"', 'fill="#111111"')
    if 'width="128"' not in svg or '#111111' not in svg:
        die('normalize fail ' + f)
    b64 = base64.b64encode(svg.encode('utf-8')).decode('ascii')
    items.append({'id': f, 'n': name, 'c': cat, 'a': alias, 'd': 'data:image/svg+xml;base64,' + b64})

hdr = (u'/* 精选 logo 100 枚（Bootstrap Icons 1.11.3，MIT；中文名+分类+别名，内嵌 base64）\n'
       u' * 其余 9900 枚见 js/logos-index.js（文件化懒加载） */\n')
io.open(os.path.join(Q, 'js', 'logos.js'), 'w', encoding='utf-8', newline='\n').write(
    hdr + 'window.LOGO_PRESETS = ' + json.dumps(items, ensure_ascii=False, separators=(',', ':')) + ';\n')
print('logos.js: %d picked' % len(items))

# ---------- 2) 集合图标 9900（文件化） ----------
LOGO_DIR = os.path.join(Q, 'logos')
if not os.path.isdir(LOGO_DIR):
    os.makedirs(LOGO_DIR)
for old in os.listdir(LOGO_DIR):
    os.remove(os.path.join(LOGO_DIR, old))

NAME_RE = re.compile(r'^[a-z0-9][a-z0-9-]*$')
extra, seen = [], set()
for set_name, dirpath, prefix, (w, h) in SETS:
    if not os.path.isdir(dirpath):
        die('missing dir ' + dirpath)
    if len(extra) >= FILE_TARGET:
        break
    for sub in ([''] if os.path.isdir(os.path.join(dirpath, 'outline')) is False else ['outline', 'filled']):
        sub_dir = os.path.join(dirpath, sub) if sub else dirpath
        if not os.path.isdir(sub_dir):
            continue
        for fn in sorted(os.listdir(sub_dir)):
            if len(extra) >= FILE_TARGET:
                break
            stem, ext = os.path.splitext(fn)
            if ext != '.svg' or not NAME_RE.match(stem) or stem in seen:
                continue
            p = os.path.join(sub_dir, fn)
            try:
                if os.path.getsize(p) > 4096 or os.path.getsize(p) < 60:
                    continue
                svg = io.open(p, 'r', encoding='utf-8').read()
            except Exception:
                continue
            # 尺寸归一（缺 width/height 的补上；currentColor 在 img 上下文渲染为黑）
            if 'width=' in svg:
                svg = re.sub(r'width="\d+(\.\d+)?"', 'width="%s"' % w, svg, count=1)
                svg = re.sub(r'height="\d+(\.\d+)?"', 'height="%s"' % h, svg, count=1)
            else:
                svg = svg.replace('<svg ', '<svg width="%s" height="%s" ' % (w, h), 1)
            if 'viewBox' not in svg:
                continue
            fid = prefix + '-' + (sub + '-' if sub else '') + stem
            if fid in seen:
                continue
            seen.add(stem if set_name == 'Tabler' else fid)
            io.open(os.path.join(LOGO_DIR, fid + '.svg'), 'w', encoding='utf-8', newline='\n').write(svg)
            extra.append({'id': fid, 'n': stem, 'c': set_name, 'a': stem + ',' + sub, 'f': fid + '.svg'})
        if len(extra) >= FILE_TARGET:
            break

if len(extra) != FILE_TARGET:
    die('extra=%d (need %d)' % (len(extra), FILE_TARGET))

io.open(os.path.join(Q, 'js', 'logos-index.js'), 'w', encoding='utf-8', newline='\n').write(
    u'/* 集合图标索引 9900 枚（文件本体在 logos/*.svg，按需加载） */\n'
    'window.LOGO_EXTRA = ' + json.dumps(extra, ensure_ascii=False, separators=(',', ':')) + ';\n')
print('logos-index.js: %d icons' % len(extra))

# ---------- 3) 共享库清单（git 存储，初始空） ----------
sl = os.path.join(Q, 'shared-logos')
if not os.path.isdir(sl):
    os.makedirs(sl)
if not os.path.isfile(os.path.join(sl, 'index.json')):
    io.open(os.path.join(sl, 'index.json'), 'w', encoding='utf-8', newline='\n').write('[]\n')
    print('shared-logos/index.json: created (empty)')

total_svg = len([f for f in os.listdir(LOGO_DIR) if f.endswith('.svg')])
print('DONE: total=%d (100 embedded + %d files)' % (len(items) + total_svg, total_svg))
