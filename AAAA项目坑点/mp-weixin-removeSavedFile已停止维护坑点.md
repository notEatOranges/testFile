# mp-weixin：uni.removeSavedFile 等底层 wx.xxx 文件接口已停止维护

> 适用：uni-app + 微信小程序（mp-weixin），用到 uni.saveFile / uni.removeSavedFile / uni.getSavedFileList / uni.getSavedFileInfo / uni.getFileInfo 的项目。

## 现状

微信官方文档明确：
- `wx.removeSavedFile`（顶层 API）：**「该接口已停止维护，推荐使用 FileSystemManager.removeSavedFile」**。
- uni-app 文档对 `uni.saveFile` / `uni.getSavedFileList` / `uni.getSavedFileInfo` / `uni.removeSavedFile` / `uni.getFileInfo` 每个都标注「微信小程序已停止维护 wx.xxx 接口，建议使用 FileSystemManager 对象中的方法」。
- 即 **uni 的这些封装在 mp-weixin 下底层仍映射到已停止维护的 wx.xxx 顶层 API**，uni-app 没有自动切到 FileSystemManager。

## 影响

**「停止维护」≠「立即失效」**：
- 这些 API 仍可用（微信向后兼容），当前功能正常。
- 但微信不再更新/修复，未来某个基础库版本可能真删除 → 届时保存/删除/查询文件会 fail。

## 迁移方法（mp-weixin 改用 FileSystemManager 对象）

```js
const fs = uni.getFileSystemManager();
fs.saveFile({ tempFilePath, success, fail });       // 替代 uni.saveFile
fs.removeSavedFile({ filePath, success, fail });    // 替代 uni.removeSavedFile
fs.getSavedFileList({ success, fail });             // 替代 uni.getSavedFileList
fs.getFileInfo({ filePath, success, fail });        // 替代 uni.getFileInfo
```

注意区分：
- 删「本地缓存文件」（saveFile 产生的）→ `FileSystemManager.removeSavedFile`。
- 删「本地用户文件」（USER_DATA_PATH 自定义路径）→ `FileSystemManager.unlink`。
- 两者不是一回事，别用错。

## 本项目实例

翼动同行（school-parent-mp）`packageMine/utils/exportFile.js`：
- `saveFilePromise` 用 `uni.saveFile`、`removeSavedFilePromise` 用 `uni.removeSavedFile`、`getFileInfoPromise` 用 `uni.getFileInfo`。
- 当前正常工作，**未紧急迁移**（API 仍向后兼容）。
- 若未来微信真废弃导致保存/删除失败，按上方迁移到 `uni.getFileSystemManager().xxx`。
