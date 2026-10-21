import { UPLOAD_LIMITS } from '../config/uploads';
export function validateUpload(file: { name: string; size: number; type: string }): string | null {
  const extension = file.name.split('.').at(-1)?.toLowerCase() ?? '';
  if (!(UPLOAD_LIMITS.extensions as readonly string[]).includes(extension) || (file.type && !(UPLOAD_LIMITS.mimeTypes as readonly string[]).includes(file.type))) return 'academic:fileType';
  if (file.size <= 0 || file.size > UPLOAD_LIMITS.maxBytes) return 'academic:fileSize';
  return null;
}
