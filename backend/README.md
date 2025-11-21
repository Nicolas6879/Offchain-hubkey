# OffChain HubKey Backend

This is the backend service for the OffChain HubKey system, which provides NFT-based identity management and verification for hub visits.

## Features

- User registration and authentication with JWT
- Create identity NFTs for visitors
- Generate custom images for NFTs with user name and wallet address
- Verify NFT ownership and signatures
- Register hub visits and send notifications
- Hybrid metadata storage for blockchain size limitations

## Tech Stack

- Node.js & Express
- TypeScript
- MongoDB for user data persistence
- Canvas for image generation
- Hedera Hashgraph / Ethereum (for blockchain operations)
- Nodemailer (for email notifications)
- JWT for authentication

## Setup and Installation

1. Clone the repository
2. Install dependencies:

```bash
npm install
```

3. Create a `.env` file in the root directory with the following variables:

```
# Server Configuration
PORT=3333
NODE_ENV=development
FRONTEND_URL=http://localhost:5173

# MongoDB Configuration (Optional)
MONGO_URI=mongodb://localhost:27017/offchain-hubkey

# Email Configuration
EMAIL_HOST=smtp.example.com
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER=your-email@example.com
EMAIL_PASS=your-email-password
EMAIL_FROM=no-reply@example.com
HUB_EMAIL=hub@example.com
ADMIN_EMAIL=admin@example.com

# Blockchain Configuration (Hedera)
BLOCKCHAIN_NETWORK=testnet
HEDERA_ACCOUNT_ID=your-account-id
HEDERA_PRIVATE_KEY=your-private-key
NFT_CONTRACT_ID=your-contract-id
```

4. Build the application:

```bash
npm run build
```

5. Start the server:

```bash
npm start
```

For development:

```bash
npm run dev
```

## Testing

The project includes comprehensive test scripts to verify all functionality:

### Unit Testing

Run individual component tests:

```bash
npm test
```

This will test:
- Image generation with Canvas
- Signature verification with Ethers.js
- Email service functionality
- NFT minting service

### API Testing

Test all API endpoints (requires server to be running):

```bash
npm run test:api
```

This will test:
- Health check endpoint
- NFT minting endpoint
- Signature verification endpoint
- Hub registration endpoint
- Image serving endpoint

### Run All Tests

Run both unit and API tests:

```bash
npm run test:all
```

### Generate Test Image

Create a sample NFT image:

```bash
npm run generate-test-image
```

## API Endpoints

### Health Check
- `GET /api/health` - Check if the service is running

### Authentication
- `POST /api/auth/signup` - Register a new user
- `POST /api/auth/login` - Authenticate an existing user

### NFT Operations
- `POST /api/mint` - Create an identity NFT (Protected)
  - Request body: `{ name, email, metadata }`
  - Returns token ID and path to generated image

- `POST /api/verify` - Verify NFT ownership (Optional auth)
  - Request body: `{ tokenId, signature, message, address }`

- `POST /api/register-hub` - Register a hub visit (Protected)
  - Request body: `{ name, email, tokenId, visitDate, hubId }`

### Generated Images
- `GET /api/images/:filename` - Access the generated NFT images

## Image Generation

The system automatically generates custom NFT images for each user, featuring:

- User's name prominently displayed
- User's wallet address
- HubKey identity badge
- Creation timestamp
- Unique gradient background

To generate a test image:

```bash
npm run generate-test-image
```

## Metadata Handling

Hedera Hashgraph has a strict limitation on NFT metadata size (typically 100 bytes per NFT). To work around this constraint, we use a hybrid approach:

### On-Chain Metadata
We store minimal data on-chain:
- Shortened name (20 chars max)
- Shortened wallet address (16 chars max)
- Reference to the image file
- Timestamp

### Off-Chain Metadata
Complete metadata is stored in local JSON files:
- Full user details
- Full wallet address
- Complete image path
- All additional attributes
- Links to other resources

