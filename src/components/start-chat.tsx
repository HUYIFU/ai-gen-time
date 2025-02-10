"use client";
import { useViewless } from "@/app/services";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Globe,
  Image,
  Mic,
  MoreHorizontal,
  Pin,
  SendHorizontal,
  Share2,
} from "lucide-react";
import { useState } from "react";
import { useRouter } from "next/navigation";

const quickActions = [
  {
    icon: <Image className="w-4 h-4" />,
    label: "创建图片",
  },
  {
    icon: <Share2 className="w-4 h-4" />,
    label: "分析图片",
  },
  {
    icon: <Pin className="w-4 h-4" />,
    label: "拾遗",
  },
  {
    icon: <Globe className="w-4 h-4" />,
    label: "给我秘密",
  },
  {
    icon: <Share2 className="w-4 h-4" />,
    label: "提供建议",
  },
];

// const client = new OpenAI({
//   apiKey: "sk-4d0397a77dcd4acab3df8024f6a03a50",
//   baseURL: "https://api.deepseek.com",
//   dangerouslyAllowBrowser: true,
// });

export function StartChat() {
  const [input, setInput] = useState("");
  const { ConversationService } = useViewless();
  const router = useRouter();

  const handleSend = async () => {
    const conversationId = ConversationService.startConversation(input);
    router.push(`/chat/${conversationId}`);
    ConversationService.sendUserMessage(input);
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center h-[60px] px-4 border-b">
        <h1 className="text-xl font-semibold">GuYueGPT</h1>
        <Button variant="ghost" size="icon" className="ml-auto">
          <MoreHorizontal className="h-6 w-6" />
        </Button>
      </div>
      <div className="flex-1 flex flex-col justify-center items-center translate-y-[-10%]">
        <div className="p-4">
          <div className="max-w-2xl mx-auto">
            <div className="text-center">
              <h2 className="text-2xl font-semibold mt-8 mb-8">
                有什么可以帮忙的？
              </h2>
            </div>
          </div>
        </div>
        <div className="p-4 max-w-3xl mx-auto w-full">
          <div className="flex flex-wrap gap-2 justify-center mb-4">
            {quickActions.map((action, i) => (
              <Button
                key={i}
                variant="outline"
                className="flex items-center gap-2"
              >
                {action.icon}
                {action.label}
              </Button>
            ))}
            <Button variant="outline">更多</Button>
          </div>
          <div className="flex gap-2 items-center">
            <Input
              className="flex-1"
              placeholder="给GPT发送消息"
              value={input}
              onChange={(e) => setInput(e.target.value)}
            />
            <Button variant="ghost" size="icon">
              <Mic className="h-6 w-6" />
            </Button>
            <Button size="icon" onClick={handleSend}>
              <SendHorizontal className="h-6 w-6" />
            </Button>
          </div>
          <p className="text-center text-sm text-gray-500 mt-4">
            GuYueGPT 可可能会犯错，请核实重要信息。
          </p>
        </div>
      </div>
    </div>
  );
}
