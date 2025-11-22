# 🧠 Offchain Membership API

API para gerenciar a entrada e identificação de membros via Web3, NFT e integração com hubs físicos parceiros.

---

## 🔧 Endpoints

### 1. 🚪 Solicitação de entrada no grupo

**POST /join-request**
Envia dados do usuário para avaliação manual da equipe.

```json
{
  "fullName": "João Silva",
  "phone": "+55 31 99999-0000",
  "email": "joao@email.com",
  "walletAddress": "0.0.123456"
}
```

### 2. ✅ Aprovação / Rejeição

**POST /join-request/\:id/approve**
**POST /join-request/\:id/reject**
Aprova ou rejeita o pedido manualmente.

---

### 3. 🖼️ NFT de Membro

**POST /nft/generate-pfp**
Gera imagem personalizada (PFP).

**POST /nft/mint**
Realiza o mint da NFT com dados do membro.

**POST /nft/send**
Envia a NFT para a carteira do usuário.

---

### 4. 🌐 Solicitação de acesso a Hub

**POST /hub-access/request**
Usuário solicita acesso a um hub parceiro.

```json
{
  "walletAddress": "0.0.123456",
  "hubId": "orbi-conecta-bh"
}
```

**POST /hub-access/\:id/notify**
Envia e-mail ao hub com dados do visitante e link para verificação.

---

### 5. ✍️ Assinatura em tempo real

WebSocket API:

* `@RequestUserSignature`: backend solicita assinatura
* `@ReturnSignedMessage`: usuário responde com a assinatura que é validada e devolvida ao hub

---

### 6. 📊 Status dos pedidos

**GET /join-request/status/\:wallet**
Consulta o status do pedido de entrada.

**GET /hub-access/status/\:wallet**
Consulta status de acesso aos hubs parceiros.

---

### 7. 🗂️ Histórico de acessos

**POST /hub-access/\:id/log**
Registra uma entrada no hub com timestamp e assinatura.

```json
{
  "walletAddress": "0.0.123456",
  "timestamp": "2025-05-13T22:00:00Z",
  "hubId": "orbi-conecta-bh",
  "signature": "0xabc..."
}
```

---

### 8. ❌ Revogação de acesso

**POST /membership/revoke**
Remove status de membro e/ou invalida NFT.

```json
{
  "walletAddress": "0.0.123456",
  "reason": "violação de conduta"
}
```

---

## 🔐 Segurança

* Todas as ações sensíveis devem ser autenticadas via assinatura da carteira.
* A metadata da NFT nunca deve conter dados sensíveis em claro.
* Considerar armazenar dados no IPFS com controle de acesso ou criptografia.

---

## 📎 Extras

* Possível suporte futuro a Webhooks para hubs.
* Logs podem ser exportados para relatórios de uso.
* Acesso revogado pode notificar o usuário automaticamente.
