/**
 * Mock AI service - Use when you don't have an API key (e.g. for teaching/demo)
 * In chatController.js, import from 'googleAiService.mock.js' instead of 'googleAiService.js'
 */

export const getAIResponse = async (messages) => {
  await new Promise((r) => setTimeout(r, 1500));
  const lastUserMsg = messages.filter((m) => m.role === 'user').pop();
  return `This is a mock response. You said: "${lastUserMsg?.content || 'hello'}". Add your GOOGLE_AI_API_KEY to .env for real AI responses from Google AI Studio.`;
};
