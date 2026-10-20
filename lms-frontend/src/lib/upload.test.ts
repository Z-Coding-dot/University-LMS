import { expect, it } from 'vitest';
import { validateUpload } from './upload';
it('rejects unsupported and oversized files before upload', () => {
  expect(validateUpload({ name: 'notes.PDF', size: 100, type: 'application/pdf' })).toBeNull();
  expect(validateUpload({ name: 'run.exe', size: 100, type: '' })).toBe('academic:fileType');
  expect(validateUpload({ name: 'fake.png', size: 100, type: 'text/html' })).toBe('academic:fileType');
  expect(validateUpload({ name: 'notes.pdf', size: 6 * 1024 * 1024, type: 'application/pdf' })).toBe('academic:fileSize');
});
