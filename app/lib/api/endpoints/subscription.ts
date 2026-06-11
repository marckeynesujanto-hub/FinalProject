import { api } from '@/app/lib/api/client'
import type {
  CreateSubscriptionPayload,
  Subscription,
} from '@/app/lib/types/api'

export const subscriptionApi = {
  getAll: () => api.get<Subscription[]>('/api/subscription'),

  create: (payload: CreateSubscriptionPayload) =>
    api.post<Subscription>('/api/subscription', payload),
}
