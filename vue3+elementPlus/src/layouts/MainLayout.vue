<template>
  <el-container class="main-layout">
    <!-- 左侧菜单 -->
    <el-aside :width="isCollapse ? '64px' : '200px'" class="layout-aside">
      <div class="logo-container">
        <template v-if="!isCollapse">
          <span class="logo-text">运动促进健康</span>
        </template>
        <template v-else>
          <span class="logo-icon">运</span>
        </template>
      </div>

      <el-menu
        :default-active="activeMenu"
        :collapse="isCollapse"
        :unique-opened="true"
        router
        class="layout-menu"
      >
        <!-- 根据角色渲染菜单 -->
        <template v-for="menu in menuList" :key="menu.index">
          <el-sub-menu v-if="menu.children" :index="menu.index">
            <template #title>
              <el-icon><component :is="menu.icon" /></el-icon>
              <span>{{ menu.title }}</span>
            </template>
            <el-menu-item
              v-for="child in menu.children"
              :key="child.index"
              :index="child.index"
            >
              <el-icon><component :is="child.icon" /></el-icon>
              <span>{{ child.title }}</span>
            </el-menu-item>
          </el-sub-menu>
          <el-menu-item v-else :index="menu.index">
            <el-icon><component :is="menu.icon" /></el-icon>
            <span>{{ menu.title }}</span>
          </el-menu-item>
        </template>
      </el-menu>
    </el-aside>

    <!-- 右侧内容区 -->
    <el-container class="layout-content">
      <!-- 顶部导航栏 -->
      <el-header class="layout-header">
        <div class="header-left">
          <el-button
            :icon="isCollapse ? Expand : Fold"
            circle
            @click="toggleCollapse"
          />
          <el-breadcrumb separator="/">
            <el-breadcrumb-item
              v-for="item in breadcrumbs"
              :key="item.path"
              :to="item.path"
            >
              {{ item.title }}
            </el-breadcrumb-item>
          </el-breadcrumb>
        </div>
        <div class="header-right">
          <el-button :icon="Refresh" circle @click="handleRefresh" />
          <el-dropdown @command="handleUserCommand">
            <div class="user-info">
              <el-avatar :size="32" :src="authStore.avatar || ''">
                <el-icon><UserFilled /></el-icon>
              </el-avatar>
              <span class="user-name">{{ authStore.displayName }}</span>
              <el-tag v-if="currentRole" size="small" class="role-tag">
                {{ currentRole.name }}
              </el-tag>
            </div>
            <template #dropdown>
              <el-dropdown-menu>
                <!-- 角色切换 -->
                <el-dropdown-item v-if="authStore.roles.length > 1" divided>
                  <div class="role-switch">
                    <span class="role-label">切换角色：</span>
                    <el-select
                      :model-value="currentRole?.value"
                      size="small"
                      style="width: 120px"
                      @change="handleRoleSwitch"
                    >
                      <el-option
                        v-for="role in roleOptions"
                        :key="role.value"
                        :label="role.name"
                        :value="role.value"
                      />
                    </el-select>
                  </div>
                </el-dropdown-item>
                <el-dropdown-item @click="handlePersonal">
                  <el-icon><User /></el-icon>
                  个人设置
                </el-dropdown-item>
                <el-dropdown-item divided @click="handleLogout">
                  <el-icon><SwitchButton /></el-icon>
                  退出登录
                </el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </div>
      </el-header>

      <!-- 主内容区 -->
      <el-main class="layout-main">
        <router-view v-slot="{ Component }">
          <transition name="fade-transform" mode="out-in">
            <component :is="Component" />
          </transition>
        </router-view>
      </el-main>
    </el-container>
  </el-container>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { ROLES, ROLE_NAMES, logout, getUser, setRoles, getDefaultPath } from '@/utils/auth'
import { ElMessageBox, ElMessage } from 'element-plus'
import {
  Setting, User, Lock, Menu, Document, Edit, DocumentChecked,
  View, Memo, Operation, Coin, Wallet, Monitor, DataAnalysis,
  List, PieChart, Calendar, Notebook, Bell, Promotion,
  Expand, Fold, Refresh, UserFilled, SwitchButton,
  Tickets, Grid, Management, OfficeBuilding, Check, Close, Warning
} from '@element-plus/icons-vue'

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()

// 侧边栏折叠状态
const isCollapse = ref(false)

