const database = process.env.MONGO_APP_DATABASE || 'mentora';

db.getSiblingDB('admin').createUser({
  user: process.env.MONGO_BACKUP_USER || 'backup',
  pwd: process.env.MONGO_BACKUP_PASSWORD,
  roles: [
    { role: 'backup', db: 'admin' },
    { role: 'restore', db: 'admin' },
  ],
});

db.getSiblingDB(database).createUser({
  user: process.env.MONGO_APP_USER || 'mentora',
  pwd: process.env.MONGO_APP_PASSWORD,
  roles: [{ role: 'readWrite', db: database }],
});
