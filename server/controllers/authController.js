import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import User from '..model/User.js';
import Chat from '..model/Chat.js';

import { sendWelcomeEmail, sendPasswordResetEmail } from '../services/emailService.js';

const generateToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET, {
        expiresIn: '30d'
    })
};

const generateResetToken = (id) => {
    return jwt.sign({id}, process.env.JWT_SECRET, {
        expiresIn: '1h'
    })
};

export const register = async (req, res) => {
    try {
        const name = String(req.body?.name ?? '').trim();
        const email = String(req.body?.email ?? '').toLowerCase();
        const password = req.body?.password;

        if(!name || !email || !password) {
            return res.status(400).json({ message: 'Name, email and password are required' })
        }

        const userExist = await User.findOne({email});
        if(userExist) {
            return res.status(400).json({
                message: 'User already exist with this email'
            })
        }

        const user = await User.create({ name, email, password });

        res.status(201).json({
            _id: user._id,
            name: user.name,
            email: user.email,
            token: generateToken(user._id)
        });
    } catch (error) {
        if(error.code === 11000) {
            return res.status(400).json({
                message: 'User already exist with this email'
            })
        }
        if(error.name === 'Validation') {
            const msg = error.errors?.[Object.keys(error.errors)[0]]?.message || error.message
            return res.status(400).json({ message: msg })
        }
        console.error('Register error:',error)
        res.status(500).json({
            message: error.message || 'Registration failed'
        });
    }
}