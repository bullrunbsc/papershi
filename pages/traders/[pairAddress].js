import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';

export default function TradersPage() {
  const router = useRouter();
  const { tokenAddress } = router.query;
  const [tradersData, setTradersData] = useState(null);
  const [tokenInfo, setTokenInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Only fetch when tokenAddress is available (after hydration)
    if (tokenAddress) {
      setLoading(true);
      fetch(`/api/top-traders?tokenAddress=${tokenAddress}`)
        .then(res => {
          if (!res.ok) throw new Error('Failed to fetch data');
          return res.json();
        })
        .then(data => {
          setTradersData(data.traders);
          setTokenInfo(data.tokenInfo);
          setLoading(false);
        })
        .catch(err => {
          console.error('Fetch error:', err);
          setError(err.message);
          setLoading(false);
        });
    }
  }, [tokenAddress]);

  if (!tokenAddress) return <div>Loading...</div>;
  if (loading) return <div>Fetching data...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div>
      <h1>Traders for Pair: {tokenInfo?.name || tokenAddress}</h1>
      
      {tokenInfo && (
        <div>
          <h2>Token Information</h2>
          <p>Symbol: {tokenInfo.symbol}</p>
          <p>Price: ${tokenInfo.price}</p>
          {/* Add more token info as needed */}
        </div>
      )}
      
      {tradersData && (
        <div>
          <h2>Top Traders</h2>
          <ul>
            {tradersData.map((trader, index) => (
              <li key={index}>
                Address: {trader.address}
                {/* Add more trader info as needed */}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
