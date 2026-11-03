export function useSquareCatalog() {
  return useAsyncData(
    'square-catalog',
    () => $fetch('/api/square/catalog'),
    {
      server: false,
      default: () => ({ enabled: false, deliveryEnabled: false, items: [] }),
    },
  )
}