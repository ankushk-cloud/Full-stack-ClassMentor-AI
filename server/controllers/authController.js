import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import User from '../models/User.js';
import Chat from '../models/Chat.js';
import { sendWelcomeEmail, sendPasswordResetEmail } from '../services/emailService.js';

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: '30d',
  });
};

const generateResetToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: '1h',
  });
};

export const register = async (req, res) => {
  try {
    const name = String(req.body?.name ?? '').trim();
    const email = String(req.body?.email ?? '').toLowerCase();
    const password = req.body?.password;

    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Name, email and password are required' });
    }

    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ message: 'User already exists with this email' });
    }

    const user = await User.create({ name, email, password });

    res.status(201).json({
      _id: user._id,
      name: user.name,
      email: user.email,
      token: generateToken(user._id),
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ message: 'User already exists with this email' });
    }
    if (error.name === 'ValidationError') {
      const msg = error.errors?.[Object.keys(error.errors)[0]]?.message || error.message;
      return res.status(400).json({ message: msg });
    }
    console.error('Register error:', error);
    res.status(500).json({ message: error.message || 'Registration failed' });
  }
};

export const login = async (req, res) => {
  try {
    const email = String(req.body?.email ?? '').toLowerCase();
    const password = req.body?.password;

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      token: generateToken(user._id),
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: error.message || 'Login failed' });
  }
};

export const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const updateProfile = async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.user._id,
      { name: req.body.name.trim() },
      { new: true, runValidators: true }
    );
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const deleteAccount = async (req, res) => {
  try {
    await Chat.deleteMany({ user: req.user._id });
    await User.findByIdAndDelete(req.user._id);
    res.json({ message: 'Account deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const forgotPassword = async (req, res) => {
  try {
    const email = String(req.body?.email ?? '').toLowerCase();
    const user = await User.findOne({ email });
    if (!user) {
      return res.json({ message: 'If an account exists with this email, you will receive a reset link.' });
    }
    const resetToken = generateResetToken(user._id);
    try {
      await sendPasswordResetEmail(user.email, resetToken);
    } catch (emailError) {
      console.error('Forgot password – email send failed:', emailError.message);
      if (emailError.code === 'EAUTH') {
        return res.status(503).json({
          message: 'Email service is not configured correctly. Please check SMTP settings (use Gmail App Password, not normal password).',
        });
      }
      return res.status(503).json({
        message: 'Unable to send email right now. Please try again later.',
      });
    }
    res.json({ message: 'If an account exists with this email, you will receive a reset link.' });
  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({ message: 'Failed to send reset email' });
  }
};

export const resetPassword = async (req, res) => {
  try {
    const { token, password } = req.body;
    if (!token || !password) {
      return res.status(400).json({ message: 'Token and new password are required' });
    }
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id).select('+password');
    if (!user) {
      return res.status(400).json({ message: 'Invalid or expired reset link' });
    }
    user.password = password;
    await user.save();
    res.json({ message: 'Password reset successful. You can now sign in.' });
  } catch (error) {
    if (error.name === 'TokenExpiredError' || error.name === 'JsonWebTokenError') {
      return res.status(400).json({ message: 'Invalid or expired reset link' });
    }
    res.status(500).json({ message: error.message || 'Password reset failed' });
  }
};
