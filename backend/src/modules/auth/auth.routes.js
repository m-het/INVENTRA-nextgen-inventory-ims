const express = require('express');
const { z } = require('zod');
const authService = require('./auth.service');
const { validate } = require('../../middleware/validate');
const { authMiddleware } = require('../../middleware/auth');

const router = express.Router();

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  name: z.string().optional(),
  role: z.enum(['INVENTORY_MANAGER', 'WAREHOUSE_STAFF']).optional(),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

const refreshSchema = z.object({
  refreshToken: z.string().min(1),
});

const forgotPasswordSchema = z.object({
  email: z.string().email(),
});

const resetPasswordSchema = z.object({
  email: z.string().email(),
  otp: z.string().length(6),
  newPassword: z.string().min(6),
});

router.post('/register', validate(registerSchema), async (req, res, next) => {
  try {
    const data = req.valid;
    const user = await authService.register(data);
    res.status(201).json(user);
  } catch (e) {
    next(e);
  }
});

router.post('/login', validate(loginSchema), async (req, res, next) => {
  try {
    const { email, password } = req.valid;
    const result = await authService.login(email, password);
    res.json(result);
  } catch (e) {
    next(e);
  }
});

router.post('/refresh', (req, res, next) => {
  const token = req.body.refreshToken || req.headers['x-refresh-token'];
  req.valid = { refreshToken: token };
  next();
}, async (req, res, next) => {
  try {
    const result = await authService.refresh(req.valid.refreshToken);
    res.json(result);
  } catch (e) {
    next(e);
  }
});

router.post('/logout', authMiddleware, async (req, res, next) => {
  try {
    const token = req.body.refreshToken || req.headers['x-refresh-token'];
    const result = await authService.logout(token);
    res.json(result);
  } catch (e) {
    next(e);
  }
});

router.post('/forgot-password', validate(forgotPasswordSchema), async (req, res, next) => {
  try {
    const result = await authService.forgotPassword(req.valid.email);
    res.json(result);
  } catch (e) {
    next(e);
  }
});

router.post('/reset-password', validate(resetPasswordSchema), async (req, res, next) => {
  try {
    const result = await authService.resetPassword(req.valid.email, req.valid.otp, req.valid.newPassword);
    res.json(result);
  } catch (e) {
    next(e);
  }
});

module.exports = router;
