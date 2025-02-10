import { StartChat } from "@/components/start-chat";
import { Sidebar } from "@/components/siderbar";

export default function Home() {
  return (
    <div className="flex h-screen bg-white">
      <Sidebar />
      <main className="flex-1">
        <StartChat />
      </main>
    </div>
  );
}
