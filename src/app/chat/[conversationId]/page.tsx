import { Conversation } from "@/components/conversation";
import { Sidebar } from "@/components/siderbar";

export default async function ConversationPage() {
  return (
    <div className="flex h-screen bg-white">
      <Sidebar />
      <main className="flex-1">
        <Conversation />
      </main>
    </div>
  );
}
