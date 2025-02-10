"use client";

import { useViewless } from "@/app/services";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { Menu, Plus, Settings } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

export function Sidebar() {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const router = useRouter();
  const { AIStore } = useViewless();
  const { conversations } = AIStore;
  const isEmpty = conversations.length <= 0;

  return (
    <div
      className={cn(
        "relative h-full border-r bg-gray-50 transition-all duration-300",
        isCollapsed ? "w-[72px]" : "w-[260px]"
      )}
    >
      <div className="flex h-[60px] items-center justify-between px-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setIsCollapsed(!isCollapsed)}
        >
          <Menu className="h-6 w-6" />
        </Button>
        {!isCollapsed && (
          <Button
            variant="outline"
            className="flex w-full ml-2 justify-between"
            onClick={() => router.push("/")}
          >
            <span>新建对话</span>
            <Plus className="h-4 w-4" />
          </Button>
        )}
      </div>
      <ScrollArea className="h-[calc(100vh-60px)]">
        {isEmpty ? (
          <div className="px-2 py-2">暂未对话</div>
        ) : (
          <div className="px-2 py-2">
            {conversations.map((conversation, i) => (
              <Link
                key={i}
                href="#"
                className={cn(
                  "flex items-center px-2 py-2 rounded-lg text-sm hover:bg-gray-100",
                  i === 0 && "bg-gray-100"
                )}
              >
                {conversation.name || "未命名对话"}
              </Link>
            ))}
          </div>
        )}
      </ScrollArea>
      {!isCollapsed && (
        <div className="absolute bottom-4 left-4 right-4">
          <Button variant="outline" className="w-full justify-start">
            <Settings className="mr-2 h-4 w-4" />
            续订 Plus
          </Button>
        </div>
      )}
    </div>
  );
}
