import gulpError from './utils/gulpError';
App({
    globalData: { theme: 'sakura' },
    onLaunch() {
        if (!wx.cloud) { console.error('[love] 请用 2.2.3 以上基础库'); return; }
        wx.cloud.init({ traceUser: true });   // env 不传 = 用「默认环境」，在开发者工具云开发面板选定
        const t = wx.getStorageSync('lh5-theme');
        if (t) this.globalData.theme = t;
    },
    onShow() {
        if (gulpError !== 'gulpErrorPlaceHolder') {
            wx.redirectTo({
                url: `/pages/gulp-error/index?gulpError=${gulpError}`,
            });
        }
    },
});
