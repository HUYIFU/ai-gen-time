"use client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Mic, MoreHorizontal, SendHorizontal, Bot, User } from "lucide-react";
import { useState } from "react";
import { useViewless } from "@/app/services";
import { ReactTyped } from "react-typed";
// import { RenderMDX } from "./render-mdx";
import MarkdownRenderer from "./md/render-md";

export function Conversation() {
  const { AIStore, ConversationService } = useViewless();
  const { computed } = AIStore;
  const { conversation } = computed;
  const { messages = [], status } = conversation || {};
  const [input, setInput] = useState("");

  const sendMessage = async (userInput: string) => {
    setInput("");
    ConversationService.sendUserMessage(userInput);
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center h-[60px] px-4 border-b">
        <h1 className="text-xl font-semibold">ChatGPT</h1>
        <Button variant="ghost" size="icon" className="ml-auto">
          <MoreHorizontal className="h-6 w-6" />
        </Button>
      </div>
      <div className="p-7 flex-1 flex flex-col gap-5 max-h-[calc(100vh-40px)] overflow-y-auto">
        {messages.map((message) => (
          <div key={message.id} className="prose dark:prose-invert max-w-none">
            {message.role === "user" ? <User /> : <Bot />}
            <MarkdownRenderer md={message.content} />
          </div>
        ))}

        {status === "start" && (
          <div className="text-sm text-gray-500">
            <ReactTyped
              strings={["思考中..."]}
              typeSpeed={50}
              showCursor={true}
            />
          </div>
        )}
      </div>
      <div className="p-4 max-w-3xl mx-auto w-full">
        <div className="flex gap-2 items-center">
          <Input
            className="flex-1"
            placeholder="给 ChatGPT 发送消息"
            value={input}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                sendMessage(input);
              }
            }}
            onChange={(e) => setInput(e.target.value)}
          />
          <Button variant="ghost" size="icon">
            <Mic className="h-6 w-6" />
          </Button>
          <Button
            size="icon"
            onClick={() => sendMessage(input)}
            disabled={["streaming", "start"].includes(status)}
          >
            <SendHorizontal className="h-6 w-6" />
          </Button>
        </div>
      </div>
    </div>
  );
}
