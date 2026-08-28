import { http } from '@kit.NetworkKit';
import { fileIo as fs } from '@kit.CoreFileKit';
import { photoAccessHelper } from '@kit.MediaLibraryKit';
import { picker } from '@kit.CoreFileKit';
import { cryptoFramework } from '@kit.CryptoArchitectureKit';
import { image } from '@kit.ImageKit';
import { media } from '@kit.MediaKit';
import { common } from '@kit.AbilityKit';

const UA_MOBILE: string =
  'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1';

/** 下载任意 URL 到缓存目录 */
export async function downloadToCache(ctx: common.Context, url: string, ext: string): Promise<string> {
  const tmpPath: string = ctx.cacheDir + '/dl_' + Date.now().toString() + '.' + ext;
  const client = http.createHttp();
  try {
    const resp = await client.request(url, {
      method: http.RequestMethod.GET,
      header: { 'User-Agent': UA_MOBILE },
      expectDataType: http.HttpDataType.ARRAY_BUFFER,
      readTimeout: 180000,
      connectTimeout: 15000
    });
    if (resp.responseCode < 200 || resp.responseCode >= 300) {
      throw new Error('下载响应异常 HTTP ' + resp.responseCode.toString());
    }
    const buf = resp.result as ArrayBuffer;
    const f = fs.openSync(tmpPath, fs.OpenMode.READ_WRITE | fs.OpenMode.CREATE | fs.OpenMode.TRUNC);
    fs.writeSync(f.fd, buf);
    fs.closeSync(f);
    return tmpPath;
  } finally {
    client.destroy();
  }
}

/** 把缓存文件写入相册（视频/图片），返回相册 URI */
export async function saveFileToGallery(ctx: common.Context, tmpPath: string, isVideo: boolean, ext: string): Promise<string> {
  const helper: photoAccessHelper.PhotoAccessHelper = photoAccessHelper.getPhotoAccessHelper(ctx);
  const uri: string = await helper.createAsset(isVideo ? photoAccessHelper.PhotoType.VIDEO : photoAccessHelper.PhotoType.IMAGE, ext);
  const dst = fs.openSync(uri, fs.OpenMode.READ_WRITE);
  const src = fs.openSync(tmpPath, fs.OpenMode.READ_ONLY);
  fs.copyFileSync(src.fd, dst.fd);
  fs.closeSync(src);
  fs.closeSync(dst);
  fs.unlinkSync(tmpPath);
  return uri;
}

/** 下载并保存视频到相册 */
export async function saveVideoToGallery(ctx: common.Context, url: string): Promise<string> {
  const tmp = await downloadToCache(ctx, url, 'mp4');
  return saveFileToGallery(ctx, tmp, true, 'mp4');
}

/** 下载并保存图片到相册 */
export async function saveImageToGallery(ctx: common.Context, url: string): Promise<string> {
  const ext = url.toLowerCase().includes('.png') ? 'png' : 'jpg';
  const tmp = await downloadToCache(ctx, url, ext);
  return saveFileToGallery(ctx, tmp, false, ext);
}

/** 通过系统安全保存对话框导出音频文件（音频不支持直接入相册） */
export async function saveAudioToDoc(ctx: common.Context, url: string, suggestedName: string): Promise<string> {
  const tmp = await downloadToCache(ctx, url, 'mp3');
  const opt = new picker.DocumentSaveOptions();
  opt.newFileNames = [suggestedName];
  opt.fileSuffixChoices = ['mp3', 'm4a', 'aac'];
  const docPicker = new picker.DocumentViewPicker(ctx);
  const uris: Array<string> = await docPicker.save(opt);
  if (uris.length === 0) {
    fs.unlinkSync(tmp);
    throw new Error('已取消保存');
  }
  const dst = fs.openSync(uris[0], fs.OpenMode.READ_WRITE);
  const src = fs.openSync(tmp, fs.OpenMode.READ_ONLY);
  fs.copyFileSync(src.fd, dst.fd);
  fs.closeSync(src);
  fs.closeSync(dst);
  fs.unlinkSync(tmp);
  return uris[0];
}

