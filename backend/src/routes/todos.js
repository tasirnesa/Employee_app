const express = require('express');
const { PrismaClient } = require('@prisma/client');
const router = express.Router();
const prisma = new PrismaClient();

// Get todos for a user
router.get('/user/:userId', async (req, res) => {
  console.log('GET /api/todos/user/:userId called');
  try {
    const { userId } = req.params;
    const todos = await prisma.todo.findMany({
      where: {
        userId: parseInt(userId),
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
    res.json(todos);
  } catch (error) {
    console.error('Error fetching todos:', error);
    res.status(500).json({ error: 'Failed to fetch todos' });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const todo = await prisma.todo.findUnique({
      where: {
        id: parseInt(id),
      },
    });
    
    if (!todo) {
      return res.status(404).json({ error: 'Todo not found' });
    }
    
    res.json(todo);
  } catch (error) {
    console.error('Error fetching todo:', error);
    res.status(500).json({ error: 'Failed to fetch todo' });
  }
});

router.post('/', async (req, res) => {
  try {
    const data = req.body;
    const todo = await prisma.todo.create({
      data: {
        title: data.title,
        description: data.description,
        completed: data.completed || false,
        userId: parseInt(data.userId),
      },
    });
    res.json(todo);
  } catch (error) {
    console.error('Error creating todo:', error);
    res.status(500).json({ error: 'Failed to create todo' });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const data = req.body;
    const todo = await prisma.todo.update({
      where: {
        id: parseInt(id),
      },
      data: {
        title: data.title,
        description: data.description,
        completed: data.completed,
        userId: data.userId ? parseInt(data.userId) : undefined,
      },
    });
    res.json(todo);
  } catch (error) {
    console.error('Error updating todo:', error);
    res.status(500).json({ error: 'Failed to update todo' });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.todo.delete({
      where: {
        id: parseInt(id),
      },
    });
    res.json({ message: 'Todo deleted successfully' });
  } catch (error) {
    console.error('Error deleting todo:', error);
    res.status(500).json({ error: 'Failed to delete todo' });
  }
});

router.patch('/:id/toggle', async (req, res) => {
  try {
    const { id } = req.params;
    const todo = await prisma.todo.findUnique({
      where: {
        id: parseInt(id),
      },
    });
    
    if (!todo) {
      return res.status(404).json({ error: 'Todo not found' });
    }
    
    const updatedTodo = await prisma.todo.update({
      where: {
        id: parseInt(id),
      },
      data: {
        completed: !todo.completed,
      },
    });
    res.json(updatedTodo);
  } catch (error) {
    console.error('Error toggling todo:', error);
    res.status(500).json({ error: 'Failed to toggle todo' });
  }
});

module.exports = router;