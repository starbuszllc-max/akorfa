import React from 'react';
import Button from '../ui/Button';

export default function PostCard({post}:{post:any}){
  return (
    <article className="p-4 bg-white rounded shadow-sm">
      <div className="flex items-center justify-between">
        <div>
          <div className="font-medium">{post.user_id ?? 'Anonymous'}</div>
          <div className="text-xs text-text-secondary">{new Date(post.created_at).toLocaleString()}</div>
        </div>
        <div className="text-sm text-text-secondary">{post.layer}</div>
      </div>

      <div className="mt-3 text-gray-800">{post.content}</div>

      <div className="mt-3 flex items-center gap-3">
        <button className="text-sm text-text-secondary">Like ({post.like_count ?? 0})</button>
        <button className="text-sm text-text-secondary">Comments ({post.comment_count ?? 0})</button>
        <form action="/api/reactions" method="post" className="ml-auto">
          {/* lightweight reaction placeholder; client actions preferred */}
        </form>
      </div>
    </article>
  );
}
