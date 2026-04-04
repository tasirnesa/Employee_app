const userService = require('../services/userService');
const asyncHandler = require('../utils/asyncHandler');

const userController = {
  getUsers: asyncHandler(async (req, res) => {
    const users = await userService.getAllUsers();
    res.json(users);
  }),

  getUser: asyncHandler(async (req, res) => {
    const user = await userService.getUserById(req.params.id);
    res.json(user);
  }),

  updateUser: asyncHandler(async (req, res) => {
    const updated = await userService.updateUser(req.params.id, req.body);
    res.json(updated);
  }),

  deleteUser: asyncHandler(async (req, res) => {
    await userService.deleteUser(req.params.id);
    res.status(204).send();
  }),

  authorizeUser: asyncHandler(async (req, res) => {
    const updated = await userService.authorizeUser(req.params.id);
    res.json({ message: 'User authorized', user: updated });
  }),

  // --- Auth & Profile ---
  login: asyncHandler(async (req, res) => {
    const { username, password } = req.body;
    const result = await userService.login(username, password);
    res.json(result);
  }),

  changePassword: asyncHandler(async (req, res) => {
    const { currentPassword, newPassword } = req.body;
    const user = await userService.changePassword(req.user.id, currentPassword, newPassword);
    res.json({ message: 'Password updated successfully', user: { id: user.id, isFirstLogin: user.isFirstLogin } });
  }),

  getMe: asyncHandler(async (req, res) => {
    const user = await userService.getMe(req.user.id);
    res.json(user);
  }),

  updateMe: asyncHandler(async (req, res) => {
    const user = await userService.updateMe(req.user.id, req.body);
    res.json({ message: 'User updated successfully', user });
  }),

  forgotPassword: asyncHandler(async (req, res) => {
    const result = await userService.forgotPassword(req.body.email);
    res.json(result);
  }),

  resetPassword: asyncHandler(async (req, res) => {
    const result = await userService.resetPassword(req.body.token, req.body.newPassword);
    res.json(result);
  })
};

module.exports = userController;
