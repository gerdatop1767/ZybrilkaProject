/**
 * "Пожаловаться на задание" — placeholder handler (canvas mobile fix
 * block, section 5/6). A full complaint system (backend, reasons,
 * admin review — see CLAUDE.md Section 17) is explicitly out of scope
 * for this pass; this is the single seam a real implementation will
 * replace, so the call sites (desktop's warning menu, mobile's) never
 * need to change when it grows a real backend call.
 */
export function reportTask(taskId: string): void {
  console.info(`[reportTask] placeholder: would report task ${taskId}`);
}
