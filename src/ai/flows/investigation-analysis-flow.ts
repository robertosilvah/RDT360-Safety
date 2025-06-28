'use server';
/**
 * @fileOverview An AI agent for analyzing incident investigations.
 *
 * - analyzeInvestigation - A function that handles the investigation analysis.
 * - InvestigationAnalysisInput - The input type for the analyzeInvestigation function.
 * - InvestigationAnalysisOutput - The return type for the analyzeInvestigation function.
 */

import {ai} from '@/ai/genkit';
import {mockIncidents} from '@/lib/mockData';
import {z} from 'genkit';

// Tool to find similar incidents
const findSimilarIncidents = ai.defineTool(
  {
    name: 'findSimilarIncidents',
    description:
      'Searches for past incidents that are similar to the provided query and returns a summary.',
    inputSchema: z.object({
      query: z
        .string()
        .describe(
          'A description of the incident to search for similarities.'
        ),
    }),
    outputSchema: z
      .string()
      .describe(
        'A summary of similar incidents found, or a message indicating none were found.'
      ),
  },
  async ({query}) => {
    const queryLower = query.toLowerCase();
    const similar = mockIncidents.filter(incident =>
      incident.description.toLowerCase().includes(queryLower)
    );

    if (similar.length === 0) {
      return 'No similar incidents found in the database.';
    }

    const summary = similar
      .map(
        incident =>
          `Incident ID ${incident.incident_id}: "${incident.description}" (Severity: ${incident.severity})`
      )
      .join('\n');

    return `Found ${similar.length} similar incidents:\n${summary}`;
  }
);

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
  tools: [findSimilarIncidents],
  prompt: `You are an expert safety investigator. Your task is to determine the root cause and contributing factors for a given incident.

Incident Details:
- Description: {{{incidentDescription}}}
- Type: {{{incidentType}}}
- Severity: {{{incidentSeverity}}}
- Area: {{{incidentArea}}}

Use the provided incident details to perform your analysis. You may use the 'findSimilarIncidents' tool to check for historical patterns or similar events that could provide context for your analysis.

Based on your analysis, provide a concise root cause and a list of contributing factors.`,
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
