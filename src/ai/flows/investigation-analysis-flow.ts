
'use server';
/**
 * @fileOverview An AI agent for analyzing incident investigations.
 *
 * - analyzeInvestigation - A function that handles the investigation analysis.
 * - InvestigationAnalysisInput - The input type for the analyzeInvestigation function.
 * - InvestigationAnalysisOutput - The return type for the analyzeInvestigation function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const InvestigationAnalysisInputSchema = z.object({
  incidentDescription: z
    .string()
    .describe(
      'The detailed description of the incident being investigated.'
    ),
  incidentType: z
    .string()
    .describe('The type of incident (e.g., Accident, Incident).'),
  incidentSeverity: z
    .string()
    .describe('The severity of the incident (e.g., Low, Medium, High).'),
  incidentArea: z
    .string()
    .describe('The area where the incident occurred.'),
  historicalIncidentsJSON: z
    .string()
    .describe('A JSON string representing an array of past incidents for historical context. The AI should use this data to identify patterns or similar events.')
});
export type InvestigationAnalysisInput = z.infer<
  typeof InvestigationAnalysisInputSchema
>;

const InvestigationAnalysisOutputSchema = z.object({
  rootCause: z
    .string()
    .describe('The determined primary root cause of the incident.'),
  contributingFactors: z
    .string()
    .describe(
      'A list of factors that contributed to the incident.'
    ),
  eventsHistory: z
    .string()
    .describe('A chronological history of events leading to the incident.'),
  lessonsLearned: z
    .string()
    .describe('Key lessons learned from this incident.'),
  actionPlan: z
    .string()
    .describe('A recommended action plan to prevent recurrence.'),
});
export type InvestigationAnalysisOutput = z.infer<
  typeof InvestigationAnalysisOutputSchema
>;

export async function analyzeInvestigation(
  input: InvestigationAnalysisInput
): Promise<InvestigationAnalysisOutput> {
  return investigationAnalysisFlow(input);
}

const prompt = ai.definePrompt({
  name: 'investigationAnalysisPrompt',
  input: {schema: InvestigationAnalysisInputSchema},
  output: {schema: InvestigationAnalysisOutputSchema},
  system: `You are an expert safety investigator. Your task is to analyze an incident report and provide a comprehensive analysis.

You will be given the current incident's details and a JSON string containing all historical incidents. You MUST analyze this historical data to check for patterns or similar past events.
  
Based on all available details (current and historical), provide the following:
1. A concise root cause.
2. A list of contributing factors.
3. A chronological history of events that led to the incident.
4. Key lessons that can be learned from this event.
5. A recommended action plan to prevent this from happening again.`,
  prompt: `Analyze the following incident:

- Description: {{{incidentDescription}}}
- Type: {{{incidentType}}}
- Severity: {{{incidentSeverity}}}
- Area: {{{incidentArea}}}

For historical context, here is a JSON array of past incidents:
{{{historicalIncidentsJSON}}}`,
});

const investigationAnalysisFlow = ai.defineFlow(
  {
    name: 'investigationAnalysisFlow',
    inputSchema: InvestigationAnalysisInputSchema,
    outputSchema: InvestigationAnalysisOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
