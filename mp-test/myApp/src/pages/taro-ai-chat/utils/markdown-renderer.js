/**
 * Markdown渲染器 - 适配小程序环境
 */

export class MarkdownRenderer {
  constructor() {
    // 初始化渲染器，但不绑定未定义的方法
  }

  /**
   * 渲染Markdown内容
   */
  render(content) {
    if (!content) return '';

    // 简单的Markdown解析和渲染
    let rendered = content;

    // 处理代码块
    rendered = this.processCodeBlocks(rendered);

    // 处理行内代码
    rendered = this.processInlineCode(rendered);

    // 处理标题
    rendered = this.processHeadings(rendered);

    // 处理链接
    rendered = this.processLinks(rendered);

    // 处理图片
    rendered = this.processImages(rendered);

    // 处理列表
    rendered = this.processLists(rendered);

    // 处理表格
    rendered = this.processTables(rendered);

    // 处理引用
    rendered = this.processBlockquotes(rendered);

    // 处理强调
    rendered = this.processEmphasis(rendered);

    // 处理粗体
    rendered = this.processStrong(rendered);

    return rendered;
  }

  /**
   * 处理代码块
   */
  processCodeBlocks(content) {
    return content.replace(/```(\w+)?\n([\s\S]*?)```/g, (match, lang, code) => {
      return `<view class="code-block ${lang || ''}">\n<text class="code-content">${this.escapeHtml(code.trim())}</text>\n</view>`;
    });
  }

  /**
   * 处理行内代码
   */
  processInlineCode(content) {
    return content.replace(/`([^`]+)`/g, '<text class="inline-code">$1</text>');
  }

  /**
   * 处理标题
   */
  processHeadings(content) {
    return content
      .replace(/^### (.*$)/gim, '<view class="heading-h3">$1</view>')
      .replace(/^## (.*$)/gim, '<view class="heading-h2">$1</view>')
      .replace(/^# (.*$)/gim, '<view class="heading-h1">$1</view>');
  }

  /**
   * 处理链接
   */
  processLinks(content) {
    return content.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<text class="link" data-url="$2">$1</text>');
  }

  /**
   * 处理图片
   */
  processImages(content) {
    return content.replace(/!\[([^\]]*)\]\(([^)]+)\)/g, '<image class="markdown-image" src="$2" mode="widthFix" alt="$1" />');
  }

  /**
   * 处理列表
   */
  processLists(content) {
    // 处理无序列表
    content = content.replace(/^[\s]*[-*+]\s+(.*$)/gim, '<view class="list-item">• $1</view>');

    // 处理有序列表
    content = content.replace(/^[\s]*(\d+)\.\s+(.*$)/gim, '<view class="list-item">$1. $2</view>');

    return content;
  }

  /**
   * 处理表格
   */
  processTables(content) {
    return content.replace(/\|(.+)\|/g, (match, row) => {
      const cells = row.split('|').map((cell) => cell.trim());
      const cellElements = cells.map((cell) => `<text class="table-cell">${cell}</text>`).join('');
      return `<view class="table-row">${cellElements}</view>`;
    });
  }

  /**
   * 处理引用
   */
  processBlockquotes(content) {
    return content.replace(/^>\s+(.*$)/gim, '<view class="blockquote">$1</view>');
  }

  /**
   * 处理强调
   */
  processEmphasis(content) {
    return content.replace(/\*([^*]+)\*/g, '<text class="emphasis">$1</text>');
  }

  /**
   * 处理粗体
   */
  processStrong(content) {
    return content.replace(/\*\*([^*]+)\*\*/g, '<text class="strong">$1</text>');
  }

  /**
   * 转义HTML
   */
  escapeHtml(text) {
    const map = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#039;',
    };
    return text.replace(/[&<>"']/g, (m) => map[m]);
  }

  /**
   * 渲染为小程序组件
   */
  renderToComponent(content) {
    const rendered = this.render(content);

    return {
      type: 'rich-text',
      nodes: [{
        type: 'node',
        name: 'div',
        attrs: {
          class: 'markdown-content',
        },
        children: [{
          type: 'text',
          text: rendered,
        }],
      }],
    };
  }

  /**
   * 获取样式
   */
  getStyles() {
    return `
      .markdown-content {
        font-size: 28rpx;
        line-height: 1.6;
        color: #333;
      }
      
      .heading-h1 {
        font-size: 40rpx;
        font-weight: bold;
        margin: 20rpx 0;
        color: #000;
      }
      
      .heading-h2 {
        font-size: 36rpx;
        font-weight: bold;
        margin: 18rpx 0;
        color: #000;
      }
      
      .heading-h3 {
        font-size: 32rpx;
        font-weight: bold;
        margin: 16rpx 0;
        color: #000;
      }
      
      .code-block {
        background-color: #f6f8fa;
        border-radius: 8rpx;
        padding: 20rpx;
        margin: 16rpx 0;
        font-family: 'Courier New', monospace;
      }
      
      .code-content {
        font-size: 24rpx;
        color: #24292e;
        white-space: pre-wrap;
        word-break: break-all;
      }
      
      .inline-code {
        background-color: #f6f8fa;
        padding: 4rpx 8rpx;
        border-radius: 4rpx;
        font-family: 'Courier New', monospace;
        font-size: 24rpx;
        color: #24292e;
      }
      
      .link {
        color: #0366d6;
        text-decoration: underline;
      }
      
      .markdown-image {
        max-width: 100%;
        height: auto;
        margin: 16rpx 0;
        border-radius: 8rpx;
      }
      
      .list-item {
        margin: 8rpx 0;
        padding-left: 20rpx;
      }
      
      .table-row {
        display: flex;
        border-bottom: 1rpx solid #e1e4e8;
        padding: 12rpx 0;
      }
      
      .table-cell {
        flex: 1;
        padding: 8rpx 12rpx;
        font-size: 24rpx;
      }
      
      .blockquote {
        border-left: 4rpx solid #dfe2e5;
        padding-left: 20rpx;
        margin: 16rpx 0;
        color: #6a737d;
        font-style: italic;
      }
      
      .emphasis {
        font-style: italic;
      }
      
      .strong {
        font-weight: bold;
      }
    `;
  }
}
