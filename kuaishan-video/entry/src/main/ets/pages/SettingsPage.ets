import { router, promptAction } from '@kit.ArkUI';
import { common } from '@kit.AbilityKit';
import { AppConfig } from '../services/ParseService';

@Entry
@Component
struct SettingsPage {
  @StorageProp('avoidTop') topPad: number = 0;
  @StorageProp('avoidBottom') bottomPad: number = 0;
  @State apiUrl: string = '';
  private ctx: common.Context = getContext(this) as common.Context;

  aboutToAppear(): void {
    this.apiUrl = AppConfig.loadApiUrl(this.ctx);
  }

  save(): void {
    AppConfig.saveApiUrl(this.ctx, this.apiUrl.trim());
    promptAction.showToast({ message: '配置已保存 ✅', duration: 1500 });
    router.back();
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
        Text('设置')
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
          // 内置解析引擎说明
          Column({ space: 8 }) {
            Text('内置解析引擎')
              .fontSize(15)
              .fontWeight(FontWeight.Medium)
              .fontColor('#20242b')
              .width('100%')

            Text('抖音：请求分享页提取 _ROUTER_DATA 作品数据，播放地址 playwm→play 即为无水印直链；支持视频、图集、原声。\n快手：解析分享页 __APOLLO_STATE__ 数据。\n\n当内置引擎未命中时（平台风控变化、私密作品等），会自动回退到下方自建接口。')
              .fontSize(12)
              .fontColor('#7a8290')
              .width('100%')
          }
          .alignItems(HorizontalAlign.Start)
          .padding(14)
          .backgroundColor(Color.White)
          .borderRadius(16)
          .width('100%')

          // 备用接口
          Column({ space: 8 }) {
            Text('备用解析接口（可选）')
              .fontSize(15)
              .fontWeight(FontWeight.Medium)
              .fontColor('#20242b')
              .width('100%')

            TextInput({
              text: this.apiUrl,
              placeholder: 'https://your-api.example.com/parse'
            })
              .fontSize(13)
              .placeholderFont({ size: 12 })
              .placeholderColor('#b6bbc4')
              .fontColor('#20242b')
              .backgroundColor('#F4F5F7')
              .borderRadius(10)
              .height(42)
              .width('100%')
              .onChange((v: string) => {
                this.apiUrl = v;
              })

            Text('约定：POST {"link":"分享链接","type":"video|user"}\n· type=video 返回 JSON 含 title/author/cover/url（兼容 data 包裹与常见别名）\n· type=user 返回 {nickname, avatar, signature, aweme_count, works:[{desc,video:{play_addr:{url_list:[...]}},images:[...]}]}，works 结构与抖音 aweme 一致')
              .fontSize(11)
              .fontColor('#9aa0ab')
              .width('100%')
          }
          .alignItems(HorizontalAlign.Start)
          .padding(14)
          .backgroundColor(Color.White)
          .borderRadius(16)
          .margin({ top: 12 })

          Button('保存配置')
            .fontSize(15)
            .fontColor(Color.White)
            .linearGradient({
              angle: 135,
              colors: [['#FF5F6D', 0], ['#FF9A76', 1]]
            })
            .height(44)
            .borderRadius(22)
            .width('60%')
            .margin({ top: 24 })
            .onClick(() => {
              this.save();
            })

          Text('水印快删 v1.1.0 · 仅用于个人学习研究\n请尊重原作者版权，勿传播侵权内容')
            .fontSize(11)
            .fontColor('#c2c7cf')
            .textAlign(TextAlign.Center)
            .margin({ top: 20 })
        }
        .alignItems(HorizontalAlign.Start)
        .width('100%')
        .padding(16)
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
