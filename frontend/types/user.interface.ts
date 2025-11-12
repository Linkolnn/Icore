// ===================================
// 🎯 ЗАДАНИЕ 1: Создайте интерфейсы для User
// ===================================

// TODO: Импортируйте нужные типы если создадите отдельные файлы
// import { ... } from './common.types'

/**
 * Интерфейс пользователя
 * 
 * Требования:
 * - id должен быть readonly (нельзя изменить после создания)
 * - avatar необязательное поле
 * - status может быть только: 'online' | 'offline' | 'away' | 'dnd'
 */
// TODO: export interface User { ... }
type UserStatus = 'online' | 'offline' | 'away' | 'dnd'

export interface User {
    readonly id: string
    name: string
    email: string
    avatar?: string
    status: UserStatus
    createdAt: Date
    updatedAt: Date
}

export interface RegisterDto {
   name: string
   email: string
   password: string 
}

export interface LoginDto {
    email: string
    password: string
}

export interface AuthResponse {
    user: User
    token: string
}
/**
 * DTO для регистрации нового пользователя
 * 
 * Требования:
 * - name: строка
 * - email: строка
 * - password: строка (будет захеширован на сервере)
 */
// TODO: export interface RegisterDto { ... }


/**
 * DTO для входа пользователя
 * 
 * Требования:
 * - email: строка
 * - password: строка
 */
// TODO: export interface LoginDto { ... }


/**
 * Response после успешной авторизации
 * 
 * Требования:
 * - user: объект User
 * - token: строка (JWT токен)
 */
// TODO: export interface AuthResponse { ... }


// ===================================
// 💡 Подсказки:
// ===================================

// 1. readonly делает свойство неизменяемым:
//    readonly id: string

// 2. Необязательное свойство помечается ?:
//    avatar?: string

// 3. Union type для ограниченных значений:
//    status: 'online' | 'offline' | 'away' | 'dnd'

// 4. Для создания type alias используйте:
//    type UserStatus = 'online' | 'offline' | 'away' | 'dnd'
//    И потом: status: UserStatus

// ===================================
// 📖 Справка:
// ===================================

// Официальная документация:
// - Interfaces: https://www.typescriptlang.org/docs/handbook/2/objects.html
// - Type Aliases: https://www.typescriptlang.org/docs/handbook/2/everyday-types.html#type-aliases
// - Readonly: https://www.typescriptlang.org/docs/handbook/2/objects.html#readonly-properties
