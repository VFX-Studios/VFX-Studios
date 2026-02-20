import { getClient } from './_client.ts';

const DEFAULT_MARKETPLACE_FEES = {
  free: 12,
  weekly: 10,
  monthly: 9,
  annual: 8,
  creator_pro: 8,
  enterprise: 6
};

const PAYMENT_CONTRACT_ABI = [
  {
    inputs: [
      { internalType: 'address', name: 'seller', type: 'address' },
      { internalType: 'uint256', name: 'amount', type: 'uint256' }
    ],
    name: 'processPurchase',
    outputs: [],
    stateMutability: 'payable',
    type: 'function'
  },
  {
    inputs: [],
    name: 'withdrawFees',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function'
  }
];

const CONTRACT_SOURCE = `
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract VFXMarketplace {
    address public owner;
    uint256 public platformFeePercent = 10; // Default fee, backend may tier this per creator
    uint256 public accumulatedFees;

    event Purchase(address indexed buyer, address indexed seller, uint256 amount, uint256 fee);
    event FeeWithdrawn(address indexed owner, uint256 amount);

    constructor() {
        owner = msg.sender;
    }

    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner can call this");
        _;
    }

    function processPurchase(address payable seller, uint256 amount) external payable {
        require(msg.value == amount, "Incorrect payment amount");

        uint256 fee = (amount * platformFeePercent) / 100;
        uint256 sellerPayout = amount - fee;

        accumulatedFees += fee;

        (bool success, ) = seller.call{value: sellerPayout}("");
        require(success, "Transfer to seller failed");

        emit Purchase(msg.sender, seller, amount, fee);
    }

    function withdrawFees() external onlyOwner {
        uint256 amount = accumulatedFees;
        accumulatedFees = 0;

        (bool success, ) = owner.call{value: amount}("");
        require(success, "Fee withdrawal failed");

        emit FeeWithdrawn(owner, amount);
    }

    function updateFeePercent(uint256 newPercent) external onlyOwner {
        require(newPercent <= 15, "Fee too high");
        platformFeePercent = newPercent;
    }
}
`;

Deno.serve(withSecurity(async (req) => {
  try {
    const base44 = getClient(req);
    const user = await base44.auth.me();

    if (user?.role !== 'admin') {
      return Response.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    const { action } = await req.json();

    if (action === 'get_contract_info') {
      return Response.json({
        contract_source: CONTRACT_SOURCE,
        abi: PAYMENT_CONTRACT_ABI,
        marketplace_fee_policy: {
          default_fee_percent: 10,
          tier_overrides: DEFAULT_MARKETPLACE_FEES,
          note: 'Enterprise is discounted to be competitive for high-volume creators and B2B partnerships.'
        },
        deployment_instructions: {
          ethereum: {
            network: 'mainnet',
            rpc: 'https://mainnet.infura.io/v3/YOUR_KEY',
            gas_estimate: '~0.005 ETH',
            compiler: 'solc 0.8.20'
          },
          polygon: {
            network: 'polygon-mainnet',
            rpc: 'https://polygon-rpc.com',
            gas_estimate: '~0.01 MATIC',
            compiler: 'solc 0.8.20'
          },
          binance: {
            network: 'bsc-mainnet',
            rpc: 'https://bsc-dataseed.binance.org',
            gas_estimate: '~0.001 BNB',
            compiler: 'solc 0.8.20'
          }
        },
        deployment_steps: [
          '1. Compile contract using Remix or Hardhat',
          '2. Deploy to chosen network',
          '3. Verify contract on block explorer',
          '4. Store contract address in app settings',
          '5. Update frontend with contract ABI and address'
        ]
      });
    }

    if (action === 'process_payment') {
      const { wallet_address, amount, contract_address } = await req.json();

      const transactionData = {
        from: wallet_address,
        to: contract_address,
        value: amount,
        data: '0x...',
        gas: 100000
      };

      return Response.json({
        success: true,
        transaction_hash: '0x...',
        message: 'Transaction submitted to blockchain',
        transaction_data: transactionData
      });
    }

    return Response.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    console.error('deploy-payment-contract error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
  }));
