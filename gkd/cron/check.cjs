#!/usr/bin/env node
/**
 * GKD 个人订阅每日检查（NEC8/VM103 定时任务,每天 9:00 由 crontab 调 check.sh 运行本脚本）
 *
 * 逻辑:
 *  1. 拉官方订阅(registry.gkd.li,失败退 jsDelivr 镜像)
 *  2. 对照 apps.json 装机清单,找出「官方未覆盖 && 个人订阅没写 && auto==='stub'」的应用
 *  3. 为缺口自动补文本兜底规则(开屏跳过+弹窗关闭),version+1,commit+push
 *  4. 全程写日志;银行政务认证类(auto==='never')永远不会被自动加规则
 *
 * 依赖: node >= 18, json5 (装在 ~/gkd-cron/node_modules,NODE_PATH 指过去,见 check.sh)
 */
const fs = require('fs');
const path = require('path');
const cp = require('child_process');
// json5 已 vendor 进仓库(MIT), NEC8 上无需 npm 安装
const Json5 = require(path.join(__dirname, 'vendor', 'json5'));

const REPO = process.env.GKD_REPO || path.join(process.env.HOME, 'NEC8-testFile');
const DIR = path.join(REPO, 'gkd');
const OFFICIAL_URLS = [
  'https://registry.gkd.li/gkd.json5',
  'https://cdn.jsdelivr.net/gh/gkd-kit/subscription@main/dist/gkd.json5',
  'https://fastly.jsdelivr.net/gh/gkd-kit/subscription@main/dist/gkd.json5',
];

const HEADER = [
  '// Orange 的 GKD 个人订阅',
  '// 由 NEC8(VM103) 每日定时任务与人工共同维护; 人工维护文档见同目录 README.md',
  '// 订阅 URL: https://1996818.xyz/testFile/gkd/gkd.json5',
  '// 注意: 机器生成时本文件头注释会被重写,规则改动请优先改 README 并走人工评审',
  '',
].join('\n');

function log(msg) {
  console.log(`[gkd-check ${new Date().toISOString()}] ${msg}`);
}

async function fetchOfficial() {
  for (const u of OFFICIAL_URLS) {
    try {
      const r = await fetch(u, { signal: AbortSignal.timeout(30000) });
      if (r.ok) {
        const t = await r.text();
        if (t.length > 100000) {
          log(`官方订阅拉取成功: ${u} (${t.length} bytes)`);
          return t;
        }
      }
      log(`官方订阅源不可用: ${u}`);
    } catch (e) {
      log(`官方订阅源失败: ${u} ${e.message}`);
    }
  }
  return null;
}

function git(args) {
  return cp.execSync(`git ${args}`, { cwd: REPO, stdio: 'pipe' }).toString().trim();
}

(async () => {
  const appsDb = JSON.parse(fs.readFileSync(path.join(DIR, 'apps.json'), 'utf8'));
  const sub = Json5.parse(fs.readFileSync(path.join(DIR, 'gkd.json5'), 'utf8'));

  const officialText = await fetchOfficial();
  if (!officialText) {
    log('官方订阅全部源拉取失败,本次跳过(不影响已有规则)');
    process.exit(0);
  }
  const official = Json5.parse(officialText);
  const officialIds = new Set(official.apps.map(a => a.id));
  const myIds = new Set(sub.apps.map(a => a.id));

  const targets = appsDb.apps.filter(
    a => !officialIds.has(a.id) && !myIds.has(a.id) && a.auto === 'stub'
  );
  log(
    `官方v${official.version}覆盖${officialIds.size}应用 | 装机${appsDb.apps.length} | ` +
    `个人订阅v${sub.version}含${myIds.size}应用 | 本次候选自动补 ${targets.length} 个` +
    (targets.length ? `: ${targets.map(t => t.name).join('、')}` : '')
  );

  let appsChanged = false;
  for (const a of appsDb.apps) {
    const now = officialIds.has(a.id);
    if (a.official !== now) { a.official = now; appsChanged = true; }
    if (myIds.has(a.id) && !a.personal) { a.personal = true; appsChanged = true; }
  }

  if (targets.length === 0 && !appsChanged) {
    log('无覆盖变化,无新增缺口,结束');
    process.exit(0);
  }

  if (targets.length > 0) {
    const skipRule = {
      matches: '[text*="跳过"][text.length<=4][visibleToUser=true]',
      action: 'click', quickFind: true, actionMaximum: 1, resetMatch: 'app',
    };
    const closeRule = {
      matches: '[text="关闭" || text="以后再说" || text="暂不"][visibleToUser=true]',
      action: 'click', quickFind: true, actionMaximum: 2, resetMatch: 'app',
    };
    for (const t of targets) {
      sub.apps.push({
        id: t.id,
        name: t.name || t.id,
        groups: [
          { key: 0, name: '开屏广告', desc: 'cron 自动补充(文本兜底,可在手机上精修)', rules: [skipRule] },
          { key: 1, name: '弹窗广告', desc: 'cron 自动补充(文本兜底,可在手机上精修)', rules: [closeRule] },
        ],
      });
      t.personal = true;
    }
    sub.version += 1;
    fs.writeFileSync(path.join(DIR, 'gkd.json5'), HEADER + Json5.stringify(sub, null, 2) + '\n');
    log(`已自动补充 ${targets.length} 个应用,订阅版本升至 v${sub.version}`);
  }

  if (appsChanged || targets.length > 0) {
    appsDb.updatedAt = new Date().toISOString().slice(0, 10);
    appsDb.stats = {
      total: appsDb.apps.length,
      officialCovered: appsDb.apps.filter(a => a.official).length,
      personal: appsDb.apps.filter(a => a.personal).length,
      never: appsDb.apps.filter(a => a.auto === 'never').length,
    };
    fs.writeFileSync(path.join(DIR, 'apps.json'), JSON.stringify(appsDb, null, 2) + '\n');
  }

  git('add gkd/gkd.json5 gkd/apps.json');
  const msg =
    targets.length > 0
      ? `cron(gkd): 自动补充 ${targets.length} 个应用规则 (官方v${official.version})`
      : `cron(gkd): 刷新覆盖状态 (官方v${official.version})`;
  git(`commit -m ${JSON.stringify(msg)}`);
  git('pull --no-rebase');
  git('push');
  log('已 commit+push,手机端 GKD 下次检查订阅更新时生效');
})().catch(e => {
  console.error('[gkd-check] 失败:', e && e.message ? e.message : e);
  process.exit(1);
});
