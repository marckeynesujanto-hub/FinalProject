import { api } from '@/lib/api/client'
import type { Driver } from '@/lib/types/api'

export const driversApi = {
  getRandom: () => api.get<Driver>('/api/drivers'),
}
