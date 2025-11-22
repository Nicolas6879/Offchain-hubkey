# Marketplace "Loja" Implementation Summary

## Overview
This document describes the complete implementation of the marketplace feature ("Loja") for the Offchain platform. The marketplace allows users to browse and purchase products using platform tokens (hardcoded to `0.0.2203022`).

## Implementation Summary

### ✅ Backend Implementation

#### 1. Database Models

**User Model Updates** (`backend/src/models/User.ts`)
- Added `tokenBalance` field (Number, default: 0, min: 0)
- Tracks user's token balance for marketplace purchases

**Product Model** (`backend/src/models/Product.ts`)
- `name` (String, required) - Product name
- `description` (String, optional) - Product description
- `image` (String, optional) - Product image filename or URL
- `price` (Number, required, min: 0) - Price in platform tokens
- `available` (Number, required, default: 0, min: 0) - Quantity available
- `sold` (Number, default: 0, min: 0) - Quantity sold
- `createdBy` (String, required) - Admin wallet address
- `isActive` (Boolean, default: true) - Active status
- Timestamps: `createdAt`, `updatedAt`

**Purchase Model** (`backend/src/models/Purchase.ts`)
- `productId` (ObjectId, ref: 'Product') - Reference to product
- `userId` (ObjectId, ref: 'User') - Reference to user
- `walletAddress` (String) - Buyer's wallet address
- `quantity` (Number, min: 1) - Quantity purchased
- `pricePerItem` (Number) - Price per item at purchase time
- `totalAmount` (Number) - Total amount paid
- `status` (String: pending|completed|cancelled|refunded)
- `productName` (String) - Product name (historical record)
- `productImage` (String) - Product image (historical record)
- `notes` (String, optional) - Additional notes
- Timestamps: `createdAt`, `updatedAt`

#### 2. API Endpoints

**Product Controller** (`backend/src/controllers/productController.ts`)

**Public Endpoints:**
- `GET /api/products` - Get all active products
- `GET /api/products/:id` - Get product by ID
- `GET /api/balance` - Get user's token balance (requires wallet-address header)
- `GET /api/purchases` - Get user's purchase history (requires wallet-address header)
- `POST /api/products/:id/purchase` - Purchase a product (requires wallet-address header)

**Admin Endpoints:**
- `POST /api/admin/products` - Create new product (requires admin auth)
- `PUT /api/admin/products/:id` - Update product (requires admin auth)
- `DELETE /api/admin/products/:id` - Soft delete product (requires admin auth)
- `GET /api/admin/products/:id/purchases` - Get product purchases (requires admin auth)

#### 3. Routes Configuration
- Routes added in `backend/src/routes/productRoutes.ts`
- Integrated into main router in `backend/src/routes/index.ts`

### ✅ Frontend Implementation

#### 1. Service Layer

**Product Service** (`frontend/src/services/productService.ts`)
- Handles all API calls related to products and purchases
- Interfaces for Product, Purchase, CreateProductData, UpdateProductData
- Functions for all CRUD operations and purchases

#### 2. User Pages

**Loja (Marketplace)** (`frontend/src/pages/Loja/`)
- Public marketplace where users can browse and buy products
- Features:
  - Product grid with images, descriptions, and prices
  - Real-time token balance display
  - Purchase modal with quantity selector
  - Stock availability checking
  - Balance validation before purchase
  - Responsive design
- Route: `/loja`
- Files:
  - `Loja.tsx` - Main component
  - `Loja.css` - Styles
  - `index.ts` - Export

#### 3. Admin Pages

**Manage Products** (`frontend/src/pages/ManageProducts/`)
- Admin interface for product management
- Features:
  - Product table with all product details
  - Create/Edit product modal
  - Image upload with preview
  - Soft delete functionality
  - Real-time stock and sales tracking
  - Responsive design
- Route: `/manage-products` (admin only)
- Files:
  - `ManageProducts.tsx` - Main component
  - `ManageProducts.css` - Styles
  - `index.ts` - Export

#### 4. Router Configuration
- Routes added in `frontend/src/AppRouter.tsx`
- `/loja` - Public marketplace
- `/manage-products` - Admin product management (requires AdminRoute)

## Key Features

### User Features
1. **Browse Products** - View all available products with images and descriptions
2. **Check Balance** - See token balance in real-time
3. **Purchase Products** - Buy products with token balance
4. **Purchase Confirmation** - Modal with quantity selector and balance validation
5. **Purchase History** - Track all purchases (can be added to profile page)

