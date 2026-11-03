const key = (value) => String(value || '').toLocaleLowerCase('en-US').replace(/[^a-z0-9]+/g, '')

export function mergeSquareCatalog(menu, catalogItems) {
  if (!menu || !Array.isArray(menu.categories)) return menu
  const byName = new Map((catalogItems || []).map((item) => [key(item.name), item]))

  return {
    ...menu,
    squareCatalogConnected: true,
    categories: menu.categories.map((category) => ({
      ...category,
      sections: (category.sections || []).map((section) => ({
        ...section,
        items: (section.items || []).map((item) => {
          const squareItem = byName.get(key(item.name))
          if (!squareItem) return { ...item, squareVariations: [], squareCatalogMatched: false }
          const variations = (squareItem.variations || []).filter((variation) => (
            variation.id && Number.isInteger(variation.priceCents) && variation.priceCents > 0
          ))
          const first = variations.length === 1 ? variations[0] : null
          return {
            ...item,
            price: first ? first.priceCents / 100 : null,
            variants: variations.length > 1
              ? variations.map((variation) => ({
                label: variation.name || 'Regular',
                price: variation.priceCents / 100,
                squareVariationId: variation.id,
              }))
              : [],
            squareVariationId: first ? first.id : null,
            squareVariations: variations,
            squareCatalogMatched: variations.length > 0,
          }
        }),
      })),
    })),
  }
}