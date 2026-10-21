import type { LetterRange } from './grading';
export function validLetterScale(scale: LetterRange[]): boolean {
  const rows = [...scale].sort((a, b) => a.min - b.min);
  return !!rows.length && rows[0].min === 0 && rows.at(-1)!.max === 100 && rows.every((row, index) => Number.isFinite(row.min) && Number.isFinite(row.max) && row.min >= 0 && row.max <= 100 && row.min < row.max && !!row.letter.trim() && (index === 0 || Math.abs(rows[index - 1].max - row.min) < 0.000001));
}
export interface ScheduleTime { weekday: number; start: string; end: string }
export function slotsOverlap(first: ScheduleTime, second: ScheduleTime): boolean {
  return first.weekday === second.weekday && first.start < second.end && second.start < first.end;
}
