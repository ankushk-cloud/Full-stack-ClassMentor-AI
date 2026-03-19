import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { chatAPI } from '../services/api';
import ChatSidebar from '../components/ChatSidebar';
import MessageList from '../components/MessageList';
import MessageInput from '../components/MessageInput';
import LogoutButton from '../components/LogoutButton';
import ThemeToggle from '../components/ThemeToggle';
import UserAvatar from '../components/UserAvatar';

const Chat = () => {
  const { user } = useAuth();
  const { theme, themeMode } = useTheme();
  const navigate = useNavigate();
  const [chats, setChats] = useState([]);
  const [currentChat, setCurrentChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const [searchQuery, setSearchQuery] = useState('');

  const fetchChats = useCallback(async (search) => {
    try {
      const res = await chatAPI.getChats(search || undefined);
      setChats(res.data);
    } catch (err) {
      setError('Failed to load chats');
    }
  }, []);

  useEffect(() => {
    fetchChats(searchQuery);
  }, [fetchChats, searchQuery]);

  useEffect(() => {
    if (currentChat) {
      setMessages(currentChat.messages || []);
    } else {
      setMessages([]);
    }
  }, [currentChat]);

  const handleNewChat = async () => {
    try {
      setError('');
      const res = await chatAPI.createChat();
      setCurrentChat(res.data);
      setChats((prev) => [res.data, ...prev]);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create chat');
    }
  };

  const handleSelectChat = async (chatId) => {
    if (currentChat?._id === chatId) return;
    try {
      setError('');
      const res = await chatAPI.getChat(chatId);
      setCurrentChat(res.data);
    } catch (err) {
      setError('Failed to load chat');
    }
  };

  const handleSendMessage = async (content) => {
    let chatId = currentChat?._id;

    if (!chatId) {
      try {
        const res = await chatAPI.createChat();
        chatId = res.data._id;
        setCurrentChat(res.data);
        setChats((prev) => [res.data, ...prev]);
      } catch (err) {
        setError('Failed to create chat');
        return;
      }
    }

    setMessages((prev) => [...prev, { role: 'user', content }]);
    setIsLoading(true);
    setError('');

    try {
      const res = await chatAPI.sendMessage(chatId, content);
      setMessages((prev) => [
        ...prev,
        { ...res.data.assistantMessage, _id: res.data.assistantMessage._id || Date.now() },
      ]);
      setCurrentChat((prev) => ({
        ...prev,
        messages: [
          ...(prev?.messages || []),
          res.data.userMessage,
          res.data.assistantMessage,
        ],
      }));
      fetchChats(searchQuery);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to send message');
      setMessages((prev) => prev.slice(0, -1));
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteChat = async (chatId) => {
    try {
      await chatAPI.deleteChat(chatId);
      setChats((prev) => prev.filter((c) => c._id !== chatId));
      if (currentChat?._id === chatId) {
        setCurrentChat(null);
        setMessages([]);
      }
    } catch (err) {
      setError('Failed to delete chat');
    }
  };

  const styles = {
    container: {
      display: 'flex',
      height: '100vh',
      overflow: 'hidden',
      background: theme.bg,
    },
    main: {
      flex: 1,
      display: 'flex',
      flexDirection: 'column',
      minWidth: 0,
      minHeight: 0,
      overflow: 'hidden',
    },
    header: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: '16px 24px',
      borderBottom: `1px solid ${theme.border}`,
    },
    logo: { fontSize: 20, fontWeight: 600, color: theme.text },
    sidebarFooter: {
      display: 'flex',
      flexDirection: 'column',
      gap: 12,
    },
    sidebarFooterRow: { display: 'flex', alignItems: 'center', gap: 8 },
    sidebarNavBtn: {
      flex: 1,
      padding: '10px 12px',
      background: 'transparent',
      border: `1px solid ${theme.border}`,
      color: theme.text,
      borderRadius: 8,
      cursor: 'pointer',
      fontSize: 14,
    },
    sidebarUserRow: {
      flex: 1,
      display: 'flex',
      alignItems: 'center',
      gap: 10,
      padding: '8px 12px',
      margin: '0 -4px 0 0',
      borderRadius: 8,
      cursor: 'pointer',
      border: 'none',
      background: 'transparent',
      minWidth: 0,
      textAlign: 'left',
    },
    sidebarUserName: { flex: 1, fontSize: 14, color: theme.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' },
    sidebarLogoutBtn: {
      padding: '8px 12px',
      background: 'transparent',
      border: `1px solid ${theme.border}`,
      color: theme.text,
      borderRadius: 8,
      cursor: 'pointer',
      fontSize: 14,
    },
    errorBanner: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '12px 24px',
      background: themeMode === 'light' ? '#ffebe9' : '#3d1f1f',
      color: theme.error,
      borderBottom: `1px solid ${theme.border}`,
    },
    errorClose: {
      background: 'none',
      border: 'none',
      color: theme.error,
      fontSize: 20,
      cursor: 'pointer',
    },
  };

  return (
    <div style={styles.container}>
      <ChatSidebar
        chats={chats}
        currentChatId={currentChat?._id}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        onSelectChat={handleSelectChat}
        onNewChat={handleNewChat}
        onDeleteChat={handleDeleteChat}
        footer={
          <div style={styles.sidebarFooter}>
            <div style={styles.sidebarFooterRow}>
              <ThemeToggle />
              <button onClick={() => navigate('/')} style={styles.sidebarNavBtn}>
                Home
              </button>
            </div>
            <div style={styles.sidebarFooterRow}>
              <button
                type="button"
                onClick={() => navigate('/profile')}
                style={styles.sidebarUserRow}
                onMouseEnter={(e) => { e.currentTarget.style.background = theme.surfaceHover; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
                title="Profile"
              >
                <UserAvatar name={user?.name} size={36} />
                <span style={styles.sidebarUserName} title={user?.name}>{user?.name}</span>
              </button>
              <LogoutButton style={styles.sidebarLogoutBtn} />
            </div>
          </div>
        }
      />
      <div style={styles.main}>
        <header style={styles.header}>
          <h1 style={styles.logo}>classMentor AI</h1>
        </header>
        {error && (
          <div style={styles.errorBanner}>
            {error}
            <button onClick={() => setError('')} style={styles.errorClose}>
              ×
            </button>
          </div>
        )}
        <MessageList messages={messages} isLoading={isLoading} />
        <MessageInput onSend={handleSendMessage} disabled={isLoading} />
      </div>
    </div>
  );
};

export default Chat;
