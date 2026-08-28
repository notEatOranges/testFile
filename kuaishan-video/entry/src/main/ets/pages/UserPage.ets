import { router, promptAction } from '@kit.ArkUI';
import { common } from '@kit.AbilityKit';
import { ParseService, mapAwemeList } from '../services/ParseService';
import { VideoInfo } from '../services/ParseService';
import { saveVideoToGallery } from '../services/MediaSaver';

@Entry
@Component
struct UserPage {
  @StorageProp('avoidTop') topPad: number = 0;
  @StorageProp('avoidBottom') bottomPad: number = 0;
  @State inputText: string = '';
  @State loading: boolean = false;
  @State errMsg: string = '';
  @State nickname: string = '';
  @State avatar: string = '';
  @State signature: string = '';
  @State awemeCount: string = '';
  @State works: VideoInfo[] = [];
  @State savingIdx: number = -1;
  private ctx: common.Context = getContext(this) as common.Context;

  startParse(): void {
    if (this.loading) {
      return;
    }
    this.errMsg = '';
    this.works = [];
    this.nickname = '';
    this.avatar = '';
    this.signature = '';
    this.awemeCount = '';
    const raw: string = this.inputText.trim();
    if (raw.length === 0) {
      this.errMsg = '请粘贴主页分享口令、链接或直接粘贴 sec_uid';
      return;
    }
    this.loading = true;
    ParseService.parseUserProfile(this.ctx, raw)
      .then((out: Record<string, Object>) => {
        this.loading = false;
        const nick: Object = out['nickname'];
        if (typeof nick === 'string') {
          this.nickname = nick as string;
        }
        const av: Object = out['avatar'];
        if (typeof av === 'string') {
          this.avatar = av as string;
        }
        const sig: Object = out['signature'];
        if (typeof sig === 'string') {
          this.signature = sig as string;
        }
        const cnt: Object = out['aweme_count'];
        if (typeof cnt === 'number') {
          this.awemeCount = (cnt as number).toString();
        }
        const worksObj: Object = out['works'];
        this.works = mapAwemeList(worksObj);
        if (this.works.length === 0) {
          this.errMsg = '已解析到用户信息，但作品列表需要自建接口支持（见设置页说明）';
        }
      })
      .catch((e: Object) => {
        this.loading = false;
        this.errMsg = e instanceof Error ? e.message : String(e);
      });
  }

  saveWork(idx: number, w: VideoInfo): void {
    if (this.savingIdx >= 0 || w.videoUrl.length === 0) {
      return;
    }
    this.savingIdx = idx;
    this.works = this.works.slice();
    saveVideoToGallery(this.ctx, w.videoUrl)
      .then(() => {
        this.savingIdx = -1;
        this.works = this.works.slice();
        promptAction.showToast({ message: '已保存 ✅', duration: 1500 });
      })
      .catch((e: Object) => {
        this.savingIdx = -1;
        this.works = this.works.slice();
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
        Text('抖音主页')
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
            placeholder: '粘贴抖音主页分享口令 / 链接 / sec_uid'
          })
            .fontSize(14)
            .placeholderFont({ size: 13 })
            .placeholderColor('#b6bbc4')
            .fontColor('#20242b')
            .backgroundColor('#FFFFFF')
            .borderRadius(14)
            .height(80)
            .padding(12)
            .onChange((v: string) => {
              this.inputText = v;
            })

          Button(this.loading ? '解析中…' : '解析主页')
            .fontSize(15)
            .fontColor(Color.White)
            .linearGradient({
              angle: 135,
              colors: [['#0FA6C8', 0], ['#38BDF8', 1]]
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

          if (this.nickname.length > 0) {
            Row({ space: 12 }) {
              if (this.avatar.length > 0) {
                Image(this.avatar)
                  .width(56)
                  .height(56)
                  .borderRadius(28)
                  .objectFit(ImageFit.Cover)
                  .backgroundColor('#eceef2')
              }
              Column({ space: 3 }) {
                Text(this.nickname).fontSize(16).fontWeight(FontWeight.Bold).fontColor('#20242b')
                if (this.signature.length > 0) {
                  Text(this.signature).fontSize(12).fontColor('#9aa0ab').maxLines(2)
                    .textOverflow({ overflow: TextOverflow.Ellipsis }).width('100%')
                }
                if (this.awemeCount.length > 0) {
                  Text('作品 ' + this.awemeCount + ' 个 · 已载入 ' + this.works.length.toString() + ' 个')
                    .fontSize(11).fontColor('#9aa0ab')
                }
              }
              .alignItems(HorizontalAlign.Start)
              .layoutWeight(1)
            }
            .width('100%')
            .padding(12)
            .backgroundColor(Color.White)
            .borderRadius(16)
            .margin({ top: 16 })
            .alignItems(VerticalAlign.Top)
          }

          ForEach(this.works, (w: VideoInfo, idx: number) => {
            Row({ space: 10 }) {
              if (w.cover.length > 0) {
                Image(w.cover)
                  .width(58)
                  .height(58)
                  .borderRadius(10)
                  .objectFit(ImageFit.Cover)
                  .backgroundColor('#eceef2')
              }
              Column({ space: 3 }) {
                Text((idx + 1).toString() + '. ' + w.title)
                  .fontSize(13)
                  .fontColor('#20242b')
                  .maxLines(2)
                  .textOverflow({ overflow: TextOverflow.Ellipsis })
                  .width('100%')
                Text(w.images.length > 0 ? '图集' : '视频')
                  .fontSize(11)
                  .fontColor('#9aa0ab')
              }
              .alignItems(HorizontalAlign.Start)
              .layoutWeight(1)

              if (w.videoUrl.length > 0) {
                Button(this.savingIdx === idx ? '…' : '保存')
                  .fontSize(12)
                  .fontColor(Color.White)
                  .backgroundColor('#0FA6C8')
                  .height(30)
                  .borderRadius(15)
                  .onClick(() => {
                    this.saveWork(idx, w);
                  })
              }
            }
            .width('100%')
            .padding(10)
            .backgroundColor(Color.White)
            .borderRadius(14)
            .margin({ top: 10 })
            .alignItems(VerticalAlign.Center)
          }, (w: VideoInfo, idx: number) => idx.toString() + w.title)
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
