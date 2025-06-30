'use server';
/**
 * @fileOverview An AI agent for analyzing Job Safety Analyses (JSAs).
 *
 * - analyzeJsa - A function that handles the JSA analysis.
 * - JsaAnalysisInput - The input type for the analyzeJsa function.
 * - JsaAnalysisOutput - The return type for the analyzeJsa function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const JsaStepSchema = z.object({
  step_description: z.string().describe('The description of a single job step.'),
  hazards: z.string().describe('The identified potential hazards for this step, as a comma-separated string.'),
  controls: z.string().describe('The control measures to mitigate the hazards for this step, as a comma-separated string.'),
});

const JsaAnalysisInputSchema = z.object({
  title: z.string().describe('The title of the Job Safety Analysis.'),
  jobDescription: z.string().describe('The overall description of the job.'),
  requiredPpe: z.string().describe('A comma-separated list of required Personal Protective Equipment (PPE).'),
  steps: z.array(JsaStepSchema).describe('An array of the job steps, including their descriptions, hazards, and controls.'),
});
export type JsaAnalysisInput = z.infer<typeof JsaAnalysisInputSchema>;

const JsaAnalysisOutputSchema = z.object({
  analysis: z.string().describe('A comprehensive analysis and review of the JSA, including potential improvements, missed hazards, or suggested additional controls.'),
});
export type JsaAnalysisOutput = z.infer<typeof JsaAnalysisOutputSchema>;

export async function analyzeJsa(input: JsaAnalysisInput): Promise<JsaAnalysisOutput> {
  return jsaAnalysisFlow(input);
}

const prompt = ai.definePrompt({
  name: 'jsaAnalysisPrompt',
  input: {schema: JsaAnalysisInputSchema},
  output: {schema: JsaAnalysisOutputSchema},
  system: `You are an expert safety professional with decades of experience in creating and reviewing Job Safety Analyses (JSAs). Your task is to analyze a given JSA and provide constructive feedback.

Your analysis should be thorough but concise. Focus on:
1.  **Completeness:** Are there any obvious steps, hazards, or controls missing based on the job description?
2.  **Clarity:** Are the descriptions, hazards, and controls clear and easy to understand?
3.  **Effectiveness:** Are the proposed control measures effective for the identified hazards? Suggest alternatives or enhancements if necessary.
4.  **PPE:** Is the listed Personal Protective Equipment appropriate for the described job and hazards?

Provide your feedback in a professional and helpful tone. Structure your output as a single block of text.`,
  prompt: `Please analyze the following Job Safety Analysis:

**Title:** {{{title}}}
**Job Description:** {{{jobDescription}}}
**Required PPE:** {{{requiredPpe}}}

**Job Steps:**
{{#each steps}}
- **Step:** {{{this.step_description}}}
  - **Hazards:** {{{this.hazards}}}
  - **Controls:** {{{this.controls}}}
{{/each}}
`,
});

const jsaAnalysisFlow = ai.defineFlow(
  {
    name: 'jsaAnalysisFlow',
    inputSchema: JsaAnalysisInputSchema,
    outputSchema: JsaAnalysisOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
