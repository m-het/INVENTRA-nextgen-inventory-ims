const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { PrismaClient } = require('@prisma/client');
const { UnauthorizedError, ConflictError, ValidationError } = require('../../shared/errors');
const config = require('../../config');

const prisma = new PrismaClient();

async function register(data) {
  const existing = await prisma.user.findUnique({ where: { email: data.email } });
  if (existing) throw new ConflictError('Email already registered');
  const passwordHash = await bcrypt.hash(data.password, 10);
  const user = await prisma.user.create({
    data: {
      email: data.email,
      passwordHash,
      name: data.name,
      role: data.role || 'WAREHOUSE_STAFF',
    },
    select: { id: true, email: true, name: true, role: true, createdAt: true },
  });
  return user;
}

async function login(email, password) {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) throw new UnauthorizedError('Invalid email or password');
  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) throw new UnauthorizedError('Invalid email or password');
  const accessToken = jwt.sign(
    { sub: user.id, role: user.role },
    config.jwt.secret,
    { expiresIn: config.jwt.expiresIn }
  );
  const refreshToken = jwt.sign(
    { sub: user.id, type: 'refresh' },
    config.jwt.refreshSecret,
    { expiresIn: config.jwt.refreshExpiresIn }
  );
  await prisma.refreshToken.create({
    data: {
      token: refreshToken,
      userId: user.id,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    },
  });
  return {
    user: { id: user.id, email: user.email, name: user.name, role: user.role },
    accessToken,
    refreshToken,
    expiresIn: config.jwt.expiresIn,
  };
}

async function refresh(refreshToken) {
  if (!refreshToken) throw new UnauthorizedError('Refresh token required');
  let payload;
  try {
    payload = jwt.verify(refreshToken, config.jwt.refreshSecret);
  } catch {
    throw new UnauthorizedError('Invalid or expired refresh token');
  }
  if (payload.type !== 'refresh') throw new UnauthorizedError('Invalid token type');
  const stored = await prisma.refreshToken.findUnique({
    where: { token: refreshToken },
    include: { user: true },
  });
  if (!stored || stored.expiresAt < new Date()) {
    if (stored) await prisma.refreshToken.delete({ where: { id: stored.id } }).catch(() => {});
    throw new UnauthorizedError('Invalid or expired refresh token');
  }
  const accessToken = jwt.sign(
    { sub: stored.user.id, role: stored.user.role },
    config.jwt.secret,
    { expiresIn: config.jwt.expiresIn }
  );
  return {
    user: { id: stored.user.id, email: stored.user.email, name: stored.user.name, role: stored.user.role },
    accessToken,
    expiresIn: config.jwt.expiresIn,
  };
}

async function logout(refreshToken) {
  if (refreshToken) {
    await prisma.refreshToken.deleteMany({ where: { token: refreshToken } }).catch(() => {});
  }
  return { message: 'Logged out' };
}

function generateOtp() {
  return String(Math.floor(100000 + Math.random() * 900000));
}

async function forgotPassword(email) {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) return { message: 'If an account exists with this email, you will receive an OTP.' };
  await prisma.passwordResetOtp.deleteMany({ where: { email } });
  const otp = generateOtp();
  const expiresAt = new Date(Date.now() + 15 * 60 * 1000);
  await prisma.passwordResetOtp.create({ data: { email, otp, expiresAt } });
  if (config.nodeEnv !== 'production') {
    return { message: 'OTP generated. In development the OTP is returned here.', otpForDev: otp, expiresIn: '15m' };
  }
  return { message: 'If an account exists with this email, you will receive an OTP.' };
}

async function resetPassword(email, otp, newPassword) {
  const record = await prisma.passwordResetOtp.findFirst({
    where: { email },
    orderBy: { createdAt: 'desc' },
  });
  if (!record) throw new ValidationError('Invalid or expired OTP');
  if (record.expiresAt < new Date()) {
    await prisma.passwordResetOtp.deleteMany({ where: { email } });
    throw new ValidationError('OTP has expired');
  }
  if (record.otp !== otp) throw new ValidationError('Invalid OTP');
  const passwordHash = await bcrypt.hash(newPassword, 10);
  await prisma.user.update({ where: { email }, data: { passwordHash } });
  await prisma.passwordResetOtp.deleteMany({ where: { email } });
  return { message: 'Password reset successful' };
}

module.exports = { register, login, refresh, logout, forgotPassword, resetPassword };
