import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, Coins, CheckCircle } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';
import WalletConnect from '@/components/wallet/WalletConnect';

export default function NFTMinter({ open, onClose, assetId, assetType }) {
  const [minting, setMinting] = useState(false);
  const [blockchain, setBlockchain] = useState('polygon');
  const [mintPrice, setMintPrice] = useState('0.05');
  const [royalty, setRoyalty] = useState('10');
  const [walletConnected, setWalletConnected] = useState(false);
  const [walletAddress, setWalletAddress] = useState(null);

  useEffect(() => {
    const checkWallet = async () => {
      try {
        const user = await base44.auth.me();
        const wallets = await base44.entities.WalletConnection.filter({ user_id: user.id });
        if (wallets[0]) {
          setWalletConnected(true);
          setWalletAddress(wallets[0].wallet_address);
        }
      } catch (error) {
        console.error('Wallet check failed');
      }
    };
    if (open) checkWallet();
  }, [open]);

  const handleMint = async () => {
    if (!walletConnected) {
      toast.error('Please connect your wallet first');
      return;
    }

    setMinting(true);
    try {
      const user = await base44.auth.me();
      
      // Create NFT mint record
      const nft = await base44.entities.NFTMint.create({
        creator_user_id: user.id,
        asset_type: assetType,
        asset_reference_id: assetId,
        blockchain,
        mint_price: parseFloat(mintPrice),
        royalty_percentage: parseFloat(royalty),
        status: 'minting'
      });

      // In production: Call smart contract to mint
      // const response = await base44.functions.invoke('mint-nft', {
      //   nft_id: nft.id,
      //   wallet_address: walletAddress,
      //   blockchain
      // });

      toast.success('NFT minting initiated! Check your wallet in 2-3 minutes.');
      
      // Update status
      await base44.entities.NFTMint.update(nft.id, {
        status: 'minted',
        contract_address: '0x...' // Placeholder
      });

      onClose();
    } catch (error) {
      toast.error('Minting failed');
    } finally {
      setMinting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="bg-[#1a0a3e] border-white/10 max-w-md">
        <DialogHeader>
          <DialogTitle className="text-white flex items-center gap-2">
            <Coins className="w-5 h-5 text-[#f5a623]" />
            Mint NFT
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Wallet Connection */}
          {!walletConnected ? (
            <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4">
              <p className="text-yellow-300 text-sm mb-3">Connect your wallet to mint NFTs</p>
              <WalletConnect onConnected={(addr) => {
                setWalletConnected(true);
                setWalletAddress(addr);
              }} />
            </div>
          ) : (
            <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-3 flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-green-400" />
              <span className="text-green-300 text-sm">
                Wallet: {walletAddress.slice(0, 6)}...{walletAddress.slice(-4)}
              </span>
            </div>
          )}

          {/* Blockchain Selection */}
          <div>
            <Label className="text-white/70">Blockchain</Label>
            <Select value={blockchain} onValueChange={setBlockchain}>
              <SelectTrigger className="mt-2 bg-white/5 border-white/10 text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-[#1a0a3e] border-white/10">
                <SelectItem value="ethereum">Ethereum (Higher gas fees)</SelectItem>
                <SelectItem value="polygon">Polygon (Low fees, recommended)</SelectItem>
                <SelectItem value="solana">Solana (Fast & cheap)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Mint Price */}
          <div>
            <Label className="text-white/70">Initial Listing Price (ETH/MATIC/SOL)</Label>
            <Input
              type="number"
              step="0.01"
              min="0"
              value={mintPrice}
              onChange={(e) => setMintPrice(e.target.value)}
              className="mt-2 bg-white/5 border-white/10 text-white"
            />
          </div>

          {/* Royalty */}
          <div>
            <Label className="text-white/70">Creator Royalty on Secondary Sales (%)</Label>
            <Input
              type="number"
              min="0"
              max="20"
              value={royalty}
              onChange={(e) => setRoyalty(e.target.value)}
              className="mt-2 bg-white/5 border-white/10 text-white"
            />
          </div>

          {/* Fee Breakdown */}
          <div className="bg-white/5 rounded-lg p-3 text-sm">
            <div className="flex justify-between text-white/60 mb-1">
              <span>Platform fee (secondary sales)</span>
              <span>5%</span>
            </div>
            <div className="flex justify-between text-white/60">
              <span>Your royalty (secondary sales)</span>
              <span>{royalty}%</span>
            </div>
          </div>

          {/* Mint Button */}
          <Button
            onClick={handleMint}
            disabled={minting || !walletConnected}
            className="w-full bg-gradient-to-r from-[#f5a623] to-[#e91e8c]"
          >
            {minting ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Minting...
              </>
            ) : (
              'Mint NFT'
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}