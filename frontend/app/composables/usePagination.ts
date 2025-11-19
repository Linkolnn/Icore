import { ref, computed, type Ref } from 'vue'

interface PaginationOptions<T> {
  fetchFunction: (cursor?: string) => Promise<{
    items: T[]
    hasMore: boolean
    nextCursor?: string
  }>
  initialLimit?: number
}

export function usePagination<T>(options: PaginationOptions<T>) {
  const { fetchFunction, initialLimit = 50 } = options
  
  // State
  const items: Ref<T[]> = ref([])
  const loading = ref(false)
  const hasMore = ref(true)
  const nextCursor = ref<string | undefined>(undefined)
  const error = ref<string | null>(null)
  
  // Computed
  const isEmpty = computed(() => items.value.length === 0 && !loading.value)
  const canLoadMore = computed(() => hasMore.value && !loading.value)
  
  // Load initial data
  async function loadInitial() {
    if (loading.value) return
    
    loading.value = true
    error.value = null
    
    try {
      const result = await fetchFunction()
      items.value = result.items
      hasMore.value = result.hasMore
      nextCursor.value = result.nextCursor
    } catch (err: any) {
      error.value = err.message || 'Failed to load data'
    } finally {
      loading.value = false
    }
  }
  
  // Load more data
  async function loadMore() {
    if (!canLoadMore.value || !nextCursor.value) return
    
    loading.value = true
    error.value = null
    
    try {
      const result = await fetchFunction(nextCursor.value)
      
      // Append new items
      items.value = [...items.value, ...result.items]
      hasMore.value = result.hasMore
      nextCursor.value = result.nextCursor
    } catch (err: any) {
      error.value = err.message || 'Failed to load more'
    } finally {
      loading.value = false
    }
  }
  
  // Reset pagination
  function reset() {
    items.value = []
    hasMore.value = true
    nextCursor.value = undefined
    error.value = null
    loading.value = false
  }
  
  // Prepend item (for new messages)
  function prependItem(item: T) {
    items.value = [item, ...items.value]
  }
  
  // Append item
  function appendItem(item: T) {
    items.value = [...items.value, item]
  }
  
  // Update item
  function updateItem(id: string, updater: (item: T) => T) {
    const index = items.value.findIndex((item: any) => item._id === id)
    if (index !== -1) {
      const newItems = [...items.value]
      const currentItem = newItems[index]
      if (currentItem) {
        newItems[index] = updater(currentItem)
        items.value = newItems
      }
    }
  }
  
  // Remove item
  function removeItem(id: string) {
    items.value = items.value.filter((item: any) => item._id !== id)
  }
  
  return {
    // State
    items,
    loading,
    hasMore,
    error,
    isEmpty,
    canLoadMore,
    
    // Actions
    loadInitial,
    loadMore,
    reset,
    prependItem,
    appendItem,
    updateItem,
    removeItem
  }
}
