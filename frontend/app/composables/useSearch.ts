import { ref, computed, watch } from 'vue'
import { useDebounceFn } from '@vueuse/core'

interface SearchResult {
  _id: string
  text: string
  sender: any
  chat: any
  createdAt: string
}

interface UseSearchOptions {
  chatId?: string
  debounce?: number
  minLength?: number
}

export function useSearch(options: UseSearchOptions = {}) {
  const { chatId, debounce = 500, minLength = 2 } = options
  
  // State
  const query = ref('')
  const results = ref<SearchResult[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)
  const total = ref(0)
  const highlights = ref<Map<string, string[]>>(new Map())
  
  // Computed
  const hasResults = computed(() => results.value.length > 0)
  const isSearching = computed(() => loading.value)
  const canSearch = computed(() => query.value.length >= minLength)
  
  // Search function
  async function performSearch() {
    if (!canSearch.value) {
      results.value = []
      total.value = 0
      return
    }
    
    loading.value = true
    error.value = null
    
    try {
      const params = new URLSearchParams({
        q: query.value,
        ...(chatId && { chatId }),
        limit: '20'
      })
      
      const response = await $fetch<{
        messages: SearchResult[]
        total: number
        highlights?: Record<string, string[]>
      }>(`/api/messages/search?${params}`)
      
      results.value = response.messages || []
      total.value = response.total || 0
      
      // Convert highlights to Map if it's an object
      if (response.highlights) {
        highlights.value = new Map(Object.entries(response.highlights))
      }
    } catch (err: any) {
      error.value = err.message || 'Search failed'
    } finally {
      loading.value = false
    }
  }
  
  // Debounced search
  const debouncedSearch = useDebounceFn(performSearch, debounce)
  
  // Watch query changes
  watch(query, () => {
    if (!query.value) {
      results.value = []
      total.value = 0
      highlights.value.clear()
      return
    }
    
    if (canSearch.value) {
      debouncedSearch()
    }
  })
  
  // Clear search
  function clearSearch() {
    query.value = ''
    results.value = []
    total.value = 0
    highlights.value.clear()
    error.value = null
  }
  
  // Highlight text
  function highlightText(text: string, messageId?: string): string {
    if (!query.value) return text
    
    // Check if we have specific highlights for this message
    if (messageId && highlights.value.has(messageId)) {
      const messageHighlights = highlights.value.get(messageId)
      if (messageHighlights && messageHighlights.length > 0) {
        let highlightedText = text
        messageHighlights.forEach(match => {
          const regex = new RegExp(`(${escapeRegExp(match)})`, 'gi')
          highlightedText = highlightedText.replace(regex, '<mark>$1</mark>')
        })
        return highlightedText
      }
    }
    
    // Default highlighting
    const regex = new RegExp(`(${escapeRegExp(query.value)})`, 'gi')
    return text.replace(regex, '<mark>$1</mark>')
  }
  
  // Jump to message
  async function jumpToMessage(messageId: string) {
    // This will be implemented by the parent component
    // as it needs access to the message list
    return messageId
  }
  
  return {
    // State
    query,
    results,
    loading,
    error,
    total,
    highlights,
    
    // Computed
    hasResults,
    isSearching,
    canSearch,
    
    // Methods
    performSearch,
    clearSearch,
    highlightText,
    jumpToMessage
  }
}

// Utility function to escape RegExp special characters
function escapeRegExp(string: string): string {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}
