import { NextRequest, NextResponse } from 'next/server';
import { postToInstagram } from '@/lib/ayrshare';

export async function POST(request: NextRequest) {
  try {
    const { text, imageUrl } = await request.json();

    const result = await postToInstagram(text, imageUrl);

    return NextResponse.json({ success: true, data: result });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to post' },
      { status: 500 }
    );
  }
}
