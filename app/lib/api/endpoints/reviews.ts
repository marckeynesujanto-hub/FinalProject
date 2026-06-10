import { api } from '@/lib/api/client'
import type { ReviewPayload, ReviewResponse } from '@/lib/types/api'

export const reviewsApi = {
  submit: (payload: ReviewPayload) =>
    api.post<ReviewResponse>('/api/reviews', payload),
}
