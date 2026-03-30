const utilityRepository = require('../repositories/utilityRepository');
const communicationService = require('./communicationService');
const userRepository = require('../repositories/userRepository');

const utilityService = {
  // --- Todo logic ---
  getTodos: async (userId) => {
    return await utilityRepository.findAllTodos(userId);
  },

  getTodoById: async (id) => {
    return await utilityRepository.findTodoById(id);
  },

  createTodo: async (data, assignerId) => {
    const todo = await utilityRepository.createTodo({
      title: data.title,
      description: data.description,
      completed: data.completed || false,
      userId: parseInt(data.userId),
    });

    if (todo.userId && assignerId && todo.userId !== parseInt(assignerId)) {
      const assigner = await userRepository.findById(assignerId);
      await communicationService.notify(
        todo.userId,
        'New Task Assigned',
        `${assigner?.fullName || 'A manager'} assigned a new task to you: "${todo.title}".`,
        'INFO',
        '/todo'
      );
    }
    return todo;
  },

  updateTodo: async (id, data) => {
    return await utilityRepository.updateTodo(id, {
      title: data.title,
      description: data.description,
      completed: data.completed,
      userId: data.userId ? parseInt(data.userId) : undefined,
    });
  },

  toggleTodo: async (id) => {
    const todo = await utilityRepository.findTodoById(id);
    if (!todo) throw new Error('Todo not found');
    return await utilityRepository.updateTodo(id, { completed: !todo.completed });
  },

  deleteTodo: async (id) => {
    return await utilityRepository.deleteTodo(id);
  }
};

module.exports = utilityService;
