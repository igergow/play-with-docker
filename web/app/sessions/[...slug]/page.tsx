import { EditorPageWrapper } from './page-wrapper';

// Required for static export with catch-all routes
export function generateStaticParams() {
  // Return a placeholder - actual routes will be handled client-side via URL params
  return [{ slug: ['placeholder', 'instances', 'placeholder', 'editor'] }];
}

export default function EditorPage({
  params,
}: {
  params: { slug: string[] };
}) {
  return <EditorPageWrapper params={params} />;
}
