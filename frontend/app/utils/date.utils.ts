/**
 * Утилиты для работы с датами
 *
 * Применяем паттерн: Utility Functions
 * Принцип: DRY - переиспользуемая логика для форматирования времени
 */

/**
 * Форматировать дату в формат HH:MM
 * @param date - Дата для форматирования
 * @returns Время в формате HH:MM
 */
export function formatTime(date: string | Date): string {
  const d = new Date(date)
  const hours = d.getHours().toString().padStart(2, '0')
  const minutes = d.getMinutes().toString().padStart(2, '0')
  return `${hours}:${minutes}`
}

/**
 * Форматировать дату в формат DD.MM.YYYY
 * @param date - Дата для форматирования
 * @returns Дата в формате DD.MM.YYYY
 */
export function formatDate(date: string | Date): string {
  const d = new Date(date)
  const day = d.getDate().toString().padStart(2, '0')
  const month = (d.getMonth() + 1).toString().padStart(2, '0')
  const year = d.getFullYear()
  return `${day}.${month}.${year}`
}

/**
 * Форматировать дату в формат DD.MM.YYYY HH:MM
 * @param date - Дата для форматирования
 * @returns Дата и время в формате DD.MM.YYYY HH:MM
 */
export function formatDateTime(date: string | Date): string {
  return `${formatDate(date)} ${formatTime(date)}`
}
