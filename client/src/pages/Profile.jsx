import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import LogoutButton from '../components/LogoutButton';
import ThemeToggle from '../components/ThemeToggle';

const Profile = () => {
  const { user, updateProfile, deleteAccount } = useAuth();
  const { theme } = useTheme();
  const navigate = useNavigate();
  const [name, setName] = useState(user?.name || '');
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setSaving(true);
    try {
      await updateProfile(name);
      setSuccess('Profile updated successfully.');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteAccount = async () => {
    setDeleting(true);
    setError('');
    try {
      await deleteAccount();
      navigate('/login');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete account');
      setDeleting(false);
      setShowDeleteConfirm(false);
    }
  };

  const styles = {
    container: { minHeight: '100vh', display: 'flex', flexDirection: 'column', background: theme.bg },
    header: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: '16px 24px',
      borderBottom: `1px solid ${theme.border}`,
    },
    logo: { fontSize: 20, fontWeight: 600, color: theme.text },
    nav: { display: 'flex', alignItems: 'center', gap: 12 },
    navBtn: {
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
    main: { flex: 1, padding: 24, maxWidth: 480, margin: '0 auto', width: '100%' },
    title: { marginBottom: 24, fontSize: 28, color: theme.text },
    card: {
      background: theme.surface,
      border: `1px solid ${theme.border}`,
      borderRadius: 12,
      padding: 24,
    },
    field: { marginBottom: 20 },
    label: { display: 'block', marginBottom: 8, color: theme.textMuted, fontSize: 14 },
    input: {
      width: '100%',
      padding: 12,
      borderRadius: 8,
      border: `1px solid ${theme.border}`,
      background: theme.inputBg,
      color: theme.text,
      fontSize: 16,
    },
    hint: { fontSize: 12, color: theme.textMuted, marginTop: 4, display: 'block' },
    error: { color: theme.error, marginBottom: 16, fontSize: 14 },
    success: { color: '#3fb950', marginBottom: 16, fontSize: 14 },
    saveBtn: {
      padding: '12px 24px',
      background: theme.accent,
      border: 'none',
      color: 'white',
      borderRadius: 8,
      fontSize: 16,
      cursor: 'pointer',
    },
    divider: { border: 'none', borderTop: `1px solid ${theme.border}`, margin: '24px 0' },
    dangerZone: {},
    dangerTitle: { color: theme.error, marginBottom: 8, fontSize: 16 },
    dangerText: { color: theme.textMuted, fontSize: 14, marginBottom: 16 },
    deleteBtn: {
      padding: '10px 20px',
      background: 'transparent',
      border: `1px solid ${theme.error}`,
      color: theme.error,
      borderRadius: 8,
      cursor: 'pointer',
      fontSize: 14,
    },
    confirmBox: { marginTop: 12 },
    confirmText: { color: theme.text, marginBottom: 12, fontSize: 14 },
    confirmActions: { display: 'flex', gap: 12 },
    confirmDeleteBtn: {
      padding: '10px 20px',
      background: theme.error,
      border: 'none',
      color: 'white',
      borderRadius: 8,
      cursor: 'pointer',
      fontSize: 14,
    },
    cancelBtn: {
      padding: '10px 20px',
      background: 'transparent',
      border: `1px solid ${theme.border}`,
      color: theme.text,
      borderRadius: 8,
      cursor: 'pointer',
      fontSize: 14,
    },
  };

  return (
    <div style={styles.container}>
      <header style={styles.header}>
        <h1 style={styles.logo}>classMentor AI</h1>
        <div style={styles.nav}>
          <ThemeToggle />
          <button onClick={() => navigate('/')} style={styles.navBtn}>
            Home
          </button>
          <button onClick={() => navigate('/chat')} style={styles.navBtn}>
            Chat
          </button>
          <LogoutButton style={styles.logoutBtn} />
        </div>
      </header>
      <main style={styles.main}>
        <h2 style={styles.title}>Profile</h2>
        <div style={styles.card}>
          <form onSubmit={handleSubmit}>
            {error && <p style={styles.error}>{error}</p>}
            {success && <p style={styles.success}>{success}</p>}
            <div style={styles.field}>
              <label style={styles.label}>Email</label>
              <input
                type="email"
                value={user?.email || ''}
                disabled
                style={{ ...styles.input, opacity: 0.7 }}
              />
              <span style={styles.hint}>Email cannot be changed</span>
            </div>
            <div style={styles.field}>
              <label style={styles.label}>Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your name"
                style={styles.input}
                minLength={2}
                maxLength={50}
              />
            </div>
            <button type="submit" disabled={saving} style={styles.saveBtn}>
              {saving ? 'Saving...' : 'Save changes'}
            </button>
          </form>

          <hr style={styles.divider} />

          <div style={styles.dangerZone}>
            <h3 style={styles.dangerTitle}>Delete account</h3>
            <p style={styles.dangerText}>
              Permanently delete your account and all your chat history. This cannot be undone.
            </p>
            {!showDeleteConfirm ? (
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(true)}
                style={styles.deleteBtn}
              >
                Delete my account
              </button>
            ) : (
              <div style={styles.confirmBox}>
                <p style={styles.confirmText}>Are you sure? This action cannot be undone.</p>
                <div style={styles.confirmActions}>
                  <button
                    type="button"
                    onClick={handleDeleteAccount}
                    disabled={deleting}
                    style={styles.confirmDeleteBtn}
                  >
                    {deleting ? 'Deleting...' : 'Yes, delete account'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowDeleteConfirm(false)}
                    disabled={deleting}
                    style={styles.cancelBtn}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default Profile;
