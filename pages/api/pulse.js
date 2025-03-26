import fetch from 'node-fetch';

/**
 * Deep merge utility function to properly merge nested objects
 * This properly merges nested properties like protocols instead of replacing the entire object
 */
function deepMerge(target, source) {
  const result = { ...target };
  
  for (const key in source) {
    if (source[key] !== null && typeof source[key] === 'object' && !Array.isArray(source[key])) {
      if (key in target && typeof target[key] === 'object') {
        result[key] = deepMerge(target[key], source[key]);
      } else {
        result[key] = { ...source[key] };
      }
    } else {
      result[key] = source[key];
    }
  }
  
  return result;
}

// API handler for Next.js
export default async function handler(req, res) {
  // Set CORS headers to allow requests from your frontend
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  // Only allow POST requests
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  try {
    // Get the request body
    const { table, customFilters = {} } = req.body;

    // We'll need to store and pass cookies between requests
    let cookies = [
      // Initial cookies needed for authentication
      `auth-refresh-token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJyZWZyZXNoVG9rZW5JZCI6IjNjZDhiMWJkLTM3NzUtNGY4Ni05ZDFkLWJjOTI4ZDNlNzNlYSIsImlhdCI6MTczOTkxMjcyNX0.tTlfBfuH8vNQzL88AcOfeuhWVXvoXe21arUY0jcH3nM`,
    ];

    // Refresh token request to get a new access token
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
      throw new Error(`Failed to refresh token: ${refreshResponse.status} ${refreshResponse.statusText}`);
    }

    // Get new cookies from response (including the access token)
    const newCookies = refreshResponse.headers.raw()['set-cookie'];
    if (newCookies) {
      // Replace existing cookies with the same name
      const cookieMap = new Map();
      
      // Add existing cookies to the map
      cookies.forEach(cookie => {
        const cookieName = cookie.split('=')[0];
        cookieMap.set(cookieName, cookie);
      });
      
      // Add or replace with new cookies
      newCookies.forEach(cookie => {
        const cookieName = cookie.split('=')[0];
        cookieMap.set(cookieName, cookie.split(';')[0]);
      });
      
      // Convert back to array
      cookies = Array.from(cookieMap.values());
    } else {
      console.warn("No set-cookie headers returned from refresh token endpoint");
    }

    // Default filters with all required fields based on examples
    const defaultFilters = {
      age: { max: null, min: null },
      txns: { max: null, min: null },
      bundle: { max: null, min: null },
      volume: { max: null, min: null },
      dexPaid: false,
      holders: { max: null, min: null },
      numBuys: { max: null, min: null },
      snipers: { max: null, min: null },
      twitter: { max: null, min: null },
      website: false,
      botUsers: { max: null, min: null },
      insiders: { max: null, min: null },
      numSells: { max: null, min: null },
      telegram: false,
      liquidity: { max: null, min: null },
      marketCap: { max: null, min: null },
      protocols: { pump: true, raydium: false, moonshot: false },
      devHolding: { max: null, min: null },
      bondingCurve: { max: null, min: null },
      top10Holders: { max: null, min: null },
      mustEndInPump: false,
      searchKeywords: [],
      excludeKeywords: []
    };

    // Merge default filters with custom filters using deep merge
    // This ensures nested objects like protocols are merged properly
    const mergedFilters = deepMerge(defaultFilters, customFilters);

    // Prepare the request payload
    const payload = {
      table: table, // 'newPairs', 'finalStretch', or 'migrated'
      filters: mergedFilters,
      usdPerSol: null
    };

    // Log the payload for debugging
    console.log(`Sending pulse request for table: ${table}`);
    console.log(`Payload: ${JSON.stringify(payload, null, 2)}`);
    console.log(`Using cookies: ${cookies.join('; ')}`);

    // Make the pulse request
    const pulseResponse = await fetch('https://api5.axiom.trade/pulse', {
      method: 'POST',
      headers: {
        'accept': 'application/json',
        'content-type': 'application/json',
        'origin': 'https://axiom.trade',
        'referer': 'https://axiom.trade/',
        'cookie': cookies.join('; ')
      },
      body: JSON.stringify(payload)
    });

    if (!pulseResponse.ok) {
      throw new Error(`Failed to fetch pulse data: ${pulseResponse.status} ${pulseResponse.statusText}`);
    }

    // Get the pulse data
    const pulseData = await pulseResponse.json();
    res.status(200).json(pulseData);
  } catch (error) {
    console.error('Error in API route:', error);
    res.status(500).json({ error: error.message });
  }
}