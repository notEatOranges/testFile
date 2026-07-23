/**
 * Taro小程序AI对话模块类型定义
 */

export class ChatItem {
  constructor(id, content, isAnswer = false) {
    this.id = id;
    this.content = content;
    this.isAnswer = isAnswer;
    this.message_files = [];
    this.agent_thoughts = [];
    this.citation = [];
    this.more = null;
    this.feedback = null;
    this.annotation = null;
    this.isOpeningStatement = false;
    this.suggestedQuestions = [];
    this.conversationId = null;
    this.parentMessageId = null;
    this.siblingCount = 0;
    this.siblingIndex = 0;
    this.prevSibling = null;
    this.nextSibling = null;
  }
}

export class ChatConfig {
  constructor(config = {}) {
    this.opening_statement = config.opening_statement || '';
    this.suggested_questions = config.suggested_questions || [];
    this.suggested_questions_after_answer = config.suggested_questions_after_answer || { enabled: false };
    this.supportFeedback = config.supportFeedback || true;
    this.supportAnnotation = config.supportAnnotation || false;
    this.questionEditEnable = config.questionEditEnable || false;
    this.system_parameters = config.system_parameters || {
      audio_file_size_limit: 10,
      file_size_limit: 20,
      image_file_size_limit: 5,
      video_file_size_limit: 50,
      workflow_file_upload_limit: 10,
    };
  }
}

// ChatUtils 类已移除，相关功能已迁移到 utils/helpers.js
