import { useState } from 'react';
import { ChatProvider } from '../../context/ChatContext';
import DoctorSidebar from '../../components/DoctorSidebar';
import DoctorHeader from '../../components/DoctorHeader';
import ChatSidebar from '../../components/ChatSidebar';
import ChatBox from '../../components/ChatBox';
import './DoctorChat.css';

export default function DoctorChat() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <ChatProvider>
      <div className="doctor-page-wrapper">
        <DoctorSidebar activePage="chat" isOpen={mobileMenuOpen} onClose={() => setMobileMenuOpen(false)} />
        <div className="doctor-content">
          <DoctorHeader onMenuClick={() => setMobileMenuOpen(true)} />
          <main className="doctor-main doctor-chat-main">
            <div className="doctor-chat-shell">
              <ChatSidebar title="Patient Messages" subtitle="Secure follow-up conversations" />
              <ChatBox emptyStateText="Select a conversation to reply." />
            </div>
          </main>
        </div>
      </div>
    </ChatProvider>
  );
}