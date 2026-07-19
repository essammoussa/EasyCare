// src/context/ChatContext.jsx
import { createContext, useContext, useState, useEffect, useRef } from 'react';
import { io } from 'socket.io-client';
import useAuth from '../hooks/useAuth';
import { 
  getChatConversations, 
  getChatMessages, 
  getOrCreateChatConversation, 
  sendChatMessage, 
  markChatMessagesRead, 
  getUserAppointments 
} from '../services/api';

const ChatContext = createContext(null);

export function ChatProvider({ children }) {
  const { user } = useAuth();
  const userRole = user?.role; // 'patient' or 'doctor'

  const [conversations, setConversations] = useState([]);
  const [activeConversation, setActiveConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [draft, setDraft] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [availableAppointments, setAvailableAppointments] = useState([]);
  const [showStartForm, setShowStartForm] = useState(false);
  const [selectedAppointmentId, setSelectedAppointmentId] = useState('');
  const [startingConversation, setStartingConversation] = useState(false);
  const [startError, setStartError] = useState('');

  // Keeps a single socket connection instance across context lifecycle re-renders
  const socketRef = useRef(null);

  // 1. Establish Secure Real-time Socket Connection
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!user?._id || !token) return;

    // Connect to the server passing the token via handshake auth
    socketRef.current = io('http://localhost:5000', {
      auth: { token }
    });

    // Listen for incoming messages broadcasted from the server
    socketRef.current.on('receiveMessage', (newMessage) => {
      setActiveConversation((currentActive) => {
        // If the message is part of the currently active thread, append it instantly
        if (currentActive && currentActive._id === newMessage.conversationId) {
          setMessages((prev) => {
            if (prev.some((m) => m._id === newMessage._id)) return prev;
            return [...prev, newMessage];
          });
          
          // Emit back that we read it immediately since the thread is open
          socketRef.current.emit('markRead', { conversationId: currentActive._id });
          markChatMessagesRead(currentActive._id).catch(console.error);
        } else {
          // If the message is for a background conversation, increment its unread count
          setConversations((prevConvs) =>
            prevConvs.map((conv) => {
              if (conv._id === newMessage.conversationId) {
                return {
                  ...conv,
                  unreadCountPatient: userRole === 'patient' ? (conv.unreadCountPatient || 0) + 1 : conv.unreadCountPatient,
                  unreadCountDoctor: userRole === 'doctor' ? (conv.unreadCountDoctor || 0) + 1 : conv.unreadCountDoctor,
                };
              }
              return conv;
            })
          );
        }
        return currentActive;
      });
    });

    // Listen for read updates from the opposing participant
    socketRef.current.on('messagesRead', (payload) => {
      setActiveConversation((currentActive) => {
        if (currentActive && currentActive._id === payload.conversationId) {
          // You can use this block later to update checkmarks or message ticks if required
          console.log('Opposite user read the thread messages');
        }
        return currentActive;
      });
    });

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, [user, userRole]);

  // 2. Room Orchestration on Active Conversation Shift
  useEffect(() => {
    if (!activeConversation?._id || !socketRef.current) return;

    // Direct the socket engine to join this conversational stream room
    socketRef.current.emit('joinConversation', activeConversation._id);

    // Notify the room that we have opened and read this conversation thread
    socketRef.current.emit('markRead', { conversationId: activeConversation._id });

    // Optimistically clear the visual unread badges in the sidebar list locally
    setConversations((prev) =>
      prev.map((conv) => {
        if (conv._id === activeConversation._id) {
          return {
            ...conv,
            unreadCountPatient: userRole === 'patient' ? 0 : conv.unreadCountPatient,
            unreadCountDoctor: userRole === 'doctor' ? 0 : conv.unreadCountDoctor,
          };
        }
        return conv;
      })
    );
  }, [activeConversation, userRole]);

  // 3. Load Conversations list & Appointments lookup meta
  useEffect(() => {
    const loadChatData = async () => {
      try {
        const [{ data: conversationsData }, { data: appointmentsData }] = await Promise.all([
          getChatConversations(),
          getUserAppointments(),
        ]);
        
        setConversations(conversationsData || []);
        
        const options = (appointmentsData || [])
          .filter((app) => app.status !== 'cancelled')
          .map((app) => {
            const partnerId = userRole === 'doctor' 
              ? (app.patientId?._id || app.patientId)
              : (app.doctorId?.userId?._id || app.doctorId?.userId || app.doctorId);
            
            const partnerName = userRole === 'doctor' ? (app.patientId?.name || 'Patient') : (app.doctorId?.name || 'Doctor');
            const dateLabel = app.bookingId?.slotId?.startTime || app._id.slice(-4);

            return { appointmentId: app._id, partnerId, label: `${partnerName} • ${dateLabel}` };
          });

        setAvailableAppointments(options);
        if (conversationsData?.length) {
          setActiveConversation(conversationsData[0]);
        }
      } catch (err) {
        setError('Failed to load chat data.');
      } finally {
        setLoading(false);
      }
    };

    if (userRole) loadChatData();
  }, [userRole]);

  // 4. Load initial messages history block for selected room
  useEffect(() => {
    const loadMessages = async () => {
      if (!activeConversation?._id) return;
      try {
        const { data } = await getChatMessages(activeConversation._id);
        setMessages(data || []);
        await markChatMessagesRead(activeConversation._id);
      } catch (err) {
        console.error('Error syncing message list:', err);
      }
    };
    loadMessages();
  }, [activeConversation]);

  // 5. Handlers: Save Message via API and emit event via WebSockets
  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!draft.trim() || !activeConversation?._id) return;

    try {
      const { data: savedMessage } = await sendChatMessage({
        conversationId: activeConversation._id,
        text: draft.trim(),
      });

      // Append local message array state instantly
      setMessages((prev) => [...prev, savedMessage]);
      setDraft('');

      // Emit payload to the socket room so the recipient gets it in real time
      if (socketRef.current) {
        socketRef.current.emit('sendMessage', savedMessage);
      }
    } catch (err) {
      console.error('Message delivery failed:', err);
    }
  };

  const handleStartConversation = async (e) => {
    e.preventDefault();
    if (!selectedAppointmentId) return;

    setStartingConversation(true);
    setStartError('');

    try {
      const targetedApp = availableAppointments.find((a) => a.appointmentId === selectedAppointmentId);
      const { data } = await getOrCreateChatConversation(targetedApp.partnerId, targetedApp.appointmentId);
      
      if (!conversations.some((c) => c._id === data._id)) {
        setConversations((prev) => [data, ...prev]);
      }
      
      setActiveConversation(data);
      setShowStartForm(false);
      setSelectedAppointmentId('');
    } catch (err) {
      setStartError('Could not start conversation.');
    } finally {
      setStartingConversation(false);
    }
  };

  const getPartnerName = (conv) => {
    if (!conv) return '';
    return userRole === 'doctor' ? (conv.patientId?.name || 'Patient') : (conv.doctorId?.name || 'Doctor');
  };

  const getAppointmentLabel = (conv) => {
    return conv?.appointmentId?.bookingId?.slotId?.startTime 
      ? `Appointment • ${conv.appointmentId.bookingId.slotId.startTime}` 
      : 'Appointment Chat';
  };

  return (
    <ChatContext.Provider
      value={{
        userRole,
        currentUserId: user?._id,
        conversations,
        activeConversation,
        setActiveConversation,
        messages,
        draft,
        setDraft,
        loading,
        error,
        availableAppointments,
        showStartForm,
        setShowStartForm,
        selectedAppointmentId,
        setSelectedAppointmentId,
        startingConversation,
        startError,
        handleSendMessage,
        handleStartConversation,
        getPartnerName,
        getAppointmentLabel,
      }}
    >
      {children}
    </ChatContext.Provider>
  );
}

export const useChat = () => useContext(ChatContext);