import { api } from '@/lib/api/client'
import type { RatingPayload, RatingResponse } from '@/lib/types/api'

export const ratingsApi = {
  submit: (payload: RatingPayload) =>
    api.post<RatingResponse>('/api/ratings', payload),
}
