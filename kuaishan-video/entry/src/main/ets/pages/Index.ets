import { router, promptAction } from '@kit.ArkUI';

class FeatureItem {
  title: string;
  desc: string;
  symbol: Resource;
  iconColor: string;
  iconBg: string;
  target: string;
  pageParam: string;

  constructor(title: string, desc: string, symbol: Resource, iconColor: string, iconBg: string,
    target: string, pageParam: string) {
    this.title = title;
    this.desc = desc;
    this.symbol = symbol;
    this.iconColor = iconColor;
    this.iconBg = iconBg;
    this.target = target;
    this.pageParam = pageParam;
  }
}

function buildFeatures(): FeatureItem[] {
  return [
    new FeatureItem('视频去水印', '解析短视频链接去除水印', $r('sys.symbol.play_round_triangle_fill'), '#FF3B5C', '#FFE1E7', 'pages/ParsePage', ''),
    new FeatureItem('图集提取', '提取图片素材批量下载', $r('sys.symbol.picture_2'), '#3D8BFF', '#E3EEFF', 'pages/ParsePage', ''),
    new FeatureItem('实况提取', '提取作品封面与视频素材', $r('sys.symbol.livephoto'), '#FF7043', '#FFEBE0', 'pages/LivePage', 'extract'),
    new FeatureItem('批量解析', '多链接同时解析下载', $r('sys.symbol.download'), '#8B5CF6', '#F0E9FF', 'pages/BatchParsePage', ''),
    new FeatureItem('抖音主页', '解析抖音主页作品列表', $r('sys.symbol.person'), '#0FA6C8', '#E3F5FF', 'pages/UserPage', ''),
    new FeatureItem('AI去水印', '涂抹修复去除图片水印', $r('sys.symbol.wand_and_stars'), '#5B6CFF', '#ECF0FF', 'pages/InpaintPage', ''),
    new FeatureItem('MD5修改', '修改图片视频MD5值', $r('sys.symbol.lock'), '#22A85C', '#E5FBEA', 'pages/Md5Page', ''),
    new FeatureItem('音频分离', '从作品中分离原声音频', $r('sys.symbol.waveform'), '#E85D9E', '#FDE7F3', 'pages/AudioPage', ''),
    new FeatureItem('图片去水印', '框选区域智能修复', $r('sys.symbol.paintbrush'), '#D89A0E', '#FEF3D9', 'pages/InpaintPage', ''),
    new FeatureItem('视频转实况', '提取视频封面帧素材', $r('sys.symbol.video'), '#10B981', '#E2F8EF', 'pages/LivePage', 'make')
  ];
}

@Entry
@Component
struct Index {
  private features: FeatureItem[] = buildFeatures();
  @StorageProp('avoidTop') topPad: number = 0;
  @StorageProp('avoidBottom') bottomPad: number = 0;

  openFeature(f: FeatureItem): void {
    if (f.pageParam.length > 0) {
      AppStorage.setOrCreate('pageParam', f.pageParam);
    }
    router.pushUrl({ url: f.target });
  }

  @Builder
  featureCard(f: FeatureItem) {
    Column({ space: 6 }) {
      Row() {
        SymbolGlyph(f.symbol)
          .fontSize(26)
          .fontColor([f.iconColor])
      }
      .justifyContent(FlexAlign.Center)
      .width(52)
      .height(52)
      .backgroundColor(f.iconBg)
      .borderRadius(16)
      Text(f.title)
        .fontSize(16)
        .fontWeight(FontWeight.Bold)
        .fontColor('#20242b')
        .width('100%')
        .maxLines(1)
        .textOverflow({ overflow: TextOverflow.Ellipsis })
      Text(f.desc)
        .fontSize(12)
        .fontColor('#9aa0ab')
        .width('100%')
        .maxLines(2)
        .textOverflow({ overflow: TextOverflow.Ellipsis })
    }
    .alignItems(HorizontalAlign.Start)
    .padding(14)
    .constraintSize({ minHeight: 128 })
    .layoutWeight(1)
    .backgroundColor(Color.White)
    .borderRadius(18)
    .onClick(() => {
      this.openFeature(f);
    })
  }

  build() {
    Column() {
      // 顶部标题栏
      Row() {
        Text('')
          .width(44)
        Text('水印快删')
          .fontSize(24)
          .fontWeight(FontWeight.Bold)
          .fontColor('#15181e')
          .layoutWeight(1)
          .textAlign(TextAlign.Center)
        SymbolGlyph($r('sys.symbol.gearshape'))
          .fontSize(22)
          .fontColor(['#39414d'])
          .width(44)
          .onClick(() => {
            router.pushUrl({ url: 'pages/SettingsPage' });
          })
      }
      .width('100%')
      .height(60)
      .padding({ left: 16, right: 16 })

      Scroll() {
        Column() {
          Text('功能中心')
            .fontSize(19)
            .fontWeight(FontWeight.Bold)
            .fontColor('#15181e')
            .margin({ top: 6, bottom: 14 })

          ForEach(Array.from(new Array<number>(Math.ceil(this.features.length / 2)), (_v: number, i: number) => i),
            (rowIdx: number) => {
              Row({ space: 12 }) {
                ForEach(this.features.slice(rowIdx * 2, rowIdx * 2 + 2),
                  (f: FeatureItem) => {
                    this.featureCard(f)
                  },
                  (f: FeatureItem) => f.title
                )
                if (rowIdx * 2 + 1 >= this.features.length) {
                  Row().layoutWeight(1)
                }
              }
              .alignItems(VerticalAlign.Top)
              .margin({ bottom: 12 })
            },
            (rowIdx: number) => rowIdx.toString()
          )

          Text('~ 更多能力持续解锁中 ~')
            .fontSize(12)
            .fontColor('#c2c7cf')
            .margin({ top: 10, bottom: 30 })
        }
        .padding({ left: 16, right: 16 })
        .alignItems(HorizontalAlign.Start)
        .width('100%')
      }
      .layoutWeight(1)
      .scrollBar(BarState.Off)
      .align(Alignment.TopStart)
      .edgeEffect(EdgeEffect.Spring)
    }
    .width('100%')
    .height('100%')
    .backgroundColor('#F4F5F7')
    .padding({ top: this.topPad, bottom: this.bottomPad })
  }
}
