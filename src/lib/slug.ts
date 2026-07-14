function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function randomSuffix(): string {
  return Math.random().toString(36).slice(2, 6);
}

export function generateSlug(name: string): string {
  const base = slugify(name) || 'event';
  return `${base}-${randomSuffix()}`;
}
