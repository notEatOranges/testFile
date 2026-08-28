import { http } from '@kit.NetworkKit';
import { preferences } from '@kit.ArkData';
import { common } from '@kit.AbilityKit';

const UA_MOBILE: string =
  'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1';

/** 解析结果 */
export class VideoInfo {
  title: string = '';
  author: string = '';
  cover: string = '';
  videoUrl: string = '';
  platform: string = '';
  durationSec: number = 0;
  images: string[] = [];
  musicUrl: string = '';
}

/** 应用配置持久化 */
export class AppConfig {
  private static readonly STORE: string = 'kuaishan_config';
  private static readonly KEY_API: string = 'api_url';

  private static prefs(ctx: common.Context): preferences.Preferences {
    return preferences.getPreferencesSync(ctx, { name: AppConfig.STORE });
  }

  static loadApiUrl(ctx: common.Context): string {
    return AppConfig.prefs(ctx).getSync(AppConfig.KEY_API, '') as string;
  }

  static saveApiUrl(ctx: common.Context, url: string): void {
    const p = AppConfig.prefs(ctx);
    p.putSync(AppConfig.KEY_API, url);
    p.flush();
  }
}

function pickStr(o: Record<string, Object>, keys: string[]): string {
  for (const k of keys) {
    const t: Object = o[k];
    if (typeof t === 'string') {
      const s = t as string;
      if (s.length > 0) {
        return s;
      }
    }
  }
  return '';
}

function asRecord(o: Object | null): Record<string, Object> | null {
  if (o !== null && typeof o === 'object') {
    return o as Record<string, Object>;
  }
  return null;
}

/** 网络GET文本 */
async function httpGetText(url: string, timeout: number): Promise<string> {
  const client = http.createHttp();
  try {
    const resp = await client.request(url, {
      method: http.RequestMethod.GET,
      header: { 'User-Agent': UA_MOBILE },
      expectDataType: http.HttpDataType.STRING,
      readTimeout: timeout,
      connectTimeout: 12000
    });
    if (resp.responseCode < 200 || resp.responseCode >= 300) {
      throw new Error('HTTP ' + resp.responseCode.toString());
    }
    return resp.result as string;
  } finally {
    client.destroy();
  }
}

/** 网络POST文本 */
async function httpPostText(url: string, body: string, timeout: number): Promise<string> {
  const client = http.createHttp();
  try {
    const resp = await client.request(url, {
      method: http.RequestMethod.POST,
      header: { 'Content-Type': 'application/json', 'User-Agent': UA_MOBILE },
      extraData: body,
      expectDataType: http.HttpDataType.STRING,
      readTimeout: timeout,
      connectTimeout: 12000
    });
    if (resp.responseCode < 200 || resp.responseCode >= 300) {
      throw new Error('HTTP ' + resp.responseCode.toString());
    }
    return resp.result as string;
  } finally {
    client.destroy();
  }
}

