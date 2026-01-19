# Quick Start: Database Setup

## ⚡ Fast Track (3 minutes)

### Step 1: Get a Database
Go to [neon.tech](https://neon.tech) → Sign up → Create project → Copy connection string

### Step 2: Configure
Add to `.env.local`:
```bash
DATABASE_URL="postgresql://user:pass@host.neon.tech/db?sslmode=require"
```

### Step 3: Run Migrations
```bash
npm run db:push
```

### Step 4: Verify
```bash
npm run db:check
```

Done! ✅

---

## 🎯 Interactive Setup (5 minutes)

If you prefer a guided setup:

```bash
npm run db:setup-interactive
```

This wizard will:
- Help you choose between Neon or local PostgreSQL
- Save your connection string
- Test the connection
- Offer to run migrations

---

## 📚 Full Documentation

See `docs/DATABASE_MIGRATION_GUIDE.md` for:
- Detailed setup instructions
- Troubleshooting guide
- Schema documentation
- All available commands

---

## 🔍 Useful Commands

```bash
# Check database connection
npm run db:check

# Interactive setup wizard
npm run db:setup-interactive

# Push schema to database (fast)
npm run db:push

# Generate migration files
npm run db:generate

# Open database GUI
npm run db:studio

# Drop all tables (⚠️ destructive)
npm run db:drop
```

---

## 📊 What Gets Created

### Tables
- **users** - User accounts with RBAC
- **items** - Universal items table (quilts, cards, shoes, rackets)
- **usage_logs** - Audit trail for all operations

### Features
- ✅ Single-table inheritance with JSONB
- ✅ Role-based access control
- ✅ Multi-tenant data isolation
- ✅ Comprehensive indexing
- ✅ Cascade deletes
- ✅ Audit logging

---

## 🆘 Troubleshooting

**"DATABASE_URL not set"**
→ Add it to `.env.local`

**"Connection refused"**
→ Check database is running / Neon project is active

**"No tables found"**
→ Run `npm run db:push`

**Need help?**
→ See `docs/DATABASE_MIGRATION_GUIDE.md`

---

## ✅ Next Steps

After database setup:
1. ✅ Database ready
2. ➡️ Implement authentication (Task 3)
3. ➡️ Create user interface (Task 5)
4. ➡️ Build module system (Task 8)
