import React from 'react';
import { useTheme } from '../context/ThemeContext';

const getInitials = (name) => {
  if (!name || typeof name !== 'string') return '?';
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }
  return name.slice(0, 2).toUpperCase();
};

const UserAvatar = ({ name, size = 36, style = {} }) => {
  const { theme } = useTheme();
  const initials = getInitials(name);

  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: '50%',
        background: theme.accent || '#238636',
        color: '#fff',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: size * 0.4,
        fontWeight: 600,
        flexShrink: 0,
        ...style,
      }}
      title={name}
      aria-hidden
    >
      {initials}
    </div>
  );
};

export default UserAvatar;
