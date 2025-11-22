# 🧠 Offchain Membership API

API to manage group entry and member identification via Web3, NFTs and integration with partner physical hubs.

---

## 🔧 Endpoints

### 1. 🚪 Join request

**POST /join-request**
Sends user data for manual review by the team.

```json
{
  "fullName": "João Silva",
  "phone": "+55 31 99999-0000",
  "email": "joao@email.com",
  "walletAddress": "0.0.123456"
}
```

### 2. ✅ Approve / Reject

**POST /join-request/:id/approve**
**POST /join-request/:id/reject**
Manually approve or reject the request.

---

### 3. 🖼️ Member NFT

**POST /nft/generate-pfp**
Generates a personalized profile picture (PFP).

**POST /nft/mint**
Performs the minting of the member NFT.

**POST /nft/send**
Sends the NFT to the user's wallet.

---

### 4. 🌐 Hub access request

**POST /hub-access/request**
User requests access to a partner hub.

```json
{
  "walletAddress": "0.0.123456",
  "hubId": "orbi-conecta-bh"
}
```

**POST /hub-access/:id/notify**
Sends an email to the hub with visitor data and a verification link.

---

### 5. ✍️ Real-time signature

WebSocket API:

* `@RequestUserSignature`: backend requests a signature
* `@ReturnSignedMessage`: user responds with the signature which is validated and returned to the hub

---

### 6. 📊 Request status

**GET /join-request/status/:wallet**
Check the status of the join request.

**GET /hub-access/status/:wallet**
Check the status of access to partner hubs.

---

### 7. 🗂️ Access history

**POST /hub-access/:id/log**
Records a hub entry with timestamp and signature.

```json
{
  "walletAddress": "0.0.123456",
  "timestamp": "2025-05-13T22:00:00Z",
  "hubId": "orbi-conecta-bh",
  "signature": "0xabc..."
}
```

---

### 8. ❌ Revoke access

**POST /membership/revoke**
Removes member status and/or invalidates the NFT.

```json
{
  "walletAddress": "0.0.123456",
  "reason": "violation of conduct"
}
```

---

## 🔐 Security

* All sensitive actions must be authenticated via wallet signature.
* NFT metadata must never contain sensitive data in plain text.
* Consider storing data on IPFS with access control or encryption.

---

## 📎 Extras

* Possible future support for webhooks for hubs.
* Logs can be exported for usage reports.
* Revoked access can automatically notify the user.
