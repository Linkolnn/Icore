/**
 * Генератор уникальных User ID
 * Формат: nickname@randomid
 * Пример: john@a1b2c3d4
 */

/**
 * Генерирует случайную строку для ID
 * @param length - длина строки (по умолчанию 8)
 * @returns случайная строка из букв и цифр
 */
function generateRandomId(length: number = 8): string {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

/**
 * Создает nickname из имени пользователя
 * - Приводит к нижнему регистру
 * - Удаляет пробелы и спецсимволы
 * - Оставляет только буквы и цифры
 * 
 * @param name - имя пользователя
 * @returns nickname в lowercase без спецсимволов
 */
export function createNicknameFromName(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '') // Удаляем все кроме букв и цифр
    .substring(0, 20); // Максимум 20 символов
}

/**
 * Генерирует полный userId
 * Формат: nickname@randomid
 * 
 * @param name - имя пользователя
 * @returns userId в формате nickname@randomid
 */
export function generateUserId(name: string): string {
  const nickname = createNicknameFromName(name);
  const randomId = generateRandomId(8);
  return `${nickname}@${randomId}`;
}

/**
 * Валидирует формат userId
 * Должен быть в формате: nickname@randomid
 * 
 * @param userId - userId для проверки
 * @returns true если формат правильный
 */
export function validateUserIdFormat(userId: string): boolean {
  const regex = /^[a-z0-9]+@[a-z0-9]+$/;
  return regex.test(userId);
}

/**
 * Извлекает nickname из userId
 * 
 * @param userId - userId в формате nickname@randomid
 * @returns nickname часть
 */
export function extractNickname(userId: string): string {
  return userId.split('@')[0];
}

/**
 * Извлекает randomId из userId
 * 
 * @param userId - userId в формате nickname@randomid
 * @returns randomId часть
 */
export function extractRandomId(userId: string): string {
  return userId.split('@')[1];
}

/**
 * Создает новый userId с тем же randomId но новым nickname
 * Используется когда пользователь меняет nickname
 * 
 * @param oldUserId - старый userId
 * @param newNickname - новый nickname
 * @returns новый userId с тем же randomId
 */
export function updateNickname(oldUserId: string, newNickname: string): string {
  const randomId = extractRandomId(oldUserId);
  const nickname = createNicknameFromName(newNickname);
  return `${nickname}@${randomId}`;
}
