// =======================================================
//  Angadia Pedhi — Database Seed Script
//  Run: node scripts/seed.js
// =======================================================
const { MongoClient, Decimal128 } = require('mongodb');
const bcrypt = require('bcryptjs');

const URI = process.env.MONGO_URI || 'mongodb://angadia_user:angadia_pass_dev@localhost:27017/angadia_dev?authSource=angadia_dev';
const DB   = 'angadia_dev';

async function seed() {
  const client = new MongoClient(URI);
  await client.connect();
  const db = client.db(DB);
  console.log('Connected to MongoDB');

  // ── Cities ────────────────────────────────────────────
  const cities = [
    { name: 'Ahmedabad', state: 'Gujarat', isActive: true, createdAt: new Date() },
    { name: 'Surat',     state: 'Gujarat', isActive: true, createdAt: new Date() },
    { name: 'Rajkot',   state: 'Gujarat', isActive: true, createdAt: new Date() },
    { name: 'Vadodara', state: 'Gujarat', isActive: true, createdAt: new Date() },
    { name: 'Mumbai',   state: 'Maharashtra', isActive: true, createdAt: new Date() },
    { name: 'Delhi',    state: 'Delhi', isActive: true, createdAt: new Date() },
  ];

  for (const city of cities) {
    await db.collection('cities').updateOne(
      { name: city.name },
      { $setOnInsert: city },
      { upsert: true }
    );
  }
  console.log(`Seeded ${cities.length} cities`);

  // ── Admin User ────────────────────────────────────────
  const passwordHash = await bcrypt.hash('Admin@1234', 12);
  await db.collection('users').updateOne(
    { username: 'admin' },
    {
      $setOnInsert: {
        username: 'admin',
        passwordHash,
        role: 'ADMIN',
        fullName: 'System Administrator',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      }
    },
    { upsert: true }
  );
  console.log('Admin user seeded: admin / Admin@1234');

  // ── Staff User ────────────────────────────────────────
  const staffHash = await bcrypt.hash('Staff@1234', 12);
  await db.collection('users').updateOne(
    { username: 'staff1' },
    {
      $setOnInsert: {
        username: 'staff1',
        passwordHash: staffHash,
        role: 'STAFF',
        fullName: 'Staff Member',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      }
    },
    { upsert: true }
  );
  console.log('Staff user seeded: staff1 / Staff@1234');

  // ── Sample Vatav Rate ─────────────────────────────────
  await db.collection('vatav_rates').updateOne(
    { effectiveTo: null },
    {
      $setOnInsert: {
        effectiveFrom: new Date('2024-04-01'),
        effectiveTo: null,
        rate: Decimal128.fromString('0.25'),
        description: 'Default vatav rate 0.25%',
        createdAt: new Date(),
        createdBy: 'system',
      }
    },
    { upsert: true }
  );
  console.log('Vatav rate seeded: 0.25%');

  // ── Counters collection seed ──────────────────────────
  await db.collection('counters').updateOne(
    { _id: 'party-AHM' },
    { $setOnInsert: { _id: 'party-AHM', seq: 0 } },
    { upsert: true }
  );

  await client.close();
  console.log('\n✅ Seed complete!');
  console.log('   Admin login: admin / Admin@1234');
  console.log('   Staff login: staff1 / Staff@1234');
}

seed().catch(err => { console.error('Seed failed:', err); process.exit(1); });
