import express from 'express';
import {
  createChat,
  getChats,
  getChat,
  sendMessage,
  deleteChat,
} from '../controllers/chatController.js';
import { protect } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { sendMessageValidator } from '../validators/chatValidators.js';

const router = express.Router();

router.use(protect);

router.post('/', createChat);
router.get('/', getChats);
router.get('/:id', getChat);
router.post('/:id/messages', sendMessageValidator, validate, sendMessage);
router.delete('/:id', deleteChat);

export default router;
