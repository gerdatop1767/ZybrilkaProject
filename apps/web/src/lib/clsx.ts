export type ClassValue = string | false | null | undefined;

/**
 * Tiny class-name joiner so components don't need a dependency just to
 * combine conditional CSS Module classes.
 */
export function clsx(...values: ClassValue[]): string {
  return values.filter(Boolean).join(' ');
}