// 当前激活的菜单
const activeMenu = computed(() => route.path)

// 面包屑
const breadcrumbs = computed(() => {
  const matched = route.matched.filter(item => item.meta && item.meta.title)
  return matched.map(item => ({
    path: item.path,
    title: item.meta.title
  }))
})

// 角色选项
const roleOptions = computed(() => {
  return authStore.roles.map(role => ({
    value: role,
    name: ROLE_NAMES[role] || role
  }))
})

// 当前角色
const currentRole = computed(() => {
  if (authStore.roles.length === 0) return null
  const firstRole = authStore.roles[0]
  return {
    value: firstRole,
    name: ROLE_NAMES[firstRole] || firstRole
  }
})

// 菜单配置
const menuConfig = {
  // 省体育局群体端菜单
  province: [
    {
      index: 'province-template',
      title: '模板管理',
      icon: Document,
      children: [
        { index: '/province/template', title: '模板列表', icon: List },
        { index: '/province/template/design', title: '模板设计', icon: Edit }
      ]
    },
    {
      index: 'province-declaration',
      title: '申报设置',
      icon: Setting,
      children: [
        { index: '/province/declaration', title: '参数配置', icon: Management }
      ]
    },
    {
      index: 'province-preliminary',
      title: '资格初审',
      icon: DocumentChecked,
      children: [
        { index: '/province/preliminary', title: '初审卡片', icon: Grid },
        { index: '/province/preliminary/list', title: '初审列表', icon: List }
      ]
    },
    {
      index: 'province-review',
      title: '书面评审',
      icon: Memo,
      children: [
        { index: '/province/review', title: '评审卡片', icon: Grid },
        { index: '/province/review/list', title: '评审列表', icon: List }
      ]
    },
    {
      index: 'province-inspection',
      title: '实地考察',
      icon: View,
      children: [
        { index: '/province/inspection', title: '考察卡片', icon: Grid },
        { index: '/province/inspection/list', title: '考察列表', icon: List }
      ]
    },
    {
      index: 'province-summary',
      title: '评分汇总',
      icon: PieChart,
      children: [
        { index: '/province/summary', title: '汇总列表', icon: List }
      ]
    }
  ],
  // 机构端菜单
  organization: [
    {
      index: 'org-home',
      title: '首页',
      icon: Monitor,
      children: [
        { index: '/organization/home', title: '机构首页', icon: Grid }
      ]
    },
    {
      index: 'org-application',
      title: '补助申请',
      icon: Tickets,
      children: [
        { index: '/organization/guide', title: '申请指南', icon: Document },
        { index: '/organization/application', title: '申请表单', icon: Edit },
        { index: '/organization/application/detail', title: '申请详情', icon: View }
      ]
    }
  ],
  // 市体育部门端菜单
  city: [
    {
      index: 'city-pending',
      title: '待审核',
      icon: DocumentChecked,
      children: [
        { index: '/city/pending', title: '审核列表', icon: List }
      ]
    },
    {
      index: 'city-submit',
      title: '待报送',
      icon: Promotion,
      children: [
        { index: '/city/submit', title: '报送卡片', icon: Grid },
        { index: '/city/submit/list', title: '报送列表', icon: List }
      ]
    },
    {
      index: 'city-submitted',
      title: '已报送',
      icon: Check,
      children: [
        { index: '/city/submitted', title: '报送列表', icon: List }
      ]
    },
    {
      index: 'city-rejected',
      title: '已驳回',
      icon: Close,
      children: [
        { index: '/city/rejected', title: '驳回列表', icon: List }
      ]
    },
    {
      index: 'city-failed',
      title: '不通过',
      icon: Warning,
      children: [
        { index: '/city/failed', title: '不通过列表', icon: List }
      ]
    }
  ],
  // 专家端菜单
  expert: [
    {
      index: 'expert-written',
      title: '书面评审',
      icon: Memo,
      children: [
        { index: '/expert/written-review', title: '评审卡片', icon: Grid },
        { index: '/expert/written-review/list', title: '评审列表', icon: List },
        { index: '/expert/written-review/form', title: '评审打分', icon: Edit }
      ]
    },
    {
      index: 'expert-onsite',
      title: '实地考察',
      icon: OfficeBuilding,
      children: [
        { index: '/expert/on-site-review', title: '城市列表', icon: Grid },
        { index: '/expert/on-site-review/orgs', title: '机构列表', icon: List },
        { index: '/expert/on-site-review/form', title: '考察评分', icon: Edit }
      ]
    }
  ]
}

