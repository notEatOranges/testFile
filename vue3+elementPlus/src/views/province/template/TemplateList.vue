<template>
  <div class="template-list-page">
    <div class="page-header">
      <h2 class="page-title">模板管理</h2>
      <p class="page-desc">管理申报模板，支持模板的新增、编辑、删除和专家配置</p>
    </div>

    <!-- 统计卡片 -->
    <el-row :gutter="16" class="stats-row">
      <el-col :span="6">
        <el-card shadow="never" class="stat-card">
          <div class="stat-content">
            <div class="stat-icon active">
              <el-icon><Document /></el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-value">{{ templateStore.activeTemplateCount }}</div>
              <div class="stat-label">启用模板</div>
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card shadow="never" class="stat-card">
          <div class="stat-content">
            <div class="stat-icon inactive">
              <el-icon><DocumentCopy /></el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-value">{{ templateStore.inactiveTemplateCount }}</div>
              <div class="stat-label">停用模板</div>
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card shadow="never" class="stat-card">
          <div class="stat-content">
            <div class="stat-icon total">
              <el-icon><Files /></el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-value">{{ templateStore.templateList.length }}</div>
              <div class="stat-label">模板总数</div>
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card shadow="never" class="stat-card">
          <div class="stat-content">
            <div class="stat-icon expert">
              <el-icon><User /></el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-value">12</div>
              <div class="stat-label">评审专家</div>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 操作栏 -->
    <el-card shadow="never" class="search-card">
      <el-form :model="templateStore.filters" inline>
        <el-form-item label="模板名称">
          <el-input
            v-model="templateStore.filters.name"
            placeholder="请输入模板名称"
            clearable
            @clear="handleSearch"
            @keyup.enter="handleSearch"
          />
        </el-form-item>
        <el-form-item label="状态">
          <el-select
            v-model="templateStore.filters.status"
            placeholder="请选择状态"
            clearable
            @change="handleSearch"
          >
            <el-option label="已启用" value="active" />
            <el-option label="已停用" value="inactive" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" :icon="Search" @click="handleSearch">搜索</el-button>
          <el-button :icon="Refresh" @click="handleReset">重置</el-button>
          <el-button type="primary" :icon="Plus" @click="handleCreate">新增模板</el-button>
          <el-button type="success" :icon="List" @click="handleDynamicForm">动态表单</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <!-- 模板列表 -->
    <el-card shadow="never" class="table-card">
      <el-table
        v-loading="templateStore.loading"
        :data="templateStore.templateList"
        stripe
        style="width: 100%"
      >
        <el-table-column prop="name" label="模板名称" min-width="200" />
        <el-table-column prop="description" label="描述" min-width="300" show-overflow-tooltip />
        <el-table-column label="专家数量" width="100" align="center">
          <template #default="{ row }">
            <el-tag type="info">{{ row.experts?.length || 0 }}人</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="表单字段" width="100" align="center">
          <template #default="{ row }">
            <el-tag type="info">{{ row.formFields?.length || 0 }}项</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="状态" width="100" align="center">
          <template #default="{ row }">
            <StatusTag :status="row.status" :status-map="statusMap" />
          </template>
        </el-table-column>
        <el-table-column prop="createdAt" label="创建时间" width="180">
          <template #default="{ row }">
            {{ formatDate(row.createdAt) }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="280" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" :icon="Edit" @click="handleEdit(row)">编辑</el-button>
            <el-button link type="primary" :icon="CopyDocument" @click="handleCopy(row)">复制</el-button>
            <el-button
              link
              :type="row.status === 'active' ? 'warning' : 'success'"
              @click="handleToggleStatus(row)"
            >
              {{ row.status === 'active' ? '停用' : '启用' }}
            </el-button>
            <el-button link type="danger" :icon="Delete" @click="handleDelete(row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>

      <el-pagination
        v-model:current-page="templateStore.pagination.page"
        v-model:page-size="templateStore.pagination.pageSize"
        :total="templateStore.total"
        :page-sizes="[10, 20, 50, 100]"
        layout="total, sizes, prev, pager, next, jumper"
        @size-change="templateStore.fetchTemplateList()"
        @current-change="templateStore.fetchTemplateList()"
      />
    </el-card>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useTemplateStore } from '@/stores/province/template'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  Search, Refresh, Plus, Edit, Delete, CopyDocument, List,
  Document, DocumentCopy, Files, User
} from '@element-plus/icons-vue'
import StatusTag from '@/components/StatusTag.vue'
import { formatDate } from '@/utils/format'

