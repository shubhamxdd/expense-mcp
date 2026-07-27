import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '../services/api'

export function useApiKeys() {
  return useQuery({
    queryKey: ['apiKeys'],
    queryFn: () => api.listApiKeys(),
  })
}

export function useCreateApiKey() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (label: string) => api.createApiKey(label),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['apiKeys'] })
    },
  })
}

export function useRevokeApiKey() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => api.revokeApiKey(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['apiKeys'] })
    },
  })
}

export function useMcpClients() {
  return useQuery({
    queryKey: ['mcpClients'],
    queryFn: () => api.listMcpClients(),
  })
}

export function useRegisterMcpClient() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (assistant: 'claude' | 'chatgpt') => api.registerMcpClient(assistant),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mcpClients'] })
    },
  })
}

export function useRevokeMcpClient() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (clientId: string) => api.revokeMcpClient(clientId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mcpClients'] })
    },
  })
}
