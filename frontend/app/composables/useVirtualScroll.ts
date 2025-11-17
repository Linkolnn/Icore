import { computed, ref, type Ref } from 'vue'

interface VirtualScrollOptions {
  items: Ref<any[]>
  itemHeight?: number // Примерная высота элемента
  containerHeight: Ref<number>
  buffer?: number // Количество элементов вне видимости для буфера
  reverse?: boolean // Для чата - скролл снизу вверх
}

export function useVirtualScroll(options: VirtualScrollOptions) {
  const {
    items,
    itemHeight = 80,
    containerHeight,
    buffer = 5,
    reverse = false
  } = options

  // Текущая позиция скролла
  const scrollTop = ref(0)
  const scrollHeight = ref(0)
  
  // Карта высот элементов (для динамических высот)
  const heightCache = new Map<string | number, number>()
  
  // Средняя высота элемента (обновляется динамически)
  const averageHeight = ref(itemHeight)

  /**
   * Вычисляем видимый диапазон элементов
   */
  const visibleRange = computed(() => {
    const itemCount = items.value.length
    if (itemCount === 0) return { start: 0, end: 0 }

    // Количество видимых элементов
    const visibleCount = Math.ceil(containerHeight.value / averageHeight.value)
    
    // Индекс первого видимого элемента
    const firstVisible = Math.floor(scrollTop.value / averageHeight.value)
    
    // Добавляем буфер
    const start = Math.max(0, firstVisible - buffer)
    const end = Math.min(itemCount, firstVisible + visibleCount + buffer)
    
    return { start, end }
  })

  /**
   * Элементы для рендеринга
   */
  const visibleItems = computed(() => {
    const { start, end } = visibleRange.value
    return items.value.slice(start, end).map((item, index) => ({
      ...item,
      virtualIndex: start + index
    }))
  })

  /**
   * Общая высота контейнера (для правильного скроллбара)
   */
  const totalHeight = computed(() => {
    return items.value.length * averageHeight.value
  })

  /**
   * Смещение для видимых элементов
   */
  const offsetY = computed(() => {
    const { start } = visibleRange.value
    return start * averageHeight.value
  })

  /**
   * Обновить высоту элемента в кеше
   */
  function updateItemHeight(id: string | number, height: number) {
    heightCache.set(id, height)
    
    // Пересчитываем среднюю высоту
    if (heightCache.size > 0) {
      const heights = Array.from(heightCache.values())
      const sum = heights.reduce((acc, h) => acc + h, 0)
      averageHeight.value = Math.round(sum / heights.length)
    }
  }

  /**
   * Обработка скролла
   */
  function handleScroll(event: Event) {
    const target = event.target as HTMLElement
    scrollTop.value = target.scrollTop
    scrollHeight.value = target.scrollHeight
  }

  /**
   * Скролл к элементу по индексу
   */
  function scrollToIndex(index: number, behavior: ScrollBehavior = 'smooth') {
    const position = index * averageHeight.value
    return {
      top: position,
      behavior
    }
  }

  /**
   * Скролл вниз (для новых сообщений)
   */
  function scrollToBottom(behavior: ScrollBehavior = 'smooth') {
    return {
      top: totalHeight.value,
      behavior
    }
  }

  /**
   * Сохранение позиции при добавлении элементов сверху
   */
  function preserveScrollPosition(prevItemCount: number) {
    const addedItems = items.value.length - prevItemCount
    if (addedItems > 0 && scrollTop.value > 0) {
      // Корректируем позицию скролла
      const addedHeight = addedItems * averageHeight.value
      return scrollTop.value + addedHeight
    }
    return scrollTop.value
  }

  return {
    // Данные
    visibleItems,
    totalHeight,
    offsetY,
    visibleRange,
    averageHeight,
    
    // Методы
    handleScroll,
    updateItemHeight,
    scrollToIndex,
    scrollToBottom,
    preserveScrollPosition
  }
}
