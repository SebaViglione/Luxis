'use client';

import { EstadoError } from '@/components/ui/estado-error';

export default function ErrorApp({ retry }: { error: unknown; retry: () => void }) {
  return <EstadoError onReintentar={retry} />;
}
