/**
 * Generate a URL-friendly slug from a Serbian string.
 * Converts Cyrillic/Latin diacritics to ASCII equivalents.
 */
export function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[čć]/g, 'c')
    .replace(/[šŠ]/g, 's')
    .replace(/[žŽ]/g, 'z')
    .replace(/[đĐ]/g, 'dj')
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}
