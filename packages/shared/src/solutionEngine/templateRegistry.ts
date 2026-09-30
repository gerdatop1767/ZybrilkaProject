/**
 * Resolves a `TaskTypeKey` (+ optional `subtypeId`) to a registered
 * `SolutionTemplate`. This is a plain in-memory registry, not a DB
 * table — concrete templates (math:13, math:14, rus:27, ...) live as
 * versioned config modules (a later stage) that call `register()` at
 * startup. Adding a new subject/task never requires touching this file.
 */
import type { SolutionTemplate, TaskTypeKey } from './types.js';

export class SolutionTemplateRegistry {
  private readonly byTaskType = new Map<TaskTypeKey, SolutionTemplate[]>();

  register(template: SolutionTemplate): void {
    const list = this.byTaskType.get(template.taskTypeKey) ?? [];
    list.push(template);
    this.byTaskType.set(template.taskTypeKey, list);
  }

  /**
   * Resolves the most recently registered template matching
   * `taskTypeKey` (+ `subtypeId`, when given — `undefined` matches only
   * a template with no `subtypeId` of its own). Registration order is
   * significant: a later `register()` call for the same
   * taskTypeKey/subtypeId shadows an earlier one (last-registered
   * wins) — a deliberate, simple rule for this foundation layer, not a
   * semantic-versioning resolver.
   */
  resolve(taskTypeKey: TaskTypeKey, subtypeId?: string): SolutionTemplate | undefined {
    const list = this.byTaskType.get(taskTypeKey);
    if (!list) return undefined;
    for (let i = list.length - 1; i >= 0; i--) {
      const template = list[i]!;
      if (template.subtypeId === subtypeId) return template;
    }
    return undefined;
  }

  /** Every template registered for a taskTypeKey, in registration order — mainly for tests/tooling. */
  listForTaskType(taskTypeKey: TaskTypeKey): readonly SolutionTemplate[] {
    return this.byTaskType.get(taskTypeKey) ?? [];
  }
}

export const defaultSolutionTemplateRegistry = new SolutionTemplateRegistry();
