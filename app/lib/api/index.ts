export { api, apiClient, ApiClientError } from '@/lib/api/client'
export type { RequestOptions } from '@/lib/api/client'

export { driversApi } from '@/lib/api/endpoints/drivers'
export { leaderboardApi } from '@/lib/api/endpoints/leaderboard'
export { pointsApi } from '@/lib/api/endpoints/points'
export { productsApi } from '@/lib/api/endpoints/products'
export { ratingsApi } from '@/lib/api/endpoints/ratings'
export { reviewsApi } from '@/lib/api/endpoints/reviews'
export { subscriptionApi } from '@/lib/api/endpoints/subscription'
export { locationsApi } from '@/lib/api/endpoints/locations'

import { driversApi } from '@/lib/api/endpoints/drivers'
import { leaderboardApi } from '@/lib/api/endpoints/leaderboard'
import { pointsApi } from '@/lib/api/endpoints/points'
import { productsApi } from '@/lib/api/endpoints/products'
import { ratingsApi } from '@/lib/api/endpoints/ratings'
import { reviewsApi } from '@/lib/api/endpoints/reviews'
import { subscriptionApi } from '@/lib/api/endpoints/subscription'
import { locationsApi } from '@/lib/api/endpoints/locations'

/** Unified API facade for convenient imports: `import { trashInApi } from '@/lib/api'` */
export const trashInApi = {
  drivers: driversApi,
  leaderboard: leaderboardApi,
  points: pointsApi,
  products: productsApi,
  ratings: ratingsApi,
  reviews: reviewsApi,
  subscription: subscriptionApi,
  locations: locationsApi,
}
