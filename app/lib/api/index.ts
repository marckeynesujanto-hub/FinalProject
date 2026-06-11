export { api, apiClient, ApiClientError } from '@/app/lib/api/client'
export type { RequestOptions } from '@/app/lib/api/client'

export { driversApi } from '@/app/lib/api/endpoints/drivers'
export { leaderboardApi } from '@/app/lib/api/endpoints/leaderboard'
export { pointsApi } from '@/app/lib/api/endpoints/points'
export { productsApi } from '@/app/lib/api/endpoints/products'
export { ratingsApi } from '@/app/lib/api/endpoints/ratings'
export { reviewsApi } from '@/app/lib/api/endpoints/reviews'
export { subscriptionApi } from '@/app/lib/api/endpoints/subscription'
export { locationsApi } from '@/app/lib/api/endpoints/locations'

import { driversApi } from '@/app/lib/api/endpoints/drivers'
import { leaderboardApi } from '@/app/lib/api/endpoints/leaderboard'
import { pointsApi } from '@/app/lib/api/endpoints/points'
import { productsApi } from '@/app/lib/api/endpoints/products'
import { ratingsApi } from '@/app/lib/api/endpoints/ratings'
import { reviewsApi } from '@/app/lib/api/endpoints/reviews'
import { subscriptionApi } from '@/app/lib/api/endpoints/subscription'
import { locationsApi } from '@/app/lib/api/endpoints/locations'

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
