"use client";

import { PrivyProvider } from "@privy-io/react-auth";
import type { PrivyClientConfig } from '@privy-io/react-auth';

interface PrivyClientProviderProps {
    children: React.ReactNode;
}

export function PrivyClientProvider({ children }: PrivyClientProviderProps) {

    const privyConfig: PrivyClientConfig = {
        loginMethods: ['email', 'twitter', 'google', 'github', 'discord'],
        appearance: {
            showWalletLoginFirst: true
        }
    };

    return (
        <PrivyProvider
            appId={process.env.NEXT_PUBLIC_PRIVY_KEY || ""}
            clientId={process.env.NEXT_PUBLIC_PRIVY_CLIENT_ID || ""}
            config={privyConfig}
        >
            {children}
        </PrivyProvider>
    );
}