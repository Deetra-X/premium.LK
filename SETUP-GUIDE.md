# Premium.LK - Setup and Troubleshooting Guide

## 🚀 Quick Start

To run the application, you need to start **both** the frontend and backend servers:

### Option 1: Automatic (Recommended)
```bash
npm run dev:full
```

### Option 2: Manual Start

**Terminal 1 - Backend Server:**
```bash
npm run server
# OR
node src/app.cjs
# OR (Windows)
start-backend.bat
```

**Terminal 2 - Frontend Server:**
```bash
npm run dev
```

## 📋 Prerequisites

1. **Node.js** (v16 or higher)
2. **MySQL Database** running on localhost:3306
3. **Database Setup:**
   - Database name: `POS`
   - Username: `root`
   - Password: `root`
   - Tables: `accounts`, `product_categories`

## 🔍 Troubleshooting Account Data Issues

### Issue: "Account details not fetch from database"

**Symptoms:**
- Accounts list is empty
- Console shows fetch errors
- Network errors in browser dev tools

**Solutions:**

1. **Check Backend Server:**
   - Make sure the backend server is running on port 3001
   - Look for "Server running on port 3001" message
   - Test: Open http://localhost:3001/api/accounts in browser

2. **Check Database Connection:**
   - Ensure MySQL is running
   - Verify database credentials in `src/db.js`
   - Test connection: http://localhost:3001/test-db

3. **Check Database Tables:**
   ```sql
   USE POS;
   SHOW TABLES;
   SELECT * FROM accounts LIMIT 5;
   SELECT * FROM product_categories LIMIT 5;
   ```

4. **Check Browser Console:**
   - Open Developer Tools (F12)
   - Look for fetch errors or network issues
   - Check if API calls are being made to the right URLs

## 🛠️ Common Fixes

### Fix 1: Install Dependencies
```bash
npm install
```

### Fix 2: Install Concurrently (for dev:full command)
```bash
npm install --save-dev concurrently
```

### Fix 3: Reset Database Connection
1. Stop all servers
2. Restart MySQL service
3. Restart backend server
4. Restart frontend server

### Fix 4: Clear Browser Cache
- Hard refresh: Ctrl+Shift+R (Windows) or Cmd+Shift+R (Mac)
- Clear localStorage: F12 → Application → Local Storage → Clear

## 📱 API Endpoints

- `GET /api/accounts` - Fetch all accounts
- `POST /api/accounts` - Create new account
- `PUT /api/accounts/:id` - Update account
- `DELETE /api/accounts/:id` - Delete account
- `GET /api/categories` - Fetch categories

## 🔧 Development Mode

The application includes debugging logs. Check the browser console for:
- 🔄 Fetching accounts and categories...
- ✅ Accounts fetched: [data]
- ❌ Error fetching data: [error]

## 📞 Support

If accounts are still not loading:
1. Check all terminals for error messages
2. Verify MySQL is running and accessible
3. Ensure both frontend (5173) and backend (3001) ports are free
4. Check firewall settings

## 🎯 Quick Test

Open browser console and run:
```javascript
fetch('/api/accounts').then(r => r.json()).then(console.log)
```

This should return your accounts data or show the specific error.
