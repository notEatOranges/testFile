# -*- coding: utf-8 -*-
"""Build logos.js: pick exactly 100 bootstrap icons (quotas per category),
normalize size attrs, embed as base64 data URLs with Chinese name/category/alias.
Run from chrome-plugins/:  python build/gen-logos.py
"""
import base64, io, json, os, sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
CAND = os.path.join(ROOT, 'build', 'logos-candidates.txt')
ICONS_DIR = os.path.join(ROOT, 'qr-toolbox', 'package', 'icons')
OUT = os.path.join(ROOT, 'qr-toolbox', 'js', 'logos.js')

QUOTA = [
    ('社交品牌', 12), ('通讯办公', 10), ('电商购物', 10), ('科技数码', 13),
    ('出行导航', 8), ('餐饮美食', 7), ('天气自然', 7), ('医疗健康', 6),
    ('媒体创意', 8), ('金融安全', 8), ('教育学习', 5), ('生活服务', 6),
]
TOTAL = sum(n for _, n in QUOTA)
assert TOTAL == 100, TOTAL

rows = []
for ln in io.open(CAND, 'r', encoding='utf-8'):
    ln = ln.strip()
    if not ln or ln.startswith('#'):
        continue
    f, name, cat, alias = ln.split('|')
    rows.append((f.strip(), name.strip(), cat.strip(), alias.strip()))

missing = [f for f, _, _, _ in rows if not os.path.isfile(os.path.join(ICONS_DIR, f + '.svg'))]
if missing:
    print('MISSING icons: %s' % ', '.join(missing)); sys.exit(1)

picked, short_report = [], []
for cat, quota in QUOTA:
    got = [r for r in rows if r[2] == cat][:quota]
    if len(got) < quota:
        print('QUOTA SHORT: %s has %d need %d' % (cat, len(got), quota)); sys.exit(1)
    picked.extend(got)
    short_report.append('%s:%d' % (cat, len(got)))

items = []
for f, name, cat, alias in picked:
    svg = io.open(os.path.join(ICONS_DIR, f + '.svg'), 'r', encoding='utf-8').read()
    svg = svg.replace('width="16" height="16"', 'width="128" height="128"')
    svg = svg.replace('fill="currentColor"', 'fill="#111111"')
    if 'width="128"' not in svg or '#111111' not in svg:
        print('NORMALIZE FAIL: ' + f); sys.exit(1)
    b64 = base64.b64encode(svg.encode('utf-8')).decode('ascii')
    items.append({'id': f, 'n': name, 'c': cat, 'a': alias,
                  'd': 'data:image/svg+xml;base64,' + b64})

hdr = (u'/* 预设 logo 库：100 枚（图标源自开源 Bootstrap Icons 1.11.3，MIT License）\n'
       u' * 字段：id=图标名 n=中文名 c=分类 a=搜索别名 d=svg dataURL */\n')
body = 'window.LOGO_PRESETS = ' + json.dumps(items, ensure_ascii=False, separators=(',', ':')) + ';\n'
if not os.path.isdir(os.path.dirname(OUT)):
    os.makedirs(os.path.dirname(OUT))
io.open(OUT, 'w', encoding='utf-8', newline='\n').write(hdr + body)
print('OK logos.js items=%d bytes=%d  [%s]' % (len(items), len((hdr + body).encode('utf-8')), ' '.join(short_report)))
