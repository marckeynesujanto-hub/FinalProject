import { api } from '@/app/lib/api/client'
import type { Driver } from '@/app/lib/types/api'

export const driversApi = {
  getRandom: () => api.get<Driver>('/api/drivers'),
}
