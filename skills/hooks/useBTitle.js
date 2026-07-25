import { ref, watch, nextTick } from 'vue';
import useCRoute from './useCRoute';
import useTagsViewStore from '@/store/modules/tagsView';
import { useRoute } from 'vue-router';

export default function useBTitle() {
  const tStore = useTagsViewStore();
  const route = useRoute();
  const { getCurrentRoute } = useCRoute();


  function getCurrentTag() {
    const routes = tStore.visitedViews;
    for (let i = 0; i < routes.length; i++) {
      const item = routes[i];
      if (item.name === route.name) {
        // cItem.meta.title = title
        return item;
      }
    }
  }

  function changeLastTitle(title) {
    nextTick(() => {
      const r = getCurrentRoute();
      const t = getCurrentTag();
      r && (r.meta.title = title);
      t && (t.title = title);
      t && (t.meta.title = title);
    });
  }
  const originTitle = getCurrentRoute()?.meta?.title;
  const title = ref(originTitle);

  watch(
    title,
    (t, o) => {
      if (t && t !== o) {
        changeLastTitle(t);
      }
    },
    { immediate: true },
  );

  return title;
}