// 根据角色获取菜单
const menuList = computed(() => {
  const roles = authStore.roles
  let menus = []

  if (roles.includes(ROLES.PROVINCE)) {
    menus = [...menus, ...menuConfig.province]
  }
  if (roles.includes(ROLES.ORGANIZATION)) {
    menus = [...menus, ...menuConfig.organization]
  }
  if (roles.includes(ROLES.CITY)) {
    menus = [...menus, ...menuConfig.city]
  }
  if (roles.includes(ROLES.EXPERT)) {
    menus = [...menus, ...menuConfig.expert]
  }

  return menus
})

// 切换折叠状态
const toggleCollapse = () => {
  isCollapse.value = !isCollapse.value
}

// 刷新页面
const handleRefresh = () => {
  router.go(0)
}

// 角色切换
const handleRoleSwitch = async (role) => {
  try {
    await ElMessageBox.confirm(
      '切换角色将重新加载页面，是否继续？',
      '提示',
      { type: 'warning' }
    )

    // 更新角色
    setRoles([role])
    const user = getUser()

    // 更新 store
    authStore.setRoles([role])
    authStore.setUser(user)

    // 跳转到对应角色的首页
    const defaultPath = getDefaultPath([role])
    window.location.href = window.location.origin + defaultPath
  } catch {
    // 用户取消
  }
}

// 个人设置
const handlePersonal = () => {
  ElMessage.info('个人设置功能开发中')
}

// 退出登录
const handleLogout = async () => {
  try {
    await ElMessageBox.confirm('确定要退出登录吗？', '提示', {
      type: 'warning'
    })

    await authStore.logout()
    router.push('/login')
    ElMessage.success('已退出登录')
  } catch {
    // 用户取消
  }
}

// 处理用户下拉菜单命令
const handleUserCommand = (command) => {
  console.log('命令:', command)
}
</script>

<style scoped lang="scss">
.main-layout {
  height: 100vh;
}

.layout-aside {
  background: #304156;
  transition: width 0.3s;
  overflow: hidden;

  .logo-container {
    height: 60px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: #2b3a4a;

    .logo-text {
      font-size: 16px;
      font-weight: bold;
      color: #fff;
    }

    .logo-icon {
      width: 32px;
      height: 32px;
      background: var(--el-color-primary);
      border-radius: 4px;
      display: flex;
      align-items: center;
      justify-content: center;
      color: #fff;
      font-weight: bold;
    }
  }

  .layout-menu {
    border-right: none;
    background: #304156;

    &:not(.el-menu--collapse) {
      width: 200px;
    }

    :deep(.el-menu-item),
    :deep(.el-sub-menu__title) {
      color: #bfcbd9;

      &:hover {
        background: #263445;
      }
    }

    :deep(.el-menu-item.is-active) {
      color: var(--el-color-primary);
      background: #263445;
    }
  }
}

.layout-content {
  display: flex;
  flex-direction: column;
  height: 100%;
  overflow: hidden;
}

.layout-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: #fff;
  border-bottom: 1px solid #e6e6e6;
  padding: 0 20px;
  height: 60px;
  flex-shrink: 0;

  .header-left {
    display: flex;
    align-items: center;
    gap: 16px;
  }

  .header-right {
    display: flex;
    align-items: center;
    gap: 16px;

    .user-info {
      display: flex;
      align-items: center;
      gap: 8px;
      cursor: pointer;
      padding: 4px 8px;
      border-radius: 4px;
      transition: background 0.2s;

      &:hover {
        background: #f5f5f5;
      }

      .user-name {
        font-size: 14px;
        color: #333;
      }

      .role-tag {
        font-size: 12px;
      }
    }
  }
}

.layout-main {
  background: #f0f2f5;
  padding: 20px;
  overflow-y: auto;
  flex: 1;
  min-height: 0;
}

// 角色切换
.role-switch {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 4px 0;

  .role-label {
    font-size: 12px;
    color: #666;
  }
}

// 页面切换动画
.fade-transform-enter-active,
.fade-transform-leave-active {
  transition: all 0.3s;
}

.fade-transform-enter-from {
  opacity: 0;
  transform: translateX(-30px);
}

.fade-transform-leave-to {
  opacity: 0;
  transform: translateX(30px);
}
</style>
