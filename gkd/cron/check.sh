#!/bin/bash
# GKD 订阅每日检查入口 —— crontab: 0 9 * * * /bin/bash $HOME/gkd-cron/check.sh >> $HOME/gkd-cron/cron.log 2>&1
# 依赖已 vendor 进仓库(gkd/cron/vendor/json5), 无需 npm
set -e
export HOME="${HOME:-/home/dev}"
cd "$HOME/NEC8-testFile"
git pull --no-rebase -q || echo "[check.sh] git pull 失败,继续用本地版本"
node "$HOME/NEC8-testFile/gkd/cron/check.cjs"
