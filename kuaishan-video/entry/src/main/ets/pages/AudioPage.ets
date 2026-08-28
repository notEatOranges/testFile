import { router, promptAction } from '@kit.ArkUI';
import { common } from '@kit.AbilityKit';
import { VideoInfo, ParseService } from '../services/ParseService';
import { saveAudioToDoc } from '../services/MediaSaver';

@Entry
@Component
struct AudioPage {
  @StorageProp('avoidTop') topPad: number = 0;
  @StorageProp('avoidBottom') bottomPad: number = 0;
  @State inputText: string = '';
  @State loading: boolean = false;
  @State info: VideoInfo | null = null;
  @State errMsg: string = '';
  @State saving: boolean = false;
  private ctx: common.Context = getContext(this) as common.Context;

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
        if (v.musicUrl.length === 0) {
          this.errMsg = '该作品未解析到原声音频';
        }
      })
      .catch((e: Object) => {
        this.loading = false;
        this.errMsg = e instanceof Error ? e.message : String(e);
      });
  }

  async doSave(): Promise<void> {
    const inf = this.info;
    if (inf === null || inf.musicUrl.length === 0 || this.saving) {
      return;
    }
    this.saving = true;
    try {
      const uri = await saveAudioToDoc(this.ctx, inf.musicUrl, '原声_' + Date.now().toString() + '.mp3');
      promptAction.showToast({ message: '音频已保存：' + uri, duration: 3000 });
    } catch (e) {
      const msg: string = e instanceof Error ? e.message : String(e);
      promptAction.showToast({ message: msg, duration: 2500 });
    }
    this.saving = false;
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
        Text('音频分离')
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
            placeholder: '粘贴作品分享链接，解析其原声/背景音乐'
          })
            .fontSize(14)
            .placeholderFont({ size: 13 })
            .placeholderColor('#b6bbc4')
            .fontColor('#20242b')
            .backgroundColor('#FFFFFF')
            .borderRadius(14)
            .height(88)
            .padding(12)
            .onChange((v: string) => {
              this.inputText = v;
            })

          Button(this.loading ? '解析中…' : '解析原声')
            .fontSize(15)
            .fontColor(Color.White)
            .linearGradient({
              angle: 135,
              colors: [['#E85D9E', 0], ['#FF8FB8', 1]]
            })
            .height(42)
            .borderRadius(21)
            .width('100%')
            .margin({ top: 12 })
            .enabled(!this.loading)
            .opacity(this.loading ? 0.6 : 1)
            .onClick(() => {
              this.startParse();
            })

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

          if (this.info !== null && this.info.musicUrl.length > 0) {
            Column({ space: 10 }) {
              Row({ space: 10 }) {
                Column() {
                  SymbolGlyph($r('sys.symbol.waveform')).fontSize(26).fontColor(['#E85D9E'])
                }
                .width(54)
                .height(54)
                .justifyContent(FlexAlign.Center)
                .backgroundColor('#FDE7F3')
                .borderRadius(14)

                Column({ space: 3 }) {
                  Text(this.info.title)
                    .fontSize(14)
                    .fontColor('#20242b')
                    .maxLines(2)
                    .textOverflow({ overflow: TextOverflow.Ellipsis })
                    .width('100%')
                  Text('原声 · ' + this.info.platform).fontSize(12).fontColor('#9aa0ab')
                }
                .alignItems(HorizontalAlign.Start)
                .layoutWeight(1)
              }
              .width('100%')

              Button(this.saving ? '正在导出…' : '选择位置并保存音频')
                .fontSize(14)
                .fontColor(Color.White)
                .backgroundColor('#E85D9E')
                .height(40)
                .borderRadius(20)
                .width('100%')
                .enabled(!this.saving)
                .onClick(() => {
                  this.doSave();
                })

              Text('音频文件将通过系统保存对话框导出到你选择的位置')
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
