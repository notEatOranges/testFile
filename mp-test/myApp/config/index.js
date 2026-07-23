import { defineConfig } from '@tarojs/cli';

import devConfig from './dev';
import prodConfig from './prod';
import { NODE_ENV } from '../env.config.js';
// https://taro-docs.jd.com/docs/next/config#defineconfig-辅助函数
export default defineConfig(async (merge) => { // , { command, mode }
  const baseConfig = {
    projectName: 'myApp',
    date: '2025-7-28',
    designWidth: 375,
    deviceRatio: {
      640: 2.34 / 2,
      750: 1,
      375: 2,
      828: 1.81 / 2,
    },
    sourceRoot: 'src',
    outputRoot: 'dist',
    plugins: ['@tarojs/plugin-html'],
    defineConstants: {
    },
    copy: {
      patterns: [
      ],
      options: {
      },
    },
    framework: 'react',
    compiler: {
      type: 'vite',
    },
    mini: {
      postcss: {
        pxtransform: {
          enable: true,
          config: {
            selectorBlackList: ['nut-'],
          },
        },
        cssModules: {
          enable: false, // 默认为 false，如需使用 css modules 功能，则设为 true
          config: {
            namingPattern: 'module', // 转换模式，取值为 global/module
            generateScopedName: '[name]__[local]___[hash:base64:5]',
          },
        },
      },
      // 彻底禁用 vendors.js 生成
      // viteChain(chain) {
      //   // 完全禁用代码分割
      //   chain.optimization.splitChunks(false)

      //   // 或者使用更具体的配置，确保不生成 vendors
      //   // chain.optimization.splitChunks({
      //   //   chunks: 'all',
      //   //   cacheGroups: {
      //   //     default: {
      //   //       minChunks: 1,
      //   //       priority: -20,
      //   //       reuseExistingChunk: true
      //   //   }
      //   // })

      //   // 确保不生成 vendors chunk
      //   chain.optimization.splitChunks({
      //     cacheGroups: {
      //       vendors: false,
      //       default: {
      //         minChunks: 1,
      //         priority: -20,
      //         reuseExistingChunk: true
      //       }
      //     }
      //   })

      //   // 添加自定义插件来处理 app.js
      //   chain.plugin('remove-vendors').use({
      //     name: 'remove-vendors',
      //     apply: 'build',
      //     enforce: 'post',
      //     generateBundle(options, bundle) {
      //       // 在构建完成后处理 app.js
      //       for (const fileName in bundle) {
      //         if (fileName === 'app.js') {
      //           const asset = bundle[fileName]
      //           if (asset.type === 'chunk' && asset.code) {
      //             // 移除对 vendors.js 的引用
      //             asset.code = asset.code.replace(/require\("\.\/vendors\.js"\),?/g, '')
      //           }
      //         }
      //       }
      //     }
      //   })
      // }
    },
    h5: {
      devServer: {
        port: 3000,
      },
      publicPath: '/',
      staticDirectory: 'static',

      miniCssExtractPluginOption: {
        ignoreOrder: true,
        filename: 'css/[name].[hash].css',
        chunkFilename: 'css/[name].[chunkhash].css',
      },
      postcss: {
        autoprefixer: {
          enable: true,
          config: {},
        },
        cssModules: {
          enable: false, // 默认为 false，如需使用 css modules 功能，则设为 true
          config: {
            namingPattern: 'module', // 转换模式，取值为 global/module
            generateScopedName: '[name]__[local]___[hash:base64:5]',
          },
        },
      },
    },
    rn: {
      appName: 'taroDemo',
      postcss: {
        cssModules: {
          enable: false, // 默认为 false，如需使用 css modules 功能，则设为 true
        },
      },
    },
  };
  // 小程序环境兼容
  const nodeEnv = NODE_ENV || 'development';

  if (nodeEnv === 'development') {
    // 本地开发构建配置（不混淆压缩）
    return merge({}, baseConfig, devConfig);
  }
  // 生产构建配置（默认开启压缩混淆等）
  return merge({}, baseConfig, prodConfig);
});
