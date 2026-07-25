import usePermissionStore from '@/store/modules/permission';

export default function useCRoute() {
  const pStore = usePermissionStore();
  const route = useRoute();

  function getCurrentRoute() {
    const routes = pStore.addRoutes;
    for (let i = 0; i < routes.length; i++) {
      const pItem = routes[i];
      if (pItem.children && pItem.children.length) {
        for (let j = 0; j < pItem.children.length; j++) {
          const cItem = pItem.children[j];
          if (cItem.name === route.name) {
          // cItem.meta.title = title
            return cItem;
          }
        }
      }
    }
  }

  return {
    getCurrentRoute,
  };
}
