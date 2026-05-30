# Project Organization Summary

## ✅ Completed Reorganization

### Folder Structure Changes

**New Organized Structure:**
```
project-root/
├── src/                              # All application source code
│   ├── server.js                    # Main entry point (moved from root)
│   ├── db.js                        # Database connection
│   ├── authentication.js            # Authentication logic
│   ├── isLoggedIn.js               # Middleware for session validation
│   ├── utility-file.js             # Utility functions
│   └── routes/
│       └── profileUpdateRouter.js   # Profile update router
├── database/                         # All SQL files
│   ├── schema.sql                  # Database schema
│   ├── function.sql                # PostgreSQL functions
│   ├── procedures.sql              # Stored procedures
│   ├── triggers.sql                # Database triggers
│   └── Insertion.sql               # Initial data
├── public/                          # Static assets (unchanged)
│   ├── bgImage/
│   ├── images/
├── views/                           # EJS templates (unchanged)
├── uploads/                         # User uploads (unchanged)
├── package.json                     # Updated with new main path
└── .env                            # Environment config (create this)
```

### Code Changes Made

#### 1. **package.json** - Updated
- `"main": "src/server.js"` (was: `"server.js"`)
- `"start": "node src/server.js"` (was: `"node server.js"`)
- Added `"dev": "node src/server.js"`

#### 2. **src/server.js** - Path Updates
- Added `const path = require("path");` for cross-platform paths
- Updated views directory: `app.set('views', path.join(__dirname, '../views'));`
- Updated static files: `app.use(express.static(path.join(__dirname, '../public')));`
- Updated uploads: 
  - Storage: `path.join(__dirname, '../uploads')`
  - Static serve: `path.join(__dirname, '../uploads')`
- Fixed profile router require: `require("./routes/profileUpdateRouter")`
- Router mount: `app.use("/profile/update", profileUpdateRouter);`

#### 3. **src/routes/profileUpdateRouter.js** - Path Updates
- Updated db.js path: `require("../db")` (was: `require("./db")`)
- Updated isLoggedIn path: `require("../isLoggedIn")` (was: `require("./isLoggedIn")`)

#### 4. **src/utility-file.js** - Cleaned Up
- Removed unnecessary Express app setup
- Kept only database and utility function logic
- Updated db.js require: `require("./db")`

#### 5. **src/db.js** - Unchanged Structure
- Database configuration remains the same
- Uses .env variables for connection

#### 6. **src/authentication.js** - Unchanged Structure
- Authentication logic preserved
- Uses db.js connection

#### 7. **src/isLoggedIn.js** - Unchanged Structure
- Session middleware preserved

#### 8. **database/ SQL Files** - Organized
- `schema.sql` - Created from schema (1).sql
- `function.sql` - All PostgreSQL functions
- `procedures.sql` - Stored procedures
- `triggers.sql` - Database triggers with DROP IF EXISTS safety
- `Insertion.sql` - Initial data

### How to Run

1. **Create .env file** in project root:
```env
DB_USER=your_db_user
DB_HOST=localhost
DB_DATABASE=your_db_name
DB_PASSWORD=your_password
DB_PORT=5432
Port=3000
```

2. **Install dependencies:**
```bash
npm install
```

3. **Setup database:**
```bash
psql -U your_user -d your_db -f database/schema.sql
psql -U your_user -d your_db -f database/function.sql
psql -U your_user -d your_db -f database/procedures.sql
psql -U your_user -d your_db -f database/triggers.sql
psql -U your_user -d your_db -f database/Insertion.sql
```

4. **Run application:**
```bash
npm start
```

The app will start on `http://localhost:3000`

