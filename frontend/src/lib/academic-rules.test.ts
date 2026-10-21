import { expect, it } from 'vitest';
import { slotsOverlap, validLetterScale } from './academic-rules';
it('accepts a complete unordered scale and rejects gaps, overlaps and invalid bounds', () => {
  const scale = [{ min: 55, max: 100, letter: 'P' }, { min: 0, max: 55, letter: 'F' }];
  expect(validLetterScale(scale)).toBe(true);
  expect(validLetterScale([])).toBe(false);
  for (const max of [54, 56, NaN, Infinity]) expect(validLetterScale([scale[0], { min: 0, max, letter: 'F' }])).toBe(false);
  expect(validLetterScale([{ min: 0, max: 101, letter: 'A' }])).toBe(false);
});
it('detects timetable overlaps while allowing adjacent slots and different days', () => {
  const slot = { weekday: 6, start: '09:00', end: '10:00' };
  expect(slotsOverlap(slot, { ...slot, start: '09:30', end: '11:00' })).toBe(true);
  expect(slotsOverlap(slot, { ...slot, start: '10:00', end: '11:00' })).toBe(false);
  expect(slotsOverlap(slot, { ...slot, weekday: 7 })).toBe(false);
});
