"use client";
import { inject, injectable } from "inversify";
import { type AIStore } from "./AIStore";
import { Conversation, ConversationStatus, Message } from "@/types";
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
      status: "init",
    };

    this.aiStore.setCurrentConversationId(conversationId);
    this.aiStore.setConversations([
      ...this.aiStore.conversations,
      newConversation,
    ]);

    return conversationId;
  }

  private updateConversationStatus(
    conversationId: string,
    status: ConversationStatus
  ) {
    this.aiStore.setConversations(
      this.aiStore.conversations.map((conversation) => ({
        ...conversation,
        status:
          conversation.id === conversationId ? status : conversation.status,
      }))
    );
  }

  public async sendUserMessage(userInput: string): Promise<void> {
    const { conversation } = this.aiStore.computed;
    const { messages = [] } = conversation || {};
    const newMessages = [...messages];
    // 使用一个临时变量来存储累积的内容
    let accumulatedContent = "";
    const assistantMessageId = generateUniqueId();

    if (messages[messages.length - 1].role !== "user") {
      const newMessage: Message = {
        id: generateUniqueId(),
        content: userInput,
        role: "user",
      };
      newMessages.push(newMessage);
      this.aiStore.setMessages(newMessages);
    }

    try {
      // 开始流式响应
      this.updateConversationStatus(conversation.id, "start");
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "text/event-stream",
        },
        body: JSON.stringify({ messages: newMessages }),
      });

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();

      if (!reader) {
        throw new Error("No reader available");
      }
      while (true) {
        this.updateConversationStatus(conversation.id, "streaming");
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
              if (text === "[DONE]") {
                this.updateConversationStatus(conversation.id, "done");
                break;
              }
              accumulatedContent += text;
              const updatedAssistantMessage: Message = {
                id: assistantMessageId,
                content: accumulatedContent,
                role: "assistant",
              };
              this.aiStore.setMessages([
                ...newMessages,
                updatedAssistantMessage,
              ]);
            } catch (e) {
              console.error("Error parsing SSE data:", e);
            }
          }
        }
      }
      this.updateConversationStatus(conversation.id, "done");
    } catch (error) {
      console.error("Error during SSE:", error);
      this.updateConversationStatus(conversation.id, "error");
      // 处理错误情况
    }
  }
}