/** 从 _ROUTER_DATA / iteminfo 里的 item 对象映射结果 */
function mapItem(item: Record<string, Object>, platform: string): VideoInfo {
  const v = new VideoInfo();
  v.platform = platform;
  v.title = pickStr(item, ['desc', 'title', 'caption']);

  const videoRec = asRecord(item['video']);
  if (videoRec !== null) {
    const play = asRecord(videoRec['play_addr']);
    if (play !== null) {
      const urls: Object = play['url_list'];
      if (typeof urls === 'object' && urls !== null) {
        const arr = urls as Array<Object>;
        if (arr.length > 0 && typeof arr[0] === 'string') {
          let u = arr[0] as string;
          // playwm 接口带水印，替换为 play 接口即无水印
          u = u.replace('/playwm/', '/play/');
          v.videoUrl = u;
        }
      }
    }
    const coverRec = asRecord(videoRec['cover']);
    if (coverRec !== null) {
      const urls: Object = coverRec['url_list'];
      if (typeof urls === 'object' && urls !== null) {
        const arr = urls as Array<Object>;
        if (arr.length > 0 && typeof arr[0] === 'string') {
          v.cover = arr[0] as string;
        }
      }
    }
    const durObj: Object = videoRec['duration'];
    if (typeof durObj === 'number') {
      v.durationSec = Math.round((durObj as number) / 1000);
    }
  }

  // 图集（note 类型）
  const imgs: Object = item['images'];
  if (typeof imgs === 'object' && imgs !== null) {
    const arr = imgs as Array<Object>;
    for (const one of arr) {
      const rec = asRecord(one);
      if (rec === null) {
        continue;
      }
      const urls: Object = rec['url_list'];
      if (typeof urls === 'object' && urls !== null) {
        const ul = urls as Array<Object>;
        if (ul.length > 0 && typeof ul[0] === 'string') {
          v.images.push(ul[0] as string);
        }
      }
    }
  }

  // 原声（音频分离真实来源）
  const musicRec = asRecord(item['music']);
  if (musicRec !== null) {
    const play = asRecord(musicRec['play_url']);
    if (play !== null) {
      const urls: Object = play['url_list'];
      if (typeof urls === 'object' && urls !== null) {
        const arr = urls as Array<Object>;
        if (arr.length > 0 && typeof arr[0] === 'string') {
          v.musicUrl = arr[0] as string;
        }
      }
    }
  }

  const authorRec = asRecord(item['author']);
  if (authorRec !== null) {
    v.author = pickStr(authorRec, ['nickname', 'name']);
  }
  if (v.title.length === 0) {
    v.title = '未命名作品';
  }
  return v;
}

/** 抖音页面 _ROUTER_DATA 解析 */
function parseDouyinRouterData(body: string): VideoInfo | null {
  const key = '_ROUTER_DATA';
  const i = body.indexOf(key);
  if (i < 0) {
    return null;
  }
  const braceStart = body.indexOf('{', i);
  if (braceStart < 0) {
    return null;
  }
  // 从 braceStart 起做花括号配平截取 JSON
  let depth = 0;
  let inStr = false;
  let esc = false;
  let end = -1;
  for (let p = braceStart; p < body.length; p++) {
    const ch = body.charAt(p);
    if (esc) {
      esc = false;
      continue;
    }
    if (ch === '\\') {
      esc = true;
      continue;
    }
    if (ch === '"') {
      inStr = !inStr;
      continue;
    }
    if (inStr) {
      continue;
    }
    if (ch === '{') {
      depth++;
    } else if (ch === '}') {
      depth--;
      if (depth === 0) {
        end = p;
        break;
      }
    }
  }
  if (end < 0) {
    return null;
  }
  const root = asRecord(JSON.parse(body.substring(braceStart, end + 1)) as Object);
  if (root === null) {
    return null;
  }
  const loader = asRecord(root['loaderData']);
  if (loader === null) {
    return null;
  }
  // key 形如 video_(id)/note_(id)/user_*
  for (const k of Object.keys(loader)) {
    if (k.startsWith('video_') || k.startsWith('note_')) {
      const page = asRecord(loader[k]);
      if (page === null) {
        continue;
      }
      const itemInfo = asRecord(page['videoInfoRes']);
      if (itemInfo === null) {
        continue;
      }
      const list: Object = itemInfo['item_list'];
      if (typeof list === 'object' && list !== null) {
        const arr = list as Array<Object>;
        if (arr.length > 0) {
          const item = asRecord(arr[0]);
          if (item !== null) {
            return mapItem(item, '抖音');
          }
        }
      }
    }
  }
  return null;
}

