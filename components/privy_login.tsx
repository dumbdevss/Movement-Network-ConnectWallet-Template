"use client";

import { useState } from "react";
import { usePrivy, useLogin } from "@privy-io/react-auth";
import { useCreateWallet } from "@privy-io/react-auth/extended-chains";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { createMovementWallet } from "@/lib/privy-movement";
import Image from "next/image";

interface PrivyLoginProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (data: {
    user: any;
    isNewUser: boolean;
    wasAlreadyAuthenticated: boolean;
    loginMethod: string;
    linkedAccount?: any;
    movementWallet?: any;
  }) => void;
}

export default function PrivyLogin({ isOpen, onClose, onSuccess }: PrivyLoginProps) {
  const [isCreatingWallet, setIsCreatingWallet] = useState(false);
  const { createWallet } = useCreateWallet();

  const { ready, authenticated, user } = usePrivy();

  // Check for Movement wallet
  const movementWallet: any = user?.linkedAccounts?.find(
    (account: any) => account.type === 'wallet' && account.chainType === 'aptos'
  );

  const handleWalletCreation = async (user: any) => {
    try {
      setIsCreatingWallet(true);

      // Create Movement wallet using API
      const movementWallet = await createMovementWallet(user, createWallet);

      return movementWallet;
    } catch (error) {
      console.error('Wallet creation error:', error);
      throw error;
    } finally {
      setIsCreatingWallet(false);
    }
  };

  const { login } = useLogin({
    onComplete: async ({ user, isNewUser, wasAlreadyAuthenticated, loginMethod, loginAccount }) => {

      try {
        setIsCreatingWallet(true);
        // Create wallet after successful login
        const movementWallet = await handleWalletCreation(user);

        // Call success callback
        if (onSuccess) {
          onSuccess({
            user,
            isNewUser,
            wasAlreadyAuthenticated,
            loginMethod: loginMethod || 'unknown',
            linkedAccount: loginAccount,
            movementWallet
          });
        }

        onClose();
        setIsCreatingWallet(false);
      } catch (error) {
        console.error('Error in login completion:', error);
        setIsCreatingWallet(false);
      }
    },
    onError: (error) => {
      console.error('Login failed:', error);
      setIsCreatingWallet(false);
    }
  });

  const handlePrivyLogin = async () => {
    try {
      setIsCreatingWallet(true);

      if (!authenticated) {
        // Login with Privy - wallet creation will happen in onComplete callback
        await login({
          loginMethods: ['email', 'twitter', 'google', 'github', 'discord'],
          prefill: { type: 'email', value: '' },
          disableSignup: false
        });
      } else {
        // User is already authenticated, just create wallet
        const movementWallet = await handleWalletCreation(user);

        if (onSuccess) {
          onSuccess({
            user,
            isNewUser: false,
            wasAlreadyAuthenticated: true,
            loginMethod: 'existing',
            movementWallet
          });
        }

        onClose();
      }
    } catch (error) {
      console.error('Privy login error:', error);
      setIsCreatingWallet(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="text-center mb-4">
            <Image
              src="/Privy_Symbol_White.png"
              alt="Privy"
              width={48}
              height={48}
              className="mx-auto mb-2 invert"
            />
            <DialogTitle className="text-lg font-semibold">Connect with Privy</DialogTitle>
            <DialogDescription className="text-sm text-muted-foreground">
              Secure social login with automatic Movement wallet creation
            </DialogDescription>
          </div>
        </DialogHeader>

        <div className="space-y-4">
          {!authenticated || !movementWallet ? (
            <Button
              variant="default"
              className="w-full justify-center h-14 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-medium"
              onClick={handlePrivyLogin}
              disabled={isCreatingWallet || !ready}
            >
              {isCreatingWallet ? (
                <div className="flex items-center space-x-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  <span>Setting up wallet...</span>
                </div>
              ) : authenticated ? (
                <span>Setup Movement Wallet</span>
              ) : (
                <span>Login & Create Wallet</span>
              )}
            </Button>
          ) : null}

          {authenticated && user && (
            <div className="space-y-2">
              {/* User Authentication Status */}
              <div className="text-sm text-muted-foreground text-center bg-muted/50 p-3 rounded-lg">
                <div className="flex items-center justify-center space-x-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span>Authenticated as: {user.email?.address || user.phone?.number || 'User'}</span>
                </div>
              </div>

              {/* Movement Wallet Status */}
              {movementWallet ? (
                <div className="text-sm text-center bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 p-3 rounded-lg">
                  <div className="flex items-center justify-center space-x-2 mb-1">
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    <span className="font-medium text-blue-700">Movement Wallet Connected</span>
                  </div>
                  <div className="text-xs text-blue-600 font-mono">
                    {movementWallet.address?.slice(0, 6)}...{movementWallet.address?.slice(-4)}
                  </div>
                </div>
              ) : (
                <div className="text-sm text-center bg-orange-50 border border-orange-200 p-3 rounded-lg">
                  <div className="flex items-center justify-center space-x-2">
                    <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                    <span className="text-orange-700">Movement Wallet Not Created</span>
                  </div>
                </div>
              )}
            </div>
          )}

          <div className="text-xs text-muted-foreground text-center">
            By continuing, you agree to Privy's Terms of Service and Privacy Policy.
            Your Movement wallet will be created automatically upon successful login.
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}