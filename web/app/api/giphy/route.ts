import { NextRequest, NextResponse } from 'next/server';

const GIPHY_API_KEY = process.env.GIPHY_API_KEY || '';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get('q') || 'trending';
  const limit = searchParams.get('limit') || '20';

  if (!GIPHY_API_KEY) {
    const mockGifs = [
      { id: '1', url: 'https://media.giphy.com/media/placeholder/giphy.gif', title: 'Sample GIF 1' },
      { id: '2', url: 'https://media.giphy.com/media/placeholder/giphy.gif', title: 'Sample GIF 2' },
    ];
    return NextResponse.json({ gifs: mockGifs });
  }

  try {
    const endpoint = query === 'trending' 
      ? `https://api.giphy.com/v1/gifs/trending?api_key=${GIPHY_API_KEY}&limit=${limit}&rating=g`
      : `https://api.giphy.com/v1/gifs/search?api_key=${GIPHY_API_KEY}&q=${encodeURIComponent(query)}&limit=${limit}&rating=g`;

    const response = await fetch(endpoint);
    
    if (!response.ok) {
      throw new Error('Failed to fetch from Giphy');
    }

    const data = await response.json();
    
    const gifs = data.data.map((gif: any) => ({
      id: gif.id,
      url: gif.images.fixed_height.url,
      title: gif.title,
      thumbnail: gif.images.fixed_height_small.url
    }));

    return NextResponse.json({ gifs });
  } catch (error) {
    console.error('Giphy API error:', error);
    return NextResponse.json({ gifs: [], error: 'Failed to fetch GIFs' }, { status: 500 });
  }
}
