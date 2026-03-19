import React, { useState, useRef } from 'react';
import { useTheme } from '../context/ThemeContext';
import { voiceAPI } from '../services/api';

const MicIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 2a3 3 0 0 1 3 3v7a3 3 0 0 1-6 0V5a3 3 0 0 1 3-3Z" />
    <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
    <line x1="12" y1="19" x2="12" y2="22" />
  </svg>
);

const StopIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
    <rect x="6" y="6" width="12" height="12" rx="2" />
  </svg>
);

const MessageInput = ({ onSend, disabled }) => {
  const { theme } = useTheme();
  const [message, setMessage] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [recordError, setRecordError] = useState('');
  const textareaRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const chunksRef = useRef([]);

  const handleSubmit = (e) => {
    e.preventDefault();
    const trimmed = message.trim();
    if (!trimmed || disabled) return;
    onSend(trimmed);
    setMessage('');
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const startRecording = async () => {
    setRecordError('');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      chunksRef.current = [];
      const recorder = new MediaRecorder(stream);
      mediaRecorderRef.current = recorder;
      recorder.ondataavailable = (e) => {
        if (e.data.size) chunksRef.current.push(e.data);
      };
      recorder.onstop = async () => {
        stream.getTracks().forEach((t) => t.stop());
        if (chunksRef.current.length === 0) {
          setRecordError('Recording too short. Speak for 1–2 seconds, then stop.');
          setIsRecording(false);
          return;
        }
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
        if (blob.size < 1000) {
          setRecordError('Recording too short. Speak for 1–2 seconds, then stop.');
          setIsRecording(false);
          return;
        }
        const formData = new FormData();
        formData.append('audio', blob, 'recording.webm');
        setRecordError('');
        setIsTranscribing(true);
        try {
          const res = await voiceAPI.transcribe(formData);
          const text = (res.data?.text || '').trim();
          if (text) setMessage((prev) => (prev ? `${prev} ${text}` : text));
        } catch (err) {
          setRecordError(err.response?.data?.message || err.message || 'Transcription failed');
        } finally {
          setIsTranscribing(false);
        }
        setIsRecording(false);
      };
      recorder.start();
      setIsRecording(true);
    } catch (err) {
      setRecordError('Microphone access denied or not available');
      setIsRecording(false);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
  };

  const handleMicClick = () => {
    if (isRecording) stopRecording();
    else startRecording();
  };

  const styles = {
    form: {
      padding: 16,
      borderTop: `1px solid ${theme.border}`,
      background: theme.bg,
    },
    inputWrapper: {
      display: 'flex',
      gap: 12,
      alignItems: 'flex-end',
      maxWidth: 800,
      margin: '0 auto',
    },
    textarea: {
      flex: 1,
      padding: 12,
      borderRadius: 8,
      border: `1px solid ${theme.border}`,
      background: theme.surface,
      color: theme.text,
      fontSize: 16,
      resize: 'none',
      minHeight: 44,
      maxHeight: 200,
    },
    button: {
      padding: '12px 24px',
      background: theme.accent,
      border: 'none',
      color: 'white',
      borderRadius: 8,
      cursor: 'pointer',
      fontSize: 16,
      flexShrink: 0,
    },
    micBtn: {
      padding: 12,
      background: isRecording ? (theme.error || '#cf2222') : 'transparent',
      border: `1px solid ${theme.border}`,
      borderRadius: 8,
      color: theme.text,
      cursor: 'pointer',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      flexShrink: 0,
    },
    errorText: { fontSize: 12, color: theme.error, marginTop: 6 },
  };

  return (
    <form onSubmit={handleSubmit} style={styles.form}>
      {recordError && <p style={styles.errorText}>{recordError}</p>}
      <div style={styles.inputWrapper}>
        <button
          type="button"
          onClick={handleMicClick}
          style={styles.micBtn}
          disabled={disabled || isTranscribing}
          title={isRecording ? 'Stop recording' : 'Voice input'}
          aria-label={isRecording ? 'Stop recording' : 'Start voice input'}
        >
          {isRecording ? <StopIcon /> : <MicIcon />}
        </button>
        <textarea
          ref={textareaRef}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={isTranscribing ? 'Transcribing...' : 'Message classMentor AI...'}
          disabled={disabled}
          rows={1}
          style={styles.textarea}
        />
        <button type="submit" disabled={!message.trim() || disabled} style={styles.button}>
          Send
        </button>
      </div>
    </form>
  );
};

export default MessageInput;
