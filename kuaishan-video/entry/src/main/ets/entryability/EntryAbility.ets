import { AbilityConstant, UIAbility, Want } from '@kit.AbilityKit';
import { hilog } from '@kit.PerformanceAnalysisKit';
import { window } from '@kit.ArkUI';

export default class EntryAbility extends UIAbility {
  onCreate(want: Want, launchParam: AbilityConstant.LaunchParam): void {
    hilog.info(0x0000, 'KuaishanVideo', '%{public}s', 'Ability onCreate');
    this.captureSharedLink(want);
  }

  onNewWant(want: Want, launchParam: AbilityConstant.LaunchParam): void {
    // 应用已在运行时被分享链接拉起
    this.captureSharedLink(want);
  }

  /** 把外部拉起链接写入全局状态，交给 Index 页处理 */
  private captureSharedLink(want: Want): void {
    const uri: string = want?.uri ?? '';
    if (uri.length > 0) {
      hilog.info(0x0000, 'KuaishanVideo', 'shared link: %{public}s', uri);
      AppStorage.setOrCreate('sharedLink', uri);
    }
  }

  onDestroy(): void {
    hilog.info(0x0000, 'KuaishanVideo', '%{public}s', 'Ability onDestroy');
  }

  onWindowStageCreate(windowStage: window.WindowStage): void {
    // 沉浸式：全屏布局 + 记录安全区高度（px→vp）
    windowStage.getMainWindow((err, win) => {
      if (err.code) {
        hilog.error(0x0000, 'KuaishanVideo', 'getMainWindow failed %{public}s', JSON.stringify(err) ?? '');
      } else {
        win.setWindowLayoutFullScreen(true);
        const topRect = win.getWindowAvoidArea(window.AvoidAreaType.TYPE_SYSTEM).topRect;
        const bottomRect = win.getWindowAvoidArea(window.AvoidAreaType.TYPE_NAVIGATION_INDICATOR).bottomRect;
        AppStorage.setOrCreate('avoidTop', px2vp(topRect.height));
        AppStorage.setOrCreate('avoidBottom', px2vp(bottomRect.height));
      }
    });

    windowStage.loadContent('pages/Index', (err) => {
      if (err.code) {
        hilog.error(0x0000, 'KuaishanVideo', 'Failed to load the content. Cause: %{public}s', JSON.stringify(err) ?? '');
        return;
      }
      hilog.info(0x0000, 'KuaishanVideo', 'Succeeded in loading the content.');
    });
  }

  onWindowStageDestroy(): void {
    hilog.info(0x0000, 'KuaishanVideo', '%{public}s', 'Ability onWindowStageDestroy');
  }

  onForeground(): void {
    hilog.info(0x0000, 'KuaishanVideo', '%{public}s', 'Ability onForeground');
  }

  onBackground(): void {
    hilog.info(0x0000, 'KuaishanVideo', '%{public}s', 'Ability onBackground');
  }
}
