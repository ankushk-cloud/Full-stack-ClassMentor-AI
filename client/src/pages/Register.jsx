import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import PasswordInput from '../components/PasswordInput';

const Register = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const { theme } = useTheme();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await register(name, email, password);
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed');
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
        <p style={styles.subtitle}>Create your account</p>
        <form onSubmit={handleSubmit} style={styles.form}>
          {error && <p style={styles.error}>{error}</p>}
          <input
            type="text"
            placeholder="Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            style={styles.input}
          />
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            style={styles.input}
          />
          <PasswordInput
            placeholder="Password (min 6 characters)"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={6}
            inputStyle={styles.input}
          />
          <button type="submit" disabled={loading} style={styles.button}>
            {loading ? 'Creating account...' : 'Register'}
          </button>
        </form>
        <p style={styles.footer}>
          Already have an account? <Link to="/login" style={{ color: theme.link }}>Sign In</Link>
        </p>
      </div>
    </div>
  );
};

export default Register;
