'use server';
/**
 * @fileOverview An AI agent for generating Toolbox Talk content.
 *
 * - generateToolboxTalk - A function that handles the content generation.
 * - ToolboxTalkInput - The input type for the generateToolboxTalk function.
 * - ToolboxTalkOutput - The return type for the generateToolboxTalk function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const ToolboxTalkInputSchema = z.object({
  topic: z.string().describe('The topic for the toolbox talk.'),
});
export type ToolboxTalkInput = z.infer<typeof ToolboxTalkInputSchema>;

const ToolboxTalkOutputSchema = z.object({
  content: z.string().describe('The generated content for the toolbox talk, including key points, hazards, and best practices. Should be formatted for a textarea.'),
});
export type ToolboxTalkOutput = z.infer<typeof ToolboxTalkOutputSchema>;

export async function generateToolboxTalk(input: ToolboxTalkInput): Promise<ToolboxTalkOutput> {
  return toolboxTalkFlow(input);
}

const prompt = ai.definePrompt({
  name: 'toolboxTalkPrompt',
  input: {schema: ToolboxTalkInputSchema},
  output: {schema: ToolboxTalkOutputSchema},
  system: `You are a world-class safety professional responsible for creating concise and effective toolbox talks.

Given a topic, you will generate the content for a toolbox talk. The content should be structured with clear headings for:
1.  Key Discussion Points
2.  Potential Hazards
3.  Best Practices / Controls

The output should be a single block of text, well-formatted to be pasted directly into a textarea for the "General Topics Discussed" section of a form. Use markdown-style headings (e.g., "**Key Discussion Points**").`,
  prompt: `Generate a toolbox talk about the following topic: {{{topic}}}`,
});

const toolboxTalkFlow = ai.defineFlow(
  {
    name: 'toolboxTalkFlow',
    inputSchema: ToolboxTalkInputSchema,
    outputSchema: ToolboxTalkOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
