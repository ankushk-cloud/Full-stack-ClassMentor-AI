import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';

const LogoutButton = ({ style = {} }) => {
  const { logout } = useAuth();
  const { theme } = useTheme();
  const [showModal, setShowModal] = useState(false);

  const handleLogoutClick = () => setShowModal(true);
  const handleConfirm = () => {
    logout();
    setShowModal(false);
  };
  const handleCancel = () => setShowModal(false);

  const styles = {
    button: {
      padding: '8px 16px',
      background: 'transparent',
      border: `1px solid ${theme.border}`,
      color: theme.text,
      borderRadius: 8,
      cursor: 'pointer',
      ...style,
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
    message: { margin: '0 0 24px 0', fontSize: 16, color: theme.text },
    actions: { display: 'flex', gap: 12, justifyContent: 'flex-end' },
    cancelBtn: {
      padding: '10px 20px',
      background: 'transparent',
      border: `1px solid ${theme.border}`,
      color: theme.text,
      borderRadius: 8,
      cursor: 'pointer',
      fontSize: 14,
    },
    confirmBtn: {
      padding: '10px 20px',
      background: theme.accent,
      border: 'none',
      color: 'white',
      borderRadius: 8,
      cursor: 'pointer',
      fontSize: 14,
    },
  };

  return (
    <>
      <button onClick={handleLogoutClick} style={styles.button}>
        Logout
      </button>
      {showModal && (
        <div style={styles.overlay} onClick={handleCancel}>
          <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
            <p style={styles.message}>Are you sure you want to logout?</p>
            <div style={styles.actions}>
              <button onClick={handleCancel} style={styles.cancelBtn}>
                Cancel
              </button>
              <button onClick={handleConfirm} style={styles.confirmBtn}>
                Yes, logout
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default LogoutButton;
