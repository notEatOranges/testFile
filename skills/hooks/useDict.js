import { ref, toRefs } from 'vue';
import { getDicts } from '@/api/dict/data';

/**
 * 获取字典数据
 */
export default function useDict(...args) {
  const res = ref({});
  return (() => {
    args.forEach((d) => {
      res.value[d] = [];
      getDicts(d).then((resp) => {
        // eslint-disable-next-line max-nested-callbacks
        res.value[d] = resp.data.map((p) => ({ label: p.dictLabel, value: p.dictValue, elTagType: p.listClass, sort: p.dictSort, remark: p.remark }));
      });
    });
    return toRefs(res.value);
  })();
}
