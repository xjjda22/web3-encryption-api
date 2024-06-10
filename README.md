# SEPOLIA Wallet Interaction API

This API allows you to encrypt messages and send transactions securely to the SEPOLIA blockchain.

## Installation
```
git clone web3-encryption-api

npm install
cp .env.example .env

npm start
```

# Request: encrypt-message
```
curl -X POST http://localhost:3000/encrypt-message \
-H "Content-Type: application/json" \
-d '{
    "message": "Your message here"
}'
```
Response:
```
{
    "encryptedMessage": "<encrypted-message>"
}
```

# Request:send-transaction
```
curl -X POST http://localhost:3000/send-transaction \
-H "Content-Type: application/json" \
-d '{
    "encryptedMessage": "<encrypted-message>"
}'

```
Response:
```
{
    "hash": "<transaction-hash>",
    "blockNumber": "<block-number>",
    "confirmations": "<number-of-confirmations>"
    // Additional transaction details...
}

```

