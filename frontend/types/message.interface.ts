// ===================================
// 🎯 ЗАДАНИЕ 2: Создайте интерфейсы для Message
// ===================================

/**
 * Статус отправки сообщения
 * 
 * Возможные значения:
 * - 'sending' - сообщение отправляется
 * - 'sent' - сообщение отправлено на сервер
 * - 'delivered' - сообщение доставлено получателю
 * - 'read' - сообщение прочитано
 * - 'failed' - ошибка отправки
 */
// TODO: export type MessageStatus = ...

export type MessageStatus = 'sending' | 'sent' | 'delivered' | 'read' | 'failed'

export interface Message {
    readonly id: string
    readonly chatId: string
    readonly senderId: string
    content: string
    status: MessageStatus
    attachments?: string[]
    createdAt: Date
    updatedAt: Date
}

export interface CreateMessageDto {
    chatId: string
    content: string
    attachments?: string[]
}

export interface UpdateMessageDto {
    content: string
}
/**
 * Интерфейс сообщения
 * 
 * Требования:
 * - id: string, readonly
 * - chatId: string, readonly (ID чата, в котором сообщение)
 * - senderId: string, readonly (ID отправителя)
 * - content: string (текст сообщения)
 * - status: MessageStatus
 * - attachments: массив строк, необязательное (ссылки на файлы)
 * - createdAt: Date
 * - updatedAt: Date
 */
// TODO: export interface Message { ... }


/**
 * DTO для создания нового сообщения
 * 
 * Требования:
 * - chatId: string
 * - content: string
 * - attachments: массив строк, необязательное
 * 
 * Примечание: senderId и status устанавливаются автоматически на сервере
 */
// TODO: export interface CreateMessageDto { ... }


/**
 * DTO для обновления сообщения (редактирование)
 * 
 * Требования:
 * - content: string
 * 
 * Примечание: можно редактировать только текст
 */
// TODO: export interface UpdateMessageDto { ... }


// ===================================
// 💡 Подсказки:
// ===================================

// 1. Type alias для union типов:
//    type Status = 'sending' | 'sent' | 'delivered'

// 2. Массив типизируется через []:
//    attachments: string[]

// 3. Необязательный массив:
//    attachments?: string[]

// 4. Readonly для ID которые нельзя менять:
//    readonly id: string

// ===================================
// 🤔 Подумайте:
// ===================================

// Вопрос 1: Почему chatId и senderId readonly?
// Ответ: Сообщение не может "переехать" в другой чат или сменить автора

// Вопрос 2: Почему в CreateMessageDto нет status?
// Ответ: Статус устанавливается автоматически ('sending' → 'sent')

// Вопрос 3: Почему attachments необязательное поле?
// Ответ: Не все сообщения содержат файлы

// ===================================
// 📖 Справка:
// ===================================

// Официальная документация:
// - Union Types: https://www.typescriptlang.org/docs/handbook/2/everyday-types.html#union-types
// - Arrays: https://www.typescriptlang.org/docs/handbook/2/everyday-types.html#arrays
