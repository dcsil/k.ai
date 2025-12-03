export async function postToInstagram(text: string, imageUrl?: string) {
  const apiKey = process.env.AYRSHARE_API_KEY;

  const postData = {
    post: text,
    platforms: ['instagram'],
    ...(imageUrl && { mediaUrls: [imageUrl] })
  };

  const response = await fetch('https://app.ayrshare.com/api/post', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(postData),
  });

  if (!response.ok) {
    throw new Error(`Failed to post: ${response.status}`);
  }

  return await response.json();
}

export async function postToYouTube(
  videoUrl: string,
  title: string,
  options?: {
    privacyType?: 'private' | 'public' | 'unlisted';
    selfDeclaredMadeForKids?: 'yes' | 'no';
    scheduledAt?: Date;
  }
) {
  const apiKey = process.env.POSTIZ_API_KEY;
  const integrationId = process.env.POSTIZ_YOUTUBE_INTEGRATION_ID;

  // if (!apiKey || !integrationId) {
  //   throw new Error('Postiz API key or YouTube integration ID not configured');
  // }

  const postizRequest = {
    type: options?.scheduledAt ? 'schedule' : 'now',
    tags: [],
    shortLink: false,
    ...(options?.scheduledAt && { date: options.scheduledAt.toISOString() }),
    posts: [
      {
        integration: {
          id: integrationId,
        },
        settings: {
          title: title,
          type: options?.privacyType || 'private',
          selfDeclaredMadeForKids: options?.selfDeclaredMadeForKids || 'no',
        },
        value: [
          {
            id: generateUniqueId(),
            content: '',
            image: [
              {
                id: generateUniqueId(),
                path: videoUrl,
                alt: null,
                thumbnail: null,
                thumbnailTimestamp: null,
              },
            ],
          },
        ],
      },
    ],
  };

  const response = await fetch('http://kai.kevin.plus:5000/api/public/v1/posts', {
    method: 'POST',
    headers: {
      'Authorization': `${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(postizRequest),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(
      `Failed to post to YouTube: ${response.status} - ${errorData.message || response.statusText}`
    );
  }

  return await response.json();
}

function generateUniqueId(): string {
  return Math.random().toString(36).substr(2, 9);
}
