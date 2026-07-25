import { onMounted, ref, watch, onActivated, onDeactivated } from 'vue';
import { useWindowSize } from '@vueuse/core';
import settings from '@/settings';

export default function useTable(tableRef, bottom) {
  // console.log('tableRef',tableRef)
  // console.log(tableRef.$el);

  const bottomOptions = {
    noPagination: 32,
    withPagination: 32 + 52,
  };

  const bottomCompactOptions = {
    noPagination: 10,
    withPagination: 10 + 52,
  };

  const resultOpts = settings.size === 'compact' ? bottomCompactOptions : bottomOptions;

  let lock = false;
  const tableHeight = ref();
  const { height } = useWindowSize();

  onMounted(() => {
    setTimeout(calcTableHeight);
  });

  onActivated(() => {
    // console.log("onActivated");
    lock = false;
    setTimeout(calcTableHeight);
  });

  onDeactivated(() => {
    // console.log("onDeactivated");
    lock = true;
  });

  watch(height, () => {
    setTimeout(calcTableHeight);
  });

  function calcTableHeight() {
    if (lock) return;
    // console.log("hshshsh");
    const { top } = tableRef.value?.$el?.getBoundingClientRect() || tableRef.value.getBoundingClientRect();

    let currentBottom = 0;
    if (typeof bottom === 'string') {
      currentBottom = resultOpts[bottom] || 0;
    } else {
      currentBottom = bottom;
    }
    tableHeight.value = height.value - top - currentBottom;
    // console.log(tableHeight)
  }
  return {
    tableHeight,
    calcTableHeight,
  };
}
