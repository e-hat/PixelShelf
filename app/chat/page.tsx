// app/chat/page.tsx

'use client';

import { Suspense } from 'react';
import ChatPageInner from './ChatPageInner';

export default function ChatPage() {
  return (
    <Suspense fallback={<div className="p-6">Loading chat...</div>}>
      <ChatPageInner />
    </Suspense>
  );
}
