// utils/axiomApi.js - Enhanced API client for Axiom
export async function getPairInfo(pairAddress) {
  try {
    const response = await fetch(`/api/pair-info?pairAddress=${pairAddress}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch pair info: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error fetching pair info:', error);
    throw error;
  }
}

export async function getTopTraders(pairAddress) {
  try {
    const response = await fetch(`/api/top-traders?pairAddress=${pairAddress}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch top traders: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error fetching top traders:', error);
    throw error;
  }
}

export async function getTokenInfo(pairAddress) {
  try {
    const response = await fetch(`/api/traders?pairAddress=${pairAddress}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch token info: ${response.status}`);
    }

    const data = await response.json();
    return data.tokenInfo;
  } catch (error) {
    console.error('Error fetching token info:', error);
    throw error;
  }
}

export async function getSolscanMarkets(tokenAddress) {
  try {
    const response = await fetch(`/api/solscan-markets?tokenAddress=${tokenAddress}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch Solscan markets: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error fetching Solscan markets:', error);
    throw error;
  }
}

// Fetch all token data at once from multiple endpoints
export async function getFullTokenData(pairAddress) {
  try {
    // First get the pair info to extract token address
    const pairInfoRes = await fetch(`/api/pair-info?pairAddress=${pairAddress}`);
    let pairInfo = null;
    let tokenAddress = null;
    
    if (pairInfoRes.ok) {
      pairInfo = await pairInfoRes.json();
      tokenAddress = pairInfo?.tokenAddress;
    }
    
    // Make the rest of the requests in parallel, including Solscan if we have token address
    const requestPromises = [
      fetch(`/api/traders?pairAddress=${pairAddress}`),
      fetch(`/api/top-traders?pairAddress=${pairAddress}`)
    ];
    
    // Add Solscan API request if we have the token address
    if (tokenAddress) {
      requestPromises.push(fetch(`/api/solscan-markets?tokenAddress=${tokenAddress}`));
    }
    
    const responses = await Promise.all(requestPromises);
    
    // Process responses
    let tokenInfo = null;
    if (responses[0].ok) {
      const data = await responses[0].json();
      tokenInfo = data.tokenInfo;
    }
    
    let topTraders = [];
    if (responses[1].ok) {
      topTraders = await responses[1].json();
    }
    
    let solscanData = null;
    if (tokenAddress && responses[2]?.ok) {
      const solscanResponse = await responses[2].json();
      solscanData = solscanResponse.data;
    }
    
    // Calculate total volume from Solscan data if available
    const calculateTotalVolume = () => {
      if (!solscanData || !Array.isArray(solscanData)) return 0;
      
      return solscanData.reduce((total, market) => {
        if (market && typeof market.total_volume_24h === 'number') {
          return total + market.total_volume_24h;
        }
        return total;
      }, 0);
    };
    
    const totalVolume24h = calculateTotalVolume();
    
    // Merge the data
    return {
      tokenInfo,
      pairInfo,
      topTraders,
      solscanData,
      totalVolume24h,
      // Combined object for convenience
      mergedData: {
        ...tokenInfo,
        pairInfo,
        topTraders,
        solscanData,
        totalVolume24h
      }
    };
  } catch (error) {
    console.error('Error fetching full token data:', error);
    throw error;
  }
}

// Helper functions for specific data
export async function getPulseData(table, customFilters = {}) {
  try {
    const response = await fetch('/api/pulse', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        table,
        customFilters
      }),
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch pulse data: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error fetching pulse data:', error);
    throw error;
  }
}

export async function getNewPairsData() {
  const customFilters = {
    protocols: { pump: true, raydium: true }
  };
  
  return getPulseData('newPairs', customFilters);
}

export async function getFinalStretchData() {
  const customFilters = {
    protocols: { pump: true }
  };
  
  return getPulseData('finalStretch', customFilters);
}

export async function getMigratedData() {
  const customFilters = {
    dexPaid: true
  };
  
  return getPulseData('migrated', customFilters);
}