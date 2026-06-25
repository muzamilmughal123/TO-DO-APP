import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import appModule from '../src/app';
import connectDB from '../src/config/db';
import seedDatabase from '../src/config/seeder';
import mongoose from 'mongoose';

const app = appModule.default || appModule;

let connection;

beforeAll(async () => {
  connection = await connectDB();
  await seedDatabase();
});

afterAll(async () => {
  if (connection) {
    await mongoose.disconnect();
  }
});

describe('Server API', () => {
  it('should return health message at root', async () => {
    const res = await request(app).get('/');
    expect(res.status).toBe(200);
    expect(res.body).toEqual({
      success: true,
      message: 'AI-Powered Smart Task Manager API is running...',
    });
  });

  it('should authenticate seeded admin user', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'admin@task.com', password: 'admin123' });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveProperty('accessToken');
    expect(res.body.data.user).toMatchObject({
      email: 'admin@task.com',
      role: 'admin',
    });
  });

  it('should list tasks for authenticated admin', async () => {
    const login = await request(app)
      .post('/api/auth/login')
      .send({ email: 'admin@task.com', password: 'admin123' });

    const token = login.body.data.accessToken;
    const res = await request(app)
      .get('/api/tasks')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data.tasks)).toBe(true);
    expect(res.body.data.tasks.length).toBeGreaterThanOrEqual(1);
  });
});
