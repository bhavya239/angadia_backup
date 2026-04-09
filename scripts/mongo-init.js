// MongoDB init script — runs on first container start
// Creates the app user with least-privilege access

db = db.getSiblingDB('angadia_dev');

db.createUser({
  user: 'angadia_user',
  pwd: 'angadia_pass_dev',
  roles: [{ role: 'readWrite', db: 'angadia_dev' }]
});

// Create collections with validation
db.createCollection('users');
db.createCollection('cities');
db.createCollection('parties');
db.createCollection('transactions');
db.createCollection('opening_balances');
db.createCollection('vatav_rates');
db.createCollection('audit_logs');
db.createCollection('refresh_tokens');
db.createCollection('counters');

print('angadia_dev database initialized successfully');
