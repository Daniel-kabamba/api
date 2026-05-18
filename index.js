const express = require('express');

const DEFAULT_PORT = 3000;
const app = express();

app.use(express.json());

let nextTodoId = 3;
const todos = new Map([
  [
    1,
    {
      id: 1,
      title: 'Créer une API Express',
      completed: true,
      createdAt: new Date('2026-01-01T00:00:00.000Z').toISOString(),
      updatedAt: new Date('2026-01-01T00:00:00.000Z').toISOString(),
    },
  ],
  [
    2,
    {
      id: 2,
      title: 'Ajouter les routes CRUD',
      completed: false,
      createdAt: new Date('2026-01-02T00:00:00.000Z').toISOString(),
      updatedAt: new Date('2026-01-02T00:00:00.000Z').toISOString(),
    },
  ],
]);

function sendSuccess(res, data, status = 200) {
  return res.status(status).json({ success: true, data });
}

function sendError(res, status, message, details) {
  return res.status(status).json({
    success: false,
    error: {
      message,
      ...(details ? { details } : {}),
    },
  });
}

function parseTodoId(req, res, next) {
  const id = Number(req.params.id);

  if (!Number.isInteger(id) || id <= 0) {
    return sendError(res, 400, 'Invalid todo id. It must be a positive integer.');
  }

  req.todoId = id;
  return next();
}

function findTodo(req, res, next) {
  const todo = todos.get(req.todoId);

  if (!todo) {
    return sendError(res, 404, 'Todo not found.');
  }

  req.todo = todo;
  return next();
}

function validateTodoCreate(req, res, next) {
  const errors = [];
  const { title, completed } = req.body;

  if (typeof title !== 'string' || title.trim().length === 0) {
    errors.push('title is required and must be a non-empty string.');
  }

  if (completed !== undefined && typeof completed !== 'boolean') {
    errors.push('completed must be a boolean when provided.');
  }

  if (errors.length > 0) {
    return sendError(res, 400, 'Validation failed.', errors);
  }

  req.validatedTodo = {
    title: title.trim(),
    completed: completed ?? false,
  };

  return next();
}

function validateTodoUpdate(req, res, next) {
  const errors = [];
  const allowedFields = ['title', 'completed'];
  const providedFields = Object.keys(req.body);

  if (providedFields.length === 0) {
    errors.push('At least one field is required.');
  }

  const unknownFields = providedFields.filter((field) => !allowedFields.includes(field));
  if (unknownFields.length > 0) {
    errors.push(`Unknown field(s): ${unknownFields.join(', ')}.`);
  }

  if ('title' in req.body && (typeof req.body.title !== 'string' || req.body.title.trim().length === 0)) {
    errors.push('title must be a non-empty string when provided.');
  }

  if ('completed' in req.body && typeof req.body.completed !== 'boolean') {
    errors.push('completed must be a boolean when provided.');
  }

  if (errors.length > 0) {
    return sendError(res, 400, 'Validation failed.', errors);
  }

  req.validatedTodo = {
    ...('title' in req.body ? { title: req.body.title.trim() } : {}),
    ...('completed' in req.body ? { completed: req.body.completed } : {}),
  };

  return next();
}

app.get('/', (req, res) => {
  sendSuccess(res, {
    name: 'Todo API',
    version: '1.0.0',
    endpoints: {
      health: 'GET /health',
      listTodos: 'GET /api/todos',
      getTodo: 'GET /api/todos/:id',
      createTodo: 'POST /api/todos',
      updateTodo: 'PUT /api/todos/:id',
      patchTodo: 'PATCH /api/todos/:id',
      deleteTodo: 'DELETE /api/todos/:id',
    },
  });
});

app.get('/health', (req, res) => {
  sendSuccess(res, {
    status: 'ok',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
  });
});

app.get('/api/todos', (req, res) => {
  const { completed } = req.query;
  let results = Array.from(todos.values());

  if (completed !== undefined) {
    if (!['true', 'false'].includes(completed)) {
      return sendError(res, 400, 'completed query parameter must be true or false.');
    }

    const completedFilter = completed === 'true';
    results = results.filter((todo) => todo.completed === completedFilter);
  }

  return sendSuccess(res, results);
});

app.post('/api/todos', validateTodoCreate, (req, res) => {
  const now = new Date().toISOString();
  const todo = {
    id: nextTodoId,
    ...req.validatedTodo,
    createdAt: now,
    updatedAt: now,
  };

  todos.set(nextTodoId, todo);
  nextTodoId += 1;

  return sendSuccess(res, todo, 201);
});

app.get('/api/todos/:id', parseTodoId, findTodo, (req, res) => {
  sendSuccess(res, req.todo);
});

app.put('/api/todos/:id', parseTodoId, findTodo, validateTodoCreate, (req, res) => {
  const updatedTodo = {
    ...req.todo,
    ...req.validatedTodo,
    updatedAt: new Date().toISOString(),
  };

  todos.set(req.todoId, updatedTodo);
  sendSuccess(res, updatedTodo);
});

app.patch('/api/todos/:id', parseTodoId, findTodo, validateTodoUpdate, (req, res) => {
  const updatedTodo = {
    ...req.todo,
    ...req.validatedTodo,
    updatedAt: new Date().toISOString(),
  };

  todos.set(req.todoId, updatedTodo);
  sendSuccess(res, updatedTodo);
});

app.delete('/api/todos/:id', parseTodoId, findTodo, (req, res) => {
  todos.delete(req.todoId);
  res.status(204).send();
});

app.use((req, res) => {
  sendError(res, 404, `Route ${req.method} ${req.originalUrl} not found.`);
});

app.use((err, req, res, next) => {
  if (err instanceof SyntaxError && 'body' in err) {
    return sendError(res, 400, 'Invalid JSON payload.');
  }

  console.error(err);
  return sendError(res, 500, 'Internal server error.');
});

if (require.main === module) {
  const port = Number(process.env.PORT) || DEFAULT_PORT;

  app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
  });
}

module.exports = app;
