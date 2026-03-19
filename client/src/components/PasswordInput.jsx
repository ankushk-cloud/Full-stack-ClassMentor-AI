import React, { useState } from 'react';
import { useTheme } from '../context/ThemeContext';

const EyeIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
    <circle cx="12" cy="12" r="3" />
  </svg>
);

const EyeOffIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
    <line x1="1" y1="1" x2="23" y2="23" />
  </svg>
);

const PasswordInput = ({ value, onChange, placeholder = 'Password', required, minLength, style = {}, inputStyle = {} }) => {
  const [showPassword, setShowPassword] = useState(false);
  const { theme } = useTheme();

  return (
    <div style={{ ...styles.wrapper, ...style }}>
      <input
        type={showPassword ? 'text' : 'password'}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        required={required}
        minLength={minLength}
        style={{ ...styles.input, ...inputStyle }}
      />
      <button
        type="button"
        onClick={() => setShowPassword((s) => !s)}
        style={{ ...styles.toggleBtn, color: theme.textMuted }}
        tabIndex={-1}
        title={showPassword ? 'Hide password' : 'Show password'}
        aria-label={showPassword ? 'Hide password' : 'Show password'}
      >
        {showPassword ? <EyeOffIcon /> : <EyeIcon />}
      </button>
    </div>
  );
};

const styles = {
  wrapper: {
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
    width: '100%',
  },
  input: {
    width: '100%',
    padding: '12px 44px 12px 12px',
    borderRadius: 8,
    border: '1px solid #333',
    background: '#0f0f0f',
    color: '#e4e4e4',
    fontSize: 16,
  },
  toggleBtn: {
    position: 'absolute',
    right: 10,
    top: '50%',
    transform: 'translateY(-50%)',
    background: 'none',
    border: 'none',
    color: '#888',
    cursor: 'pointer',
    padding: 4,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
};

export default PasswordInput;
