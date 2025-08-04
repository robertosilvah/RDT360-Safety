'use server';

import { analyzeJsa } from '@/ai/flows/jsa-analysis-flow';
import { analyzeInvestigation } from '@/ai/flows/investigation-analysis-flow';
import { generateKpiSummary } from '@/ai/flows/kpi-summarization';
import { generateToolboxTalk } from '@/ai/flows/toolbox-talk-flow';

export const getJsaAnalysisAction = analyzeJsa;
export const getInvestigationAnalysisAction = analyzeInvestigation;
export const getKpiSummaryAction = generateKpiSummary;
export const generateToolboxTalkAction = generateToolboxTalk;
