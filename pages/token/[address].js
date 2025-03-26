import React, { useEffect } from 'react';
import { useRouter } from 'next/router';
import TokenDetails from '../../components/TokenDetails';

export default function TokenPage() {
  const router = useRouter();
  const { address, tokenAddress } = router.query;

  useEffect(() => {
    // Debug logging to verify the address is correctly parsed from the URL
    if (address) {
      console.log('Token/Pair Address from URL params:', address);
    }
  }, [address]);

  if (!address) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p>Loading token details...</p>
      </div>
    );
  }

  // Use the tokenAddress from query params if available, otherwise use address
  const effectiveTokenAddress = tokenAddress || address;

  return <TokenDetails 
    pairAddress={address} 
    tokenAddress={effectiveTokenAddress} 
  />;
}