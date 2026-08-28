import { router, promptAction } from '@kit.ArkUI';
import { pasteboard } from '@kit.BasicServicesKit';
import { common } from '@kit.AbilityKit';
import { VideoInfo, ParseService } from '../services/ParseService';
import { saveVideoToGallery, saveImageToGallery, saveAudioToDoc } from '../services/MediaSaver';

@Entry
@Component
struct ParsePage {
  @StorageProp('avoidTop') topPad: number = 0;
  @StorageProp('avoidBottom') bottomPad: number = 0;
  @State inputText: string = '';
  @State loading: boolean = false;
  @State info: VideoInfo | null = null;
  @State errMsg: string = '';
  @State savingVideo: boolean = false;
  @State savingImgs: boolean = false;
  @State imgProgress: string = '';
  private ctx: common.Context = getContext(this) as common.Context;

  aboutToAppear(): void {
    const pending: string | undefined = AppStorage.get<string>('pendingLink');
    if (pending !== undefined && pending.length > 0) {
      this.inputText = pending;
      AppStorage.setOrCreate('pendingLink', '');
      const auto: boolean | undefined = AppStorage.get<boolean>('autoParse');
      if (auto === true) {
        AppStorage.setOrCreate('autoParse', false);
        this.startParse();
      }
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
        this.info = v;
        this.loading = false;
      })
      .catch((e: Object) => {
        this.loading = false;
        this.errMsg = e instanceof Error ? e.message : String(e);
      });
  }

  copyDirectLink(): void {
    const inf = this.info;
    if (inf === null) {
      return;
    }
    const target: string = inf.videoUrl.length > 0 ? inf.videoUrl : (inf.images.length > 0 ? inf.images[0] : '');
    if (target.length === 0) {
      promptAction.showToast({ message: '暂无可用直链', duration: 1500 });
      return;
    }
    const data = pasteboard.createData(pasteboard.MIMETYPE_TEXT_PLAIN, target);
    pasteboard.getSystemPasteboard().setPasteData(data);
    promptAction.showToast({ message: '直链已复制', duration: 1500 });
  }

  pasteFromClipboard(): void {
    pasteboard.getSystemPasteboard().getData()
      .then((data: pasteboard.PasteData) => {
        if (data.getRecordCount() > 0) {
          const rec = data.getRecord(0);
          const txt: string = rec.plainText;
          if (txt.length > 0) {
            this.inputText = txt;
            return;
          }
        }
        promptAction.showToast({ message: '剪贴板没有文本内容', duration: 1500 });
      })
      .catch(() => {
        promptAction.showToast({ message: '读取剪贴板失败', duration: 1500 });
      });
  }

  doSaveVideo(): void {
    const inf = this.info;
    if (inf === null || inf.videoUrl.length === 0 || this.savingVideo) {
      return;
    }
    this.savingVideo = true;
    saveVideoToGallery(this.ctx, inf.videoUrl)
      .then(() => {
        this.savingVideo = false;
        promptAction.showToast({ message: '无水印视频已保存到相册 ✅', duration: 2500 });
      })
      .catch((e: Object) => {
        this.savingVideo = false;
        const msg: string = e instanceof Error ? e.message : String(e);
        promptAction.showToast({ message: '保存失败：' + msg, duration: 3000 });
      });
  }

  async doSaveAllImages(): Promise<void> {
    const inf = this.info;
    if (inf === null || inf.images.length === 0 || this.savingImgs) {
      return;
    }
    this.savingImgs = true;
    let ok = 0;
    const total = inf.images.length;
    for (let i = 0; i < total; i++) {
      this.imgProgress = (i + 1).toString() + '/' + total.toString();
      try {
        await saveImageToGallery(this.ctx, inf.images[i]);
        ok++;
      } catch (e) {
        // 单张失败继续下一张
      }
    }
    this.savingImgs = false;
    this.imgProgress = '';
    promptAction.showToast({ message: '图集保存完成 ' + ok.toString() + '/' + total.toString(), duration: 2500 });
  }

  async doSaveMusic(): Promise<void> {
    const inf = this.info;
    if (inf === null || inf.musicUrl.length === 0) {
      return;
    }
    try {
      const uri = await saveAudioToDoc(this.ctx, inf.musicUrl, '原声_' + Date.now().toString() + '.mp3');
      promptAction.showToast({ message: '原声已保存：' + uri, duration: 3000 });
    } catch (e) {
      const msg: string = e instanceof Error ? e.message : String(e);
      promptAction.showToast({ message: msg, duration: 2000 });
    }
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
        Text('去水印解析')
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
          Column() {
            TextArea({
              text: this.inputText,
              placeholder: '粘贴抖音/快手分享标题、口令或链接'
            })
              .fontSize(14)
              .placeholderFont({ size: 13 })
              .placeholderColor('#b6bbc4')
              .fontColor('#20242b')
              .backgroundColor('#FFFFFF')
              .borderRadius(14)
              .height(92)
              .padding(12)
              .onChange((v: string) => {
                this.inputText = v;
              })

            Row({ space: 10 }) {
              Button('粘贴')
                .fontSize(15)
                .fontColor('#39414d')
                .backgroundColor('#EDEFF3')
                .layoutWeight(1)
                .height(42)
                .borderRadius(21)
                .onClick(() => {
                  this.pasteFromClipboard();
                })
              Button('开始解析')
                .fontSize(15)
                .fontColor(Color.White)
                .linearGradient({
                  angle: 135,
                  colors: [['#FF5F6D', 0], ['#FF9A76', 1]]
                })
                .layoutWeight(2)
                .height(42)
                .borderRadius(21)
                .enabled(!this.loading)
                .opacity(this.loading ? 0.6 : 1)
                .onClick(() => {
                  this.startParse();
                })
            }
            .width('100%')
            .margin({ top: 12 })
          }
          .margin({ top: 4 })

          if (this.loading) {
            Column({ space: 10 }) {
              LoadingProgress().width(42).height(42).color('#FF5F6D')
              Text('正在请求分享页并解析…').fontSize(13).fontColor('#7a8290')
            }
            .width('100%')
            .margin({ top: 46 })
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

          if (!this.loading && this.info !== null) {
            this.resultCard()
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

  @Builder
  resultCard() {
    Column() {
      if (this.info !== null) {
        this.resultInner(this.info)
      }
    }
    .padding(12)
    .backgroundColor(Color.White)
    .borderRadius(18)
    .width('100%')
    .margin({ top: 16 })
  }

  @Builder
  resultInner(inf: VideoInfo) {
    Column() {
      if (inf.cover.length > 0) {
        Image(inf.cover)
          .width('100%')
          .height(180)
          .borderRadius(12)
          .objectFit(ImageFit.Cover)
          .backgroundColor('#eceef2')
      } else if (inf.images.length > 0) {
        Row({ space: 6 }) {
          ForEach(inf.images.slice(0, 3), (u: string) => {
            Image(u)
              .layoutWeight(1)
              .height(110)
              .borderRadius(10)
              .objectFit(ImageFit.Cover)
              .backgroundColor('#eceef2')
          }, (u: string) => u)
        }
        .width('100%')

        if (inf.images.length > 3) {
          Text('共 ' + inf.images.length.toString() + ' 张图')
            .fontSize(11)
            .fontColor('#9aa0ab')
            .margin({ top: 4 })
        }
      } else {
        Column({ space: 8 }) {
          SymbolGlyph($r('sys.symbol.picture')).fontSize(36).fontColor(['#c6ccd6'])
          Text('暂无封面').fontSize(12).fontColor('#aab0ba')
        }
        .width('100%')
        .height(130)
        .justifyContent(FlexAlign.Center)
        .backgroundColor('#eff1f5')
        .borderRadius(12)
      }

      Text(inf.title)
        .fontSize(15)
        .fontWeight(FontWeight.Medium)
        .fontColor('#20242b')
        .maxLines(2)
        .textOverflow({ overflow: TextOverflow.Ellipsis })
        .width('100%')
        .margin({ top: 12 })

      Row({ space: 8 }) {
        Text(inf.platform)
          .fontSize(11)
          .fontColor('#c9385a')
          .backgroundColor('#FFE1E7')
          .borderRadius(6)
          .padding({ left: 6, right: 6, top: 2, bottom: 2 })
        if (inf.author.length > 0) {
          Text('@' + inf.author).fontSize(12).fontColor('#7a8290')
        }
        Blank()
        if (inf.durationSec > 0) {
          Text(inf.durationSec.toString() + 's').fontSize(12).fontColor('#7a8290')
        }
      }
      .width('100%')
      .margin({ top: 8 })

      Divider()
        .color('#f0f1f4')
        .margin({ top: 12, bottom: 12 })

      Column({ space: 10 }) {
        if (inf.videoUrl.length > 0) {
          Row() {
            // 安全控件：系统级临时授权保存到相册
            SaveButton({ icon: SaveIconStyle.FULL_FILLED, text: SaveDescription.DOWNLOAD, buttonType: ButtonType.Capsule })
              .onClick((event: ClickEvent, result: SaveButtonOnClickResult) => {
                if (result !== SaveButtonOnClickResult.SUCCESS) {
                  promptAction.showToast({ message: '保存授权未通过', duration: 1500 });
                  return;
                }
                this.doSaveVideo();
              })
              .width('100%')
          }
        }

        if (inf.images.length > 0) {
          Button(this.savingImgs ? '保存图集中 ' + this.imgProgress : '保存全部图集（' + inf.images.length.toString() + '张）')
            .fontSize(14)
            .fontColor(Color.White)
            .backgroundColor('#3D8BFF')
            .height(38)
            .borderRadius(19)
            .width('100%')
            .enabled(!this.savingImgs)
            .onClick(() => {
              this.doSaveAllImages();
            })
        }

        if (inf.musicUrl.length > 0) {
          Button('分离并保存原声')
            .fontSize(14)
            .fontColor(Color.White)
            .backgroundColor('#E85D9E')
            .height(38)
            .borderRadius(19)
            .width('100%')
            .onClick(() => {
              this.doSaveMusic();
            })
        }

        Button('复制直链')
          .fontSize(14)
          .fontColor('#39414d')
          .backgroundColor('#EDEFF3')
          .height(38)
          .borderRadius(19)
          .width('100%')
          .onClick(() => {
            this.copyDirectLink();
          })
      }
      .width('100%')
    }
    .alignItems(HorizontalAlign.Start)
    .width('100%')
  }
}
