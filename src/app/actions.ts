'use server';

import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from '@/lib/firebase';

export async function fetchAndUploadImageAction(imageUrl: string): Promise<string> {
  if (!imageUrl) {
    throw new Error('Invalid input: Image URL cannot be empty.');
  }

  let effectiveUrl = imageUrl;

  // This logic is designed to handle various Google Drive link formats
  // and transform them into a direct download link.
  if (imageUrl.includes('drive.google.com')) {
    // Regex to capture file ID from formats like:
    // - /file/d/ID/...
    // - ?id=ID
    const regex = /\/file\/d\/([a-zA-Z0-9_-]+)|[?&]id=([a-zA-Z0-9_-]+)/;
    const match = imageUrl.match(regex);
    
    if (match && (match[1] || match[2])) {
      const fileId = match[1] || match[2];
      effectiveUrl = `https://drive.google.com/uc?export=view&id=${fileId}`;
      console.log(`Transformed Google Drive URL to direct view link: ${effectiveUrl}`);
    } else {
      console.warn(`Could not extract file ID from Google Drive URL. Attempting to use original URL: ${imageUrl}`);
    }
  }

  try {
    const response = await fetch(effectiveUrl, {
      redirect: 'follow', // Important for Google Drive links
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/108.0.0.0 Safari/537.36',
        'Accept': 'image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
      }
    });

    if (!response.ok) {
      const responseBody = await response.text();
      console.error(`Server failed to fetch image from ${effectiveUrl}. Status: ${response.status} ${response.statusText}`);
      console.error(`Response body: ${responseBody}`);
      throw new Error(`Server failed to fetch image. Status: ${response.status} ${response.statusText}. See server console for response body.`);
    }

    const contentType = response.headers.get('content-type');
    if (!contentType || !contentType.startsWith('image/')) {
      const responseBody = await response.text();
      console.error(`URL did not return an image. Content-Type: ${contentType}`);
      console.error(`Response body: ${responseBody}`);
      throw new Error(`URL did not return an image. The server returned content type '${contentType}'. See server console for response body.`);
    }

    const imageBuffer = await response.arrayBuffer();

    if (imageBuffer.byteLength === 0) {
      console.error(`Fetched empty image buffer from ${effectiveUrl}.`);
      throw new Error('Fetched an empty image buffer from the URL.');
    }

    const fileName = imageUrl.substring(imageUrl.lastIndexOf('/') + 1).split('?')[0] || 'imported-image.jpg';
    const storageRef = ref(storage, `observations/imported/${Date.now()}_${fileName}`);

    await uploadBytes(storageRef, imageBuffer, { contentType });
    const downloadUrl = await getDownloadURL(storageRef);

    return downloadUrl;
  } catch (error) {
    console.error(`Error in fetchAndUploadImageAction for URL ${effectiveUrl}:`, error);
    if (error instanceof Error) {
        throw new Error(error.message);
    }
    throw new Error('An unknown error occurred during image fetching and uploading.');
  }
}
