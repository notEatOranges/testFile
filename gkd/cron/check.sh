#!/bin/bash
# GKD 订阅每日检查入口 —— crontab: 0 9 * * * /bin/bash $HOME/gkd-cron/check.sh >> $HOME/gkd-cron/cron.log 2>&1
# 首次部署: npm install --prefix $HOME/gkd-cron json5
set -e
export HOME="${HOME:-/home/dev}"
cd "$HOME/NEC8-testFile"
git pull --no-rebase -q || echo "[check.sh] git pull 失败,继续用本地版本"
export NODE_PATH="$HOME/gkd-cron/node_modules"
node "$HOME/NEC8-testFile/gkd/cron/check.cjs"
