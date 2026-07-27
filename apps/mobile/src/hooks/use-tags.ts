import { useQuery } from '@tanstack/react-query'
import { api } from '../services/api'

export function useTags() {
  return useQuery({
    queryKey: ['tags'],
    queryFn: () => api.listTags(),
    staleTime: 60_000,
  })
}
