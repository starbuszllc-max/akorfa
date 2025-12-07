import React from 'react';
import PostComposer from '../../components/feed/PostComposer';
import FeedList from '../../components/feed/FeedList';

export default function FeedPage() {
  return (
    <main>
      <h1 className="text-2xl font-bold mb-4">Feed</h1>
      <div className="space-y-6">
        <PostComposer />
        <FeedList />
      </div>
    </main>
  );
}
