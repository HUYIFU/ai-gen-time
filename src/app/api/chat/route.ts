import { NextRequest } from "next/server";
import OpenAI from "openai";

console.log(process.env.DEEPSEEK_API_KEY);
// 初始化 OpenAI 客户端
const openai = new OpenAI({
  apiKey: process.env.DEEPSEEK_API_KEY,
  baseURL: "https://api.deepseek.com",
});

export async function POST(req: NextRequest) {
  const encoder = new TextEncoder();
  const { messages } = await req.json();

  const stream = new TransformStream();
  const writer = stream.writable.getWriter();

  const writeChunk = async (text: string) => {
    await writer.write(encoder.encode(`data: ${JSON.stringify({ text })}\n\n`));
  };

  (async () => {
    try {
      // 调用 OpenAI API
      const completion = await openai.chat.completions.create({
        model: "deepseek-chat",
        messages: [
          {
            role: "system",
            content: "You are a helpful assistant. 请使用中文回答",
          },
          ...messages,
        ],
        stream: true,
      });

      // 处理流式响应
      for await (const chunk of completion) {
        const content = chunk.choices[0]?.delta?.content || "";
        if (content) {
          await writeChunk(content);
        }
      }

      await writeChunk("[DONE]");
    } catch (error) {
      console.error("Error:", error);
      await writeChunk("[Error] Something went wrong");
    } finally {
      try {
        await writer.close();
      } catch (error) {
        console.error("Error closing writer:", error);
      }
    }
  })();

  return new Response(stream.readable, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}
