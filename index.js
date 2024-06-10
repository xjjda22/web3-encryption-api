const express = require('express');
const sodium = require('libsodium-wrappers');
const { ethers } = require('ethers');
require('dotenv').config();

const app = express();
app.use(express.json());

// const provider = new ethers.providers.StaticJsonRpcProvider(`https://sepolia.infura.io/v3/${process.env.INFURA_PROJECT_ID}`);
// const provider = new ethers.providers.InfuraProvider('sepolia', process.env.INFURA_PROJECT_ID);
// provider.on("block", async (blockNumber) => {
//     console.log('blockNumber',blockNumber);
// });

// Initialize Libsodium
const initializeSodium = async () => {
    await sodium.ready;
};

// Encrypt the message using Libsodium
const encryptMessage = async (message) => {
    const publicKey = sodium.from_hex(process.env.RECIPIENT_PUBLIC_KEY);
    const jsonString = JSON.stringify(message);
    const keyPair = sodium.crypto_box_keypair();
    const nonce = sodium.randombytes_buf(sodium.crypto_box_NONCEBYTES);
    const ciphertext = sodium.crypto_box_easy(jsonString, nonce, publicKey, keyPair.privateKey);

    const encryptedData = {
        ciphertext: sodium.to_hex(ciphertext),
        nonce: sodium.to_hex(nonce),
        publicKey: sodium.to_hex(keyPair.publicKey)
    };

    return JSON.stringify(encryptedData);
};

// Derive wallet address from private key
const getWalletAddressFromPrivateKey = (privateKey) => {
    const wallet = new ethers.Wallet(privateKey);
    return wallet.address;
};

// Send the encrypted message via ethers.js
const sendTransaction = async (encryptedMessage) => {
    const provider = new ethers.providers.StaticJsonRpcProvider(`https://sepolia.infura.io/v3/${process.env.INFURA_PROJECT_ID}`);
    const privateKey = process.env.PRIVATE_KEY;
    const senderWallet = new ethers.Wallet(privateKey, provider);
    const receiverAddress = process.env.RECEIVER_ADDRESS;

    // Check if the RECEIVER_ADDRESS is a valid Ethereum address
    if (!ethers.utils.isAddress(receiverAddress)) {
        throw new Error("Invalid RECEIVER_ADDRESS");
    }

    // Check if the sender's wallet address derived from the private key is valid
    const senderAddress = senderWallet.address;
    if (!ethers.utils.isAddress(senderAddress)) {
        throw new Error("Invalid sender wallet address derived from the private key");
    }

    try {
        const transaction = {
            to: receiverAddress,
            value: ethers.utils.parseEther('0.0'),  // Sending 0 ETH, just the data
            gasLimit: 2000000,  // Gas limit
            data: ethers.utils.hexlify(ethers.utils.toUtf8Bytes(encryptedMessage))  // Memo containing your encrypted message
        };

        const response = await senderWallet.sendTransaction(transaction);
        const receipt = await response.wait();
        return receipt;
    } catch (error) {
        throw new Error("Error sending transaction: " + error.message);
    }
};


// Endpoint to generate encrypted message
app.post('/encrypt-message', async (req, res) => {
    try {
        const message = req.body;
        const encryptedData = await encryptMessage(message);
        res.json({ encryptedMessage: encryptedData });
    } catch (error) {
        res.status(500).send(error.message);
    }
});

// Endpoint to send transaction
app.post('/send-transaction', async (req, res) => {
    try {
        const encryptedMessage = req.body.encryptedMessage;
        const receipt = await sendTransaction(encryptedMessage);
        res.json(receipt);
    } catch (error) {
        res.status(500).send(error.message);
    }
});

// Start the server
const PORT = process.env.PORT || 3000;
initializeSodium().then(() => {
    app.listen(PORT, () => {
        console.log(`Server is running on port ${PORT}`);
    });
});
