import useCRoute from './useCRoute';

export default function useBreadcrumb() {
  const route = useRoute();
  const { getCurrentRoute } = useCRoute();


  function setVisible(flag = true) {
    route.meta.hideBreadcrumb = !flag;
    getCurrentRoute().meta.hideBreadcrumb = !flag;
  }

  return {
    setVisible,
  };
}