/** 相册选一个视频/图片，返回 [uri, 扩展名小写] */
export async function pickFromGallery(ctx: common.Context, videoMode: boolean): Promise<[string, string]> {
  const opt = new photoAccessHelper.PhotoSelectOptions();
  opt.MIMEType = videoMode ? photoAccessHelper.PhotoViewMIMETypes.VIDEO_TYPE : photoAccessHelper.PhotoViewMIMETypes.IMAGE_TYPE;
  opt.maxSelectNumber = 1;
  const p = new photoAccessHelper.PhotoViewPicker();
  const result: photoAccessHelper.PhotoSelectResult = await p.select(opt);
  if (result.photoUris.length === 0) {
    throw new Error('未选择文件');
  }
  const uri = result.photoUris[0];
  let ext = 'jpg';
  const raw = uri.substring(uri.lastIndexOf('/') + 1);
  const dot = raw.lastIndexOf('.');
  const q = raw.indexOf('?');
  if (dot >= 0 && (q < 0 || dot < q)) {
    ext = raw.substring(dot + 1, q >= 0 ? q : raw.length).toLowerCase();
  }
  if (ext.length === 0 || ext.length > 5) {
    ext = videoMode ? 'mp4' : 'jpg';
  }
  return [uri, ext];
}

/** 计算相册资源文件 MD5（分块读取），返回 32 位小写十六进制 */
export async function md5OfUri(uri: string): Promise<string> {
  const md = cryptoFramework.createMd('MD5');
  const file = fs.openSync(uri, fs.OpenMode.READ_ONLY);
  const stat = fs.statSync(file.fd);
  const chunk = new ArrayBuffer(1024 * 512);
  let off = 0;
  while (off < stat.size) {
    const readLen = fs.readSync(file.fd, chunk, { offset: off, length: chunk.byteLength });
    if (readLen <= 0) {
      break;
    }
    await md.update({ data: new Uint8Array(chunk.slice(0, readLen)) });
    off += readLen;
  }
  fs.closeSync(file);
  const blob = await md.digest();
  const arr = new Uint8Array(blob.data);
  let hex = '';
  for (const b of arr) {
    hex += (b < 16 ? '0' : '') + b.toString(16);
  }
  return hex;
}

/** 生成"改MD5"副本：在文件尾部追加随机字节，重新写入相册；返回新 URI 与新 MD5 */
export async function makeMd5Variant(ctx: common.Context, uri: string, isVideo: boolean): Promise<[string, string]> {
  const src = fs.openSync(uri, fs.OpenMode.READ_ONLY);
  const stat = fs.statSync(src.fd);
  const tmpPath: string = ctx.cacheDir + '/md5_' + Date.now().toString() + (isVideo ? '.mp4' : '.jpg');
  const dst = fs.openSync(tmpPath, fs.OpenMode.READ_WRITE | fs.OpenMode.CREATE | fs.OpenMode.TRUNC);
  const chunk = new ArrayBuffer(1024 * 512);
  let off = 0;
  while (off < stat.size) {
    const len = Math.min(1024 * 512, stat.size - off);
    const readLen = fs.readSync(src.fd, chunk, { offset: off, length: len });
    if (readLen <= 0) {
      break;
    }
    const slice = chunk.slice(0, readLen);
    fs.writeSync(dst.fd, slice);
    off += readLen;
  }
  // 尾部追加随机 16 字节，MD5 必变，内容可正常播放
  const rnd = new Uint8Array(16);
  for (let i = 0; i < 16; i++) {
    rnd[i] = Math.floor(Math.random() * 256);
  }
  fs.writeSync(dst.fd, rnd.buffer);
  fs.closeSync(src);
  fs.closeSync(dst);
  const newUri = await saveFileToGallery(ctx, tmpPath, isVideo, isVideo ? 'mp4' : 'jpg');
  const newMd5 = await md5OfUri(newUri);
  return [newUri, newMd5];
}

