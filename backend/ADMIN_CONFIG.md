# Admin Wallet Configuration

This document explains how to configure admin wallets for the Offchain HubKey backend.

## Environment Variable Configuration

Admin wallets are configured via the `ADMIN_WALLETS` environment variable in your `.env` file.

### Format
```bash
ADMIN_WALLETS=wallet1,wallet2,wallet3
```

### Example
```bash
# Add admin wallet addresses (comma-separated, case-insensitive)
ADMIN_WALLETS=0x71C7656EC7ab88b098defB751B7401B5f6d8976F,0x742d35Cc6634C0532925a3b8D87fBd83c6C4c4c7,0x123...abc
```

## Default Admin Wallets

If no `ADMIN_WALLETS` environment variable is set, the system will use these default admin wallets:
- `0x71C7656EC7ab88b098defB751B7401B5f6d8976F`
- `0x742d35Cc6634C0532925a3b8D87fBd83c6C4c4c7`

## Admin Privileges

Admin wallets have access to the following protected endpoints:

### Hub Management
- `POST /api/hub-access/admin/hubs` - Create new hubs
- `GET /api/hub-access/admin/hubs` - Get all hubs (including inactive)
- `PUT /api/hub-access/admin/hubs/:id` - Update hub information
- `DELETE /api/hub-access/admin/hubs/:id` - Delete/deactivate hubs

## Usage in API Requests

When making requests to admin-protected endpoints, include the wallet address in one of these ways:

### Option 1: Request Body
```json
{
  "walletAddress": "0x71C7656EC7ab88b098defB751B7401B5f6d8976F",
  "name": "New Hub",
  "endereco": "123 Main St",
  // ... other fields
}
```

### Option 2: Request Headers
```bash
curl -X POST "http://localhost:3001/api/hub-access/admin/hubs" \
  -H "Content-Type: application/json" \
  -H "wallet-address: 0x71C7656EC7ab88b098defB751B7401B5f6d8976F" \
  -d '{"name": "New Hub", "endereco": "123 Main St", ...}'
```

### Option 3: Query Parameters
```bash
curl -X GET "http://localhost:3001/api/hub-access/admin/hubs?walletAddress=0x71C7656EC7ab88b098defB751B7401B5f6d8976F"
```

## Error Responses

### No Wallet Address
```json
{
  "success": false,
  "message": "Wallet address required for admin access",
  "error": "WALLET_REQUIRED"
}
```

### Insufficient Privileges
```json
{
  "success": false,
  "message": "Admin privileges required",
  "error": "INSUFFICIENT_PRIVILEGES"
}
```

## Runtime Management

### Check if Wallet is Admin
```typescript
import { isAdminWallet } from './utils/adminUtils';

const isAdmin = isAdminWallet('0x71C7656EC7ab88b098defB751B7401B5f6d8976F');
```

### Get All Admin Wallets
```typescript
import { getAdminWallets } from './utils/adminUtils';

const adminWallets = getAdminWallets();
console.log('Admin wallets:', adminWallets);
```

### Add/Remove Admin Wallets (Runtime Only)
```typescript
import { addAdminWallet, removeAdminWallet } from './utils/adminUtils';

// Add admin wallet (doesn't persist to .env)
const added = addAdminWallet('0xNewAdminWallet...');

// Remove admin wallet (doesn't persist to .env)
const removed = removeAdminWallet('0xOldAdminWallet...');
```

## Security Notes

1. **Wallet addresses are case-insensitive** - they're automatically normalized to lowercase
2. **Environment changes require restart** - Changes to `ADMIN_WALLETS` in `.env` require server restart
3. **Runtime changes don't persist** - Use `addAdminWallet`/`removeAdminWallet` for temporary changes only
4. **Keep admin wallets secure** - Only add trusted wallet addresses to the admin list

## Testing Admin Features

For testing purposes, you can temporarily add your test wallet as an admin:

```typescript
// In your test setup
import { addAdminWallet } from '../utils/adminUtils';

beforeEach(() => {
  addAdminWallet('0xYourTestWallet...');
});
``` 