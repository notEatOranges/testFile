export default defineAppConfig({
  pages: [
    'pages/taro-ai-chat/example',
    'pages/index/index',
  ],
  window: {
    backgroundTextStyle: 'light',
    navigationBarBackgroundColor: '#fff',
    navigationBarTitleText: 'AI助手',
    navigationBarTextStyle: 'black',
  },
  requiredBackgroundModes: ['audio'],
  permission: {
    'scope.record': {
      desc: '需要使用录音功能进行语音输入',
    },
  },
});
