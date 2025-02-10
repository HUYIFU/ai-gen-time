export type Message = {
  id: string;
  content: string;
  role: "user" | "assistant";
};

export type Conversation = {
  id: string;
  name?: string;
  messages: Message[];
};
