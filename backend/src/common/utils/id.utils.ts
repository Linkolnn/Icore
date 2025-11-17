/**
 * Utility functions for ID operations
 * 
 * Применяем DRY принцип - избегаем дублирования кода
 */

/**
 * Safely convert any ID to string
 * Handles ObjectId, string, and undefined/null
 */
export function toStringId(id: any): string {
  if (!id) return '';
  return typeof id === 'string' ? id : id.toString();
}

/**
 * Compare two IDs (handles ObjectId and string)
 */
export function compareIds(id1: any, id2: any): boolean {
  return toStringId(id1) === toStringId(id2);
}

/**
 * Check if ID is in array
 */
export function isIdInArray(id: any, array: any[]): boolean {
  const idStr = toStringId(id);
  return array.some(item => toStringId(item) === idStr);
}
