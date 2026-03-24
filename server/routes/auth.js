import express from 'express';
import {
  register,
  login,
  getMe,
  updateProfile,
  deleteAccount,
  forgotPassword,
  resetPassword,
} from '../controllers/authController.js';
import { protect } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import {
  registerValidator,
  loginValidator,
  updateProfileValidator,
  forgotPasswordValidator,
  resetPasswordValidator,
} from '../validators/authValidators.js';

const router = express.Router();

router.post('/register', registerValidator, validate, register);
router.post('/login', loginValidator, validate, login);
router.post('/forgot-password', forgotPasswordValidator, validate, forgotPassword);
router.post('/reset-password', resetPasswordValidator, validate, resetPassword);
router.get('/me', protect, getMe);
router.put('/profile', protect, updateProfileValidator, validate, updateProfile);
router.delete('/me', protect, deleteAccount);

export default router;
