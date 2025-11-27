import { NextRequest, NextResponse } from 'next/server';
import { postToInstagram } from '@/lib/ayrshare';

export async function POST(request: NextRequest) {
  try {
    const { post, mediaUrls } = await request.json();

    if (!post) {
      return NextResponse.json(
        { error: 'Missing required field: post' },
        { status: 400 }
      );
    }

    const imageUrl = mediaUrls && mediaUrls.length > 0 ? mediaUrls[0] : undefined;
    const result = await postToInstagram(post, imageUrl);

    return NextResponse.json({ success: true, data: result });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to post' },
      { status: 500 }
    );
  }
}
