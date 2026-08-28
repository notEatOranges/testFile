import { router, promptAction } from '@kit.ArkUI';
import { common } from '@kit.AbilityKit';
import { VideoInfo, ParseService } from '../services/ParseService';
import { saveVideoToGallery, saveImageToGallery, pickFromGallery, extractFrameToGallery } from '../services/MediaSaver';

@Entry
@Component
struct LivePage {
  @StorageProp('avoidTop') topPad: number = 0;
  @StorageProp('avoidBottom') bottomPad: number = 0;
  @State tab: string = 'extract';
  @State inputText: string = '';
  @State loading: boolean = false;
  @State info: VideoInfo | null = null;
  @State errMsg: string = '';
  @State savingText: string = '';
  @State pickedVideo: string = '';
  @State frameBusy: boolean = false;
  private ctx: common.Context = getContext(this) as common.Context;

  aboutToAppear(): void {
    const param: string | undefined = AppStorage.get<string>('pageParam');
    if (param === 'make' || param === 'extract') {
      this.tab = param;
      AppStorage.setOrCreate('pageParam', '');
    }
  }

  startParse(): void {
    if (this.loading) {
      return;
    }
    this.errMsg = '';
    this.info = null;
    const raw: string = this.inputText.trim();
    if (raw.length === 0) {
      this.errMsg = '请先粘贴分享链接或口令';
      return;
    }
    this.loading = true;
    ParseService.parse(this.ctx, raw)
      .then((v: VideoInfo) => {
        this.loading = false;
        this.info = v;
        if (v.cover.length === 0 && v.videoUrl.length === 0) {
          this.errMsg = '该作品没有可提取的封面/视频素材';
        }
      })
      .catch((e: Object) => {
        this.loading = false;
        this.errMsg = e instanceof Error ? e.message : String(e);
      });
  }

  async pickVideo(): Promise<void> {
    this.errMsg = '';
    try {
      const pair = await pickFromGallery(this.ctx, true);
      this.pickedVideo = pair[0];
    } catch (e) {
      this.errMsg = e instanceof Error ? e.message : String(e);
    }
  }

  async doExtractFrame(): Promise<void> {
    if (this.pickedVideo.length === 0 || this.frameBusy) {
      return;
    }
    this.frameBusy = true;
    try {
      await extractFrameToGallery(this.ctx, this.pickedVideo, 0);
      promptAction.showToast({ message: '封面帧已保存到相册 ✅ 与原视频即为实况素材对', duration: 3000 });
    } catch (e) {
      const msg: string = e instanceof Error ? e.message : String(e);
      promptAction.showToast({ message: '提取失败：' + msg, duration: 3000 });
    }
    this.frameBusy = false;
  }

