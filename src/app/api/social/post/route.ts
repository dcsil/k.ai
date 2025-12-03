import { NextRequest, NextResponse } from 'next/server';
import { postToInstagram, postToYouTube } from '@/lib/ayrshare';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { platform, post, mediaUrls, videoUrl, title, privacyType, scheduledAt } = body;

    let result;

    if (platform === 'youtube') {
      result = await postToYouTube(videoUrl, title, {
        privacyType: privacyType || 'private',
        selfDeclaredMadeForKids: 'no',
        ...(scheduledAt && { scheduledAt: new Date(scheduledAt) }),
      });
    } else {
      // Default to Instagram

      if (!post) {
        return NextResponse.json(
          { error: 'Missing required field: post' },
          { status: 400 }
        );
      }

      const imageUrl = mediaUrls && mediaUrls.length > 0 ? mediaUrls[0] : undefined;

      result = await postToInstagram(post, mediaUrls);
    }

    return NextResponse.json({ success: true, data: result });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to post' },
      { status: 500 }
    );
  }
}
