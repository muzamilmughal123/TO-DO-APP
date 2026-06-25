const User = require('../models/User');
const Task = require('../models/Task');
const AuditLog = require('../models/AuditLog');

const seedDatabase = async () => {
  try {
    const userCount = await User.countDocuments();
    if (userCount > 0) {
      console.log('Database already has users. Seeding skipped.');
      return;
    }

    console.log('Seeding database with default demo accounts and tasks...');

    // 1. Create Users
    const usersData = [
      {
        name: 'Super Admin',
        email: 'admin@task.com',
        password: 'admin123',
        role: 'admin',
        avatar: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?auto=format&fit=crop&q=80&w=200',
      },
      {
        name: 'Alex Manager',
        email: 'manager@task.com',
        password: 'manager123',
        role: 'manager',
        avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=200',
      },
      {
        name: 'Sarah User',
        email: 'user@task.com',
        password: 'user123',
        role: 'user',
        avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=200',
      },
    ];

    const seededUsers = [];
    for (const u of usersData) {
      const newUser = new User(u);
      await newUser.save();
      seededUsers.push(newUser);
    }
    console.log('Successfully seeded 3 demo users.');

    const adminUser = seededUsers.find(u => u.role === 'admin');
    const managerUser = seededUsers.find(u => u.role === 'manager');
    const regularUser = seededUsers.find(u => u.role === 'user');

    // 2. Create Tasks
    const tasksData = [
      {
        title: 'Launch Smart Task System',
        description: 'Complete the full stack integration, connect Socket.io, and verify JWT rotation endpoints.',
        category: 'Work',
        priority: 'Critical',
        status: 'In-Progress',
        assignedTo: managerUser._id,
        createdBy: adminUser._id,
        dueDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000), // 2 days from now
        aiGeneratedSummary: '[Mock AI] Finish JWT tokens and socket configuration.',
        tags: ['sprint-1', 'launch'],
      },
      {
        title: 'Configure OpenAI API Secrets',
        description: 'Add VITE_API_URL and OPENAI_API_KEY environment variables in .env configuration.',
        category: 'Urgent',
        priority: 'High',
        status: 'Pending',
        assignedTo: regularUser._id,
        createdBy: managerUser._id,
        dueDate: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000), // 1 day from now
        aiGeneratedSummary: '[Mock AI] Set up OpenAI keys in the environment settings.',
        tags: ['config', 'security'],
      },
      {
        title: 'Deploy MERN App to Production',
        description: 'Publish React code to Vercel and Express server endpoints to Render web services.',
        category: 'Work',
        priority: 'High',
        status: 'Pending',
        assignedTo: adminUser._id,
        createdBy: managerUser._id,
        dueDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000), // 5 days from now
        aiGeneratedSummary: '[Mock AI] Publish backend server to Render and client to Vercel.',
        tags: ['deployment'],
      },
      {
        title: 'Team Standup Meeting',
        description: 'Catch up on task blockages and outline plans for sprint progress reviews.',
        category: 'Meeting',
        priority: 'Medium',
        status: 'Completed',
        assignedTo: regularUser._id,
        createdBy: managerUser._id,
        dueDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // yesterday
        aiGeneratedSummary: '[Mock AI] Sync team progress and address issues.',
        tags: ['sync', 'daily'],
      },
      {
        title: 'Weekly Sprint Review',
        description: 'Present tasks finished this sprint and review AI summary performance results.',
        category: 'Meeting',
        priority: 'Medium',
        status: 'Pending',
        assignedTo: null,
        createdBy: managerUser._id,
        dueDate: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000), // 4 days from now
        aiGeneratedSummary: '[Mock AI] Demo achievements and review AI metrics.',
        tags: ['meeting', 'sprint'],
      },
    ];

    for (const t of tasksData) {
      const newTask = new Task(t);
      await newTask.save();
    }
    console.log('Successfully seeded 5 initial tasks.');

    // 3. Add initial log
    const systemLog = new AuditLog({
      action: 'SYSTEM_BOOT_SEED',
      resource: 'System',
      details: { message: 'Database initialized and seeded with demo data.' },
      ipAddress: '127.0.0.1',
    });
    await systemLog.save();
    console.log('Database seeding finished.');

  } catch (error) {
    console.error('Failed to seed database:', error);
  }
};

module.exports = seedDatabase;
