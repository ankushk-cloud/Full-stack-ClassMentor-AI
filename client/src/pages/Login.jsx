import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import PasswordInput from '../components/PasswordInput';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const { theme } = useTheme();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password);
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed');
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
    subtitle: { color: theme.textMuted, marginBottom: 24, textAlign: 'center' },
    form: { display: 'flex', flexDirection: 'column', gap: 16 },
    error: { color: theme.error, fontSize: 14 },
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
        <h1 style={styles.title}>classMentor AI</h1>
        <p style={styles.subtitle}>Sign in to continue</p>
        <form onSubmit={handleSubmit} style={styles.form}>
          {error && <p style={styles.error}>{error}</p>}
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            style={styles.input}
          />
          <PasswordInput
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            inputStyle={styles.input}
          />
          <button type="submit" disabled={loading} style={styles.button}>
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
          <p style={{ textAlign: 'center', marginTop: -8 }}>
            <Link to="/forgot-password" style={{ color: theme.link, fontSize: 14 }}>Forgot password?</Link>
          </p>
        </form>
        <p style={styles.footer}>
          Don't have an account? <Link to="/register" style={{ color: theme.link }}>Register</Link>
        </p>
      </div>
    </div>
  );
};

export default Login;
