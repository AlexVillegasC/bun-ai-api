import { Groq } from 'groq-sdk';
import type { AIService, ChatMessage } from '../types';

const groq = new Groq();

export const groqService: AIService = {
  name: 'Groq',
  async chat(messages: ChatMessage[]) {
    const chatCompletion = await groq.chat.completions.create({
      messages,
      model: process.env.GROQ_MODEL ?? 'openai/gpt-oss-120b',
      temperature: 0.6,
      max_completion_tokens: 4096,
      top_p: 1,
      stream: true,
      stop: null
    });
    
    return (async function* () {
      for await (const chunk of chatCompletion) {
        yield chunk.choices[0]?.delta?.content || ''
      }
    })()
  }
}

