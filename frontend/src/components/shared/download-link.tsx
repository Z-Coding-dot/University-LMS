import { useState, type AnchorHTMLAttributes, type MouseEvent } from 'react';
import axios from 'axios';
import { toast } from 'sonner';
import { api, apiErrorMessage, useMock } from '../../api/client';
import type { Attachment } from '../../api/types';

interface DownloadLinkProps extends Omit<AnchorHTMLAttributes<HTMLAnchorElement>, 'href' | 'download' | 'onClick'> {
  file: Pick<Attachment, 'id' | 'name' | 'url'>;
}

export function DownloadLink({ file, children, ...props }: DownloadLinkProps) {
  const [busy, setBusy] = useState(false);
  async function download(event: MouseEvent<HTMLAnchorElement>) {
    if (useMock) return;
    event.preventDefault();
    if (busy) return;
    setBusy(true);
    try {
      // The API client supplies bearer tokens and handles session expiry for downloads too.
      const response = await api.get<Blob>(`/files/${file.id}`, { responseType: 'blob', timeout: 120000 });
      const url = URL.createObjectURL(response.data);
      const link = document.createElement('a');
      link.href = url; link.download = file.name; link.click();
      window.setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch (error) {
      if (axios.isAxiosError(error) && error.response?.status === 404) toast.error(apiErrorMessage(error, 'common:notFoundTitle'));
    } finally {
      setBusy(false);
    }
  }
  return <a {...props} href={file.url} download={file.name} onClick={download} aria-busy={busy || undefined}>{children ?? file.name}</a>;
}
