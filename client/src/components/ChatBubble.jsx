import React from 'react';
import ReactMarkdown from 'react-markdown';
import { useTheme } from '../context/ThemeContext';

const UserIcon = ({ size = 24, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
    <circle cx="12" cy="7" r="4" />
  </svg>
);

const AIIcon = ({ size = 24, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z" />
  </svg>
);

const ChatBubble = ({ message }) => {
  const { theme } = useTheme();
  const isUser = message.role === 'user';

  const styles = {
    wrapper: { marginBottom: 16 },
    userWrapper: { display: 'flex', justifyContent: 'flex-end' },
    assistantWrapper: { display: 'flex', justifyContent: 'flex-start' },
    bubble: {
      display: 'flex',
      gap: 12,
      maxWidth: '85%',
      padding: 16,
      borderRadius: 12,
    },
    userBubble: {
      background: theme.userBubble,
      flexDirection: 'row-reverse',
    },
    assistantBubble: {
      background: theme.assistantBubble,
      border: `1px solid ${theme.border}`,
    },
    avatar: {
      width: 36,
      height: 36,
      flexShrink: 0,
      borderRadius: '50%',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: isUser ? (theme.accent || '#238636') : (theme.surfaceHover || 'rgba(110, 118, 129, 0.2)'),
      color: isUser ? '#fff' : theme.text,
    },
    content: { flex: 1, minWidth: 0 },
    role: {
      fontSize: 12,
      color: isUser ? '#ffffff' : theme.textMuted,
      display: 'block',
      marginBottom: 4,
    },
    text: {
      whiteSpace: 'pre-wrap',
      wordBreak: 'break-word',
      lineHeight: 1.6,
      margin: 0,
      color: isUser ? '#ffffff' : theme.text,
    },
    markdown: { whiteSpace: 'pre-wrap', wordBreak: 'break-word', lineHeight: 1.6, fontSize: 15, color: theme.text },
  };

  const mdStyles = {
    p: { margin: '0 0 10px 0', lineHeight: 1.6 },
    strong: { fontWeight: 600, color: theme.text },
    ul: { margin: '0 0 10px 0', paddingLeft: 20 },
    ol: { margin: '0 0 10px 0', paddingLeft: 20 },
    li: { marginBottom: 4, lineHeight: 1.5 },
    h1: { fontSize: 20, margin: '12px 0 8px 0', fontWeight: 600 },
    h2: { fontSize: 18, margin: '12px 0 6px 0', fontWeight: 600 },
    h3: { fontSize: 16, margin: '10px 0 4px 0', fontWeight: 600 },
    code: { background: theme.surfaceHover || '#2d2d2d', padding: '2px 6px', borderRadius: 4, fontSize: 14 },
    pre: { background: theme.surfaceHover || '#2d2d2d', padding: 12, borderRadius: 8, overflow: 'auto', margin: '10px 0' },
    blockquote: { borderLeft: `4px solid ${theme.border}`, margin: '10px 0', paddingLeft: 16, color: theme.textMuted },
  };

  const markdownComponents = {
    p: ({ children }) => <p style={mdStyles.p}>{children}</p>,
    strong: ({ children }) => <strong style={mdStyles.strong}>{children}</strong>,
    ul: ({ children }) => <ul style={mdStyles.ul}>{children}</ul>,
    ol: ({ children }) => <ol style={mdStyles.ol}>{children}</ol>,
    li: ({ children }) => <li style={mdStyles.li}>{children}</li>,
    h1: ({ children }) => <h1 style={mdStyles.h1}>{children}</h1>,
    h2: ({ children }) => <h2 style={mdStyles.h2}>{children}</h2>,
    h3: ({ children }) => <h3 style={mdStyles.h3}>{children}</h3>,
    code: ({ children }) => <code style={mdStyles.code}>{children}</code>,
    pre: ({ children }) => <pre style={mdStyles.pre}>{children}</pre>,
    blockquote: ({ children }) => <blockquote style={mdStyles.blockquote}>{children}</blockquote>,
  };

  return (
    <div style={{ ...styles.wrapper, ...(isUser ? styles.userWrapper : styles.assistantWrapper) }}>
      <div style={{ ...styles.bubble, ...(isUser ? styles.userBubble : styles.assistantBubble) }}>
        <div style={styles.avatar} aria-hidden>
          {isUser ? <UserIcon size={20} color="currentColor" /> : <AIIcon size={20} color="currentColor" />}
        </div>
        <div style={styles.content}>
          <span style={styles.role}>{isUser ? 'You' : 'classMentor AI'}</span>
          {isUser ? (
            <p style={styles.text}>{message.content}</p>
          ) : (
            <div style={styles.markdown}>
              <ReactMarkdown components={markdownComponents}>{message.content}</ReactMarkdown>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ChatBubble;
