import React, { useState, useEffect } from 'react';
import PaperTradingEngine from './PaperTradingEngine';
import { getPairInfo, getTokenInfo, getTopTraders } from '../utils/axiomApi';
import { getAllTokenData } from '../utils/solscanApi';

const TokenDetail = ({ pairAddress, tokenAddress }) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [tokenInfo, setTokenInfo] = useState(null);
  const [pairInfo, setPairInfo] = useState(null);
  const [topTraders, setTopTraders] = useState([]);
  const [solscanData, setSolscanData] = useState(null);
  const [activeTab, setActiveTab] = useState('market');

  useEffect(() => {
    const fetchData = async () => {
      if (!pairAddress) return;
      
      try {
        setLoading(true);
        
        // First fetch solscan data directly as that has most token info
        try {
          const solscan = await getAllTokenData(tokenAddress || pairAddress);
          setSolscanData(solscan);
          console.log("Solscan data:", solscan);
        } catch (err) {
          console.error('Error fetching Solscan data:', err);
        }
        
        // Then get pair info and other data
        let fetchedPairInfo;
        try {
          fetchedPairInfo = await getPairInfo(pairAddress);
          setPairInfo(fetchedPairInfo);
        } catch (err) {
          console.error('Error fetching pair info:', err);
        }
        
        const actualTokenAddress = fetchedPairInfo?.tokenAddress || tokenAddress;
        
        const [fetchedTokenInfo, fetchedTopTraders] = await Promise.all([
          getTokenInfo(pairAddress).catch(err => {
            console.error('Error fetching token info:', err);
            return null;
          }),
          getTopTraders(pairAddress).catch(err => {
            console.error('Error fetching top traders:', err);
            return [];
          })
        ]);
        
        setTokenInfo(fetchedTokenInfo);
        setTopTraders(Array.isArray(fetchedTopTraders) ? fetchedTopTraders : []);
      } catch (err) {
        console.error('Error in data fetching process:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [pairAddress, tokenAddress]);

  const formatNumber = (num) => {
    if (num === undefined || num === null) return '0';
    
    if (num >= 1000000000) {
      return (num / 1000000000).toFixed(1) + 'B';
    } else if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M';
    } else if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K';
    }
    
    return num.toString();
  };
  
  // Format large token supplies 
  const formatSupply = (supplyStr) => {
    if (!supplyStr) return '0';
    
    const supply = parseFloat(supplyStr);
    if (isNaN(supply)) return supplyStr;
    
    if (supply >= 1000000000000) {
      return (supply / 1000000000000).toFixed(2) + 'T';
    } else if (supply >= 1000000000) {
      return (supply / 1000000000).toFixed(2) + 'B';
    } else if (supply >= 1000000) {
      return (supply / 1000000).toFixed(2) + 'M';
    } else if (supply >= 1000) {
      return (supply / 1000).toFixed(2) + 'K';
    }
    
    return supply.toFixed(2);
  };

  if (loading) {
    return (
      <div className="token-detail-page axiom-style-token-detail">
        <div className="loading-indicator">
          <div className="spinner"></div>
          <p>Loading token details...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="token-detail-page axiom-style-token-detail">
        <div className="error-message">
          Error: {error}
        </div>
      </div>
    );
  }

  const solscanMeta = solscanData?.meta || {};
  const solscanStats = solscanData?.stats || {};
  const solscanMarkets = solscanData?.markets || [];
  
  // Get token data, prioritizing solscan data then falling back to other sources
  const tokenSymbol = solscanMeta.symbol || pairInfo?.tokenTicker || tokenInfo?.tokenTicker || "UNKNOWN";
  const tokenName = solscanMeta.name || pairInfo?.tokenName || tokenInfo?.tokenName || "Unknown Token";
  const actualTokenAddress = pairInfo?.tokenAddress || tokenAddress;
  const tokenIcon = solscanMeta.icon || '';
  
  const price = solscanMeta.price || solscanStats.price || tokenInfo?.price || 0;
  const marketCap = solscanMeta.market_cap || solscanStats.marketCap || tokenInfo?.marketCapSol || pairInfo?.marketCapSol || 0;
  const volume = solscanStats.totalVolume || tokenInfo?.volumeSol || pairInfo?.volumeSol || 0;
  const holderCount = solscanMeta.holder || solscanStats.holders || pairInfo?.numHolders || tokenInfo?.numHolders || 0;
  const totalTrades = solscanStats.totalTrades || 0;
  const supply = solscanMeta.supply || pairInfo?.supply || 0;
  const liquidity = tokenInfo?.liquiditySol || pairInfo?.liquiditySol || 0;

  // Combine data for trading panel
  const combinedTokenData = {
    ...tokenInfo,
    ...pairInfo,
    marketCap,
    volumeSol: volume,
    price,
    numHolders: holderCount
  };

  return (
    <div className="token-detail-page axiom-style-token-detail">
      {/* Token Header - Styled like Axiom */}
      <div className="token-header-bar">
        <div className="token-header-left">
          {tokenIcon && (
            <div className="token-icon">
              <img src={tokenIcon} alt={tokenSymbol} className="token-image" />
            </div>
          )}
          <div className="token-title">
            <h1 className="token-name">
              {tokenSymbol} <span className="token-subname">{tokenName}</span>
            </h1>
            <div className="token-actions">
              <a href="#" className="token-action-link">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10" />
                  <path d="M12 8v8M8 12h8" />
                </svg>
              </a>
              <a href="#" className="token-action-link">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
                  <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
                </svg>
              </a>
              <a href="#" className="token-action-link">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M23 3a11 11 0 0 1-3.2 1.6 4.9 4.9 0 0 0-8.4 4.5A14 14 0 0 1 1 2a5 5 0 0 0 1.5 6.3A5 5 0 0 1 1 7.9v.1a4.9 4.9 0 0 0 4 4.8 5 5 0
0 1-2.2.1 5 5 0 0 0 4.6 3.5A10 10 0 0 1 1 20a14 14 0 0 0 7.6 2" />
                </svg>
              </a>
              <a href="#" className="token-action-link">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.8 19.8 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.8 19.8 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.1 1 .33 1.94.7 2.87a2 2 0 0 1-.45 2.1l-1.27 1.27a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.1-.45c.93.37 1.87.6 2.87.7A2 2 0 0 1 22 16.92z" />
                </svg>
              </a>
              <a href="#" className="token-action-link">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 11.5a8.4 8.4 0 0 1-.5 3M21 12.9a10.5 10.5 0 0 1-.5 2.3M15 4.5a8.4 8.4 0 0 1 3 .5M12.9 3a10.5 10.5 0 0 1 2.3.5" />
                  <path d="M9 6.8a8 8 0 0 1 2-1.5" />
                  <path d="M3.2 15a10.1 10.1 0 0 1 0-6" />
                  <circle cx="12" cy="12" r="1" />
                </svg>
              </a>
            </div>
          </div>
        </div>
        <div className="token-header-right">
          <div className="token-price-section">
            <div className="token-price">${price < 0.01 ? price.toFixed(10) : price.toFixed(4)}</div>
            <div className={`price-change ${(tokenInfo?.priceChange24h || 0) >= 0 ? 'positive' : 'negative'}`}>
              {(tokenInfo?.priceChange24h || 0) >= 0 ? '+' : ''}{tokenInfo?.priceChange24h ? tokenInfo.priceChange24h.toFixed(2) : '0.00'}%
            </div>
          </div>
          <div className="token-metrics-row">
            <div className="metric-item">
              <span className="metric-label">Price</span>
              <span className="metric-value">${price < 0.01 ? price.toFixed(6) : price.toFixed(2)}</span>
            </div>
            <div className="metric-item">
              <span className="metric-label">Liquidity</span>
              <span className="metric-value">${formatNumber(liquidity)}</span>
            </div>
            <div className="metric-item">
              <span className="metric-label">Supply</span>
              <span className="metric-value">{formatSupply(supply)}</span>
            </div>
            <div className="metric-item">
              <span className="metric-label">Holders</span>
              <span className="metric-value">{formatNumber(holderCount)}</span>
            </div>
          </div>
        </div>
      </div>
      
      {/* Main Content */}
      <div className="main-content">
        {/* Chart Container */}
        <div className="chart-container">
          <iframe 
            src={`https://www.gmgn.cc/kline/sol/${actualTokenAddress}`}
            className="token-chart"
            title="Token Chart"
            frameBorder="0"
          />
        </div>
        
        {/* Trading Panel */}
        <div className="trading-container">
          <PaperTradingEngine 
            tokenAddress={actualTokenAddress}
            tokenSymbol={tokenSymbol}
            currentPrice={price}
            tokenData={combinedTokenData}
          />
        </div>
      </div>

      {/* Markets Section */}
      {solscanMarkets && solscanMarkets.length > 0 && (
        <div className="axiom-markets-section">
          <h3 className="section-title">Markets ({totalTrades || 0} trades in 24h)</h3>
          <div className="markets-table-container">
            <table className="markets-table">
              <thead>
                <tr>
                  <th>DEX</th>
                  <th>Pair</th>
                  <th>Trades 24h</th>
                  <th>Volume 24h</th>
                </tr>
              </thead>
              <tbody>
                {solscanMarkets.map((market, index) => {
                  let dexName = "Unknown";
                  if (market.program_id === "675kPX9MHTjS2zt1qfr1NYHuzeLXfQM9H24wFSUt1Mp8") {
                    dexName = "Raydium";
                  } else if (market.program_id === "LBUZKhRxPF3XUpBCjp4YzTKgLccjZhTSDM9YuVaPwxo") {
                    dexName = "Meteora";
                  } else if (market.program_id === "6EF8rrecthR5Dkzon8Nwu78hRvfCKubJ14M5uBEwF6P") {
                    dexName = "Pump";
                  }
                  
                  const baseCurrency = market.token_1 === "So11111111111111111111111111111111111111112" ? "SOL" : "OTHER";
                  const quoteCurrency = market.token_2 === "So11111111111111111111111111111111111111112" ? "SOL" : tokenSymbol;
                  const pair = baseCurrency === "SOL" ? `${quoteCurrency}/SOL` : `SOL/${quoteCurrency}`;
                  
                  return (
                    <tr key={index}>
                      <td>
                        <div className="market-protocol">
                          <div className="protocol-icon"></div>
                          {dexName}
                        </div>
                      </td>
                      <td>{pair}</td>
                      <td>{formatNumber(market.total_trades_24h || 0)}</td>
                      <td>${formatNumber(market.total_volume_24h || 0)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default TokenDetail;