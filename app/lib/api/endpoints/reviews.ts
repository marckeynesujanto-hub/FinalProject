import { api } from '@/app/lib/api/client'
import type { ReviewPayload, ReviewResponse } from '@/app/lib/types/api'

export const reviewsApi = {
  submit: (payload: ReviewPayload) =>
    api.post<ReviewResponse>('/api/reviews', payload),
}