  build() {
    Column() {
      Row() {
        SymbolGlyph($r('sys.symbol.chevron_left'))
          .fontSize(24)
          .fontColor(['#20242b'])
          .width(44)
          .onClick(() => {
            router.back();
          })
        Text('实况素材')
          .fontSize(19)
          .fontWeight(FontWeight.Bold)
          .fontColor('#15181e')
          .layoutWeight(1)
          .textAlign(TextAlign.Center)
        Text('')
          .width(44)
      }
      .width('100%')
      .height(54)

      // 分段切换
      Row({ space: 8 }) {
        Button('实况提取（链接）')
          .fontSize(13)
          .fontColor(this.tab === 'extract' ? Color.White : '#39414d')
          .backgroundColor(this.tab === 'extract' ? '#FF7043' : '#EDEFF3')
          .layoutWeight(1)
          .height(38)
          .borderRadius(19)
          .onClick(() => {
            this.tab = 'extract';
          })
        Button('视频转实况（本机）')
          .fontSize(13)
          .fontColor(this.tab === 'make' ? Color.White : '#39414d')
          .backgroundColor(this.tab === 'make' ? '#FF7043' : '#EDEFF3')
          .layoutWeight(1)
          .height(38)
          .borderRadius(19)
          .onClick(() => {
            this.tab = 'make';
          })
      }
      .width('100%')
      .padding({ left: 16, right: 16, top: 6 })

      Scroll() {
        Column() {
          if (this.tab === 'extract') {
            Column() {
              TextArea({
                text: this.inputText,
                placeholder: '粘贴作品分享链接，提取封面大图 + 无水印视频'
              })
                .fontSize(14)
                .placeholderFont({ size: 13 })
                .placeholderColor('#b6bbc4')
                .fontColor('#20242b')
                .backgroundColor('#FFFFFF')
                .borderRadius(14)
                .height(84)
                .padding(12)
                .onChange((v: string) => {
                  this.inputText = v;
                })

              Button(this.loading ? '解析中…' : '解析素材')
                .fontSize(15)
                .fontColor(Color.White)
                .linearGradient({
                  angle: 135,
                  colors: [['#FF7043', 0], ['#FFA270', 1]]
                })
                .height(42)
                .borderRadius(21)
                .width('100%')
                .margin({ top: 12 })
                .enabled(!this.loading)
                .onClick(() => {
                  this.startParse();
                })
            }
            .width('100%')
          } else {
            Column() {
              Button(this.pickedVideo.length > 0 ? '重新选择视频' : '从相册选择视频')
                .fontSize(15)
                .fontColor(Color.White)
                .linearGradient({
                  angle: 135,
                  colors: [['#FF7043', 0], ['#FFA270', 1]]
                })
                .height(42)
                .borderRadius(21)
                .width('100%')
                .onClick(() => {
                  this.pickVideo();
                })

              if (this.pickedVideo.length > 0) {
                Text('已选择：' + this.pickedVideo.substring(this.pickedVideo.lastIndexOf('/') + 1))
                  .fontSize(11)
                  .fontColor('#9aa0ab')
                  .width('100%')
                  .margin({ top: 8 })
                  .maxLines(1)
              }
            }
            .width('100%')
          }

          if (this.errMsg.length > 0) {
            Text('⚠ ' + this.errMsg)
              .fontSize(13)
              .fontColor('#e5484d')
              .backgroundColor('#fdecec')
              .borderRadius(12)
              .padding(12)
              .width('100%')
              .margin({ top: 16 })
          }

          if (this.tab === 'extract' && this.info !== null) {
            Column({ space: 10 }) {
              Text(this.info.title)
                .fontSize(14)
                .fontWeight(FontWeight.Medium)
                .fontColor('#20242b')
                .maxLines(2)
                .textOverflow({ overflow: TextOverflow.Ellipsis })
                .width('100%')

              Button(this.savingText === 'cover' ? '保存中…' : '① 保存封面大图')
                .fontSize(14)
                .fontColor(Color.White)
                .backgroundColor('#FF7043')
                .height(40)
                .borderRadius(20)
                .width('100%')
                .enabled(this.info.cover.length > 0 && this.savingText === '')
                .opacity(this.info.cover.length > 0 ? 1 : 0.5)
                .onClick(() => {
                  this.savingText = 'cover';
                  saveImageToGallery(this.ctx, this.info!.cover)
                    .then(() => {
                      this.savingText = '';
                      promptAction.showToast({ message: '封面已保存 ✅', duration: 1800 });
                    })
                    .catch((e: Object) => {
                      this.savingText = '';
                      promptAction.showToast({ message: e instanceof Error ? e.message : String(e), duration: 2500 });
                    });
                })

              Button(this.savingText === 'video' ? '保存中…' : '② 保存无水印视频')
                .fontSize(14)
                .fontColor(Color.White)
                .backgroundColor('#FF7043')
                .height(40)
                .borderRadius(20)
                .width('100%')
                .enabled(this.info.videoUrl.length > 0 && this.savingText === '')
                .opacity(this.info.videoUrl.length > 0 ? 1 : 0.5)
                .onClick(() => {
                  this.savingText = 'video';
                  saveVideoToGallery(this.ctx, this.info!.videoUrl)
                    .then(() => {
                      this.savingText = '';
                      promptAction.showToast({ message: '视频已保存 ✅', duration: 1800 });
                    })
                    .catch((e: Object) => {
                      this.savingText = '';
                      promptAction.showToast({ message: e instanceof Error ? e.message : String(e), duration: 2500 });
                    });
                })

              Text('两步保存后，相册中将获得同作品的封面图与无水印视频素材对。')
                .fontSize(11)
                .fontColor('#9aa0ab')
                .width('100%')
            }
            .padding(12)
            .backgroundColor(Color.White)
            .borderRadius(18)
            .width('100%')
            .margin({ top: 16 })
            .alignItems(HorizontalAlign.Start)
          }

          if (this.tab === 'make' && this.pickedVideo.length > 0) {
            Column({ space: 10 }) {
              Button(this.frameBusy ? '提取中…' : '提取第 0 秒封面帧并保存')
                .fontSize(14)
                .fontColor(Color.White)
                .backgroundColor('#FF7043')
                .height(40)
                .borderRadius(20)
                .width('100%')
                .enabled(!this.frameBusy)
                .onClick(() => {
                  this.doExtractFrame();
                })
              Text('封面帧来自硬件解码，按视频原始比例输出（最长边 720px）。')
                .fontSize(11)
                .fontColor('#9aa0ab')
                .width('100%')
            }
            .padding(12)
            .backgroundColor(Color.White)
            .borderRadius(18)
            .width('100%')
            .margin({ top: 16 })
            .alignItems(HorizontalAlign.Start)
          }
        }
        .alignItems(HorizontalAlign.Start)
        .width('100%')
        .padding({ left: 16, right: 16, bottom: 30 })
      }
      .layoutWeight(1)
      .scrollBar(BarState.Off)
      .align(Alignment.TopStart)
    }
    .width('100%')
    .height('100%')
    .backgroundColor('#F4F5F7')
    .padding({ top: this.topPad, bottom: this.bottomPad })
  }
}
