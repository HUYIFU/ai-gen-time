"use client";
/* eslint-disable @typescript-eslint/no-unused-vars */
// import produce from "immer";
import { Conversation, Message } from "@/types";
import { produce } from "immer";
// import { devtools } from "zustand/middleware";

/**
 * state定义
 * 通过如下方式可以不用定义interface就具有类型提示
 */
type AIArtifactStoreSliceState = ReturnType<typeof AIStoreSlice>;
type AIStoreState = AIArtifactStoreSliceState;

/**
 * 状态切片
 * 仅定义状态和对状态的同步修改
 */
function AIStoreSlice(
  set: (obj: Partial<AIStoreState>) => void,
  get: () => AIStoreState
) {
  return {
    conversations: [] as Conversation[],
    currentConversationId: "",

    setCurrentConversationId: (id: string) => {
      set({ currentConversationId: id });
    },
    setConversations: (conversations: Conversation[]) => {
      set({ conversations });
    },
    setMessages: (messages: Message[]) => {
      const { conversations, currentConversationId } = get();
      const newConversations = produce(conversations, (draft) => {
        const conversation = draft.find(
          (conversation: Conversation) =>
            conversation.id === currentConversationId
        );
        if (conversation) {
          conversation.messages = messages;
        }
      });
      set({ conversations: newConversations });
    },
    /**
     * 计算属性
     */
    computed: {
      get conversation() {
        const { conversations } = get();
        return conversations.find(
          (conversation: Conversation) =>
            conversation.id === get().currentConversationId
        ) as Conversation;
      },
    },
  };
}

export function AIStore(
  set: (obj: Partial<ReturnType<typeof AIStoreSlice>>) => void,
  get: () => ReturnType<typeof AIStoreSlice>
) {
  return {
    ...AIStoreSlice(set, get),
  };
}

export type AIStore = ReturnType<typeof AIStore>;
