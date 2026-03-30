const utilityService = require('../services/utilityService');
const asyncHandler = require('../utils/asyncHandler');

const todoController = {
  getTodos: asyncHandler(async (req, res) => {
    const todos = await utilityService.getTodos(req.params.userId);
    res.json(todos);
  }),

  getTodoById: asyncHandler(async (req, res) => {
    const todo = await utilityService.getTodoById(req.params.id);
    if (!todo) {
      const error = new Error('Todo not found');
      error.statusCode = 404;
      throw error;
    }
    res.json(todo);
  }),

  createTodo: asyncHandler(async (req, res) => {
    const todo = await utilityService.createTodo(req.body, req.user?.id);
    res.json(todo);
  }),

  updateTodo: asyncHandler(async (req, res) => {
    const todo = await utilityService.updateTodo(req.params.id, req.body);
    res.json(todo);
  }),

  deleteTodo: asyncHandler(async (req, res) => {
    await utilityService.deleteTodo(req.params.id);
    res.json({ message: 'Todo deleted successfully' });
  }),

  toggleTodo: asyncHandler(async (req, res) => {
    const updatedTodo = await utilityService.toggleTodo(req.params.id);
    res.json(updatedTodo);
  })
};

module.exports = todoController;
