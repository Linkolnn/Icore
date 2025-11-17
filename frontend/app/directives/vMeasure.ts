/**
 * Директива для измерения высоты элементов
 * Используется в Virtual Scrolling для динамических высот
 */

interface MeasureBinding {
  value?: (height: number) => void
  modifiers?: {
    once?: boolean // Измерить только один раз
    resize?: boolean // Отслеживать изменения размера
  }
}

export const vMeasure = {
  mounted(el: HTMLElement, binding: MeasureBinding) {
    const callback = binding.value
    if (!callback || typeof callback !== 'function') return

    // Измеряем начальную высоту
    const measure = () => {
      const height = el.offsetHeight
      if (height > 0) {
        callback(height)
      }
    }

    // Измеряем после следующего тика
    nextTick(measure)

    // Если нужно отслеживать изменения
    if (binding.modifiers?.resize) {
      const resizeObserver = new ResizeObserver(() => {
        measure()
      })
      
      resizeObserver.observe(el)
      
      // Сохраняем observer для очистки
      ;(el as any)._resizeObserver = resizeObserver
    }
  },
  
  updated(el: HTMLElement, binding: MeasureBinding) {
    // Перемеряем при обновлении, если не once
    if (!binding.modifiers?.once && binding.value) {
      nextTick(() => {
        const height = el.offsetHeight
        if (height > 0) {
          binding.value!(height)
        }
      })
    }
  },
  
  unmounted(el: HTMLElement) {
    // Очищаем ResizeObserver
    const observer = (el as any)._resizeObserver
    if (observer) {
      observer.disconnect()
      delete (el as any)._resizeObserver
    }
  }
}
