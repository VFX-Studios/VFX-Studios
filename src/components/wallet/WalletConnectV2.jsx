import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Loader2, Wallet } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';

export default function WalletConnectV2({ open, onClose, onConnected }) {
  const [connecting, setConnecting] = useState(null);
  const [user, setUser] = useState(null);

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {});
  }, []);

  // MetaMask connection
  const connectMetaMask = async () => {
    setConnecting('metamask');
    try {
      if (!window.ethereum) {
        toast.error('MetaMask not installed. Visit metamask.io');
        setConnecting(null);
        return;
      }

      const accounts = await window.ethereum.request({ 
        method: 'eth_requestAccounts' 
      });
      
      const address = accounts[0];
      const chainId = await window.ethereum.request({ method: 'eth_chainId' });

      // Validate address format
      const validation = await base44.functions.invoke('wallet-address-validator', {
        address,
        blockchain_network: chainId === '0x1' ? 'ethereum' : 'polygon'
      });

      if (!validation.data.valid) {
        toast.error('Invalid wallet address');
        setConnecting(null);
        return;
      }

      // Sign message to verify ownership
      const message = `Verify wallet ownership for VFX Studios\nTimestamp: ${Date.now()}`;
      const signature = await window.ethereum.request({
        method: 'personal_sign',
        params: [message, address]
      });

      // Store wallet connection
      await base44.entities.WalletConnection.create({
        user_id: user.id,
        wallet_type: 'metamask',
        wallet_address: address,
        blockchain_network: chainId === '0x1' ? 'ethereum' : 'polygon',
        is_verified: true,
        connected_at: new Date().toISOString()
      });

      toast.success('MetaMask connected!');
      if (onConnected) onConnected(address);
      onClose();
    } catch (error) {
      toast.error('Connection failed');
      console.error(error);
    } finally {
      setConnecting(null);
    }
  };

  // Trust Wallet via WalletConnect
  const connectTrustWallet = async () => {
    setConnecting('trustwallet');
    try {
      // WalletConnect v2 initialization
      const WalletConnectProvider = window.WalletConnectProvider;
      
      if (!WalletConnectProvider) {
        toast.error('WalletConnect SDK not loaded');
        setConnecting(null);
        return;
      }

      const provider = new WalletConnectProvider.default({
        rpc: {
          1: 'https://mainnet.infura.io/v3/YOUR_INFURA_KEY',
          137: 'https://polygon-rpc.com'
        }
      });

      await provider.enable();
      const accounts = provider.accounts;
      const address = accounts[0];

      await base44.entities.WalletConnection.create({
        user_id: user.id,
        wallet_type: 'trust_wallet',
        wallet_address: address,
        blockchain_network: 'ethereum',
        is_verified: true,
        connected_at: new Date().toISOString()
      });

      toast.success('Trust Wallet connected!');
      if (onConnected) onConnected(address);
      onClose();
    } catch (error) {
      toast.error('Connection failed');
      console.error(error);
    } finally {
      setConnecting(null);
    }
  };

  // Coinbase Wallet
  const connectCoinbase = async () => {
    setConnecting('coinbase');
    try {
      if (!window.coinbaseWalletExtension) {
        toast.error('Coinbase Wallet not installed');
        setConnecting(null);
        return;
      }

      const accounts = await window.coinbaseWalletExtension.request({ 
        method: 'eth_requestAccounts' 
      });
      
      const address = accounts[0];

      await base44.entities.WalletConnection.create({
        user_id: user.id,
        wallet_type: 'coinbase_wallet',
        wallet_address: address,
        blockchain_network: 'ethereum',
        is_verified: true,
        connected_at: new Date().toISOString()
      });

      toast.success('Coinbase Wallet connected!');
      if (onConnected) onConnected(address);
      onClose();
    } catch (error) {
      toast.error('Connection failed');
      console.error(error);
    } finally {
      setConnecting(null);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="bg-[#1a0a3e] border-white/10 max-w-md">
        <DialogHeader>
          <DialogTitle className="text-white flex items-center gap-2">
            <Wallet className="w-5 h-5 text-[#f5a623]" />
            Connect Wallet
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-3">
          <Button
            onClick={connectMetaMask}
            disabled={connecting !== null}
            className="w-full bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white"
          >
            {connecting === 'metamask' ? (
              <Loader2 className="w-5 h-5 mr-3 animate-spin" />
            ) : (
              <img 
                src="https://upload.wikimedia.org/wikipedia/commons/3/36/MetaMask_Fox.svg" 
                alt="MetaMask" 
                className="w-5 h-5 mr-3"
              />
            )}
            MetaMask
          </Button>

          <Button
            onClick={connectTrustWallet}
            disabled={connecting !== null}
            className="w-full bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white"
          >
            {connecting === 'trustwallet' ? (
              <Loader2 className="w-5 h-5 mr-3 animate-spin" />
            ) : (
              <img 
                src="https://trustwallet.com/assets/images/trust_platform.svg" 
                alt="Trust Wallet" 
                className="w-5 h-5 mr-3"
              />
            )}
            Trust Wallet
          </Button>

          <Button
            onClick={connectCoinbase}
            disabled={connecting !== null}
            className="w-full bg-gradient-to-r from-blue-700 to-blue-800 hover:from-blue-800 hover:to-blue-900 text-white"
          >
            {connecting === 'coinbase' ? (
              <Loader2 className="w-5 h-5 mr-3 animate-spin" />
            ) : (
              <svg className="w-5 h-5 mr-3" viewBox="0 0 1024 1024" fill="currentColor">
                <circle cx="512" cy="512" r="512" fill="#0052FF"/>
                <path d="M512 764c-140 0-252-112-252-252S372 260 512 260s252 112 252 252-112 252-252 252zm0-448c-108 0-196 88-196 196s88 196 196 196 196-88 196-196-88-196-196-196z" fill="white"/>
              </svg>
            )}
            Coinbase Wallet
          </Button>

          <div className="text-center text-white/60 text-xs mt-4">
            Your wallet will be used for NFT minting and marketplace transactions
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}