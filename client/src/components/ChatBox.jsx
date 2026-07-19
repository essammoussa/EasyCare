import React from 'react';
import { useChat } from '../context/ChatContext';
import './ChatBox.css';
import { useRef } from 'react';
import { useEffect } from 'react';

export default function ChatBox({ emptyStateText = 'Choose a conversation to start chatting.' }) {
  const {
    activeConversation,
    messages,
    currentUserId,
    draft,
    setDraft,
    handleSendMessage,
    getPartnerName,
    getAppointmentLabel,
  } = useChat();

  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({behaviour: "smooth", block: "nearest"});
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  if (!activeConversation) {
    return (
      <section className="chat-panel">
        <div className="chat-empty-state">{emptyStateText}</div>
      </section>
    );
  }

  return (
    <section className="chat-panel">
      <div className="chat-panel-header">
        <h3>{getPartnerName(activeConversation)}</h3>
        <p>{getAppointmentLabel(activeConversation)}</p>
      </div>

      <div className="chat-messages">
        {messages.map((msg) => {
          const isMine = msg.senderId?._id === currentUserId || msg.senderId === currentUserId;
          return (
            <div key={msg._id} className={`chat-bubble ${isMine ? 'mine' : 'other'}`}>
                {!isMine && <div className="chat-item-avatar">
                    {getPartnerName(activeConversation).charAt(0).toUpperCase()}
                    </div>}
              <p>{msg.text}</p>
            </div>
          );
        })}
        {/* dummy element for scroll */}
        <div ref={messagesEndRef} />
      </div>

      <form className="chat-form" onSubmit={handleSendMessage}>
        <input
          type="text"
          placeholder="Write a message"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
        />
        <button type="submit">Send</button>
      </form>
    </section>
  );
}