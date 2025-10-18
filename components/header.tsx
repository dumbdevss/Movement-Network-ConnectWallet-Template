"use client";

import { useState } from "react";
import Link from "next/link";
import { Menu, X, Wallet, ExternalLink, Copy, LogOut, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { usePrivy } from "@privy-io/react-auth";
import { toast } from "sonner";
import Image from "next/image";

export function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { authenticated, user, logout } = usePrivy();

  // Check for Movement wallet
  const movementWallet: any = user?.linkedAccounts?.find(
    (account: any) => account.type === 'wallet' && account.chainType === 'movement'
  );

  const handleCopyAddress = async () => {
    if (movementWallet?.address) {
      await navigator.clipboard.writeText(movementWallet.address);
      toast.success('Wallet address copied to clipboard');
    }
  };

  const handleViewOnExplorer = () => {
    if (movementWallet?.address) {
      window.open(`https://explorer.movementnetwork.xyz/account/${movementWallet.address}`, '_blank');
    }
  };

  const handleDisconnect = async () => {
    try {
      await logout();
      toast.success('Disconnected from Privy');
    } catch (error) {
      console.error('Logout error:', error);
      toast.error('Failed to disconnect');
    }
  };

  const handleFaucet = () => {
    window.open('https://faucet.movementnetwork.xyz', '_blank');
  };

  return (
    <header className="border-b border-border relative">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <Link href="/" className="text-2xl font-bold text-foreground hover:text-primary transition-colors">
          Movement Network
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center space-x-6">
          <Link href="/" className="text-foreground hover:text-primary transition-colors">
            Home
          </Link>
          <a
            href="https://docs.movementnetwork.xyz/devs"
            target="_blank"
            rel="noopener noreferrer"
            className="text-foreground hover:text-primary transition-colors"
          >
            Docs
          </a>

          {/* Privy Wallet Button */}
          {authenticated && user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="flex items-center space-x-2">
                  <Image
                    src="/Privy_Symbol_White.png"
                    alt="Privy"
                    width={16}
                    height={16}
                    className="invert"
                  />
                  <span className="hidden lg:inline">
                    {movementWallet ?
                      `${movementWallet.address?.slice(0, 6)}...${movementWallet.address?.slice(-4)}` :
                      'Privy'
                    }
                  </span>
                  <ChevronDown className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <div className="px-2 py-1.5 text-sm font-medium">
                  {user.email?.address || user.phone?.number || 'User'}
                </div>
                <DropdownMenuSeparator />

                {movementWallet ? (
                  <>
                    <div className="px-2 py-1.5">
                      <div className="text-xs text-muted-foreground mb-1">Movement Wallet</div>
                      <div className="text-sm font-mono bg-muted p-2 rounded text-center">
                        {movementWallet.address?.slice(0, 6)}...{movementWallet.address?.slice(-4)}
                      </div>
                    </div>
                    <DropdownMenuSeparator />

                    <DropdownMenuItem onClick={handleCopyAddress}>
                      <Copy className="mr-2 h-4 w-4" />
                      Copy Address
                    </DropdownMenuItem>

                    <DropdownMenuItem onClick={handleFaucet}>
                      <ExternalLink className="mr-2 h-4 w-4" />
                      Faucet
                    </DropdownMenuItem>

                    <DropdownMenuItem onClick={handleViewOnExplorer}>
                      <ExternalLink className="mr-2 h-4 w-4" />
                      View on Explorer
                    </DropdownMenuItem>

                    <DropdownMenuSeparator />
                  </>
                ) : (
                  <>
                    <div className="px-2 py-1.5 text-sm text-muted-foreground">
                      No Movement wallet connected
                    </div>
                    <DropdownMenuSeparator />
                  </>
                )}

                <DropdownMenuItem onClick={handleDisconnect} className="text-red-600">
                  <LogOut className="mr-2 h-4 w-4" />
                  Disconnect
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            // Implement a connect wallet button here
           <div></div>
          )}

          <ThemeToggle />
        </nav>

        {/* Mobile Navigation Toggle */}
        <div className="md:hidden flex items-center space-x-2">
          {/* Mobile Privy Wallet Button */}
          {authenticated && user && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm">
                  <Image
                    src="/Privy_Symbol_White.png"
                    alt="Privy"
                    width={16}
                    height={16}
                    className="invert"
                  />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <div className="px-2 py-1.5 text-sm font-medium">
                  {user.email?.address || user.phone?.number || 'User'}
                </div>
                <DropdownMenuSeparator />

                {movementWallet ? (
                  <>
                    <div className="px-2 py-1.5">
                      <div className="text-xs text-muted-foreground mb-1">Movement Wallet</div>
                      <div className="text-sm font-mono bg-muted p-2 rounded text-center">
                        {movementWallet.address?.slice(0, 6)}...{movementWallet.address?.slice(-4)}
                      </div>
                    </div>
                    <DropdownMenuSeparator />

                    <DropdownMenuItem onClick={handleCopyAddress}>
                      <Copy className="mr-2 h-4 w-4" />
                      Copy Address
                    </DropdownMenuItem>


                    <DropdownMenuItem onClick={handleFaucet}>
                      <ExternalLink className="mr-2 h-4 w-4" />
                      Faucet
                    </DropdownMenuItem>

                    <DropdownMenuItem onClick={handleViewOnExplorer}>
                      <ExternalLink className="mr-2 h-4 w-4" />
                      View on Explorer
                    </DropdownMenuItem>

                    <DropdownMenuSeparator />
                  </>
                ) : (
                  <>
                    <div className="px-2 py-1.5 text-sm text-muted-foreground">
                      No Movement wallet connected
                    </div>
                    <DropdownMenuSeparator />
                  </>
                )}

                <DropdownMenuItem onClick={handleDisconnect} className="text-red-600">
                  <LogOut className="mr-2 h-4 w-4" />
                  Disconnect
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}

          <ThemeToggle />
          <Button variant="ghost" size="icon" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden absolute top-16 left-0 right-0 bg-background border-b border-border shadow-lg">
          <nav className="container mx-auto px-4 py-4 space-y-3">
            <Link
              href="/"
              className="block text-foreground hover:text-primary transition-colors py-2"
              onClick={() => setMobileMenuOpen(false)}
            >
              Home
            </Link>
            <a
              href="https://docs.movementnetwork.xyz/devs"
              target="_blank"
              rel="noopener noreferrer"
              className="block text-foreground hover:text-primary transition-colors py-2"
              onClick={() => setMobileMenuOpen(false)}
            >
              Docs
            </a>
          </nav>
        </div>
      )}
    </header>
  );
}