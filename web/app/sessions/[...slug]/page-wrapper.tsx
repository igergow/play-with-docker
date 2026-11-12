'use client';

import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import dynamic from 'next/dynamic';

// Dynamically import to avoid SSR issues with browser-only dependencies
const EditorPageClient = dynamic(() => import('./page-client').then(mod => ({ default: mod.EditorPageClient })), {
  ssr: false,
  loading: () => <div>Loading...</div>,
});

export function EditorPageWrapper({
  params,
}: {
  params: { slug: string[] };
}) {
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Extract from pathname: /sessions/{sessionId}/instances/{instanceName}/editor
  // Use pathname if available (client-side), otherwise fall back to params
  const parts = mounted && pathname ? pathname.split('/').filter(Boolean) : [];
  const sessionId = parts[1] || params.slug?.[0] || '';
  const instanceName = parts[3] || params.slug?.[2] || '';

  if (!mounted || !sessionId || !instanceName) {
    return <div>Loading...</div>;
  }

  return <EditorPageClient sessionId={sessionId} instanceName={instanceName} />;
}

