import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';
import { authAPI } from '../services/api';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const { theme } = useTheme();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');
    setLoading(true);
    try {
      await authAPI.forgotPassword(email);
      setMessage('If an account exists with this email, you will receive a reset link.');
    } catch (err) {
      setError(err.response?.data?.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  const styles = {
    container: {
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 20,
      background: theme.bg,
    },
    card: {
      background: theme.surface,
      padding: 40,
      borderRadius: 12,
      width: '100%',
      maxWidth: 400,
      border: `1px solid ${theme.border}`,
    },
    title: { fontSize: 28, marginBottom: 8, textAlign: 'center', color: theme.text },
    subtitle: { color: theme.textMuted, marginBottom: 24, textAlign: 'center', fontSize: 14 },
    form: { display: 'flex', flexDirection: 'column', gap: 16 },
    error: { color: theme.error, fontSize: 14 },
    success: { color: '#3fb950', fontSize: 14 },
    input: {
      padding: 12,
      borderRadius: 8,
      border: `1px solid ${theme.border}`,
      background: theme.inputBg,
      color: theme.text,
      fontSize: 16,
    },
    button: {
      padding: 12,
      borderRadius: 8,
      border: 'none',
      background: theme.accent,
      color: 'white',
      fontSize: 16,
      cursor: 'pointer',
      marginTop: 8,
    },
    footer: { marginTop: 24, textAlign: 'center', color: theme.textMuted },
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h1 style={styles.title}>Forgot password</h1>
        <p style={styles.subtitle}>Enter your email and we'll send you a reset link.</p>
        <form onSubmit={handleSubmit} style={styles.form}>
          {error && <p style={styles.error}>{error}</p>}
          {message && <p style={styles.success}>{message}</p>}
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            style={styles.input}
          />
          <button type="submit" disabled={loading} style={styles.button}>
            {loading ? 'Sending...' : 'Send reset link'}
          </button>
        </form>
        <p style={styles.footer}>
          <Link to="/login" style={{ color: theme.link }}>Back to Sign in</Link>
        </p>
      </div>
    </div>
  );
};

export default ForgotPassword;
