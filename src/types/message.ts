export type Message = {
  id: string;
  content: string;
  role: "user" | "assistant";
};

export type ConversationStatus =
  | "init"
  | "start"
  | "streaming"
  | "error"
  | "done";

export type Conversation = {
  id: string;
  name?: string;
  messages: Message[];
  status: ConversationStatus;
};