const router = useRouter()
const templateStore = useTemplateStore()

const statusMap = {
  active: { label: '已启用', type: 'success' },
  inactive: { label: '已停用', type: 'info' }
}

// 搜索
const handleSearch = () => {
  templateStore.fetchTemplateList()
}

// 重置
const handleReset = () => {
  templateStore.resetFilters()
  templateStore.fetchTemplateList()
}

// 新增
const handleCreate = () => {
  router.push('/province/template/design')
}

// 动态表单设计器
const handleDynamicForm = () => {
  window.location.href = '/province/form/designer'
}

// 编辑
const handleEdit = (row) => {
  templateStore.setCurrentTemplate(row)
  router.push(`/province/template/design?id=${row.id}`)
}

// 复制
const handleCopy = async (row) => {
  try {
    await ElMessageBox.confirm(`确定要复制模板"${row.name}"吗？`, '提示', {
      type: 'warning'
    })

    const result = await templateStore.copy(row.id)
    if (result.success) {
      ElMessage.success('复制成功')
    } else {
      ElMessage.error(result.message || '复制失败')
    }
  } catch {
    // 用户取消
  }
}

// 切换状态
const handleToggleStatus = async (row) => {
  const action = row.status === 'active' ? '停用' : '启用'
  try {
    await ElMessageBox.confirm(`确定要${action}模板"${row.name}"吗？`, '提示', {
      type: 'warning'
    })

    const result = await templateStore.toggleStatus(row.id, row.status === 'active' ? 'inactive' : 'active')
    if (result.success) {
      ElMessage.success(`${action}成功`)
    } else {
      ElMessage.error(result.message || `${action}失败`)
    }
  } catch {
    // 用户取消
  }
}

// 删除
const handleDelete = async (row) => {
  try {
    await ElMessageBox.confirm(`确定要删除模板"${row.name}"吗？此操作不可恢复！`, '警告', {
      type: 'warning',
      confirmButtonText: '确定',
      cancelButtonText: '取消'
    })

    const result = await templateStore.remove(row.id)
    if (result.success) {
      ElMessage.success('删除成功')
    } else {
      ElMessage.error(result.message || '删除失败')
    }
  } catch {
    // 用户取消
  }
}

onMounted(() => {
  templateStore.fetchTemplateList()
})
</script>

<style scoped lang="scss">
.template-list-page {
  .stats-row {
    margin-bottom: 16px;
  }

  .stat-card {
    .stat-content {
      display: flex;
      align-items: center;
      gap: 16px;
    }

    .stat-icon {
      width: 48px;
      height: 48px;
      border-radius: 8px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 24px;

      &.active {
        background: #e7f8e8;
        color: #52c41a;
      }

      &.inactive {
        background: #f5f5f5;
        color: #999;
      }

      &.total {
        background: #e6f7ff;
        color: #1890ff;
      }

      &.expert {
        background: #fff7e6;
        color: #fa8c16;
      }
    }

    .stat-info {
      .stat-value {
        font-size: 24px;
        font-weight: bold;
        color: #333;
        line-height: 1;
      }

      .stat-label {
        font-size: 12px;
        color: #999;
        margin-top: 4px;
      }
    }
  }

  .search-card {
    margin-bottom: 16px;
  }

  .table-card {
    .el-pagination {
      margin-top: 16px;
      justify-content: flex-end;
    }
  }
}
</style>
