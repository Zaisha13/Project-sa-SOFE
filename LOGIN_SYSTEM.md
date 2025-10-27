# Login System Documentation

## Overview
This project now includes separate login pages for Admin, Cashier, and Customer roles, all connected through a shared localStorage data structure.

## Files Created/Modified

### New Files Created:
1. **src/admin_portal-main/login.html** - Admin login page
2. **src/cashier_portal-main/login.html** - Cashier login page
3. **src/admin_portal-main/auth.css** - Copied from customer portal for styling
4. **src/cashier_portal-main/auth.css** - Copied from customer portal for styling

### Modified Files:
1. **src/customer_portal-main/login.html** - Added forgot password link and links to admin/cashier logins
2. **src/customer_portal-main/auth.js** - Added unified login system, forgot password functionality, and redirects to existing dashboards

## Data Structure

The system uses a unified localStorage structure:

```javascript
{
  admins: [
    { email: "admin@gmail.com", password: "admin123", name: "Main Admin" }
  ],
  cashiers: [
    { email: "cashier@gmail.com", password: "cashier123", name: "Cashier One" }
  ],
  customers: [
    // Customer accounts (from registration)
  ]
}
```

## Default Credentials

### Admin:
- Email: `admin@gmail.com`
- Password: `admin123`

### Cashier:
- Email: `cashier@gmail.com`
- Password: `cashier123`

## Features

### 1. Separate Login Pages
- **Customer**: `src/customer_portal-main/login.html` (existing)
- **Admin**: `src/admin_portal-main/login.html` (new)
- **Cashier**: `src/cashier_portal-main/login.html` (new)

### 2. Forgot Password
All login pages include a "Forgot Password" link that allows users to reset their password (simulated with prompts).

### 3. Unified Login Function
All logins use the same `loginUser(role)` function from `auth.js`:
- `loginUser('admin')`
- `loginUser('cashier')`
- `loginUser('customer')`

### 4. Role-Based Dashboards
After successful login, users are redirected to:
- Admin → `src/admin_portal-main/admin.html` (existing dashboard)
- Cashier → `src/cashier_portal-main/cashier.html` (existing dashboard)
- Customer → `src/customer_portal-main/customer_dashboard.html` (existing dashboard)

### 5. Shared Authentication
All login pages connect to the same `auth.js` file located in `customer_portal-main`, which handles:
- Unified authentication
- Shared localStorage data structure
- Role-based redirects

## Testing

1. Start the local server:
   ```powershell
   cd src
   python -m http.server 8000
   ```

2. Test each login:
   - Customer: Go to `http://localhost:8000/customer_portal-main/login.html`
   - Admin: Go to `http://localhost:8000/admin_portal-main/login.html`
   - Cashier: Go to `http://localhost:8000/cashier_portal-main/login.html`

3. Test credentials:
   - Customer: Register or use existing credentials
   - Admin: `admin@gmail.com` / `admin123`
   - Cashier: `cashier@gmail.com` / `cashier123`

4. Test forgot password on each login page
5. Verify redirects to the correct dashboards

## Backward Compatibility

The system maintains backward compatibility with the existing customer registration and login system. Customers can still register freely, while admin and cashier accounts are pre-created (hardcoded in localStorage).

All roles share the same unified localStorage structure, ensuring consistency across the entire system.
