const assert = require('node:assert/strict');
const { describe, it, before, after } = require('node:test');
const app = require('./index');

let server;
let baseUrl;

async function request(path, options = {}) {
  const response = await fetch(`${baseUrl}${path}`, {
    ...options,
    headers: {
      ...(options.body ? { 'Content-Type': 'application/json' } : {}),
      ...options.headers,
    },
  });

  if (response.status === 204) {
    return { response, body: null };
  }

  return { response, body: await response.json() };
}

describe('Todo API', () => {
  before(async () => {
    server = app.listen(0);
    await new Promise((resolve) => server.once('listening', resolve));
    const { port } = server.address();
    baseUrl = `http://127.0.0.1:${port}`;
  });

  after(async () => {
    await new Promise((resolve, reject) => server.close((error) => (error ? reject(error) : resolve())));
  });

  it('returns API metadata from the root endpoint', async () => {
    const { response, body } = await request('/');

    assert.equal(response.status, 200);
    assert.equal(body.success, true);
    assert.equal(body.data.name, 'Todo API');
  });

  it('returns health status', async () => {
    const { response, body } = await request('/health');

    assert.equal(response.status, 200);
    assert.equal(body.success, true);
    assert.equal(body.data.status, 'ok');
  });

  it('lists seeded todos', async () => {
    const { response, body } = await request('/api/todos');

    assert.equal(response.status, 200);
    assert.equal(body.success, true);
    assert.ok(body.data.length >= 2);
  });

  it('creates, reads, updates, filters, and deletes a todo', async () => {
    const create = await request('/api/todos', {
      method: 'POST',
      body: JSON.stringify({ title: 'Tester API complète' }),
    });

    assert.equal(create.response.status, 201);
    assert.equal(create.body.data.title, 'Tester API complète');
    assert.equal(create.body.data.completed, false);

    const id = create.body.data.id;
    const read = await request(`/api/todos/${id}`);
    assert.equal(read.response.status, 200);
    assert.equal(read.body.data.id, id);

    const put = await request(`/api/todos/${id}`, {
      method: 'PUT',
      body: JSON.stringify({ title: 'Todo remplacée', completed: true }),
    });
    assert.equal(put.response.status, 200);
    assert.equal(put.body.data.title, 'Todo remplacée');
    assert.equal(put.body.data.completed, true);

    const patch = await request(`/api/todos/${id}`, {
      method: 'PATCH',
      body: JSON.stringify({ completed: false }),
    });
    assert.equal(patch.response.status, 200);
    assert.equal(patch.body.data.completed, false);

    const filtered = await request('/api/todos?completed=false');
    assert.equal(filtered.response.status, 200);
    assert.ok(filtered.body.data.some((todo) => todo.id === id));

    const remove = await request(`/api/todos/${id}`, { method: 'DELETE' });
    assert.equal(remove.response.status, 204);

    const missing = await request(`/api/todos/${id}`);
    assert.equal(missing.response.status, 404);
  });

  it('validates request bodies and parameters', async () => {
    const invalidCreate = await request('/api/todos', {
      method: 'POST',
      body: JSON.stringify({ title: '' }),
    });
    assert.equal(invalidCreate.response.status, 400);
    assert.equal(invalidCreate.body.success, false);

    const invalidId = await request('/api/todos/not-a-number');
    assert.equal(invalidId.response.status, 400);

    const invalidFilter = await request('/api/todos?completed=maybe');
    assert.equal(invalidFilter.response.status, 400);
  });

  it('returns a JSON 404 for unknown routes', async () => {
    const { response, body } = await request('/unknown');

    assert.equal(response.status, 404);
    assert.equal(body.success, false);
  });
});
