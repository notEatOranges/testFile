import { router, promptAction } from '@kit.ArkUI';
import { common } from '@kit.AbilityKit';
import { VideoInfo, ParseService } from '../services/ParseService';
import { saveVideoToGallery, saveImageToGallery } from '../services/MediaSaver';

class BatchItem {
  ok: boolean = false;
  err: string = '';
  saving: boolean = false;
  info: VideoInfo = new VideoInfo();
}

@Entry
@Component
struct BatchParsePage {
  @StorageProp('avoidTop') topPad: number = 0;
  @StorageProp('avoidBottom') bottomPad: number = 0;
  @State inputText: string = '';
  @State running: boolean = false;
  @State progressText: string = '';
  @State results: BatchItem[] = [];
  private ctx: common.Context = getContext(this) as common.Context;

  async startBatch(): Promise<void> {
    if (this.running) {
      return;
    }
    const links: string[] = this.inputText
      .split(/\s+/)
      .filter((s: string) => s.startsWith('http'));
    if (links.length === 0) {
      promptAction.showToast({ message: '未发现链接，请每行一个或用空格分隔', duration: 2500 });
      return;
    }
    this.running = true;
    this.results = [];
    const items: BatchItem[] = [];
    for (let i = 0; i < links.length; i++) {
      this.progressText = '解析中 ' + (i + 1).toString() + '/' + links.length.toString();
      const it = new BatchItem();
      try {
        it.info = await ParseService.parse(this.ctx, links[i]);
        it.ok = true;
      } catch (e) {
        it.ok = false;
        it.err = e instanceof Error ? e.message : String(e);
      }
      items.push(it);
      this.results = items.slice();
    }
    this.running = false;
    this.progressText = '';
    const okCount = items.filter((x: BatchItem) => x.ok).length;
    promptAction.showToast({ message: '批量解析完成 ' + okCount.toString() + '/' + links.length.toString(), duration: 2500 });
  }

  saveVideoOf(it: BatchItem): void {
    if (it.saving || it.info.videoUrl.length === 0) {
      return;
    }
    it.saving = true;
    this.results = this.results.slice();
    saveVideoToGallery(this.ctx, it.info.videoUrl)
      .then(() => {
        it.saving = false;
        this.results = this.results.slice();
        promptAction.showToast({ message: '已保存到相册 ✅', duration: 1800 });
      })
      .catch((e: Object) => {
        it.saving = false;
        this.results = this.results.slice();
        const msg: string = e instanceof Error ? e.message : String(e);
        promptAction.showToast({ message: '保存失败：' + msg, duration: 2500 });
      });
  }

  saveFirstImageOf(it: BatchItem): void {
    if (it.info.images.length === 0) {
      return;
    }
    saveImageToGallery(this.ctx, it.info.images[0])
      .then(() => {
        promptAction.showToast({ message: '图片已保存 ✅', duration: 1800 });
      })
      .catch((e: Object) => {
        const msg: string = e instanceof Error ? e.message : String(e);
        promptAction.showToast({ message: '保存失败：' + msg, duration: 2500 });
      });
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
        Text('批量解析')
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

      Scroll() {
        Column() {
          TextArea({
            text: this.inputText,
            placeholder: '每行一个链接（支持抖音/快手分享口令混排）'
          })
            .fontSize(13)
            .placeholderFont({ size: 12 })
            .placeholderColor('#b6bbc4')
            .fontColor('#20242b')
            .backgroundColor('#FFFFFF')
            .borderRadius(14)
            .height(110)
            .padding(12)
            .onChange((v: string) => {
              this.inputText = v;
            })

          Button(this.running ? this.progressText : '开始批量解析')
            .fontSize(15)
            .fontColor(Color.White)
            .linearGradient({
              angle: 135,
              colors: [['#8B5CF6', 0], ['#6366F1', 1]]
            })
            .height(42)
            .borderRadius(21)
            .width('100%')
            .margin({ top: 12 })
            .enabled(!this.running)
            .opacity(this.running ? 0.6 : 1)
            .onClick(() => {
              this.startBatch();
            })

          ForEach(this.results, (it: BatchItem, idx: number) => {
            Column({ space: 8 }) {
              if (it.ok) {
                Row({ space: 10 }) {
                  if (it.info.cover.length > 0) {
                    Image(it.info.cover)
                      .width(58)
                      .height(58)
                      .borderRadius(10)
                      .objectFit(ImageFit.Cover)
                      .backgroundColor('#eceef2')
                  } else {
                    Column() {
                      SymbolGlyph($r('sys.symbol.picture')).fontSize(20).fontColor(['#c6ccd6'])
                    }
                    .width(58)
                    .height(58)
                    .justifyContent(FlexAlign.Center)
                    .backgroundColor('#eff1f5')
                    .borderRadius(10)
                  }
                  Column({ space: 3 }) {
                    Text((idx + 1).toString() + '. ' + it.info.title)
                      .fontSize(13)
                      .fontColor('#20242b')
                      .maxLines(1)
                      .textOverflow({ overflow: TextOverflow.Ellipsis })
                      .width('100%')
                    Text(it.info.platform + (it.info.images.length > 0 ? ' · 图集' + it.info.images.length.toString() + '张' : ' · 视频'))
                      .fontSize(11)
                      .fontColor('#9aa0ab')
                  }
                  .alignItems(HorizontalAlign.Start)
                  .layoutWeight(1)

                  if (it.info.videoUrl.length > 0) {
                    Row() {
                      SaveButton({ icon: SaveIconStyle.FULL_FILLED, text: SaveDescription.DOWNLOAD, buttonType: ButtonType.Capsule })
                        .onClick((event: ClickEvent, result: SaveButtonOnClickResult) => {
                          if (result !== SaveButtonOnClickResult.SUCCESS) {
                            promptAction.showToast({ message: '保存授权未通过', duration: 1500 });
                            return;
                          }
                          this.saveVideoOf(it);
                        })
                    }
                  } else if (it.info.images.length > 0) {
                    Button('存图')
                      .fontSize(12)
                      .fontColor(Color.White)
                      .backgroundColor('#3D8BFF')
                      .height(30)
                      .borderRadius(15)
                      .onClick(() => {
                        this.saveFirstImageOf(it);
                      })
                  }
                }
                .width('100%')
                .alignItems(VerticalAlign.Center)
              } else {
                Text('✕ ' + it.err)
                  .fontSize(12)
                  .fontColor('#e5484d')
                  .width('100%')
              }
            }
            .padding(12)
            .backgroundColor(Color.White)
            .borderRadius(14)
            .width('100%')
            .margin({ top: 10 })
          }, (it: BatchItem, idx: number) => idx.toString() + it.err)
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
