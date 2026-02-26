import { groqService } from './services/groq';
import { cerebrasService } from './services/cerebras';
import type { AIService, ChatMessage } from './types';

const services: AIService[] = [
  groqService,
  cerebrasService,
  // Google Gemini
  // OpenRouter
  // otro servicio incluso local
]
let currentServiceIndex = 0;

function getNextService() {
  const service = services[currentServiceIndex];
  currentServiceIndex = (currentServiceIndex + 1) % services.length;
  return service;
}

const server = Bun.serve({
  port: process.env.PORT ?? 3000,
  async fetch(req) {
    const { pathname } = new URL(req.url)

    if (req.method === 'POST' && pathname === '/chat/complete') {
      const { messages } = await req.json() as { messages: ChatMessage[] };
      for (const service of services) {
        try {
          const stream = await service.chat(messages);
          let text = '';
          for await (const chunk of stream) text += chunk;
          console.log(`/chat/complete served by ${service.name}`);
          return Response.json({ text });
        } catch (err) {
          console.error(`${service.name} failed:`, err);
        }
      }
      return Response.json(
        { text: "Lo siento, no pude procesar tu solicitud en este momento. Por favor intenta de nuevo más tarde." },
        { status: 503 }
      );
    }

    if (req.method === 'POST' && pathname === '/chat') {
      const { messages } = await req.json() as { messages: ChatMessage[] };
      const service = getNextService();

      console.log(`Using ${service?.name} service`);
      const stream = await service?.chat(messages)

      return new Response(stream, {
        headers: {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          'Connection': 'keep-alive',
        },
      });
    }

    return new Response("Not found", { status: 404 });
  }
})

console.log(`Server is running on ${server.url}`);