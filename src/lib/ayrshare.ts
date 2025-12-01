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
    const errorData = await response.json();
    console.error('Ayrshare error:', errorData);
    throw new Error(`Failed to post: ${response.status} - ${JSON.stringify(errorData)}`);
  }

  return await response.json();
}
