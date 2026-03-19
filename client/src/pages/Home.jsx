import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import LogoutButton from '../components/LogoutButton';
import ThemeToggle from '../components/ThemeToggle';
import UserAvatar from '../components/UserAvatar';

const SparkIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z" />
  </svg>
);

const suggestions = [
  { label: 'Ask a question', desc: 'Get clear explanations on any topic' },
  { label: 'Explain a concept', desc: 'Break down ideas step by step' },
  { label: 'Practice & quiz', desc: 'Test your understanding' },
  { label: 'Get feedback', desc: 'Improve with AI guidance' },
];

const Home = () => {
  const { user } = useAuth();
  const { theme } = useTheme();
  const navigate = useNavigate();

  const handleNewChat = () => {
    navigate('/chat');
  };

  const styles = {
    container: {
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      background: theme.bg,
    },
    header: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: '16px 24px',
      borderBottom: `1px solid ${theme.border}`,
    },
    logo: { fontSize: 20, fontWeight: 600, color: theme.text },
    userSection: { display: 'flex', alignItems: 'center', gap: 12 },
    userName: { color: theme.textMuted },
    profileBtn: {
      padding: '8px 16px',
      background: 'transparent',
      border: `1px solid ${theme.border}`,
      color: theme.text,
      borderRadius: 8,
      cursor: 'pointer',
    },
    logoutBtn: {
      padding: '8px 16px',
      border: `1px solid ${theme.border}`,
      color: theme.text,
      borderRadius: 8,
      cursor: 'pointer',
    },
    main: {
      flex: 1,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 24,
      padding: 32,
      maxWidth: 560,
      margin: '0 auto',
    },
    welcome: { fontSize: 28, fontWeight: 600, marginBottom: 4, color: theme.text, textAlign: 'center' },
    tagline: { fontSize: 16, color: theme.textMuted, marginBottom: 8, textAlign: 'center', lineHeight: 1.5 },
    subtitle: { fontSize: 14, color: theme.textMuted, marginBottom: 24, textAlign: 'center' },
    newChatBtn: {
      padding: '14px 28px',
      background: theme.accent,
      border: 'none',
      color: 'white',
      borderRadius: 10,
      fontSize: 16,
      fontWeight: 600,
      cursor: 'pointer',
      display: 'flex',
      alignItems: 'center',
      gap: 8,
    },
    suggestionsTitle: {
      fontSize: 13,
      fontWeight: 600,
      color: theme.textMuted,
      textTransform: 'uppercase',
      letterSpacing: '0.05em',
      marginTop: 16,
      marginBottom: 12,
    },
    suggestionsGrid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(2, 1fr)',
      gap: 12,
      width: '100%',
    },
    suggestionCard: {
      padding: 16,
      background: theme.surface,
      border: `1px solid ${theme.border}`,
      borderRadius: 12,
      cursor: 'pointer',
      textAlign: 'left',
      transition: 'border-color 0.15s, background 0.15s',
    },
    suggestionIcon: { color: theme.accent, marginBottom: 8 },
    suggestionLabel: { fontSize: 14, fontWeight: 600, color: theme.text, marginBottom: 4 },
    suggestionDesc: { fontSize: 12, color: theme.textMuted, lineHeight: 1.4 },
  };

  return (
    <div style={styles.container}>
      <header style={styles.header}>
        <h1 style={styles.logo}>classMentor AI</h1>
        <div style={styles.userSection}>
          <ThemeToggle />
          <UserAvatar name={user?.name} size={32} />
          <span style={styles.userName}>{user?.name}</span>
          <button onClick={() => navigate('/profile')} style={styles.profileBtn}>
            Profile
          </button>
          <LogoutButton style={styles.logoutBtn} />
        </div>
      </header>
      <main style={styles.main}>
        <h2 style={styles.welcome}>Welcome, {user?.name}!</h2>
        <p style={styles.tagline}>Your AI mentor for learning and practice</p>
        <p style={styles.subtitle}>Start a new conversation or pick a suggestion below</p>
        <button onClick={handleNewChat} style={styles.newChatBtn}>
          <SparkIcon />
          + New Chat
        </button>
        <span style={styles.suggestionsTitle}>What you can do</span>
        <div style={styles.suggestionsGrid}>
          {suggestions.map((item) => (
            <button
              key={item.label}
              type="button"
              style={styles.suggestionCard}
              onClick={handleNewChat}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = theme.surfaceHover;
                e.currentTarget.style.borderColor = theme.accent;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = theme.surface;
                e.currentTarget.style.borderColor = theme.border;
              }}
            >
              <div style={styles.suggestionIcon}>
                <SparkIcon />
              </div>
              <div style={styles.suggestionLabel}>{item.label}</div>
              <div style={styles.suggestionDesc}>{item.desc}</div>
            </button>
          ))}
        </div>
      </main>
    </div>
  );
};

export default Home;
