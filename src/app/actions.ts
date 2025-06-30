'use server';

import { generateKpiSummary, GenerateKpiSummaryInput, GenerateKpiSummaryOutput } from '@/ai/flows/kpi-summarization';
import { analyzeInvestigation, InvestigationAnalysisInput, InvestigationAnalysisOutput } from '@/ai/flows/investigation-analysis-flow';
import { analyzeJsa, JsaAnalysisInput, JsaAnalysisOutput } from '@/ai/flows/jsa-analysis-flow';
import { storage } from '@/lib/firebase';
import { getDownloadURL, ref, uploadBytes } from 'firebase/storage';

export async function getKpiSummaryAction(input: GenerateKpiSummaryInput): Promise<GenerateKpiSummaryOutput> {
  try {
    const output = await generateKpiSummary(input);
    return output;
  } catch (error) {
    console.error('Error in getKpiSummaryAction:', error);
    // In a real app, you'd want more robust error handling and logging.
    return { summary: 'An error occurred while generating the summary.' };
  }
}

export async function getInvestigationAnalysisAction(input: InvestigationAnalysisInput): Promise<InvestigationAnalysisOutput> {
  try {
    const output = await analyzeInvestigation(input);
    return output;
  } catch (error) {
    console.error('Error in getInvestigationAnalysisAction:', error);
    // In a real app, you'd want more robust error handling and logging.
    return { 
        rootCause: 'An error occurred during analysis.', 
        contributingFactors: 'Could not generate contributing factors.',
        eventsHistory: 'Could not generate events history.',
        lessonsLearned: 'Could not generate lessons learned.',
        actionPlan: 'Could not generate action plan.'
    };
  }
}

export async function getJsaAnalysisAction(input: JsaAnalysisInput): Promise<JsaAnalysisOutput> {
  try {
    const output = await analyzeJsa(input);
    return output;
  } catch (error) {
    console.error('Error in getJsaAnalysisAction:', error);
    return { 
        analysis: 'An error occurred during AI analysis. Please check the system logs.'
    };
  }
}


export async function fetchAndUploadImageAction(imageUrl: string): Promise<string | null> {
  if (!imageUrl || !imageUrl.startsWith('http')) {
    console.error(`Invalid URL provided to fetchAndUploadImageAction: ${imageUrl}`);
    return null;
  }

  let effectiveUrl = imageUrl;

  // Check for Google Drive link and transform it into a direct download link
  if (imageUrl.includes('drive.google.com')) {
    // Regex to find file ID from common Google Drive share URL formats
    const regex = /(?:drive\.google\.com\/(?:file\/d\/|open\?id=))([a-zA-Z0-9_-]+)/;
    const match = imageUrl.match(regex);
    if (match && match[1]) {
      const fileId = match[1];
      effectiveUrl = `https://drive.google.com/uc?export=download&id=${fileId}`;
      console.log(`Transformed Google Drive URL to direct download link: ${effectiveUrl}`);
    } else {
        console.warn(`Could not extract file ID from Google Drive URL: ${imageUrl}`);
    }
  }

  try {
    // This action runs on the server, so it can bypass browser CORS policies.
    // Adding more browser-like headers to avoid being blocked by remote servers.
    const response = await fetch(effectiveUrl, {
        headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/108.0.0.0 Safari/537.36',
            'Accept': 'image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8',
            'Accept-Language': 'en-US,en;q=0.9',
        }
    });

    if (!response.ok) {
      // Log the response body if it's not OK, as it might contain an error message.
      const responseBody = await response.text();
      console.error(`Server failed to fetch image from ${effectiveUrl}. Status: ${response.status} ${response.statusText}`);
      console.error(`Response body: ${responseBody}`);
      return null;
    }
    
    const contentType = response.headers.get('content-type') || 'image/jpeg';
    const imageBuffer = await response.arrayBuffer();
    
    if (imageBuffer.byteLength === 0) {
        console.error(`Fetched empty image buffer from ${effectiveUrl}.`);
        return null;
    }

    const fileName = imageUrl.substring(imageUrl.lastIndexOf('/') + 1).split('?')[0] || 'imported-image.jpg';
    const storageRef = ref(storage, `observations/imported/${Date.now()}_${fileName}`);
    
    await uploadBytes(storageRef, imageBuffer, { contentType });
    const downloadUrl = await getDownloadURL(storageRef);
    return downloadUrl;
  } catch (error) {
    if (error instanceof TypeError) {
      // TypeError is often thrown for network errors in Node's fetch
      console.error(`Network error or invalid URL in fetchAndUploadImageAction for URL ${effectiveUrl}. This can be due to CORS, SSL, or DNS issues.`, error);
    } else {
      console.error(`Generic error in fetchAndUploadImageAction for URL ${effectiveUrl}:`, error);
    }
    return null;
  }
}