/** 快手 __APOLLO_STATE__ 解析 */
function parseKuaishouApollo(body: string): VideoInfo | null {
  const key = '__APOLLO_STATE__';
  const i = body.indexOf(key);
  if (i < 0) {
    return null;
  }
  const braceStart = body.indexOf('{', i);
  const braceEnd = body.lastIndexOf('}');
  if (braceStart < 0 || braceEnd <= braceStart) {
    return null;
  }
  let jsonPart = body.substring(braceStart, braceEnd + 1);
  // apollo 常见 undefined 字面量清理
  while (jsonPart.includes('undefined')) {
    jsonPart = jsonPart.replace('undefined', 'null');
  }
  const root = asRecord(JSON.parse(jsonPart) as Object);
  if (root === null) {
    return null;
  }
  let best: VideoInfo | null = null;
  for (const k of Object.keys(root)) {
    if (!k.startsWith('VisionApiVideo')) {
      continue;
    }
    const rec = asRecord(root[k]);
    if (rec === null) {
      continue;
    }
    const v = new VideoInfo();
    v.platform = '快手';
    v.title = pickStr(rec, ['caption', 'title']);
    v.videoUrl = pickStr(rec, ['photoUrl', 'playUrl', 'mp4Url']);
    v.cover = pickStr(rec, ['poster', 'coverUrl', 'thumbnailUrl']);
    const durObj: Object = rec['duration'];
    if (typeof durObj === 'number') {
      v.durationSec = Math.round((durObj as number) / 1000);
    }
    if (v.videoUrl.length > 0) {
      if (v.title.length === 0) {
        v.title = '未命名作品';
      }
      best = v;
      break;
    }
  }
  return best;
}

/** 自建备用接口：约定 POST {"link","type"} 返回含 title/url 等字段的 JSON */
function parseViaApi(apiUrl: string, link: string, type: string): Promise<VideoInfo> {
  return httpPostText(apiUrl, JSON.stringify({ link: link, type: type }), 25000)
    .then((raw: string) => {
      const root: Record<string, Object> = JSON.parse(raw) as Record<string, Object>;
      let data: Record<string, Object> = root;
      const md: Object = root['data'];
      if (typeof md === 'object' && md !== null) {
        data = md as Record<string, Object>;
      }
      if (type === 'user') {
        return Promise.reject(new Error('USER_PAGE'));
      }
      const v = new VideoInfo();
      v.title = pickStr(data, ['title', 'desc']);
      v.author = pickStr(data, ['author', 'nickname', 'author_name']);
      v.cover = pickStr(data, ['cover', 'cover_url', 'pic', 'image']);
      v.videoUrl = pickStr(data, ['url', 'video_url', 'videoUrl', 'play_url', 'no_watermark_url']);
      v.musicUrl = pickStr(data, ['music', 'music_url', 'audio_url']);
      const low = link.toLowerCase();
      v.platform = low.includes('kuaishou') ? '快手' : (low.includes('douyin') ? '抖音' : '其他');
      const durObj: Object = data['duration'];
      if (typeof durObj === 'number') {
        v.durationSec = Math.round((durObj as number) / 1000);
      }
      if (v.videoUrl.length === 0) {
        throw new Error('接口未返回视频直链');
      }
      if (v.title.length === 0) {
        v.title = '未命名作品';
      }
      return v;
    });
}

