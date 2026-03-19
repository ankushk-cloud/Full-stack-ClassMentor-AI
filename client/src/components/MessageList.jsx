import React, { useRef, useEffect } from 'react';
import { useTheme } from '../context/ThemeContext';
import ChatBubble from './ChatBubble';

const MessageList = ({ messages, isLoading }) => {
  const { theme } = useTheme();
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const styles = {
    container: { flex: 1, overflowY: 'auto', padding: 24 },
    empty: {
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: 300,
      gap: 8,
    },
    emptyTitle: { fontSize: 28, fontWeight: 500, color: theme.text },
    emptySubtitle: { color: theme.textMuted, fontSize: 16 },
    messages: { maxWidth: 800, margin: '0 auto' },
    loading: { display: 'flex', justifyContent: 'flex-start', marginBottom: 16 },
    loadingBubble: {
      background: theme.surface,
      border: `1px solid ${theme.border}`,
      padding: 16,
      borderRadius: 12,
    },
    loadingDots: { color: theme.textMuted, fontSize: 18, animation: 'pulse 1.5s ease-in-out infinite' },
  };

  return (
    <div style={styles.container}>
      {messages.length === 0 && !isLoading ? (
        <div style={styles.empty}>
          <h2 style={styles.emptyTitle}>How can I help you today?</h2>
          <p style={styles.emptySubtitle}>Start a conversation by typing a message below.</p>
        </div>
      ) : (
        <div style={styles.messages}>
          {messages.map((msg) => (
            <ChatBubble key={msg._id || msg.content} message={msg} />
          ))}
          {isLoading && (
            <div style={styles.loading}>
              <div style={styles.loadingBubble}>
                <span style={styles.loadingDots}>● ● ●</span>
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>
      )}
    </div>
  );
};

export default MessageList;
