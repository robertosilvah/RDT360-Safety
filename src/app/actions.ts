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
  try {
    // This action runs on the server, so it can bypass browser CORS policies.
    // Adding a User-Agent header to mimic a browser request, as some servers may block requests without one.
    const response = await fetch(imageUrl, {
        headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        }
    });

    if (!response.ok) {
      console.error(`Server failed to fetch image from ${imageUrl}. Status: ${response.status} ${response.statusText}`);
      return null;
    }
    
    const contentType = response.headers.get('content-type') || 'image/jpeg';
    const imageBuffer = await response.arrayBuffer();
    
    const fileName = imageUrl.substring(imageUrl.lastIndexOf('/') + 1).split('?')[0] || 'imported-image.jpg';
    const storageRef = ref(storage, `observations/imported/${Date.now()}_${fileName}`);
    
    await uploadBytes(storageRef, imageBuffer, { contentType });
    const downloadUrl = await getDownloadURL(storageRef);
    return downloadUrl;
  } catch (error) {
    if (error instanceof TypeError) {
      console.error(`Network error or invalid URL in fetchAndUploadImageAction for URL ${imageUrl}:`, error.message);
    } else {
      console.error(`Generic error in fetchAndUploadImageAction for URL ${imageUrl}:`, error);
    }
    return null;
  }
}
