// /pages/api/pair-info.js
import fetch from 'node-fetch';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  // Get the pairAddress
  const { pairAddress } = req.query;
  
  if (!pairAddress) {
    return res.status(400).json({ error: "Pair address parameter is required" });
  }
  
  console.log(`Pair info API request received for pairAddress: ${pairAddress}`);
  
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
    
    // Make request to pair-info with pairAddress
    const url = `https://api5.axiom.trade/pair-info?pairAddress=${pairAddress}`;
    console.log(`Making request to: ${url}`);
    
    const pairInfoResponse = await fetch(url, {
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
    
    if (pairInfoResponse.ok) {
      const pairInfo = await pairInfoResponse.json();
      console.log('Success! Received pair info data');
      
      return res.status(200).json(pairInfo);
    } else {
      console.log(`Pair info lookup failed: ${pairInfoResponse.status}`);
      return res.status(pairInfoResponse.status).json({ error: "Failed to fetch pair info" });
    }
    
  } catch (error) {
    console.error('API error:', error);
    return res.status(500).json({ 
      error: error.message
    });
  }
}