const BASE_URL = process.env.API_URL || 'http://localhost:5000';
const ADMIN_CREDENTIALS = { email: 'admin@task.com', password: 'admin123' };
const MANAGER_CREDENTIALS = { email: 'manager@task.com', password: 'manager123' };

const headers = (token) => ({
  'Content-Type': 'application/json',
  Authorization: `Bearer ${token}`,
});

const checkResponse = async (res, name) => {
  const body = await res.json().catch(() => ({}));
  if (!res.ok || body.success === false) {
    const message = body.message || res.statusText || 'Unknown error';
    throw new Error(`${name} failed: ${message}`);
  }
  return body;
};

const fetchJson = async (url, options = {}, name) => {
  const res = await fetch(url, options);
  return checkResponse(res, name);
};

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const run = async () => {
  console.log('SQA Smoke Test Starting...');

  const root = await fetchJson(`${BASE_URL}/`, { method: 'GET' }, 'Root endpoint');
  console.log('✔ Root endpoint is reachable');

  const loginAdmin = await fetchJson(
    `${BASE_URL}/api/auth/login`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(ADMIN_CREDENTIALS),
    },
    'Admin login'
  );

  const adminToken = loginAdmin.data.accessToken;
  console.log('✔ Admin login works');

  const team = await fetchJson(
    `${BASE_URL}/api/auth/team`,
    { method: 'GET', headers: headers(adminToken) },
    'Team retrieval'
  );
  console.log(`✔ Team retrieval works (${team.data.length} members)`);

  const tasks = await fetchJson(
    `${BASE_URL}/api/tasks`,
    { method: 'GET', headers: headers(adminToken) },
    'Task list retrieval'
  );
  console.log(`✔ Task listing works (${tasks.data.tasks.length} tasks)`);

  const aiSuggest = await fetchJson(
    `${BASE_URL}/api/tasks/ai-suggest`,
    {
      method: 'POST',
      headers: headers(adminToken),
      body: JSON.stringify({
        title: 'QA smoke test task',
        description: 'Validate AI suggestion for task creation.',
      }),
    },
    'AI suggestion'
  );
  console.log(`✔ AI suggestion works (${aiSuggest.data.category}, ${aiSuggest.data.priority})`);

  const createTaskBody = {
    title: 'Smoke test regression task',
    description: 'Test the create/update/delete task lifecycle.',
    category: 'Work',
    priority: 'High',
    status: 'Pending',
    assignedTo: team.data[1]?._id || team.data[0]._id,
    dueDate: '2026-07-15',
    tags: ['sqa', 'smoke'],
  };

  const createRes = await fetchJson(
    `${BASE_URL}/api/tasks`,
    { method: 'POST', headers: headers(adminToken), body: JSON.stringify(createTaskBody) },
    'Task creation'
  );
  console.log(`✔ Task creation works (ID: ${createRes.data._id})`);

  const updateRes = await fetchJson(
    `${BASE_URL}/api/tasks/${createRes.data._id}`,
    {
      method: 'PUT',
      headers: headers(adminToken),
      body: JSON.stringify({
        ...createTaskBody,
        title: 'Smoke test regression task - updated',
        status: 'In-Progress',
      }),
    },
    'Task update'
  );
  console.log(`✔ Task update works (${updateRes.data.title})`);

  const deleteRes = await fetchJson(
    `${BASE_URL}/api/tasks/${createRes.data._id}`,
    { method: 'DELETE', headers: headers(adminToken) },
    'Task deletion'
  );
  console.log(`✔ Task deletion works`);

  const refreshRes = await fetchJson(
    `${BASE_URL}/api/auth/refresh-token`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token: loginAdmin.data.refreshToken }),
    },
    'Refresh token'
  );
  console.log('✔ Refresh token works');

  const loginManager = await fetchJson(
    `${BASE_URL}/api/auth/login`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(MANAGER_CREDENTIALS),
    },
    'Manager login'
  );

  const managerToken = loginManager.data.accessToken;
  await sleep(500);
  const adminAccessCheck = await fetch(`${BASE_URL}/api/admin/users`, {
    method: 'GET',
    headers: headers(managerToken),
  });
  if (adminAccessCheck.ok) {
    throw new Error('Manager should not have admin access');
  }
  console.log('✔ Role restriction works (manager cannot access admin endpoint)');

  console.log('\nSQA Smoke Test Completed Successfully.');
  process.exit(0);
};

run().catch((error) => {
  console.error('\nSQA Smoke Test Failed:', error.message);
  process.exit(1);
});
