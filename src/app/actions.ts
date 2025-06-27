'use server';

import { generateKpiSummary, GenerateKpiSummaryInput, GenerateKpiSummaryOutput } from '@/ai/flows/kpi-summarization';

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
