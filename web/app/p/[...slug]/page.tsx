import { PlaygroundPageWrapper } from './page-wrapper';

// Required for static export with catch-all routes
export function generateStaticParams() {
  // Return a placeholder - actual routes will be handled client-side via URL params
  return [{ slug: ['placeholder'] }];
}

export default function PlaygroundPage({
  params,
}: {
  params: { slug: string[] };
}) {
  return <PlaygroundPageWrapper params={params} />;
}