/** 链接解析服务（真实链路） */
export class ParseService {
  static extractLink(text: string): string {
    if (text.length === 0) {
      return '';
    }
    const matches: string[] | null = text.match(/https?:\/\/[A-Za-z0-9._~:/?#[\]@!$&()*+,;=%-]+/g);
    if (matches === null || matches.length === 0) {
      return '';
    }
    for (const m of matches) {
      const low = m.toLowerCase();
      if (low.includes('douyin') || low.includes('kuaishou')) {
        return m;
      }
    }
    return matches[0];
  }

  /**
   * 真实解析：
   * 1. 抖音/快手：请求分享页，从 _ROUTER_DATA / __APOLLO_STATE__ 提取作品数据，播放地址替换 playwm→play 得无水印直链
   * 2. 直链失败且配置了备用接口时，走自建接口
   */
  static async parse(ctx: common.Context, input: string, type: string = 'video'): Promise<VideoInfo> {
    const link: string = ParseService.extractLink(input);
    if (link.length === 0) {
      throw new Error('未检测到有效链接，请粘贴完整的分享内容');
    }
    const low = link.toLowerCase();
    let result: VideoInfo | null = null;
    let lastErr: string = '';

    if (low.includes('douyin')) {
      try {
        const page = await httpGetText(link, 20000);
        result = parseDouyinRouterData(page);
        if (result === null) {
          lastErr = '抖音页面结构未命中（可能为私密/已删除作品）';
        }
      } catch (e) {
        lastErr = e instanceof Error ? e.message : String(e);
      }
    } else if (low.includes('kuaishou')) {
      try {
        const page = await httpGetText(link, 20000);
        result = parseKuaishouApollo(page);
        if (result === null) {
          lastErr = '快手页面结构未命中（可能需要登录校验）';
        }
      } catch (e) {
        lastErr = e instanceof Error ? e.message : String(e);
      }
    } else {
      lastErr = '暂不支持的平台链接';
    }

    if (result !== null) {
      return result;
    }

    const apiUrl: string = AppConfig.loadApiUrl(ctx);
    if (apiUrl.length > 0 && type !== 'user') {
      return parseViaApi(apiUrl, link, type);
    }
    throw new Error(lastErr.length > 0 ? lastErr : '解析失败');
  }

  /** 抖音主页：提取 sec_uid，拉取昵称/头像/作品列表（自建接口或公开 share 接口） */
  static async parseUserProfile(ctx: common.Context, input: string): Promise<Record<string, Object>> {
    const link: string = ParseService.extractLink(input);
    if (link.length === 0) {
      throw new Error('未检测到有效链接');
    }
    const page = await httpGetText(link, 20000);
    let secUid: string = '';
    const m: RegExpMatchArray | null = page.match(/"sec_uid":"(MS4wLjABAAAA[0-9A-Za-z_-]+)"/);
    if (m !== null) {
      secUid = m[1];
    } else {
      const m2: RegExpMatchArray | null = page.match(/sec_uid=(MS4wLjABAAAA[0-9A-Za-z_-]+)/);
      if (m2 !== null) {
        secUid = m2[1];
      }
    }
    if (secUid.length === 0) {
      // 允许直接粘贴 sec_uid
      const m3: RegExpMatchArray | null = input.match(/MS4wLjABAAAA[0-9A-Za-z_-]+/);
      if (m3 !== null) {
        secUid = m3[0];
      }
    }
    if (secUid.length === 0) {
      throw new Error('未能从分享内容中解析出用户ID');
    }
    const apiUrl: string = AppConfig.loadApiUrl(ctx);
    if (apiUrl.length > 0) {
      const raw = await httpPostText(apiUrl, JSON.stringify({ link: link, type: 'user', sec_uid: secUid }), 25000);
      const root: Record<string, Object> = JSON.parse(raw) as Record<string, Object>;
      const md: Object = root['data'];
      if (typeof md === 'object' && md !== null) {
        return md as Record<string, Object>;
      }
      return root;
    }
    const raw = await httpGetText('https://www.iesdouyin.com/web/api/v2/user/profile?sec_uid=' + secUid, 20000);
    const root: Record<string, Object> = JSON.parse(raw) as Record<string, Object>;
    const userRec = asRecord(root['user']);
    const out: Record<string, Object> = {};
    if (userRec !== null) {
      out['nickname'] = userRec['nickname'] ?? '';
      out['avatar'] = userRec['avatar_medium'] ?? userRec['avatar_larger'] ?? '';
      out['signature'] = userRec['signature'] ?? '';
      out['aweme_count'] = userRec['aweme_count'] ?? 0;
    }
    out['sec_uid'] = secUid;
    out['works'] = root['aweme_list'] ?? new Array<Object>();
    return out;
  }
}

/** 把主页接口返回的作品数组映射为解析结果列表 */
export function mapAwemeList(listObj: Object): VideoInfo[] {
  const out: VideoInfo[] = [];
  if (typeof listObj !== 'object' || listObj === null) {
    return out;
  }
  const arr = listObj as Array<Object>;
  for (const one of arr) {
    const item = asRecord(one);
    if (item === null) {
      continue;
    }
    const v = mapItem(item, '抖音');
    if (v.videoUrl.length > 0 || v.images.length > 0) {
      out.push(v);
    }
  }
  return out;
}
