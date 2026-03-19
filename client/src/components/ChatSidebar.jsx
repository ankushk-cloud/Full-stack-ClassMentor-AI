import React, { useState } from 'react';
import { useTheme } from '../context/ThemeContext';

const ChatSidebar = ({ chats, currentChatId, searchQuery, onSearchChange, onSelectChat, onNewChat, onDeleteChat, footer }) => {
  const { theme } = useTheme();
  const [chatIdToDelete, setChatIdToDelete] = useState(null);

  const handleDeleteClick = (e, chatId) => {
    e.stopPropagation();
    setChatIdToDelete(chatId);
  };

  const handleConfirmDelete = () => {
    if (chatIdToDelete) {
      onDeleteChat(chatIdToDelete);
      setChatIdToDelete(null);
    }
  };

  const handleCancelDelete = () => setChatIdToDelete(null);

  const styles = {
    sidebar: {
      width: 260,
      minWidth: 260,
      height: '100vh',
      borderRight: `1px solid ${theme.border}`,
      display: 'flex',
      flexDirection: 'column',
      background: theme.bg,
      flexShrink: 0,
    },
    newChatBtn: {
      margin: 16,
      padding: 12,
      border: `1px dashed ${theme.border}`,
      background: 'transparent',
      color: theme.text,
      borderRadius: 8,
      cursor: 'pointer',
      fontSize: 14,
    },
    searchInput: {
      margin: '0 16px 12px',
      padding: '10px 12px',
      borderRadius: 8,
      border: `1px solid ${theme.border}`,
      background: theme.surface,
      color: theme.text,
      fontSize: 14,
    },
    chatList: { flex: 1, overflowY: 'auto', padding: '0 8px', minHeight: 0 },
    footer: {
      flexShrink: 0,
      borderTop: `1px solid ${theme.border}`,
      padding: 16,
    },
    empty: { color: theme.textMuted, padding: 16, fontSize: 14 },
    chatItem: { display: 'flex', alignItems: 'center', marginBottom: 4, borderRadius: 8 },
    chatItemActive: { background: theme.surfaceHover },
    chatItemBtn: {
      flex: 1,
      padding: '10px 12px',
      textAlign: 'left',
      background: 'none',
      border: 'none',
      color: theme.text,
      cursor: 'pointer',
      fontSize: 14,
      overflow: 'hidden',
      textOverflow: 'ellipsis',
      whiteSpace: 'nowrap',
    },
    deleteBtn: {
      padding: '4px 8px',
      background: 'none',
      border: 'none',
      color: theme.textMuted,
      cursor: 'pointer',
      fontSize: 18,
      opacity: 0.6,
    },
    overlay: {
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: theme.overlay,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
    },
    modal: {
      background: theme.modalBg,
      border: `1px solid ${theme.border}`,
      borderRadius: 12,
      padding: 24,
      maxWidth: 360,
      width: '90%',
    },
    modalMessage: { margin: '0 0 24px 0', fontSize: 16, color: theme.text },
    modalActions: { display: 'flex', gap: 12, justifyContent: 'flex-end' },
    cancelBtn: {
      padding: '10px 20px',
      background: 'transparent',
      border: `1px solid ${theme.border}`,
      color: theme.text,
      borderRadius: 8,
      cursor: 'pointer',
      fontSize: 14,
    },
    confirmDeleteBtn: {
      padding: '10px 20px',
      background: theme.error || '#cf2222',
      border: 'none',
      color: 'white',
      borderRadius: 8,
      cursor: 'pointer',
      fontSize: 14,
    },
  };

  return (
    <aside style={styles.sidebar}>
      <button onClick={onNewChat} style={styles.newChatBtn}>
        + New Chat
      </button>
      <input
        type="text"
        placeholder="Search chats..."
        value={searchQuery}
        onChange={(e) => onSearchChange(e.target.value)}
        style={styles.searchInput}
      />
      <div style={styles.chatList}>
        {chats.length === 0 ? (
          <p style={styles.empty}>{searchQuery ? 'No chats match your search' : 'No chats yet'}</p>
        ) : (
          chats.map((chat) => (
            <div
              key={chat._id}
              style={{
                ...styles.chatItem,
                ...(currentChatId === chat._id ? styles.chatItemActive : {}),
              }}
            >
              <button
                onClick={() => onSelectChat(chat._id)}
                style={styles.chatItemBtn}
                title={chat.title}
              >
                {chat.title || 'New Chat'}
              </button>
              <button
                onClick={(e) => handleDeleteClick(e, chat._id)}
                style={styles.deleteBtn}
                title="Delete chat"
              >
                ×
              </button>
            </div>
          ))
        )}
      </div>
      {footer && <div style={styles.footer}>{footer}</div>}
      {chatIdToDelete && (
        <div style={styles.overlay} onClick={handleCancelDelete}>
          <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
            <p style={styles.modalMessage}>Are you sure you want to delete this chat?</p>
            <div style={styles.modalActions}>
              <button onClick={handleCancelDelete} style={styles.cancelBtn}>
                Cancel
              </button>
              <button onClick={handleConfirmDelete} style={styles.confirmDeleteBtn}>
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </aside>
  );
};

export default ChatSidebar;