### Admin Features
1. **Create Products** - Add new products with image, name, description, price, and quantity
2. **Edit Products** - Update product information
3. **Delete Products** - Soft delete (set isActive to false)
4. **Track Sales** - View sold quantities
5. **Manage Inventory** - Update available quantities
6. **Upload Images** - Support for product images

## Technical Details

### Authentication
- Admin endpoints require admin authentication (wallet-address header or token)
- User endpoints require wallet-address header for purchases and balance

### Transaction Safety
- Uses MongoDB sessions for atomic transactions
- Prevents overselling by checking availability
- Validates balance before purchase
- Updates balance, inventory, and creates purchase record atomically

### Image Handling
- Supports both file uploads (base64) and URLs
- Images stored in `/backend/generated/` folder
- Served via `/api/images/:filename` endpoint
- Preview functionality in admin interface

### Hardcoded Token
- Token ID: `0.0.2203022`
- Used for all rewards and purchases
- Balance tracked at database level (no web3 for now)

## Future Enhancements (To Plan)

### Post-Purchase Actions
The following features are planned for future implementation:
1. **Physical Fulfillment** - Track shipping/delivery status
2. **Digital Delivery** - Send codes/files after purchase
3. **Purchase Notifications** - Email/push notifications
4. **Admin Order Management** - Mark orders as fulfilled
5. **Refund System** - Handle refunds and update balances
6. **Purchase Details Page** - Detailed view of individual purchases
7. **Web3 Integration** - Actual token transfers on Hedera

### Token Balance Management
1. **Manual Token Addition** - Admin interface to add tokens to users
2. **Token History** - Track all token transactions
3. **Token Transfer** - User-to-user transfers (future)

### Additional Features
1. **Product Categories** - Organize products by category
2. **Search & Filters** - Search products by name, price range
3. **Wishlist** - Save products for later
4. **Reviews & Ratings** - User feedback on products
5. **Discount Codes** - Promotional codes for discounts

## API Routes Summary

### Backend Routes
```
GET    /api/products                      - List all active products
GET    /api/products/:id                  - Get product details
GET    /api/balance                       - Get user token balance
GET    /api/purchases                     - Get user purchases
POST   /api/products/:id/purchase         - Purchase product
POST   /api/admin/products                - Create product (admin)
PUT    /api/admin/products/:id            - Update product (admin)
DELETE /api/admin/products/:id            - Delete product (admin)
GET    /api/admin/products/:id/purchases  - Get product purchases (admin)
```

### Frontend Routes
```
/loja             - Public marketplace (all users)
/manage-products  - Product management (admin only)
```

## Testing Checklist

### Backend Testing
- [ ] Create product (admin)
- [ ] Update product (admin)
- [ ] Delete product (admin)
- [ ] List products (public)
- [ ] Get product details (public)
- [ ] Purchase product (user with balance)
- [ ] Purchase with insufficient balance (should fail)
- [ ] Purchase out of stock product (should fail)
- [ ] Get user balance (user)
- [ ] Get user purchases (user)
- [ ] Get product purchases (admin)

### Frontend Testing
- [ ] Navigate to /loja
- [ ] View products in marketplace
- [ ] Check token balance display
- [ ] Open purchase modal
- [ ] Adjust quantity
- [ ] Complete purchase
- [ ] Verify balance update
- [ ] Navigate to /manage-products (admin)
- [ ] Create new product
- [ ] Upload product image
- [ ] Edit existing product
- [ ] Delete product
- [ ] View sales data

## Notes

1. **Database Migration**: No migration needed as Mongoose will auto-create the new collections and add the `tokenBalance` field with default value 0 to existing users.

2. **Token Rewards**: To connect this with event rewards, update the reward distribution service to credit `user.tokenBalance` instead of/in addition to NFT rewards.

3. **Admin Access**: Ensure admin authentication is properly configured for product management endpoints.

4. **Image Storage**: The `/backend/generated/` folder should have proper write permissions for image uploads.

5. **Error Handling**: All endpoints include comprehensive error handling with appropriate HTTP status codes and error messages.

## Implementation Status

✅ All planned features completed:
- [x] User model updated with tokenBalance
- [x] Product model created
- [x] Purchase model created  
- [x] Product controller implemented
- [x] API routes configured
- [x] Product service (frontend) implemented
- [x] Loja (marketplace) page created
- [x] Manage Products (admin) page created
- [x] Routes integrated into AppRouter

Ready for testing and integration with existing reward system!

