// src/hooks/use-chats-query.ts
import { useEffect } from 'react'
import {
  useMutation,
  useQuery,
  useQueryClient,
  type UseMutationResult,
  type UseQueryResult,
} from '@tanstack/react-query'
import { api } from '@/lib/api/api-client'
import { toast } from 'sonner'
import { useNotificationStore } from '@/store'
import { Chat, UserChat } from '@prisma/client'

// Keys for chat queries
export const chatKeys = {
  all: ['chats'] as const,
  lists: () => [...chatKeys.all, 'list'] as const,
  list: () => [...chatKeys.lists()] as const,
  details: () => [...chatKeys.all, 'detail'] as const,
  detail: (id: string) => [...chatKeys.details(), id] as const,
  messages: (chatId: string) => [...chatKeys.detail(chatId), 'messages'] as const,
}

// Get all chats
export function useChatsQuery(options?: { enabled?: boolean }) {
  const setHasNewMessages = useNotificationStore(s => s.setHasNewMessages)

  const query = useQuery({
    queryKey: chatKeys.list(),
    queryFn: () => api.chats.getAll(),
    enabled: options?.enabled !== false,
  })

  useEffect(() => {
    if (query.isSuccess && query.data) {
      const hasUnread = (query.data.chats as UserChat[]).some(
        (chat) => !!chat.hasUnread
      );
      setHasNewMessages(hasUnread)
    }
  }, [query.isSuccess, query.data, setHasNewMessages])

  return query
}

// Get single chat with messages
export function useChatQuery(
  id: string,
  options?: { enabled?: boolean }
) {
  return useQuery({
    queryKey: chatKeys.detail(id),
    queryFn: () => api.chats.getById(id),
    enabled: options?.enabled !== false && !!id,
  })
}

// Create chat mutation
export function useCreateChatMutation() {
  const queryClient = useQueryClient()
  const mutation: UseMutationResult<
    Awaited<ReturnType<typeof api.chats.create>>,
    unknown,
    string
  > = useMutation({
    mutationFn: (userId: string) => api.chats.create(userId),
  })

  useEffect(() => {
    if (mutation.isSuccess && mutation.data) {
      const chat = mutation.data
      queryClient.invalidateQueries({ queryKey: chatKeys.lists() })
      queryClient.setQueryData(chatKeys.detail(chat.id), chat)

      const participantName =
        chat.participants?.[0]?.name ||
        chat.participants?.[0]?.username ||
        'user'
      toast.success(`Started a conversation with ${participantName}`)
    }
  }, [mutation.isSuccess, mutation.data, queryClient])

  useEffect(() => {
    if (mutation.isError) {
      const err = mutation.error as any
      toast.error(err.message || 'Failed to start conversation')
    }
  }, [mutation.isError, mutation.error])

  return mutation
}

// Send message mutation
export function useSendMessageMutation() {
  const queryClient = useQueryClient()
  type Vars = { chatId: string; content: string }
  const mutation: UseMutationResult<
    Awaited<ReturnType<typeof api.chats.sendMessage>>,
    unknown,
    Vars
  > = useMutation({
    mutationFn: ({ chatId, content }: Vars) =>
      api.chats.sendMessage(chatId, content),
  })

  useEffect(() => {
    if (mutation.isSuccess && mutation.data && mutation.variables) {
      const msg = mutation.data
      const { chatId, content } = mutation.variables

      // Update single‐chat cache
      const currentChat = queryClient.getQueryData<any>(
        chatKeys.detail(chatId)
      )
      if (currentChat) {
        queryClient.setQueryData(chatKeys.detail(chatId), {
          ...currentChat,
          messages: [...(currentChat.messages ?? []), msg],
        })
      }

      // Update chats list
      const listCache = queryClient.getQueryData<any>(chatKeys.list())
      if (listCache) {
        queryClient.setQueryData(chatKeys.list(), {
          ...listCache,
          chats: listCache.chats.map((c: any) =>
            c.id === chatId
              ? {
                  ...c,
                  lastMessage: {
                    content,
                    senderId: msg.senderId,
                    createdAt: new Date().toISOString(),
                  },
                }
              : c
          ),
        })
      }
    }
  }, [
    mutation.isSuccess,
    mutation.data,
    mutation.variables,
    queryClient,
  ])

  useEffect(() => {
    if (mutation.isError) {
      const err = mutation.error as any
      toast.error(err.message || 'Failed to send message')
    }
  }, [mutation.isError, mutation.error])

  return mutation
}

// Mark chat as read mutation
export function useMarkChatAsReadMutation() {
  const queryClient = useQueryClient()
  const setHasNewMessages = useNotificationStore(s => s.setHasNewMessages)

  const mutation: UseMutationResult<
    Awaited<ReturnType<typeof api.chats.markAsRead>>,
    unknown,
    string
  > = useMutation({
    mutationFn: (chatId: string) => api.chats.markAsRead(chatId),
  })

  useEffect(() => {
    if (mutation.isSuccess && mutation.variables) {
      const chatId = mutation.variables

      // Update messages read‐state
      queryClient.setQueriesData(
        { queryKey: chatKeys.detail(chatId) },
        (oldData: any) => {
          if (!oldData) return oldData
          return {
            ...oldData,
            messages: oldData.messages.map((m: any) => ({
              ...m,
              read: true,
            })),
          }
        }
      )

      // Update unreadCount in chats list
      queryClient.setQueriesData(
        { queryKey: chatKeys.list() },
        (oldData: any) => {
          if (!oldData) return oldData
          const updated = oldData.chats.map((c: any) =>
            c.id === chatId ? { ...c, unreadCount: 0 } : c
          )
          const hasUnread = updated.some(
            (c: any) => c.unreadCount && c.unreadCount > 0
          )
          setHasNewMessages(hasUnread)
          return { ...oldData, chats: updated }
        }
      )
    }
  }, [
    mutation.isSuccess,
    mutation.variables,
    queryClient,
    setHasNewMessages,
  ])

  useEffect(() => {
    if (mutation.isError) {
      console.error('Error marking chat as read:', mutation.error)
    }
  }, [mutation.isError, mutation.error])

  return mutation
}
