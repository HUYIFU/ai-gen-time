"use client";
import { createViewless } from "@/lib/view-less";
import { AIStore } from "./AIStore";
import { ConversationService } from "./ConversationService";

export const { Provider: ViewlessProvider, useViewless } = createViewless(
  { AIStore },
  { ConversationService }
);
