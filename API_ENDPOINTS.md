# API Endpoints Documentation

This document lists all the database endpoints created to replace mock data with real database connections.

## Database Configuration
- **Database**: POS (MySQL)
- **Connection**: `src/db.js` (updated to use 'POS' database)
- **Server**: `src/app.cjs` (all routes registered)

## Categories API (`/api/categories`)

### GET /api/categories
- **Description**: Fetches all active product categories
- **Query Params**: None
- **Returns**: Array of category objects with service_types parsed
- **Example**: `GET /api/categories`

### GET /api/categories/:id
- **Description**: Fetches a single category by ID
- **Params**: `id` - Category ID
- **Returns**: Category object
- **Example**: `GET /api/categories/streaming`

### POST /api/categories
- **Description**: Creates a new product category
- **Body**: `{ name, description, icon, color, service_types }`
- **Returns**: Created category object
- **Validation**: Name required, service_types must be array

### PUT /api/categories/:id
- **Description**: Updates an existing category
- **Params**: `id` - Category ID
- **Body**: `{ name, description, icon, color, service_types, is_active }`
- **Returns**: Updated category object

### DELETE /api/categories/:id
- **Description**: Soft deletes a category (sets is_active = 0)
- **Params**: `id` - Category ID
- **Returns**: Success confirmation
- **Note**: Prevents deletion if category is used by active accounts

---

## Accounts API (`/api/accounts`)

### GET /api/accounts
- **Description**: Fetches all accounts with optional filtering
- **Query Params**: 
  - `status`: 'active', 'inactive', 'all' (default: 'all')
  - `category`: category_id to filter by
  - `limit`: number of records
  - `offset`: for pagination
- **Returns**: Array of account objects with category details
- **Example**: `GET /api/accounts?status=active&limit=10`

### GET /api/accounts/active
- **Description**: Fetches only active accounts
- **Returns**: Array of active account objects

### GET /api/accounts/expiring-soon
- **Description**: Fetches accounts expiring in next 7 days
- **Returns**: Array of accounts with days_until_renewal calculated

### GET /api/accounts/:id
- **Description**: Fetches a single account by ID
- **Params**: `id` - Account ID
- **Returns**: Account object with category details

### POST /api/accounts
- **Description**: Creates a new account
- **Body**: `{ product_name, cost, service_type, subscription_type, renewal_date, category_id, ... }`
- **Returns**: Created account object
- **Validation**: Required fields validated

### PUT /api/accounts/:id
- **Description**: Updates an existing account
- **Params**: `id` - Account ID
- **Body**: Account fields to update
- **Returns**: Updated account object

### DELETE /api/accounts/:id
- **Description**: Soft deletes an account (sets is_active = 0)
- **Params**: `id` - Account ID
- **Returns**: Success confirmation

---

## Customers API (`/api/customers`)

### GET /api/customers
- **Description**: Fetches all customers with filtering
- **Query Params**:
  - `type`: 'standard', 'reseller', 'all' (default: 'all')
  - `search`: search term for name/email
  - `limit`: number of records
  - `offset`: for pagination
- **Returns**: Array of customer objects
- **Example**: `GET /api/customers?type=reseller&search=john`

### GET /api/customers/resellers
- **Description**: Fetches all reseller customers
- **Returns**: Array of reseller customer objects

### GET /api/customers/stats
- **Description**: Fetches customer statistics
- **Returns**: Object with customer counts and revenue metrics

### GET /api/customers/:id
- **Description**: Fetches a single customer by ID
- **Params**: `id` - Customer ID
- **Returns**: Customer object

### POST /api/customers
- **Description**: Creates a new customer
- **Body**: `{ name, email, phone, customer_type, billing_address_*, ... }`
- **Returns**: Created customer object
- **Validation**: Name and email required, email uniqueness checked

### PUT /api/customers/:id
- **Description**: Updates an existing customer
- **Params**: `id` - Customer ID
- **Body**: Customer fields to update
- **Returns**: Updated customer object

### DELETE /api/customers/:id
- **Description**: Deletes a customer (hard delete)
- **Params**: `id` - Customer ID
- **Returns**: Success confirmation
- **Note**: Prevents deletion if customer has active subscriptions

---

## Dashboard API (`/api/dashboard`)

### GET /api/dashboard/metrics
- **Description**: Fetches dashboard metrics (counts and revenue)
- **Returns**: `{ activeAccounts, activeSales, salesRevenue, monthlyRevenue, expiringSoon }`

