import { delay } from './index'

// 模拟用户数据
const mockUsers = [
  {
    id: '1',
    username: 'admin',
    name: '系统管理员',
    avatar: 'https://cube.elemecdn.com/0/88/03b0d39583f48206768a7534e55bcpng.png',
    roles: ['province']
  },
  {
    id: '2',
    username: 'org',
    name: '机构用户',
    avatar: 'https://cube.elemecdn.com/0/88/03b0d39583f48206768a7534e55bcpng.png',
    roles: ['organization']
  },
  {
    id: '3',
    username: 'city',
    name: '市局用户',
    avatar: 'https://cube.elemecdn.com/0/88/03b0d39583f48206768a7534e55bcpng.png',
    roles: ['city']
  },
  {
    id: '4',
    username: 'expert',
    name: '专家用户',
    avatar: 'https://cube.elemecdn.com/0/88/03b0d39583f48206768a7534e55bcpng.png',
    roles: ['expert']
  }
]

// 登录接口
export const mockLogin = async (params) => {
  await delay(500)

  const { username, password, role } = params

  // 模拟验证（演示用，任意用户名密码都可以）
  const user = mockUsers.find(u => u.roles.includes(role)) || {
    id: Date.now().toString(),
    username,
    name: username,
    avatar: 'https://cube.elemecdn.com/0/88/03b0d39583f48206768a7534e55bcpng.png',
    roles: [role]
  }

  return {
    code: 200,
    message: '登录成功',
    data: {
      token: 'mock_token_' + Date.now(),
      user: {
        id: user.id,
        username: user.username,
        name: user.name,
        avatar: user.avatar
      },
      roles: user.roles
    }
  }
}

// 登出接口
export const mockLogout = async () => {
  await delay(200)
  return {
    code: 200,
    message: '登出成功'
  }
}

// 获取用户信息接口
export const mockGetUserInfo = async () => {
  await delay(200)
  return {
    code: 200,
    message: 'success',
    data: {
      user: mockUsers[0],
      roles: mockUsers[0].roles
    }
  }
}

// 导出 Mock API 处理函数
export const authMockHandlers = {
  '/api/auth/login': async (url, options) => {
    const params = JSON.parse(options.body)
    const result = await mockLogin(params)
    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    })
  },
  '/api/auth/logout': async () => {
    const result = await mockLogout()
    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    })
  },
  '/api/auth/user-info': async () => {
    const result = await mockGetUserInfo()
    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    })
  }
}
