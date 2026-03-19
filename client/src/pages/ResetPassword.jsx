import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';
import PasswordInput from '../components/PasswordInput';
import { authAPI } from '../services/api';

const ResetPassword = () => {
  const [searchParams] = useSearchParams();
  const tokenFromUrl = searchParams.get('token') || '';
  const [token, setToken] = useState(tokenFromUrl);
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const { theme } = useTheme();
  const navigate = useNavigate();

  useEffect(() => {
    setToken(tokenFromUrl);
  }, [tokenFromUrl]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');
    setLoading(true);
    try {
      await authAPI.resetPassword(token, password);
      setMessage('Password reset successful. Redirecting to login...');
      setTimeout(() => navigate('/login'), 2000);
    } catch (err) {
      setError(err.response?.data?.message || 'Reset failed. Link may be expired.');
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

  if (!tokenFromUrl) {
    return (
      <div style={styles.container}>
        <div style={styles.card}>
          <h1 style={styles.title}>Reset password</h1>
          <p style={styles.subtitle}>Invalid or missing reset link. Request a new one from the login page.</p>
          <p style={styles.footer}>
            <Link to="/login" style={{ color: theme.link }}>Back to Sign in</Link>
          </p>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h1 style={styles.title}>Set new password</h1>
        <p style={styles.subtitle}>Enter your new password below.</p>
        <form onSubmit={handleSubmit} style={styles.form}>
          {error && <p style={styles.error}>{error}</p>}
          {message && <p style={styles.success}>{message}</p>}
          <PasswordInput
            placeholder="New password (min 6 characters)"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={6}
            inputStyle={styles.input}
          />
          <button type="submit" disabled={loading} style={styles.button}>
            {loading ? 'Resetting...' : 'Reset password'}
          </button>
        </form>
        <p style={styles.footer}>
          <Link to="/login" style={{ color: theme.link }}>Back to Sign in</Link>
        </p>
      </div>
    </div>
  );
};

export default ResetPassword;
