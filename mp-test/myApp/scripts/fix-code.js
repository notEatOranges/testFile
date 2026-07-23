#!/usr/bin/env node

const { execSync } = require('child_process');

console.log('🔧 开始自动修复代码问题...\n');

try {
  // 修复 ESLint 问题
  console.log('📝 修复 JavaScript/JSX 代码问题...');
  execSync('npm run lint:fix', { stdio: 'inherit' });
  console.log('✅ JavaScript/JSX 代码修复完成\n');

  // 修复 Stylelint 问题
  console.log('🎨 修复样式代码问题...');
  execSync('npm run lint:style:fix', { stdio: 'inherit' });
  console.log('✅ 样式代码修复完成\n');

  console.log('🎉 所有代码问题已自动修复！');
  console.log('💡 如果仍有问题，请手动检查并修复后重新提交。');
} catch (error) {
  console.error('❌ 自动修复过程中出现错误：', error.message);
  console.log('\n💡 请手动运行以下命令来修复代码：');
  console.log('   npm run lint:fix     # 修复 JavaScript/JSX 问题');
  console.log('   npm run lint:style:fix # 修复样式问题');
  process.exit(1);
}
