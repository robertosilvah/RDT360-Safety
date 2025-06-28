
'use server';
/**
 * @fileOverview An AI agent for analyzing incident investigations.
 *
 * - analyzeInvestigation - A function that handles the investigation analysis.
 * - InvestigationAnalysisInput - The input type for the analyzeInvestigation function.
 * - InvestigationAnalysisOutput - The return type for the analyzeInvestigation function.
 */

import {ai} from '@/ai/genkit';
import {db} from '@/lib/firebase';
import {collection, getDocs} from 'firebase/firestore';
import type {Incident} from '@/types';
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

    const incidentsCollection = collection(db, 'incidents');
    const incidentsSnapshot = await getDocs(incidentsCollection);
    const allIncidents: Incident[] = incidentsSnapshot.docs.map(doc => ({
      ...(doc.data() as Omit<Incident, 'incident_id'>),
      incident_id: doc.id,
    }));

    const similar = allIncidents.filter(incident =>
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
  tools: [findSimilarIncidents],
  system: `You are an expert safety investigator. Your task is to analyze an incident report and provide a comprehensive analysis.

You MUST use the 'findSimilarIncidents' tool to check for historical patterns. For the 'query' parameter of the tool, use the provided incident description.
  
Based on the incident details and any similar incidents found, provide the following:
1. A concise root cause.
2. A list of contributing factors.
3. A chronological history of events that led to the incident.
4. Key lessons that can be learned from this event.
5. A recommended action plan to prevent this from happening again.`,
  prompt: `Analyze the following incident:

- Description: {{{incidentDescription}}}
- Type: {{{incidentType}}}
- Severity: {{{incidentSeverity}}}
- Area: {{{incidentArea}}}`,
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
