import { api } from '@/lib/api/client'
import type {
  CreateSubscriptionPayload,
  Subscription,
} from '@/lib/types/api'

export const subscriptionApi = {
  getAll: () => api.get<Subscription[]>('/api/subscription'),

  create: (payload: CreateSubscriptionPayload) =>
    api.post<Subscription>('/api/subscription', payload),
}
