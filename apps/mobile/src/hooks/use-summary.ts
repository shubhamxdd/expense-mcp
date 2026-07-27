import { useQuery } from '@tanstack/react-query'
import { api } from '../services/api'

export function useSummary(by: 'tag' | 'month', from?: string, to?: string) {
  return useQuery({
    queryKey: ['summary', by, from, to],
    queryFn: () => api.getSummary(by, from, to),
  })
}