/** 提取视频指定时间点封面帧，保存为图片到相册 */
export async function extractFrameToGallery(ctx: common.Context, videoUri: string, second: number): Promise<string> {
  const gen = await media.createAVImageGenerator();
  const file = fs.openSync(videoUri, fs.OpenMode.READ_ONLY);
  const stat = fs.statSync(file.fd);
  gen.fdSrc = { fd: file.fd, offset: 0, length: stat.size };
  const px = await gen.fetchFrameByTime(Math.round(second * 1000000), media.AVImageQueryOptions.AV_IMAGE_QUERY_NEXT_SYNC, { width: 720, height: 1280 });
  gen.release();
  fs.closeSync(file);
  return await savePixelMapToGallery(ctx, px, 'frame_' + Date.now().toString());
}

/** PixelMap 编码保存为图片到相册 */
export async function savePixelMapToGallery(ctx: common.Context, px: image.PixelMap, name: string): Promise<string> {
  const packer = image.createImagePacker();
  const opt: image.PackingOption = { format: 'image/jpeg', quality: 92 };
  const buf = await packer.packing(px, opt);
  const tmpPath: string = ctx.cacheDir + '/' + name + '.jpg';
  const f = fs.openSync(tmpPath, fs.OpenMode.READ_WRITE | fs.OpenMode.CREATE | fs.OpenMode.TRUNC);
  fs.writeSync(f.fd, buf);
  fs.closeSync(f);
  return saveFileToGallery(ctx, tmpPath, false, 'jpg');
}

/** 图片指定矩形区域去水印：用区域上下边界像素纵向插值重建背景（对纯色/渐变背景效果真实有效） */
export async function healImageRegion(uri: string, xRatio: number, yRatio: number, wRatio: number, hRatio: number): Promise<void> {
  const src = image.createImageSource(uri);
  const px = await src.createPixelMap();
  const info = await px.getImageInfo();
  const W = info.size.width;
  const H = info.size.height;
  const buf = new ArrayBuffer(W * H * 4);
  await px.readPixelsToBuffer(buf);
  const u8 = new Uint8Array(buf);

  const x0 = Math.max(0, Math.round(xRatio * W));
  const y0 = Math.max(0, Math.round(yRatio * H));
  const x1 = Math.min(W - 1, Math.round((xRatio + wRatio) * W));
  const y1 = Math.min(H - 1, Math.round((yRatio + hRatio) * H));
  if (x1 <= x0 || y1 <= y0) {
    return;
  }
  const idx = (x: number, y: number): number => (y * W + x) * 4;
  const span = y1 - y0;
  for (let x = x0; x <= x1; x++) {
    const top = idx(x, Math.max(0, y0 - 1));
    const bottom = idx(x, Math.min(H - 1, y1 + 1));
    for (let y = y0; y <= y1; y++) {
      const t = (y - y0) / span;
      const p = idx(x, y);
      for (let c = 0; c < 3; c++) {
        u8[p + c] = Math.round(u8[top + c] * (1 - t) + u8[bottom + c] * t);
      }
      u8[p + 3] = 255;
    }
  }
  await px.writeBufferToPixels(buf);
  const name: string = 'heal_' + Date.now().toString();
  const packer = image.createImagePacker();
  const opt2: image.PackingOption = { format: 'image/jpeg', quality: 92 };
  const out = await packer.packing(px, opt2);
  const tmpPath: string = getContext().cacheDir + '/' + name + '.jpg';
  const f = fs.openSync(tmpPath, fs.OpenMode.READ_WRITE | fs.OpenMode.CREATE | fs.OpenMode.TRUNC);
  fs.writeSync(f.fd, out);
  fs.closeSync(f);
  const helperCtx = getContext() as common.Context;
  await saveFileToGallery(helperCtx, tmpPath, false, 'jpg');
}
