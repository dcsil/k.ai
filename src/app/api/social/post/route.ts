import { NextRequest, NextResponse } from 'next/server';
import { postToInstagram, postToYouTube } from '@/lib/ayrshare';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { platform, text, imageUrl, videoUrl, title, privacyType, scheduledAt } = body;

    let result;

    if (platform === 'youtube') {
      if (!videoUrl || !title) {
        return NextResponse.json(
          { error: 'YouTube posts require videoUrl and title' },
          { status: 400 }
        );
      }

      result = await postToYouTube(videoUrl, title, {
        privacyType: privacyType || 'private',
        selfDeclaredMadeForKids: 'no',
        ...(scheduledAt && { scheduledAt: new Date(scheduledAt) }),
      });
    } else {
      // Default to Instagram
      if (!text) {
        return NextResponse.json(
          { error: 'Instagram posts require text' },
          { status: 400 }
        );
      }

      result = await postToInstagram(text, imageUrl);
    }

    return NextResponse.json({ success: true, data: result });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to post' },
      { status: 500 }
    );
  }
}
