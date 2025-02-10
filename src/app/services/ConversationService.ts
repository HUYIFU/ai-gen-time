"use client";
import { inject, injectable } from "inversify";
import { type AIStore } from "./AIStore";
import { Conversation, Message } from "@/types";
import { generateUniqueId } from "@/utils/unique";

@injectable()
export class ConversationService {
  constructor(@inject("AIStore") private readonly aiStore: AIStore) {}
  public getConversations() {
    return this.aiStore.conversations;
  }

  public startConversation(userInput: string): string {
    console.log("startConversation", userInput);

    const conversationId = generateUniqueId();
    const newConversation: Conversation = {
      id: conversationId,
      name: "未命名对话",
      messages: [{ id: generateUniqueId(), content: userInput, role: "user" }],
    };

    this.aiStore.setCurrentConversationId(conversationId);
    this.aiStore.setConversations([
      ...this.aiStore.conversations,
      newConversation,
    ]);

    return conversationId;
  }

  public async sendUserMessage(userInput: string): Promise<void> {
    const { conversation } = this.aiStore.computed;
    const { messages = [] } = conversation || {};

    // 使用一个临时变量来存储累积的内容
    let accumulatedContent = "";
    const assistantMessageId = generateUniqueId();

    if (messages[messages.length - 1].role !== "user") {
      const newMessage: Message = {
        id: generateUniqueId(),
        content: userInput,
        role: "user",
      };
      this.aiStore.setMessages([...messages, newMessage]);
    }

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "text/event-stream",
        },
        body: JSON.stringify({ messages }),
      });

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();

      if (!reader) {
        throw new Error("No reader available");
      }

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        // 将chunk按行分割并处理每一行
        const lines = chunk.split("\n").filter((line) => line.trim() !== "");
        for (const line of lines) {
          if (line.startsWith("data: ")) {
            try {
              const jsonStr = line.slice(6); // 移除 'data: ' 前缀
              const { text } = JSON.parse(jsonStr);
              accumulatedContent += text;
              const updatedAssistantMessage: Message = {
                id: assistantMessageId,
                content: accumulatedContent,
                role: "assistant",
              };
              this.aiStore.setMessages([...messages, updatedAssistantMessage]);
            } catch (e) {
              console.error("Error parsing SSE data:", e);
            }
          }
        }
      }
    } catch (error) {
      console.error("Error during SSE:", error);
      // 处理错误情况
    }
  }
}
