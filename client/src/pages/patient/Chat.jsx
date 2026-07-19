import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';
import ChatSidebar from '../../components/ChatSidebar';
import ChatBox from '../../components/ChatBox';
import { ChatProvider } from '../../context/ChatContext';
import './Chat.css';

export default function Chat() {
  return (
    <ChatProvider>
      <div className="patient-chat-page">
        <Navbar />
        <main className="patient-chat-main">
          <div className="patient-chat-shell">
            <ChatSidebar title="Doctor Messages" subtitle="Connect with your practitioners" />
            <ChatBox emptyStateText="Choose a conversation to start chatting." />
          </div>
        </main>
        <Footer />
      </div>
    </ChatProvider>
  );
}