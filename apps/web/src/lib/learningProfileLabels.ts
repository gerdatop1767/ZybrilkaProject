import type { SelfReportedScore, TargetScore } from '@zybrilka/shared';

/** Shared display labels so Onboarding and Profile never drift apart on
 * what a stored score value means to the user. */
export const selfReportedScoreOptions: readonly { id: SelfReportedScore; label: string }[] = [
  { id: 'unknown', label: 'Не знаю' },
  { id: 'under_40', label: 'Меньше 40' },
  { id: '40_plus', label: '40+' },
  { id: '50_plus', label: '50+' },
  { id: '60_plus', label: '60+' },
  { id: '70_plus', label: '70+' },
  { id: '80_plus', label: '80+' },
  { id: '90_plus', label: '90+' },
];

export const targetScoreOptions: readonly { id: TargetScore; label: string }[] = [
  { id: 'unknown', label: 'Не знаю' },
  { id: '60_plus', label: '60+' },
  { id: '70_plus', label: '70+' },
  { id: '80_plus', label: '80+' },
  { id: '90_plus', label: '90+' },
  { id: '95_plus', label: '95+' },
  { id: '100', label: '100' },
];

export function selfReportedScoreLabel(score: SelfReportedScore): string {
  return selfReportedScoreOptions.find((o) => o.id === score)?.label ?? score;
}

export function targetScoreLabel(score: TargetScore): string {
  return targetScoreOptions.find((o) => o.id === score)?.label ?? score;
}
