import { useState } from 'react';
import { usePrivy } from '@privy-io/react-auth';
import { 
  createMovementWallet, 
  useSignAndSubmitTransaction, 
  getWalletBalance, 
  getAccountInfo 
} from '../lib/privy-movement';

/**
 * Example usage of Privy-Movement integration
 * This file demonstrates how to use the privy-movement functions
 */

export function useMovementWallet() {
  const { user, authenticated } = usePrivy();
  const { signAndSubmitTransaction } = useSignAndSubmitTransaction();


  /**
   * Send APT tokens to another address
   */
  const sendTransaction = async (
    publicKey: string,
    walletAddress: string,
    recipientAddress: string,
    amount: number
  ) => {
    if (!authenticated || !user) {
      throw new Error('User not authenticated');
    }

    try {
      // Use the updated client-side signing function
      const result = await signAndSubmitTransaction(
        publicKey,
        walletAddress,
        recipientAddress,
        amount
      );
      
      return result;
    } catch (error) {
      throw error;
    }
  };

  /**
   * Check wallet balance
   */
  const checkBalance = async (walletAddress: string) => {
    try {
      const balance = await getWalletBalance(walletAddress);
      return balance;
    } catch (error) {
      throw error;
    }
  };

  /**
   * Get account information
   */
  const getAccount = async (walletAddress: string) => {
    try {
      const accountInfo = await getAccountInfo(walletAddress);
      console.log('Account info:', accountInfo);
      return accountInfo;
    } catch (error) {
      console.error('Failed to get account info:', error);
      throw error;
    }
  };

  return {
    sendTransaction,
    checkBalance,
    getAccount,
    user,
    authenticated
  };
}

/**
 * Example React component using the Movement wallet
 */
export function MovementWalletExample() {
  const { 
    sendTransaction, 
    checkBalance,
    getAccount,
    authenticated,
    user
  } = useMovementWallet();

  const [balance, setBalance] = useState<number | null>(null);
  const [accountInfo, setAccountInfo] = useState<any>(null);
  const [loading, setLoading] = useState<{ balance: boolean; account: boolean; transaction: boolean }>({
    balance: false,
    account: false,
    transaction: false
  });
  const [transactionResult, setTransactionResult] = useState<string | null>(null);

  const movementWallet: any = user?.linkedAccounts?.find(
    (account: any) => account.type === 'wallet' && account.chainType === 'aptos'
  );

  const handleSendTransaction = async (publicKey: string, walletAddress: string, recipientAddress: string) => {
    const amount = 1000000; // 0.01 APT in Octas

    setLoading(prev => ({ ...prev, transaction: true }));
    setTransactionResult(null);

    try {
      const result = await sendTransaction(publicKey, walletAddress, recipientAddress, amount);
      setTransactionResult(`Transaction sent successfully! Hash: ${result.hash}`);
    } catch (error) {
      setTransactionResult(`Failed to send transaction: ${error}`);
      console.error(error);
    } finally {
      setLoading(prev => ({ ...prev, transaction: false }));
    }
  };

  const handleCheckBalance = async () => {
    if (!movementWallet?.address) {
      setBalance(null);
      return;
    }

    setLoading(prev => ({ ...prev, balance: true }));

    try {
      const walletBalance = await checkBalance(movementWallet.address);
      setBalance(walletBalance);
    } catch (error) {
      setBalance(null);
      console.error('Failed to check balance:', error);
    } finally {
      setLoading(prev => ({ ...prev, balance: false }));
    }
  };

  const handleGetAccount = async () => {
    if (!movementWallet?.address) {
      setAccountInfo(null);
      return;
    }

    setLoading(prev => ({ ...prev, account: true }));

    try {
      const info = await getAccount(movementWallet.address);
      setAccountInfo(info);
    } catch (error) {
      setAccountInfo(null);
      console.error('Failed to get account info:', error);
    } finally {
      setLoading(prev => ({ ...prev, account: false }));
    }
  };

  return (
    <div className="p-4 space-y-4">
      <h2 className="text-2xl font-bold">Movement Wallet Example</h2>
      
      {!authenticated ? (
        <p>Please authenticate using privy to use wallet functions</p>
      ) : !movementWallet ? (
        <p>Please create a Movement wallet first</p>
      ) : (
        <div className="space-y-2">
          <div className="p-3 bg-gray-100 rounded-lg">
            <p className="text-sm dark:text-black font-medium">Wallet Address:</p>
            <p className="text-xs dark:text-black font-mono break-all">{movementWallet.address}</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
            <button 
              onClick={handleCheckBalance}
              disabled={loading.balance}
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
            >
              {loading.balance ? 'Checking...' : 'Check Balance'}
            </button>
            
            <button 
              onClick={handleGetAccount}
              disabled={loading.account}
              className="px-4 py-2 bg-purple-500 text-white rounded hover:bg-purple-600 disabled:opacity-50"
            >
              {loading.account ? 'Loading...' : 'Get Account Info'}
            </button>
            
            <button 
              onClick={() => handleSendTransaction(movementWallet?.publicKey, movementWallet?.address, '0x1')}
              disabled={loading.transaction}
              className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 disabled:opacity-50"
            >
              {loading.transaction ? 'Sending...' : 'Send Transaction'}
            </button>
          </div>
          
          {/* Display Results */}
          <div className="space-y-3 mt-4">
            {/* Balance Display */}
            {balance !== null && (
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <h3 className="text-sm font-semibold text-blue-800 mb-1">Wallet Balance</h3>
                <p className="text-lg font-mono text-blue-700">
                  {(balance / 100000000).toFixed(8)} MOVE
                </p>
                <p className="text-xs text-blue-600">
                  {balance.toLocaleString()} Octas
                </p>
              </div>
            )}
            
            {/* Account Info Display */}
            {accountInfo && (
              <div className="p-3 bg-purple-50 border border-purple-200 rounded-lg">
                <h3 className="text-sm font-semibold text-purple-800 mb-2">Account Information</h3>
                <div className="space-y-1 text-sm">
                  <div>
                    <span className="font-medium text-purple-700">Sequence Number:</span>
                    <span className="ml-2 font-mono text-purple-600">{accountInfo.sequence_number}</span>
                  </div>
                  <div>
                    <span className="font-medium text-purple-700">Authentication Key:</span>
                    <span className="ml-2 font-mono text-purple-600 break-all">{accountInfo.authentication_key}</span>
                  </div>
                </div>
              </div>
            )}
            
            {/* Transaction Result Display */}
            {transactionResult && (
              <div className={`p-3 rounded-lg border ${
                transactionResult.includes('successfully') 
                  ? 'bg-green-50 border-green-200' 
                  : 'bg-red-50 border-red-200'
              }`}>
                <h3 className={`text-sm font-semibold mb-1 ${
                  transactionResult.includes('successfully') 
                    ? 'text-green-800' 
                    : 'text-red-800'
                }`}>Transaction Result</h3>
                <p className={`text-sm break-all ${
                  transactionResult.includes('successfully') 
                    ? 'text-green-700' 
                    : 'text-red-700'
                }`}>
                  {transactionResult}
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
