import { ref } from 'vue';

/**
 * 自动计算 el-table 操作列宽度
 * 将 setActionRef 绑定到 pbsf-table-action 组件的 :ref，自动测量并设置列宽
 *
 * @param {Object} options
 * @param {number} options.padding - 额外内边距(px)，默认 32
 * @returns {{ actionColWidth: import('vue').Ref<string>,
 *   setActionRef: (el: Element | ComponentPublicInstance) => void }}
 *
 * @example
 * const { actionColWidth, setActionRef } = useActionColumnWidth();
 *
 * // 模板中（:ref 直接放在 pbsf-table-action 上，无需额外 div）：
 * // <el-table-column label="操作" :width="actionColWidth" fixed="right">
 * //   <template #default="{ row }">
 * //     <pbsf-table-action :show-num="4" :ref="setActionRef">
 * //       <pbsf-table-action-item @click="handleView(row)">查看</pbsf-table-action-item>
 * //       ...
 * //     </pbsf-table-action>
 * //   </template>
 * // </el-table-column>
 */
export default function useActionColumnWidth(options = {}) {
  const { padding = 32 } = options;

  const actionColWidth = ref('');
  const actionRef = ref(null);
  // 记录已测得的最大内容宽度，只增不减：
  // 避免按钮数不同的行各自覆盖 actionColWidth 造成列宽来回跳（抖动）
  let maxWidth = 0;

  function measure() {
    const el = actionRef.value;
    if (!el) return;

    // 临时禁止换行，测量内容自然宽度
    el.style.whiteSpace = 'nowrap';
    // eslint-disable-next-line no-void
    void el.offsetHeight;

    const items = el.querySelectorAll('.el-link, .el-divider');
    let totalWidth = 0;
    items.forEach((item) => {
      const style = window.getComputedStyle(item);
      const margin = parseFloat(style.marginLeft) + parseFloat(style.marginRight);
      totalWidth += item.offsetWidth + margin;
    });

    // 还原
    el.style.whiteSpace = '';

    // 取所有行中的最大值；测得值不大于已记录最大值时不更新，
    // 从而保证宽度单调收敛，不会因 el-table 重排重复触发测量而抖动
    if (totalWidth > maxWidth) {
      maxWidth = totalWidth;
      actionColWidth.value = String(totalWidth + padding);
    }
  }

  /**
   * 绑定到 pbsf-table-action 组件的 :ref
   * 自动从组件 DOM 向上查找父级 .cell 进行测量
   * 延迟到下一个事件循环，确保 DOM 已挂载到文档
   */
  function setActionRef(vm) {
    if (!vm) return;
    setTimeout(() => {
      const domEl = vm.$el || vm;
      // 处理 fragment 组件的 comment/text 节点，向上找到 Element 节点
      let target = domEl;
      while (target && typeof target.closest !== 'function') {
        target = target.parentElement;
      }
      const cell = target?.closest('.cell');
      if (cell) {
        actionRef.value = cell;
        measure();
      }
    }, 0);
  }

  return { actionColWidth, setActionRef };
}