### GET /api/dashboard/recent-sales
- **Description**: Fetches recent sales/subscriptions (last 30 days)
- **Query Params**: `limit` (default: 10)
- **Returns**: Array of recent sales with customer and category details

### GET /api/dashboard/recent-transactions
- **Description**: Fetches recent transactions (last 30 days)
- **Query Params**: `limit` (default: 10)
- **Returns**: Array of recent transactions with customer details

### GET /api/dashboard/upcoming-renewals
- **Description**: Fetches accounts with upcoming renewals (8-14 days)
- **Returns**: Array of accounts with renewal info

### GET /api/dashboard/sales-by-category
- **Description**: Fetches sales data grouped by category
- **Query Params**: `period` - 'week', 'month', 'year' (default: 'month')
- **Returns**: Array of category sales data for charts

### GET /api/dashboard/revenue-trend
- **Description**: Fetches revenue trend data for charts
- **Query Params**:
  - `period`: 'week', 'month', 'year' (default: 'month')
  - `granularity`: 'day', 'week', 'month' (default: 'day')
- **Returns**: Array of revenue data points over time

---

## Frontend API Functions

### Categories (`src/api/Categories.ts`)
- `fetchCategories()` - Get all categories
- `createCategory(data)` - Create new category
- `updateCategory(id, data)` - Update category
- `deleteCategory(id)` - Delete category

### Accounts (`src/api/Accounts.ts`)
- `fetchAccounts(params)` - Get accounts with filtering
- `fetchActiveAccounts()` - Get active accounts
- `fetchExpiringSoonAccounts()` - Get expiring accounts
- `createAccount(data)` - Create new account
- `updateAccount(id, data)` - Update account
- `deleteAccount(id)` - Delete account
- `fetchAccountById(id)` - Get single account

### Customers (`src/api/Customers.ts`)
- `fetchCustomers(params)` - Get customers with filtering
- `fetchResellerCustomers()` - Get reseller customers
- `fetchCustomerStats()` - Get customer statistics
- `createCustomer(data)` - Create new customer
- `updateCustomer(id, data)` - Update customer
- `deleteCustomer(id)` - Delete customer
- `fetchCustomerById(id)` - Get single customer

### Dashboard (`src/api/Dashboard.ts`)
- `fetchDashboardMetrics()` - Get dashboard metrics
- `fetchRecentSales(limit)` - Get recent sales
- `fetchRecentTransactions(limit)` - Get recent transactions
- `fetchUpcomingRenewals()` - Get upcoming renewals
- `fetchSalesByCategory(period)` - Get sales by category
- `fetchRevenueTrend(params)` - Get revenue trend data

---

## Updated Data Layer (`src/data/mockData.ts`)

All functions now fetch real data from the database:
- `getDashboardMetrics()` - Async function using API
- `getExpiringSoon()` - Async function using API
- `getUpcomingRenewals()` - Async function using API
- `getRecentSales()` - Async function using API
- `getRecentTransactions()` - Async function using API
- `getAccounts()` - Async function using API
- `getActiveAccounts()` - Async function using API

Additional utility functions:
- `getAccountsByCategory(categoryId)` - Filter accounts by category
- `getRenewableAccounts()` - Get renewable accounts
- `getAccountsExpiringSoon()` - Get expiring accounts
- `getSharedAccounts()` - Get shared accounts
- `getIndividualAccounts()` - Get individual accounts

---

## Database Schema Updates

Added `product_categories` table:
```sql
CREATE TABLE IF NOT EXISTS product_categories (
  id VARCHAR(64) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  icon VARCHAR(10) DEFAULT '📱',
  color VARCHAR(255) DEFAULT 'bg-gray-500/20 text-gray-300 border-gray-500/30',
  service_types JSON,
  created_at DATETIME NOT NULL,
  is_active BOOLEAN DEFAULT TRUE
);
```

---

## Error Handling

All endpoints include:
- Input validation
- Error logging
- Proper HTTP status codes
- Descriptive error messages
- Database constraint checking (foreign keys, unique constraints)

## Next Steps

1. **Test Database Connection**: Run the server and test `/api/test-db` endpoint
2. **Populate Sample Data**: Insert sample categories and accounts for testing
3. **Update Components**: Update React components to use the async data functions
4. **Add Authentication**: Consider adding authentication middleware for protected routes
5. **Add Pagination**: Implement proper pagination for large datasets
