// File: src/app/(platform)/feed/page.tsx

import { Feed } from '@/components/feed/Feed/Feed';
import { PageHeader } from '@/components/ui/PageHeader/PageHeader';

export default function FeedPage() {
  return (
    <>
      <PageHeader title="Feed" />
      <Feed type="home" />
    </>
  );
}