'use server';

/**
 * @fileOverview Generates summaries of KPIs related to different departments' safety performance.
 *
 * - generateKpiSummary - A function that generates the KPI summary.
 * - GenerateKpiSummaryInput - The input type for the generateKpiSummary function.
 * - GenerateKpiSummaryOutput - The return type for the generateKpiSummary function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateKpiSummaryInputSchema = z.object({
  departmentName: z.string().describe('The name of the department to summarize KPIs for.'),
  kpiData: z.string().describe('JSON string containing the KPI data for the department.  The keys should be the KPI name and the values should be the KPI value.'),
});
export type GenerateKpiSummaryInput = z.infer<typeof GenerateKpiSummaryInputSchema>;

const GenerateKpiSummaryOutputSchema = z.object({
  summary: z.string().describe('A summary of the KPIs for the specified department.'),
});
export type GenerateKpiSummaryOutput = z.infer<typeof GenerateKpiSummaryOutputSchema>;

export async function generateKpiSummary(input: GenerateKpiSummaryInput): Promise<GenerateKpiSummaryOutput> {
  return generateKpiSummaryFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateKpiSummaryPrompt',
  input: {schema: GenerateKpiSummaryInputSchema},
  output: {schema: GenerateKpiSummaryOutputSchema},
  prompt: `You are an AI assistant that helps safety managers understand the safety performance of their departments.

You will be provided with the name of the department and the KPI data for that department.

Your job is to generate a short summary of the KPIs for the specified department, highlighting any key trends or areas that need attention.

Department: {{{departmentName}}}
KPI Data: {{{kpiData}}}

Summary:`,
});

const generateKpiSummaryFlow = ai.defineFlow(
  {
    name: 'generateKpiSummaryFlow',
    inputSchema: GenerateKpiSummaryInputSchema,
    outputSchema: GenerateKpiSummaryOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
