#!/bin/bash

# Exit on error
set -e

echo "Setting up Axiom API integration for Next.js..."

# Check if we're in a Next.js project directory
if [ ! -f "package.json" ] || ! grep -q "\"next\":" "package.json"; then
  echo "Error: This doesn't appear to be a Next.js project directory."
  echo "Please run this script from the root of your Next.js project."
  exit 1
fi

# Install required dependencies
echo "Installing dependencies..."
npm install node-fetch

# Create necessary directories
echo "Creating directories..."
mkdir -p utils
mkdir -p pages/api
mkdir -p pages/traders

# Create the API utility file
echo "Creating utils/axiomApi.js..."
cat > utils/axiomApi.js << 'EOF'
import fetch from 'node-fetch';

export async function getTopTraders(pairAddress) {
  // We'll need to store and pass cookies between requests
  let cookies = [
    // Initial cookies needed for authentication
    `auth-refresh-token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJyZWZyZXNoVG9rZW5JZCI6IjNjZDhiMWJkLTM3NzUtNGY4Ni05ZDFkLWJjOTI4ZDNlNzNlYSIsImlhdCI6MTczOTkxMjcyNX0.tTlfBfuH8vNQzL88AcOfeuhWVXvoXe21arUY0jcH3nM`,
  ];

  try {
    // Refresh token request
    const refreshResponse = await fetch('https://api4.axiom.trade/refresh-access-token', {
      method: 'POST',
      headers: {
        'accept': 'application/json',
        'origin': 'https://axiom.trade',
        'referer': 'https://axiom.trade/',
        'cookie': cookies.join('; ')
      }
    });

    if (!refreshResponse.ok) {
      throw new Error('Failed to refresh token');
    }

    // Get new cookies from response
    const newCookies = refreshResponse.headers.raw()['set-cookie'];
    if (newCookies) {
      cookies = newCookies.map(cookie => cookie.split(';')[0]);
    }

    // Now make the resource request with updated cookies
    const tradersResponse = await fetch(`https://api2.axiom.trade/top-traders?pairAddress=${pairAddress}`, {
      method: 'GET',
      headers: {
        'accept': 'application/json',
        'origin': 'https://axiom.trade',
        'referer': 'https://axiom.trade/',
        'cookie': cookies.join('; ')
      }
    });

    if (!tradersResponse.ok) {
      throw new Error('Failed to fetch traders data');
    }
    
    // Also fetch token info with the same cookies
    const tokenInfoResponse = await fetch(`https://api2.axiom.trade/token-info?pairAddress=${pairAddress}`, {
      method: 'GET',
      headers: {
        'accept': 'application/json',
        'origin': 'https://axiom.trade',
        'referer': 'https://axiom.trade/',
        'cookie': cookies.join('; ')
      }
    });

    if (!tokenInfoResponse.ok) {
      throw new Error('Failed to fetch token info');
    }

    // Get both data sets
    const tradersData = await tradersResponse.json();
    const tokenInfo = await tokenInfoResponse.json();

    // Return combined data
    return {
      traders: tradersData,
      tokenInfo: tokenInfo
    };

  } catch (error) {
    console.error('Error:', error);
    throw error;
  }
}
EOF

# Create the API route file
echo "Creating pages/api/top-traders.js..."
cat > pages/api/top-traders.js << 'EOF'
import { getTopTraders } from '../../utils/axiomApi';

export default async function handler(req, res) {
  try {
    const { pairAddress } = req.query;
    
    if (!pairAddress) {
      return res.status(400).json({ error: 'Pair address is required' });
    }
    
    const data = await getTopTraders(pairAddress);
    return res.status(200).json(data);
  } catch (error) {
    console.error('API error:', error);
    return res.status(500).json({ error: 'Failed to fetch data' });
  }
}
EOF

# Create the traders page file
echo "Creating pages/traders/[pairAddress].js..."
cat > pages/traders/\[pairAddress\].js << 'EOF'
import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';

export default function TradersPage() {
  const router = useRouter();
  const { pairAddress } = router.query;
  const [tradersData, setTradersData] = useState(null);
  const [tokenInfo, setTokenInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Only fetch when pairAddress is available (after hydration)
    if (pairAddress) {
      setLoading(true);
      fetch(`/api/top-traders?pairAddress=${pairAddress}`)
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
  }, [pairAddress]);

  if (!pairAddress) return <div>Loading...</div>;
  if (loading) return <div>Fetching data...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div>
      <h1>Traders for Pair: {tokenInfo?.name || pairAddress}</h1>
      
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
EOF

# Create an example component file
echo "Creating pages/example.js..."
cat > pages/example.js << 'EOF'
import { useRouter } from 'next/router';

export default function ExamplePage() {
  const router = useRouter();
  
  const viewTradersForPair = (pairAddress) => {
    router.push(`/traders/${pairAddress}`);
  };
  
  return (
    <div style={{ padding: '20px' }}>
      <h1>Axiom Traders Example</h1>
      <p>Click the button below to view traders for a specific pair:</p>
      <button 
        onClick={() => viewTradersForPair('GMuP9hdawKxTv8oRvmzD72fe9ricJSM91LbJDkYEbPK5')}
        style={{
          padding: '10px 15px',
          backgroundColor: '#4CAF50',
          color: 'white',
          border: 'none',
          borderRadius: '4px',
          cursor: 'pointer'
        }}
      >
        View Traders
      </button>
    </div>
  );
}
EOF

echo "Setup complete! Files created:"
echo "- utils/axiomApi.js"
echo "- pages/api/top-traders.js"
echo "- pages/traders/[pairAddress].js"
echo "- pages/example.js"

echo ""
echo "To test this integration:"
echo "1. Run your Next.js development server: npm run dev"
echo "2. Visit http://localhost:3000/example"
echo "3. Click the 'View Traders' button to see the integration in action"
echo ""
echo "Note: If you're using Next.js with App Router, you'll need to adapt these files"
echo "to the appropriate directory structure."