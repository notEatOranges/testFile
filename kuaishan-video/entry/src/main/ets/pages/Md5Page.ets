import { router, promptAction } from '@kit.ArkUI';
import { common } from '@kit.AbilityKit';
import { pickFromGallery, md5OfUri, makeMd5Variant } from '../services/MediaSaver';

@Entry
@Component
struct Md5Page {
  @StorageProp('avoidTop') topPad: number = 0;
  @StorageProp('avoidBottom') bottomPad: number = 0;
  @State isVideo: boolean = true;
  @State picked: boolean = false;
  @State uri: string = '';
  @State origMd5: string = '';
  @State working: boolean = false;
  @State newMd5: string = '';
  @State errMsg: string = '';
  private ctx: common.Context = getContext(this) as common.Context;

  async pick(): Promise<void> {
    this.errMsg = '';
    this.origMd5 = '';
    this.newMd5 = '';
    this.picked = false;
    try {
      const pair = await pickFromGallery(this.ctx, this.isVideo);
      this.uri = pair[0];
      this.working = true;
      this.origMd5 = await md5OfUri(this.uri);
      this.working = false;
      this.picked = true;
    } catch (e) {
      this.working = false;
      this.errMsg = e instanceof Error ? e.message : String(e);
    }
  }

  async makeVariant(): Promise<void> {
    if (!this.picked || this.working) {
      return;
    }
    this.working = true;
    try {
      const pair = await makeMd5Variant(this.ctx, this.uri, this.isVideo);
      this.newMd5 = pair[1];
      promptAction.showToast({ message: '副本已保存到相册 ✅', duration: 2000 });
    } catch (e) {
      const msg: string = e instanceof Error ? e.message : String(e);
      promptAction.showToast({ message: '失败：' + msg, duration: 2500 });
    }
    this.working = false;
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
        Text('MD5修改')
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
          Text('选择文件类型')
            .fontSize(14)
            .fontColor('#7a8290')
            .margin({ bottom: 8 })

          Row({ space: 10 }) {
            Button('视频')
              .fontSize(14)
              .fontColor(this.isVideo ? Color.White : '#39414d')
              .backgroundColor(this.isVideo ? '#22A85C' : '#EDEFF3')
              .layoutWeight(1)
              .height(40)
              .borderRadius(20)
              .onClick(() => {
                this.isVideo = true;
              })
            Button('图片')
              .fontSize(14)
              .fontColor(!this.isVideo ? Color.White : '#39414d')
              .backgroundColor(!this.isVideo ? '#22A85C' : '#EDEFF3')
              .layoutWeight(1)
              .height(40)
              .borderRadius(20)
              .onClick(() => {
                this.isVideo = false;
              })
          }
          .width('100%')

          Button(this.working ? '处理中…' : '从相册选择' + (this.isVideo ? '视频' : '图片'))
            .fontSize(15)
            .fontColor(Color.White)
            .linearGradient({
              angle: 135,
              colors: [['#22A85C', 0], ['#4ADE80', 1]]
            })
            .height(42)
            .borderRadius(21)
            .width('100%')
            .margin({ top: 14 })
            .enabled(!this.working)
            .onClick(() => {
              this.pick();
            })

          if (this.errMsg.length > 0) {
            Text('⚠ ' + this.errMsg)
              .fontSize(13)
              .fontColor('#e5484d')
              .backgroundColor('#fdecec')
              .borderRadius(12)
              .padding(12)
              .width('100%')
              .margin({ top: 14 })
          }

          if (this.picked && this.origMd5.length > 0) {
            Column({ space: 10 }) {
              this.md5Row('原 MD5', this.origMd5, '#39414d')

              Button(this.working ? '生成中…' : '生成改MD5副本并保存到相册')
                .fontSize(14)
                .fontColor(Color.White)
                .backgroundColor('#22A85C')
                .height(40)
                .borderRadius(20)
                .width('100%')
                .enabled(!this.working)
                .onClick(() => {
                  this.makeVariant();
                })

              if (this.newMd5.length > 0) {
                this.md5Row('新 MD5', this.newMd5, '#22A85C')
              }

              Text('原理：在文件尾部追加 16 字节随机数据，内容播放显示完全不变，但 MD5 值必然改变；副本保存到相册，原文件不受影响。')
                .fontSize(11)
                .fontColor('#9aa0ab')
                .width('100%')
            }
            .padding(12)
            .backgroundColor(Color.White)
            .borderRadius(18)
            .width('100%')
            .margin({ top: 14 })
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

  @Builder
  md5Row(label: string, val: string, color: string) {
    Column({ space: 3 }) {
      Text(label).fontSize(12).fontColor('#9aa0ab')
      Text(val)
        .fontSize(12)
        .fontColor(color)
        .fontFamily('monospace')
        .width('100%')
        .copyOption(CopyOptions.InApp)
    }
    .alignItems(HorizontalAlign.Start)
    .width('100%')
    .backgroundColor('#F7F8FA')
    .borderRadius(10)
    .padding(10)
  }
}
