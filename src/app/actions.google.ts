'use server';

import { analyzeJsa } from '@/ai/flows/jsa-analysis-flow';
import { analyzeInvestigation } from '@/ai/flows/investigation-analysis-flow';
import { generateKpiSummary } from '@/ai/flows/kpi-summarization';

export const getJsaAnalysisAction = analyzeJsa;
export const getInvestigationAnalysisAction = analyzeInvestigation;
export const getKpiSummaryAction = generateKpiSummary;
