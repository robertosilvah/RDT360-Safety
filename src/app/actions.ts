'use server';

import { generateKpiSummary, GenerateKpiSummaryInput, GenerateKpiSummaryOutput } from '@/ai/flows/kpi-summarization';
import { analyzeInvestigation, InvestigationAnalysisInput, InvestigationAnalysisOutput } from '@/ai/flows/investigation-analysis-flow';

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
    return { rootCause: 'An error occurred during analysis.', contributingFactors: 'Could not generate contributing factors.' };
  }
}
