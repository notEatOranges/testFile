import { router, promptAction } from '@kit.ArkUI';
import { common } from '@kit.AbilityKit';
import { pickFromGallery, healImageRegion } from '../services/MediaSaver';

@Entry
@Component
struct InpaintPage {
  @StorageProp('avoidTop') topPad: number = 0;
  @StorageProp('avoidBottom') bottomPad: number = 0;
  @State uri: string = '';
  @State rx: number = 5;
  @State ry: number = 78;
  @State rw: number = 90;
  @State rh: number = 14;
  @State working: boolean = false;
  @State errMsg: string = '';
  private ctx: common.Context = getContext(this) as common.Context;

  async pick(): Promise<void> {
    this.errMsg = '';
    try {
      const pair = await pickFromGallery(this.ctx, false);
      this.uri = pair[0];
    } catch (e) {
      this.errMsg = e instanceof Error ? e.message : String(e);
    }
  }

  async heal(): Promise<void> {
    if (this.uri.length === 0 || this.working) {
      return;
    }
    this.working = true;
    try {
      await healImageRegion(this.uri, this.rx / 100, this.ry / 100, this.rw / 100, this.rh / 100);
      promptAction.showToast({ message: '修复完成，已保存到相册 ✅', duration: 2500 });
    } catch (e) {
      const msg: string = e instanceof Error ? e.message : String(e);
      promptAction.showToast({ message: '修复失败：' + msg, duration: 3000 });
    }
    this.working = false;
  }

  @Builder
  sliderRow(label: string, val: number, onChange: (v: number) => void) {
    Row() {
      Text(label)
        .fontSize(13)
        .fontColor('#39414d')
        .width(64)
      Slider({ value: val, min: 0, max: 100, step: 1, style: SliderStyle.OutSet })
        .selectedColor('#5B6CFF')
        .layoutWeight(1)
        .onChange((v: number) => {
          onChange(Math.round(v));
        })
      Text(val.toString() + '%')
        .fontSize(12)
        .fontColor('#7a8290')
        .width(42)
        .textAlign(TextAlign.End)
    }
    .width('100%')
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
        Text('图片去水印')
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
          Button(this.uri.length > 0 ? '重新选择图片' : '从相册选择图片')
            .fontSize(15)
            .fontColor(Color.White)
            .linearGradient({
              angle: 135,
              colors: [['#5B6CFF', 0], ['#8B5CF6', 1]]
            })
            .height(42)
            .borderRadius(21)
            .width('100%')
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

          if (this.uri.length > 0) {
            Stack({ alignContent: Alignment.TopStart }) {
              Image(this.uri)
                .width('100%')
                .height('100%')
                .objectFit(ImageFit.Contain)
                .backgroundColor('#111318')

              Column()
                .backgroundColor('#5B6CFF22')
                .border({ width: 2, color: '#5B6CFF' })
                .position({ x: this.rx.toString() + '%', y: this.ry.toString() + '%' })
                .width(this.rw.toString() + '%')
                .height(this.rh.toString() + '%')
            }
            .width('100%')
            .height(320)
            .borderRadius(16)
            .clip(true)
            .margin({ top: 14 })

            Column({ space: 4 }) {
              this.sliderRow('起始X', this.rx, (v: number) => {
                this.rx = v;
              })
              this.sliderRow('起始Y', this.ry, (v: number) => {
                this.ry = v;
              })
              this.sliderRow('宽度', this.rw, (v: number) => {
                this.rw = v;
              })
              this.sliderRow('高度', this.rh, (v: number) => {
                this.rh = v;
              })
            }
            .padding(12)
            .backgroundColor(Color.White)
            .borderRadius(16)
            .width('100%')
            .margin({ top: 12 })

            Button(this.working ? '修复中…' : '智能修复并保存到相册')
              .fontSize(15)
              .fontColor(Color.White)
              .linearGradient({
                angle: 135,
                colors: [['#FF5F6D', 0], ['#FF9A76', 1]]
              })
              .height(44)
              .borderRadius(22)
              .width('100%')
              .margin({ top: 14 })
              .enabled(!this.working)
              .opacity(this.working ? 0.6 : 1)
              .onClick(() => {
                this.heal();
              })

            Text('拖动滑块让蓝框完全盖住水印区域，修复会用区域上下方的背景像素纵向渐变填充。纯色、渐变、天空等背景效果最佳。')
              .fontSize(11)
              .fontColor('#9aa0ab')
              .width('100%')
              .margin({ top: 10 })
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
