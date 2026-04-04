const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const userRepository = require('../repositories/userRepository');
const prisma = require('../config/prisma');
const crypto = require('crypto');
const emailService = require('./emailService');
const { isTrueLike, isFalseLike, passwordsDifferByAtLeast4Chars } = require('../utils/helpers');

const SECRET_KEY = process.env.JWT_SECRET || 'a-very-secure-secret-key-2025';

const userService = {
  getAllUsers: async () => {
    return await userRepository.findAll();
  },

  getUserById: async (id) => {
    const user = await userRepository.findById(id);
    if (!user) throw new Error('User not found');
    return user;
  },

  updateUser: async (id, updateData) => {
    const { password, ...rest } = updateData;
    const data = { ...rest };
    
    if (password) {
      data.password = await bcrypt.hash(password, 10);
    }

    // Normalize string booleans if necessary (based on existing index.js logic)
    if (data.status !== undefined) data.status = String(data.status);
    if (data.locked !== undefined) data.locked = String(data.locked);
    if (data.isFirstLogin !== undefined) data.isFirstLogin = String(data.isFirstLogin);
    if (data.activeStatus !== undefined) data.activeStatus = String(data.activeStatus);

    return await userRepository.update(id, data);
  },

  deleteUser: async (id) => {
    const existing = await userRepository.findById(id);
    if (!existing) throw new Error('User not found');
    return await userRepository.delete(id);
  },

  authorizeUser: async (id) => {
    const data = {
      status: 'true',
      activeStatus: 'true',
      locked: 'false',
      isFirstLogin: 'false',
    };
    return await userRepository.update(id, data);
  },

  // --- Auth & Profile ---
  login: async (username, password) => {
    if (!username || !password) throw new Error('Username and password are required');
    
    const user = await userRepository.findByUsername(username);
    if (!user) throw new Error('Invalid credentials');

    const passwordMatch = await bcrypt.compare(password, user.password);
    if (!passwordMatch) throw new Error('Invalid credentials');

    const isInactive = isFalseLike(user.status) || isFalseLike(user.activeStatus);
    const isLocked = isTrueLike(user.locked);
    if (isInactive || isLocked) {
      throw new Error('Your account is Deactivated. Contact system administrator.');
    }

    // Sync with employee status
    const linkedEmployee = await prisma.employee.findFirst({ where: { userId: user.id } });
    if (linkedEmployee && linkedEmployee.isActive === false) {
      await userRepository.update(user.id, { activeStatus: 'false', status: 'false', locked: 'true' });
      throw new Error('Your account is Deactivated. Contact system administrator.');
    }

    const token = jwt.sign({ id: user.id, username: user.userName, role: user.role }, SECRET_KEY, { expiresIn: '1h' });
    
    let profileImageUrl = null;
    const emp = await prisma.employee.findFirst({ where: { userId: user.id }, select: { profileImageUrl: true } });
    profileImageUrl = emp?.profileImageUrl || null;

    return { token, user: { ...user, profileImageUrl } };
  },

  changePassword: async (userId, currentPassword, newPassword) => {
    if (!newPassword || !currentPassword) throw new Error('Both current and new passwords are required');
    
    const user = await userRepository.findById(userId);
    if (!user) throw new Error('User not found');

    const ok = await bcrypt.compare(currentPassword, user.password);
    if (!ok) throw new Error('Current password is incorrect');

    if (!passwordsDifferByAtLeast4Chars(currentPassword, newPassword)) {
      throw new Error('New password must differ from current password by at least 4 characters');
    }

    const hashed = await bcrypt.hash(String(newPassword), 10);
    return await userRepository.update(userId, { 
      password: hashed, 
      isFirstLogin: 'false', 
      locked: 'false' 
    });
  },

  getMe: async (userId) => {
    const user = await userRepository.findById(userId);
    if (!user) throw new Error('User not found');

    const emp = await prisma.employee.findFirst({ where: { userId: user.id }, select: { profileImageUrl: true } });
    return { ...user, profileImageUrl: emp?.profileImageUrl || null };
  },

  updateMe: async (userId, data) => {
    const { fullName, userName, password } = data;
    if (!fullName || !userName) throw new Error('FullName and userName are required');

    const updateData = { fullName, userName };
    if (password) {
      updateData.password = await bcrypt.hash(password, 10);
    }
    return await userRepository.update(userId, updateData);
  },

  forgotPassword: async (email) => {
    if (!email) throw new Error('Email is required');
    const user = await userRepository.findByEmail(email);
    if (!user) {
      // For security, don't reveal if user exists, but we'll return generic success.
      // However, for internal dev, throwing is faster for debugging.
      return { message: 'If an account exists with that email, a reset link will be sent.' };
    }

    const token = crypto.randomBytes(32).toString('hex');
    const expiry = new Date(Date.now() + 3600000); // 1 hour

    await userRepository.update(user.id, {
      resetToken: token,
      resetTokenExpiry: expiry
    });

    await emailService.sendPasswordResetEmail(user, token);
    return { message: 'Reset link sent to your email.' };
  },

  resetPassword: async (token, newPassword) => {
    if (!token || !newPassword) throw new Error('Token and new password are required');
    
    const user = await userRepository.findByResetToken(token);
    if (!user) throw new Error('Invalid or expired reset token');

    const hashed = await bcrypt.hash(newPassword, 10);
    return await userRepository.update(user.id, {
      password: hashed,
      resetToken: null,
      resetTokenExpiry: null,
      isFirstLogin: 'false'
    });
  }
};

module.exports = userService;
