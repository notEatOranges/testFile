@Entry
@Component
struct Index {
  @State message: string = '你好，鸿蒙 7';
  @State count: number = 0;

  build() {
    Column({ space: 12 }) {
      Text(this.message)
        .fontSize(32)
        .fontWeight(FontWeight.Bold)
        .fontColor('#182431')
      Text('API 26 · ArkTS · Stage 模型')
        .fontSize(16)
        .fontColor('#666F83')
      Divider()
        .width('60%')
        .margin({ top: 8, bottom: 8 })
      Text(`点击次数：${this.count}`)
        .fontSize(18)
        .fontColor('#182431')
      Button('点我试试')
        .width('50%')
        .height(44)
        .fontSize(16)
        .onClick(() => {
          this.count++;
        })
    }
    .width('100%')
    .height('100%')
    .backgroundColor('#F1F3F5')
    .justifyContent(FlexAlign.Center)
  }
}