This approach allows us to comply with blockchain size limitations while still preserving all necessary information.

## User Authentication

The system supports full user authentication with:

### Registration
- `POST /api/auth/signup` - Create a new user account
  - Request body: `{ email, walletAddress, password, name (optional) }`
  - Returns: JWT token and user details

### Login
- `POST /api/auth/login` - Authenticate an existing user
  - Request body: `{ email, password }`
  - Returns: JWT token and user details

### Protected Routes
All NFT operations require authentication:
- `POST /api/mint` - Requires valid JWT token
- `POST /api/register-hub` - Requires valid JWT token
- `POST /api/verify` - Optional authentication

### JWT Token Usage
For authenticated endpoints, include the JWT token in the Authorization header:
```
Authorization: Bearer your-token-here
```

## 📚 API Documentation

This API implements RESTful endpoints for the Offchain Membership platform. Below is a comprehensive list of all available endpoints:

### Authentication

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|--------------|
| `POST` | `/api/auth/signup` | Register a new user with email, wallet address, and password | No |
| `POST` | `/api/auth/login` | Authenticate and receive a JWT token | No |

### Join Requests

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|--------------|
| `POST` | `/api/join-request` | Submit an application to join the membership | No |
| `GET` | `/api/join-request/status/:wallet` | Check status of a join request by wallet address | No |
| `POST` | `/api/join-request/:id/approve` | Approve a pending join request | Yes (Admin) |
| `POST` | `/api/join-request/:id/reject` | Reject a pending join request | Yes (Admin) |

### NFT Management

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|--------------|
| `POST` | `/api/nft/generate-pfp` | Generate a profile picture for NFT | Yes |
| `POST` | `/api/nft/mint` | Mint a new membership NFT | Yes |
| `POST` | `/api/nft/send` | Send an NFT to a wallet address | Yes |
| `POST` | `/api/nft/verify` | Verify ownership of an NFT | Optional |

### Hub Access

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|--------------|
| `POST` | `/api/hub-access/request` | Request access to a partner hub | No |
| `GET` | `/api/hub-access/status/:wallet` | Get hub access status by wallet address | No |
| `POST` | `/api/hub-access/:id/notify` | Send notification to hub about visit | Yes |
| `POST` | `/api/hub-access/:id/log` | Log member's physical access to hub | Yes (Hub Staff) |

### Membership Management

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|--------------|
| `POST` | `/api/membership/revoke` | Revoke a user's membership | Yes (Admin) |

### Utility Endpoints

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|--------------|
| `GET` | `/api/health` | Health check endpoint | No |
| `GET` | `/api/images/:filename` | Serve generated images | No |

## 🔐 Authentication

All endpoints that require authentication expect a valid JWT token to be included in the request header:

```
Authorization: Bearer <token>
```

The token is obtained through the login process and has an expiration time. If a token expires, the client needs to obtain a new one by logging in again.

### User Roles

- **Member**: Regular authenticated users who have been approved for membership
- **Hub Staff**: Users with permissions to validate and log physical access to hubs
- **Admin**: Users with permissions to approve/reject membership applications and revoke memberships

## 💡 Examples

### Example: Submitting a join request

```bash
curl -X POST https://api.offchain-hubkey.com/api/join-request \
  -H "Content-Type: application/json" \
  -d '{
    "fullName": "João Silva",
    "phone": "+55 31 99999-0000",
    "email": "joao@email.com",
    "walletAddress": "0x123456789abcdef"
  }'
```

### Example: Minting an NFT

```bash
curl -X POST https://api.offchain-hubkey.com/api/nft/mint \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <your_jwt_token>" \
  -d '{
    "name": "João Silva",
    "email": "joao@email.com",
    "metadata": {
      "memberSince": "2023-05-01",
      "interests": ["blockchain", "web3", "coworking"]
    }
  }'
```

## License

MIT 