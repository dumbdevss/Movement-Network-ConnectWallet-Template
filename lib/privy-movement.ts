import {
  Aptos,
  AptosConfig,
  Network,
  AccountAddress,
  AccountAuthenticatorEd25519,
  Ed25519PublicKey,
  Ed25519Signature,
  generateSigningMessageForTransaction,
} from "@aptos-labs/ts-sdk";
import { toHex } from "viem";
import {
  useCreateWallet,
  useSignRawHash,
} from "@privy-io/react-auth/extended-chains";

// Environment variables
const MOVEMENT_RPC_URL = process.env.NEXT_PUBLIC_MOVEMENT_RPC_URL || "https://full.mainnet.movementinfra.xyz/v1";

// Initialize Aptos client for Movement Mainnet
const aptos = new Aptos(
  new AptosConfig({
    network: Network.TESTNET,
    fullnode: MOVEMENT_RPC_URL,
  })
);

/**
 * Create a new Movement wallet using Privy API
 * This function should be called after user is authenticated with Privy
 */
export async function createMovementWallet(privyUser: any) {
  try {
    // First check if user already has a Movement wallet
    const existingWallet = privyUser.linkedAccounts?.find(
      (account: any) => account.type === 'wallet' && account.chainType === 'aptos'
    );
    
    if (existingWallet) {
      console.log('User already has a Movement wallet:', existingWallet);
      return {
        id: existingWallet.id,
        address: existingWallet.address,
        public_key: existingWallet.publicKey,
        chain_type: existingWallet.chainType
      };
    }

    // Create new wallet using Privy API with correct structure
    const url = 'https://api.privy.io/v1/wallets';
    const appId = process.env.NEXT_PUBLIC_PRIVY_APP_ID;
    const appSecret = process.env.NEXT_PUBLIC_SECRET;
    
    if (!appId || !appSecret) {
      throw new Error('Privy app credentials not configured. Please set NEXT_PUBLIC_PRIVY_APP_ID and NEXT_PUBLIC_PRIVY_APP_SECRET');
    }

    const encodedCredentials = btoa(`${appId}:${appSecret}`);
    
    const options = {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${encodedCredentials}`,
        'privy-app-id': appId,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        chain_type: 'movement',
        owner: {
          user_id: privyUser.id
        }
      })
    };

    console.log('Creating Movement wallet for user:', privyUser.id);
    const response = await fetch(url, options);
    
    if (!response.ok) {
      const errorText = await response.text();
      let errorData;
      try {
        errorData = JSON.parse(errorText);
      } catch {
        errorData = { message: errorText };
      }
      throw new Error(`Privy API error: ${response.status} ${response.statusText} - ${JSON.stringify(errorData)}`);
    }
    
    const walletData = await response.json();
    console.log('Movement wallet created successfully:', walletData);
    
    return {
      id: walletData.id,
      address: walletData.address,
      public_key: walletData.public_key,
      chain_type: walletData.chain_type
    };
  } catch (error) {
    console.error('Error creating Movement wallet:', error);
    throw error;
  }
}

/**
 * Hook to sign and submit transactions on Movement Network using Privy
 * This hook should be used within a React component
 */
export function useSignAndSubmitTransaction() {
  const { signHash } = useSignWithPrivy();

  const signAndSubmitTransaction = async (
    publicKey: string, // 32-byte ed25519 public key hex
    walletAddress: string,
    recipientAddress: string,
    amount: number // amount in Octas
  ) => {
    try {
      const address = AccountAddress.from(walletAddress);

      // Build the raw transaction
      const rawTxn = await aptos.transaction.build.simple({
        sender: address,
        data: {
          function: "0x1::coin::transfer",
          typeArguments: ["0x1::aptos_coin::AptosCoin"],
          functionArguments: [
            recipientAddress,
            amount,
          ],
        },
      });

      // Generate signing message
      const message = generateSigningMessageForTransaction(rawTxn);
      
      // Sign with Privy using the hook
      const signatureResponse = await signHash(walletAddress, message);
      console.log('Signature response:', signatureResponse);
      
      if (!signatureResponse.data?.signature) {
        throw new Error('Failed to get signature from Privy');
      }

      console.log('Original publicKey:', publicKey)
      
      // Process the public key to ensure it's in the correct format
      let processedPublicKey = publicKey as string;
      
      // Remove 0x prefix if present
      if (processedPublicKey.toLowerCase().startsWith('0x')) {
        processedPublicKey = processedPublicKey.slice(2);
      }
      
      // Remove leading zeros if present (sometimes keys have 00 prefix)
      if (processedPublicKey.length === 66 && processedPublicKey.startsWith('00')) {
        processedPublicKey = processedPublicKey.substring(2);
      }
      
      // Ensure we have exactly 64 characters (32 bytes in hex)
      if (processedPublicKey.length !== 64) {
        throw new Error(`Invalid public key length: expected 64 characters, got ${processedPublicKey.length}. Key: ${processedPublicKey}`);
      }
      
      console.log('Processed publicKey:', processedPublicKey);
      
      // Create authenticator
      const senderAuthenticator = new AccountAuthenticatorEd25519(
        new Ed25519PublicKey(processedPublicKey),
        new Ed25519Signature(signatureResponse.data.signature)
      );

      // Submit transaction
      const pending = await aptos.transaction.submit.simple({
        transaction: rawTxn,
        senderAuthenticator,
      });

      // Wait for transaction confirmation
      const executed = await aptos.waitForTransaction({
        transactionHash: pending.hash,
      });

      console.log("Transaction executed:", executed.hash);
      return executed;
    } catch (error) {
      console.error('Error signing and submitting transaction:', error);
      throw error;
    }
  };

  return { signAndSubmitTransaction };
}

/**
 * Hook to sign transactions using Privy
 * This hook should be used within a React component
 */
export function useSignWithPrivy() {
  const { signRawHash } = useSignRawHash();

  const signHash = async (walletAddress: string, hash: any) => {
    try {
      const { signature: rawSignature } = await signRawHash({
        address: walletAddress,
        chainType: "movement",
        hash: toHex(hash),
      });

      console.log('Signature received:', rawSignature);
      return {
        data: {
          signature: rawSignature
        }
      };
    } catch (error) {
      console.error('Error signing with Privy:', error);
      throw error;
    }
  };

  return { signHash };
}

/**
 * Get wallet balance
 */
export async function getWalletBalance(walletAddress: string) {
  try {
    const address = AccountAddress.from(walletAddress);
    const balance = await aptos.getAccountAPTAmount({
      accountAddress: address
    });
    return balance;
  } catch (error) {
    console.error('Error getting wallet balance:', error);
    throw error;
  }
}

/**
 * Get account info
 */
export async function getAccountInfo(walletAddress: string) {
  try {
    const address = AccountAddress.from(walletAddress);
    const accountInfo = await aptos.getAccountInfo({
      accountAddress: address
    });
    return accountInfo;
  } catch (error) {
    console.error('Error getting account info:', error);
    throw error;
  }
}
