import React from 'react';
import { useChat } from '../context/ChatContext';
import './ChatSidebar.css';

export default function ChatSidebar({ title, subtitle }) {
  const {
    conversations,
    activeConversation,
    setActiveConversation,
    loading,
    error,
    availableAppointments,
    showStartForm,
    setShowStartForm,
    selectedAppointmentId,
    setSelectedAppointmentId,
    startingConversation,
    startError,
    handleStartConversation,
    getPartnerName,
    getAppointmentLabel,
  } = useChat();

  return (
    <aside className="chat-sidebar">
      <div className="chat-sidebar-header">
        <h2>{title}</h2>
        <p>{subtitle}</p>
      </div>

      {availableAppointments.length > 0 && (
        <div className="chat-start-container">
          <button
            type="button"
            className="chat-start-button"
            onClick={() => setShowStartForm(!showStartForm)}
          >
            {showStartForm ? 'Cancel' : 'Start new conversation'}
          </button>

          {showStartForm && (
            <form className="chat-start-form" onSubmit={handleStartConversation}>
              <select
                value={selectedAppointmentId}
                onChange={(e) => setSelectedAppointmentId(e.target.value)}
              >
                <option value="">Select an appointment</option>
                {availableAppointments.map((app) => (
                  <option key={app.appointmentId} value={app.appointmentId}>
                    {app.label}
                  </option>
                ))}
              </select>
              <button type="submit" disabled={startingConversation}>
                {startingConversation ? 'Starting...' : 'Start'}
              </button>
            </form>
          )}

          {startError && <div className="chat-error-message">{startError}</div>}
          <hr className="chat-sidebar-divider" />
        </div>
      )}

      {loading ? (
        <div className="chat-status-message">Loading conversations...</div>
      ) : error ? (
        <div className="chat-error-message">{error}</div>
      ) : conversations.length === 0 ? (
        <div className="chat-status-message">No conversations yet.</div>
      ) : (
        <div className="chat-list">
          {conversations.map((conv) => {
            const partnerName = getPartnerName(conv);
            const label = getAppointmentLabel(conv);
            const isActive = activeConversation?._id === conv._id;

            return (
              <button
                key={conv._id}
                className={`chat-item ${isActive ? 'active' : ''}`}
                onClick={() => setActiveConversation(conv)}
                type="button"
              >
                <div className="chat-item-avatar">
                  {partnerName.charAt(0).toUpperCase()}
                </div>
                <div className="chat-item-details">
                  <strong>{partnerName}</strong>
                  <span>{label}</span>
                </div>
              </button>
            );
          })}
        </div>
      )}
    </aside>
  );
}