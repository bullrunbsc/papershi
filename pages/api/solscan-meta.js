// pages/api/solscan-meta.js
import fetch from 'node-fetch';

export default async function handler(req, res) {
  const { tokenAddress } = req.query;
  
  // Verify environment variable
  const SOLSCAN_API_TOKEN = process.env.NEXT_PUBLIC_SOLSCAN_API_TOKEN;
  
  if (!SOLSCAN_API_TOKEN) {
    console.error('Solscan API token is not defined');
    return res.status(500).json({ 
      success: false, 
      error: 'Solscan API token is not configured' 
    });
  }

  if (!tokenAddress) {
    return res.status(400).json({ success: false, error: 'Token address is required' });
  }

  try {
    const response = await fetch(
      `https://pro-api.solscan.io/v2.0/token/meta?address=${tokenAddress}`, 
      {
        method: "GET",
        headers: {
          "token": SOLSCAN_API_TOKEN
        }
      }
    );
    
    if (!response.ok) {
      const errorBody = await response.text();
      console.error('Solscan API error response:', {
        status: response.status,
        statusText: response.statusText,
        body: errorBody
      });
      
      throw new Error(`Solscan API returned ${response.status}: ${errorBody}`);
    }
    
    const data = await response.json();
    res.status(200).json(data);
  } catch (error) {
    console.error('Solscan meta API error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to fetch token metadata',
      details: error.message 
    });
  }
}