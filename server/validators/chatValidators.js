import { body } from 'express-validator';

export const sendMessageValidator = [
  body('content')
    .trim()
    .notEmpty()
    .withMessage('Message content is required')
    .isLength({ max: 10000 })
    .withMessage('Message must be less than 10000 characters'),
];
