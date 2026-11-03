import { squareConfig, listSquareCatalog } from '../../utils/square.js'

export default defineEventHandler(async (event) => {
  try {
    const config = squareConfig(event)
    return {
      enabled: true,
      deliveryEnabled: config.deliveryBeta && config.deliveryFeeCents !== null && config.deliveryZips.length > 0,
      items: await listSquareCatalog(config),
    }
  } catch (error) {
    if (error.statusCode === 503) return { enabled: false, deliveryEnabled: false, items: [] }
    throw error
  }
})