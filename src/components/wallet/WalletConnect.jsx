import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Wallet, CheckCircle, AlertCircle } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';

// Note: Actual Web3 integration requires window.ethereum (MetaMask) or WalletConnect SDK
export default function WalletConnect({ onConnected }) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [connectedWallet, setConnectedWallet] = useState(null);
  const [user, setUser] = useState(null);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const userData = await base44.auth.me();
        setUser(userData);
        
        // Check existing connection
        const wallets = await base44.entities.WalletConnection.filter({ user_id: userData.id });
        if (wallets[0]) {
          setConnectedWallet(wallets[0]);
        }
      } catch (error) {
        console.error('User fetch error');
      }
    };
    fetchUser();
  }, []);

  const connectMetaMask = async () => {
    if (!window.ethereum) {
      toast.error('MetaMask not installed. Please install MetaMask extension.');
      window.open('https://metamask.io/download/', '_blank');
      return;
    }

    setConnecting(true);
    try {
      // Request account access
      const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
      const address = accounts[0];
      
      // Get network
      const chainId = await window.ethereum.request({ method: 'eth_chainId' });
      
      // Save to database
      await base44.entities.WalletConnection.create({
        user_id: user.id,
        wallet_type: 'metamask',
        wallet_address: address,
        blockchain_network: chainId === '0x1' ? 'ethereum' : 'polygon',
        is_verified: true
      });

      setConnectedWallet({ wallet_address: address, wallet_type: 'metamask' });
      toast.success('MetaMask connected!');
      setDialogOpen(false);
      
      if (onConnected) onConnected(address);
    } catch (error) {
      toast.error('Connection failed');
    } finally {
      setConnecting(false);
    }
  };

  const connectTrustWallet = async () => {
    // Trust Wallet uses WalletConnect protocol
    toast.info('Scan QR code with Trust Wallet app');
    
    // In production, use WalletConnect SDK:
    // import WalletConnect from "@walletconnect/client";
    // const connector = new WalletConnect({ bridge: "https://bridge.walletconnect.org" });
    
    setConnecting(true);
    try {
      // Placeholder for WalletConnect integration
      toast.error('WalletConnect SDK integration required for production');
    } finally {
      setConnecting(false);
    }
  };

  if (connectedWallet) {
    return (
      <Button variant="outline" className="border-green-500/30 text-green-400">
        <CheckCircle className="w-4 h-4 mr-2" />
        {connectedWallet.wallet_address.slice(0, 6)}...{connectedWallet.wallet_address.slice(-4)}
      </Button>
    );
  }

  return (
    <>
      <Button onClick={() => setDialogOpen(true)} className="bg-[#f5a623]">
        <Wallet className="w-4 h-4 mr-2" />
        Connect Wallet
      </Button>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="bg-[#1a0a3e] border-white/10">
          <DialogHeader>
            <DialogTitle className="text-white">Connect Your Wallet</DialogTitle>
            <p className="text-white/60 text-sm">Connect to mint NFTs and receive crypto payments</p>
          </DialogHeader>

          <div className="space-y-3">
            <Button
              onClick={connectMetaMask}
              disabled={connecting}
              className="w-full bg-orange-600 hover:bg-orange-700 text-white justify-start"
            >
              <img 
                src="https://upload.wikimedia.org/wikipedia/commons/3/36/MetaMask_Fox.svg" 
                alt="MetaMask" 
                className="w-6 h-6 mr-3"
              />
              MetaMask
              <Badge className="ml-auto bg-white/20">Popular</Badge>
            </Button>

            <Button
              onClick={connectTrustWallet}
              disabled={connecting}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white justify-start"
            >
              <Wallet className="w-6 h-6 mr-3" />
              Trust Wallet
            </Button>

            <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-3 text-sm text-blue-300">
              <AlertCircle className="w-4 h-4 inline mr-2" />
              Your wallet address will be securely stored and used only for NFT minting.
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}