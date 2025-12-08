import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { posts, profiles } from '@akorfa/shared/src/schema';
import { sql, desc, and, isNotNull } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const category = searchParams.get('category') || 'for-you';
    const limit = parseInt(searchParams.get('limit') || '20');
    const layerScoresParam = searchParams.get('layerScores');
    
    let userLayerScores: Record<string, number> = {};
    if (layerScoresParam) {
      try {
        userLayerScores = JSON.parse(layerScoresParam);
      } catch (e) {
        console.error('Failed to parse layerScores:', e);
      }
    }

    const db = getDb();
    
    let conditions = [
      isNotNull(posts.mediaUrls),
      sql`jsonb_array_length(${posts.mediaUrls}) > 0`,
      sql`${posts.mediaTypes}::jsonb ? 'video'`
    ];

    if (category === 'following') {
    } else if (category === 'live') {
      conditions.push(sql`${posts.createdAt} > NOW() - INTERVAL '1 hour'`);
    } else if (category === 'stem') {
      conditions.push(sql`${posts.layer} IN ('bio', 'internal', 'conscious')`);
    } else if (category === 'akorfa-live') {
      conditions.push(sql`${posts.isVerified} = true`);
    }

    let query = db
      .select({
        id: posts.id,
        userId: posts.userId,
        content: posts.content,
        layer: posts.layer,
        videoUrl: sql<string>`${posts.mediaUrls}::jsonb->>0`.as('video_url'),
        videoThumbnail: posts.videoThumbnail,
        videoDuration: posts.videoDuration,
        likeCount: posts.likeCount,
        commentCount: posts.commentCount,
        viewCount: posts.viewCount,
        profiles: {
          username: profiles.username,
          avatarUrl: profiles.avatarUrl
        },
        createdAt: posts.createdAt
      })
      .from(posts)
      .leftJoin(profiles, sql`${posts.userId} = ${profiles.id}`)
      .where(and(...conditions))
      .orderBy(desc(posts.createdAt))
      .limit(limit);

    const videos = await query;

    const scoredVideos = videos.map((video) => {
      let relevanceScore = 0;
      const likeCount = video.likeCount ?? 0;
      const commentCount = video.commentCount ?? 0;
      
      if (category === 'for-you' && Object.keys(userLayerScores).length > 0) {
        const videoLayer = video.layer || 'social';
        const layerScore = userLayerScores[videoLayer] || 50;
        relevanceScore = layerScore / 100;
        
        const createdTime = video.createdAt ? new Date(video.createdAt).getTime() : Date.now();
        const recencyBoost = Math.max(0, 1 - (Date.now() - createdTime) / (7 * 24 * 60 * 60 * 1000));
        const engagementBoost = (likeCount + commentCount * 2) / 100;
        
        relevanceScore = relevanceScore * 0.5 + recencyBoost * 0.3 + engagementBoost * 0.2;
      } else {
        relevanceScore = (likeCount + commentCount * 2) / 100;
      }
      
      return { ...video, relevanceScore };
    });

    scoredVideos.sort((a, b) => b.relevanceScore - a.relevanceScore);

    return NextResponse.json({ videos: scoredVideos });
  } catch (error) {
    console.error('Error fetching video feed:', error);
    return NextResponse.json(
      { error: 'Failed to fetch videos' },
      { status: 500 }
    );
  }
}
