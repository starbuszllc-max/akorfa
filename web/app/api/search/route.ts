import { NextResponse } from 'next/server';
import { getPool } from '@/lib/db';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get('q')?.trim();
  const limit = parseInt(searchParams.get('limit') || '10');

  if (!query || query.length < 2) {
    return NextResponse.json({
      posts: [],
      users: [],
      groups: [],
      comments: [],
      locations: []
    });
  }

  const pool = getPool();
  const searchPattern = `%${query.toLowerCase()}%`;

  try {
    const [postsResult, usersResult, groupsResult, commentsResult, locationsResult] = await Promise.all([
      pool.query(`
        SELECT 
          p.id, 
          p.content, 
          p.layer,
          p.like_count,
          p.comment_count,
          p.created_at,
          pr.id as user_id,
          pr.username,
          pr.full_name,
          pr.avatar_url
        FROM posts p
        LEFT JOIN profiles pr ON p.user_id = pr.id
        WHERE LOWER(p.content) LIKE $1
        ORDER BY p.created_at DESC
        LIMIT $2
      `, [searchPattern, limit]),

      pool.query(`
        SELECT 
          id,
          username,
          full_name,
          avatar_url,
          bio,
          akorfa_score,
          level
        FROM profiles
        WHERE LOWER(username) LIKE $1 
           OR LOWER(full_name) LIKE $1
           OR LOWER(bio) LIKE $1
        ORDER BY akorfa_score DESC NULLS LAST
        LIMIT $2
      `, [searchPattern, limit]),

      pool.query(`
        SELECT 
          id,
          name,
          description,
          layer,
          avatar_url,
          member_count,
          is_public
        FROM groups
        WHERE LOWER(name) LIKE $1 
           OR LOWER(description) LIKE $1
        ORDER BY member_count DESC NULLS LAST
        LIMIT $2
      `, [searchPattern, limit]),

      pool.query(`
        SELECT 
          c.id,
          c.post_id,
          c.content,
          c.created_at,
          pr.id as user_id,
          pr.username,
          pr.avatar_url
        FROM comments c
        LEFT JOIN profiles pr ON c.user_id = pr.id
        WHERE LOWER(c.content) LIKE $1
        ORDER BY c.created_at DESC
        LIMIT $2
      `, [searchPattern, limit]),

      pool.query(`
        SELECT 
          ul.user_id as id,
          ul.city,
          ul.region,
          ul.country,
          pr.username,
          pr.full_name,
          pr.avatar_url
        FROM user_locations ul
        LEFT JOIN profiles pr ON ul.user_id = pr.id
        WHERE ul.is_visible = true
          AND (LOWER(ul.city) LIKE $1 
               OR LOWER(ul.region) LIKE $1 
               OR LOWER(ul.country) LIKE $1)
        ORDER BY pr.akorfa_score DESC NULLS LAST
        LIMIT $2
      `, [searchPattern, limit])
    ]);

    return NextResponse.json({
      posts: postsResult.rows.map(row => ({
        id: row.id,
        content: row.content,
        layer: row.layer,
        likeCount: row.like_count,
        commentCount: row.comment_count,
        createdAt: row.created_at,
        user: row.user_id ? {
          id: row.user_id,
          username: row.username,
          fullName: row.full_name,
          avatarUrl: row.avatar_url
        } : null
      })),
      users: usersResult.rows.map(row => ({
        id: row.id,
        username: row.username,
        fullName: row.full_name,
        avatarUrl: row.avatar_url,
        bio: row.bio,
        akorfaScore: row.akorfa_score,
        level: row.level
      })),
      groups: groupsResult.rows.map(row => ({
        id: row.id,
        name: row.name,
        description: row.description,
        layer: row.layer,
        avatarUrl: row.avatar_url,
        memberCount: row.member_count,
        isPublic: row.is_public
      })),
      comments: commentsResult.rows.map(row => ({
        id: row.id,
        postId: row.post_id,
        content: row.content,
        createdAt: row.created_at,
        user: row.user_id ? {
          id: row.user_id,
          username: row.username,
          avatarUrl: row.avatar_url
        } : null
      })),
      locations: locationsResult.rows.map(row => ({
        id: row.id,
        city: row.city,
        region: row.region,
        country: row.country,
        user: {
          username: row.username,
          fullName: row.full_name,
          avatarUrl: row.avatar_url
        }
      }))
    });
  } catch (error) {
    console.error('Search error:', error);
    return NextResponse.json(
      { error: 'Failed to perform search' },
      { status: 500 }
    );
  }
}
