import OpenAI from 'openai';
import { createReadStream } from 'fs';

const USE_MOCK = process.env.USE_MOCK_AI === 'true';
const apiKey = (process.env.GROQ_API_KEY || '').trim();

if (!apiKey && !USE_MOCK) {
  console.warn('Warning: GROQ_API_KEY not set in .env. Get one at console.groq.com');
}

const groqClient = USE_MOCK
  ? null
  : new OpenAI({
      apiKey,
      baseURL: 'https://api.groq.com/openai/v1',
    });

const TIMEOUT_MS = 45000;

const getMockResponse = (userMessage) => {
  const msg = (userMessage || '').toLowerCase();
  if (msg.includes('hi') || msg.includes('hello') || msg.includes('hey')) {
    return "Hello! I'm classMentor AI. I'm here to help you learn MERN stack development. What would you like to know?";
  }
  if (msg.includes('mern') || msg.includes('react') || msg.includes('node')) {
    return "Great question! MERN stands for MongoDB, Express, React, and Node.js. It's a popular full-stack JavaScript framework. React handles the frontend, Node.js + Express power the backend, and MongoDB stores the data. Would you like me to explain any specific part in detail?";
  }
  if (msg.includes('thank')) {
    return "You're welcome! Happy learning. Feel free to ask more questions anytime.";
  }
  return `I understand you're asking about "${userMessage}". As your classMentor AI demo, I'm here to help with MERN stack, JavaScript, and web development. Try asking about React, Node.js, MongoDB, or Express! (Note: Add GROQ_API_KEY to .env for real AI responses)`;
};

export const getAIResponse = async (messages) => {
  if (USE_MOCK) {
    await new Promise((r) => setTimeout(r, 800));
    const lastUserMsg = messages.filter((m) => m.role === 'user').pop();
    return getMockResponse(lastUserMsg?.content);
  }

  try {
    const chatMessages = messages.map((m) => ({
      role: m.role === 'assistant' ? 'assistant' : 'user',
      content: m.content,
    }));

    const apiCall = groqClient.chat.completions.create({
      model: 'llama-3.1-8b-instant',
      messages: chatMessages,
      max_tokens: 1024,
    });

    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error('Request timed out. The AI is taking too long to respond.')), TIMEOUT_MS)
    );

    const response = await Promise.race([apiCall, timeoutPromise]);

    const text = response.choices?.[0]?.message?.content;
    return text || 'Sorry, I could not generate a response.';
  } catch (error) {
    const errStr = JSON.stringify(error);
    console.error('=== Groq AI Error (check terminal) ===');
    console.error('Message:', error.message);
    console.error('=====================================');

    const isQuotaError = errStr.includes('quota') || errStr.includes('429') || errStr.includes('rate limit');
    const isTimeout = errStr.includes('timed out');
    const isAuthError = errStr.includes('401') || errStr.includes('403') || errStr.includes('API key') || errStr.includes('invalid');

    if (isTimeout) {
      return 'The AI took too long to respond. Please try again.';
    }
    if (isAuthError) {
      throw new Error('Invalid or missing API key. Check GROQ_API_KEY in .env. Get one at console.groq.com');
    }
    if (isQuotaError) {
      const lastUserMsg = messages.filter((m) => m.role === 'user').pop();
      return `[API rate limit] I received: "${lastUserMsg?.content || 'hello'}". Wait a minute and try again, or check console.groq.com`;
    }
    throw new Error(error.message || 'Failed to get AI response');
  }
};

const WHISPER_MODEL = 'whisper-large-v3-turbo';

export const transcribeAudio = async (filePath) => {
  if (USE_MOCK) {
    await new Promise((r) => setTimeout(r, 500));
    return '[Voice demo] Say something and I will transcribe it. Add GROQ_API_KEY for real transcription.';
  }

  if (!groqClient) {
    throw new Error('Speech-to-text is not configured. Set GROQ_API_KEY in .env');
  }

  try {
    const stream = createReadStream(filePath);
    const transcription = await groqClient.audio.transcriptions.create({
      model: WHISPER_MODEL,
      file: stream,
      response_format: 'text',
    });
    const text = typeof transcription === 'string' ? transcription : transcription?.text ?? '';
    return (text || '').trim() || '[No speech detected]';
  } catch (error) {
    console.error('Transcription error:', error.message);
    const errStr = JSON.stringify(error);
    if (errStr.includes('401') || errStr.includes('403') || errStr.includes('API key') || errStr.includes('invalid')) {
      throw new Error('Invalid or missing GROQ_API_KEY. Check .env');
    }
    if (errStr.includes('429') || errStr.includes('rate limit') || errStr.includes('quota')) {
      throw new Error('Voice quota exceeded. Try again in a moment.');
    }
    throw new Error(error.message || 'Transcription failed');
  }
};
