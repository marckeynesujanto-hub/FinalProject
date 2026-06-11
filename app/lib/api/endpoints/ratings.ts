import { api } from '@/app/lib/api/client'
import type { RatingPayload, RatingResponse } from '@/app/lib/types/api'

export const ratingsApi = {
  submit: (payload: RatingPayload) =>
    api.post<RatingResponse>('/api/ratings', payload),
}
