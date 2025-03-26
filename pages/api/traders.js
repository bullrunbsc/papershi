// /pages/api/traders.js
import fetch from 'node-fetch';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  // Get the pairAddress (or fall back to tokenAddress if needed)
  const pairAddress = req.query.pairAddress || req.query.pairAddress;
  
  if (!pairAddress) {
    return res.status(400).json({ error: "Address parameter is required" });
  }
  
  console.log(`API request received for pairAddress: ${pairAddress}`);
  
  try {
    // Auth cookies
    const refreshToken = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJyZWZyZXNoVG9rZW5JZCI6IjNjZDhiMWJkLTM3NzUtNGY4Ni05ZDFkLWJjOTI4ZDNlNzNlYSIsImlhdCI6MTczOTkxMjcyNX0.tTlfBfuH8vNQzL88AcOfeuhWVXvoXe21arUY0jcH3nM";
    
    // First get an access token
    const refreshResponse = await fetch('https://api3.axiom.trade/refresh-access-token', {
      method: 'POST',
      headers: {
        'accept': 'application/json, text/plain, */*',
        'origin': 'https://axiom.trade',
        'referer': 'https://axiom.trade/',
        'pragma': 'no-cache',
        'cache-control': 'no-cache',
        'cookie': `auth-refresh-token=${refreshToken}`
      }
    });
    
    if (!refreshResponse.ok) {
      throw new Error(`Token refresh failed: ${refreshResponse.status}`);
    }
    
    // Extract new access token from cookies
    const setCookies = refreshResponse.headers.raw()['set-cookie'];
    let accessToken = '';
    
    if (setCookies) {
      for (const cookie of setCookies) {
        if (cookie.startsWith('auth-access-token=')) {
          accessToken = cookie.split(';')[0].replace('auth-access-token=', '');
          console.log(`Got access token: ${accessToken.substring(0, 20)}...`);
          break;
        }
      }
    }
    
    if (!accessToken) {
      throw new Error('Failed to retrieve access token from cookies');
    }
    
    // Make request to token-info with just the pairAddress
    const url = `https://api3.axiom.trade/token-info?pairAddress=${pairAddress}`;
    console.log(`Making request to: ${url}`);
    
    const directResponse = await fetch(url, {
      method: 'GET',
      headers: {
        'accept': 'application/json, text/plain, */*',
        'origin': 'https://axiom.trade',
        'referer': 'https://axiom.trade/',
        'pragma': 'no-cache',
        'cache-control': 'no-cache',
        'sec-fetch-dest': 'empty',
        'sec-fetch-mode': 'cors',
        'sec-fetch-site': 'same-site',
        'cookie': `auth-refresh-token=${refreshToken}; auth-access-token=${accessToken}`
      }
    });
    
    if (directResponse.ok) {
      const tokenInfo = await directResponse.json();
      console.log('Success! Received token data:', tokenInfo);
      
      return res.status(200).json({
        tokenInfo: tokenInfo,
        traders: []
      });
    } else {
      console.log(`Direct lookup failed: ${directResponse.status}`);
      
      // Try the pulse API as fallback
      try {
        console.log('Trying pulse API...');
        
        const pulseResponse = await fetch('https://api3.axiom.trade/pulse', {
          method: 'POST',
          headers: {
            'accept': 'application/json, text/plain, */*',
            'content-type': 'application/json',
            'origin': 'https://axiom.trade',
            'referer': 'https://axiom.trade/',
            'pragma': 'no-cache',
            'cache-control': 'no-cache',
            'sec-fetch-dest': 'empty',
            'sec-fetch-mode': 'cors',
            'sec-fetch-site': 'same-site',
            'cookie': `auth-refresh-token=${refreshToken}; auth-access-token=${accessToken}`
          },
          body: JSON.stringify({
            table: 'newPairs',
            filters: {
              protocols: { pump: true, raydium: true, meteora: true }
            }
          })
        });
        
        if (pulseResponse.ok) {
          const pulseData = await pulseResponse.json();
          
          if (pulseData && Array.isArray(pulseData)) {
            const matchingToken = pulseData.find(token => 
              token.pairAddress === pairAddress
            );
            
            if (matchingToken) {
              console.log('Found matching token in newPairs');
              return res.status(200).json({
                tokenInfo: matchingToken,
                traders: []
              });
            }
          }
        }
      } catch (pulseErr) {
        console.error('Pulse lookup error:', pulseErr.message);
      }
      
      // Return a placeholder if nothing is found
      return res.status(200).json({
        tokenInfo: {
          tokenAddress: pairAddress,
          pairAddress: pairAddress,
          tokenName: "Unknown Token",
          tokenTicker: "???"
        },
        traders: []
      });
    }
  } catch (error) {
    console.error('API error:', error);
    return res.status(500).json({ 
      error: error.message,
      tokenInfo: null, 
      traders: [] 
    });
  }
}