// utils/solscanApi.js - API client for Solscan via Next.js backend
/**
 * Fetches token markets data from internal API
 * @param {string} tokenAddress - Token address
 * @returns {Promise<Object>} - Markets data
 */
export async function getTokenMarkets(tokenAddress) {
    try {
      const response = await fetch(`/api/solscan-markets?tokenAddress=${tokenAddress}`);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch markets: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error fetching token markets:', error);
      return { success: false, data: [] };
    }
  }
  
  /**
   * Fetches token metadata from internal API
   * @param {string} tokenAddress - Token address
   * @returns {Promise<Object>} - Token metadata
   */
  export async function getTokenMeta(tokenAddress) {
    try {
      const response = await fetch(`/api/solscan-meta?tokenAddress=${tokenAddress}`);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch token meta: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error fetching token meta:', error);
      return { success: false, data: {} };
    }
  }
  
  /**
   * Fetches all token data from internal APIs
   * @param {string} tokenAddress - Token address
   * @returns {Promise<Object>} - Combined token data
   */
  export async function getAllTokenData(tokenAddress) {
    try {
      // Fetch both endpoints in parallel
      const [marketsResponse, metaResponse] = await Promise.all([
        getTokenMarkets(tokenAddress),
        getTokenMeta(tokenAddress)
      ]);
      
      // Calculate total volume from all markets
      const totalVolume = marketsResponse.success && Array.isArray(marketsResponse.data) 
        ? marketsResponse.data.reduce((sum, market) => sum + (market.total_volume_24h || 0), 0)
        : 0;
      
      // Calculate total trades from all markets
      const totalTrades = marketsResponse.success && Array.isArray(marketsResponse.data)
        ? marketsResponse.data.reduce((sum, market) => sum + (market.total_trades_24h || 0), 0)
        : 0;
      
      // Combine the data
      return {
        success: marketsResponse.success || metaResponse.success,
        markets: marketsResponse.data || [],
        meta: metaResponse.data || {},
        stats: {
          totalVolume,
          totalTrades,
          marketCap: metaResponse.data?.market_cap || 0,
          price: metaResponse.data?.price || 0,
          supply: metaResponse.data?.supply || 0,
          holders: metaResponse.data?.holder || 0
        }
      };
    } catch (error) {
      console.error('Error fetching Solscan data:', error);
      return { 
        success: false, 
        markets: [], 
        meta: {},
        stats: {
          totalVolume: 0,
          totalTrades: 0,
          marketCap: 0,
          price: 0,
          supply: 0,
          holders: 0
        }
      };
    }
  }