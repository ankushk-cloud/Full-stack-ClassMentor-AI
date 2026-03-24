import Chat from '../models/Chat.js';
import { getAIResponse } from '../services/aiService.js';

export const createChat = async (req, res) => {
  try {
    const chat = await Chat.create({
      user: req.user._id,
      title: 'New Chat',
      messages: [],
    });
    res.status(201).json(chat);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getChats = async (req, res) => {
  try {
    const { search } = req.query;
    const filter = { user: req.user._id };

    if (search && search.trim()) {
      const searchRegex = new RegExp(search.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
      filter.$or = [
        { title: searchRegex },
        { 'messages.content': searchRegex },
      ];
    }

    const chats = await Chat.find(filter)
      .sort({ updatedAt: -1 })
      .select('_id title updatedAt');
    res.json(chats);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getChat = async (req, res) => {
  try {
    const chat = await Chat.findOne({
      _id: req.params.id,
      user: req.user._id,
    });
    if (!chat) {
      return res.status(404).json({ message: 'Chat not found' });
    }
    res.json(chat);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const sendMessage = async (req, res) => {
  try {
    const { content } = req.body;
    const trimmedContent = content?.trim();
    if (!trimmedContent) {
      return res.status(400).json({ message: 'Message content is required' });
    }

    const chat = await Chat.findOne({
      _id: req.params.id,
      user: req.user._id,
    });
    if (!chat) {
      return res.status(404).json({ message: 'Chat not found' });
    }

    chat.messages.push({ role: 'user', content: trimmedContent });

    const messagesForAI = chat.messages.map((m) => ({
      role: m.role,
      content: m.content,
    }));

    const aiResponse = await getAIResponse(messagesForAI);

    chat.messages.push({ role: 'assistant', content: aiResponse });

    if (chat.messages.length === 2) {
      chat.title = trimmedContent.slice(0, 50) + (trimmedContent.length > 50 ? '...' : '');
    }

    await chat.save();

    res.json({
      userMessage: chat.messages[chat.messages.length - 2],
      assistantMessage: chat.messages[chat.messages.length - 1],
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const deleteChat = async (req, res) => {
  try {
    const chat = await Chat.findOneAndDelete({
      _id: req.params.id,
      user: req.user._id,
    });
    if (!chat) {
      return res.status(404).json({ message: 'Chat not found' });
    }
    res.json({ message: 'Chat deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
