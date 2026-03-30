const prisma = require('../config/prisma');

const utilityRepository = {
  // --- Todos ---
  findAllTodos: async (userId) => {
    return await prisma.todo.findMany({
      where: { userId: parseInt(userId) },
      orderBy: { createdAt: 'desc' }
    });
  },

  findTodoById: async (id) => {
    return await prisma.todo.findUnique({
      where: { id: parseInt(id) }
    });
  },

  createTodo: async (data) => {
    return await prisma.todo.create({ data });
  },

  updateTodo: async (id, data) => {
    return await prisma.todo.update({
      where: { id: parseInt(id) },
      data
    });
  },

  deleteTodo: async (id) => {
    return await prisma.todo.delete({
      where: { id: parseInt(id) }
    });
  }
};

module.exports = utilityRepository;
