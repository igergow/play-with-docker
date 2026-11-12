'use client';

import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import dynamic from 'next/dynamic';

// Dynamically import to avoid SSR issues with browser-only dependencies
const PlaygroundPageClient = dynamic(() => import('./page-client').then(mod => ({ default: mod.PlaygroundPageClient })), {
  ssr: false,
  loading: () => <div>Loading...</div>,
});

export function PlaygroundPageWrapper({
  params,
}: {
  params: { slug: string[] };
}) {
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Extract sessionId from pathname: /p/{sessionId}
  // Use pathname if available (client-side), otherwise fall back to params
  const sessionId = mounted && pathname ? pathname.split('/')[2] : params.slug?.[0] || '';

  if (!mounted || !sessionId) {
    return <div>Loading...</div>;
  }

  return <PlaygroundPageClient params={{ slug: [sessionId] }} />;
}

