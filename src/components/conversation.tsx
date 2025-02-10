"use client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Mic, MoreHorizontal, SendHorizontal } from "lucide-react";
import { useState } from "react";
import { useViewless } from "@/app/services";
import ReactMarkdown from "react-markdown";

export function Conversation() {
  const { AIStore, ConversationService } = useViewless();
  const { computed } = AIStore;
  const { conversation } = computed;
  const { messages = [] } = conversation || {};
  const [input, setInput] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);

  const sendMessage = async (userInput: string) => {
    setInput("");
    setIsStreaming(true);
    ConversationService.sendUserMessage(userInput);
    setIsStreaming(false);
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center h-[60px] px-4 border-b">
        <h1 className="text-xl font-semibold">ChatGPT</h1>
        <Button variant="ghost" size="icon" className="ml-auto">
          <MoreHorizontal className="h-6 w-6" />
        </Button>
      </div>
      <div className="p-4 flex-1 flex flex-col gap-3">
        {messages.map((message) => (
          <div key={message.id} className="prose dark:prose-invert max-w-none">
            <ReactMarkdown>{message.content}</ReactMarkdown>
          </div>
        ))}
      </div>
      <div className="p-4 max-w-3xl mx-auto w-full">
        <div className="flex gap-2 items-center">
          <Input
            className="flex-1"
            placeholder="给 ChatGPT 发送消息"
            value={input}
            onChange={(e) => setInput(e.target.value)}
          />
          <Button variant="ghost" size="icon">
            <Mic className="h-6 w-6" />
          </Button>
          <Button
            size="icon"
            onClick={() => sendMessage(input)}
            disabled={isStreaming}
          >
            <SendHorizontal className="h-6 w-6" />
          </Button>
        </div>
      </div>
    </div>
  );
}
