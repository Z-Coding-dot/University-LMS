import { describe, expect, it } from 'vitest';
import { authDestination } from './auth-redirect';

describe('post-login destination', () => {
  it('preserves course tabs, queries and dashboard anchors', () => {
    expect(authDestination('/courses/6?tab=assignments')).toBe('/courses/6?tab=assignments');
    expect(authDestination('/#performance')).toBe('/#performance');
  });
  it('rejects external destinations, invalid state and authentication loops', () => {
    for (const value of [undefined, null, {}, 123, 'https://example.com', '//example.com', '/\\example.com', '/\n/example.com', ' /courses', '/login?next=/courses', '/courses/../login', '/courses/%2e%2e/login', '/change-password', '/403']) {
      expect(authDestination(value)).toBe('/');
    }
  });
});
