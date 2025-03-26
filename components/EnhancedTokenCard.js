import React, { useState } from 'react';

const EnhancedTokenCard = ({ token, onClick }) => { // Add onClick prop
  const [logoLoaded, setLogoLoaded] = useState(true);
  
  // Extract data from token
  const {
    pairAddress,
    tokenAddress,
    tokenName,
    tokenTicker,
    tokenImage,
    protocol,
    website,
    twitter,
    telegram,
    discord,
    top10HoldersPercent,
    devHoldsPercent,
    snipersHoldPercent,
    insidersHoldPercent,
    bundlersHoldPercent,
    volumeSol,
    marketCapSol,
    liquiditySol,
    bondingCurvePercent,
    supply,
    numTxns,
    numBuys,
    numSells,
    numHolders,
    numTradingBotUsers,
    createdAt,
    dexPaid
  } = token;
  
  // Calculate time since creation
  const calculateTimeSince = (dateString) => {
    const created = new Date(dateString);
    const now = new Date();
    const diffMs = now - created;
    const diffMins = Math.floor(diffMs / (1000 * 60));
    
    if (diffMins < 60) return `${diffMins}m`;
    if (diffMins < 24 * 60) return `${Math.floor(diffMins / 60)}h`;
    return `${Math.floor(diffMins / (60 * 24))}d`;
  };
  
  // Format currency values
  const formatSol = (value) => {
    if (!value) return "0";
    return value.toFixed(1);
  };
  
  const formatUSD = (solValue, solPrice = 200) => { // Assuming SOL price of $200 for demo
    if (!solValue) return "$0";
    const usdValue = solValue * solPrice;
    
    if (usdValue >= 1e9) {
      return `$${(usdValue / 1e9).toFixed(1)}B`;
    } else if (usdValue >= 1e6) {
      return `$${(usdValue / 1e6).toFixed(1)}M`;
    } else if (usdValue >= 1e3) {
      return `$${(usdValue / 1e3).toFixed(1)}K`;
    } else {
      return `$${usdValue.toFixed(0)}`;
    }
  };
  
  // Generate a consistent pumpAddress
  const pumpAddress = tokenAddress ? 
    tokenAddress.substring(tokenAddress.length - 10) : 
    'pump';
    
  // Time since creation
  const timeSince = calculateTimeSince(createdAt);
  
  // Calculate buy/sell ratio
  const buySellRatio = numBuys && numSells ? 
    Math.round((numBuys / (numBuys + numSells)) * 100) : 
    0;
    
  // Generate TX count for display
  const txDisplay = numTxns || 0;
  
  // Handle card click - call the onClick prop with the token
  const handleClick = () => {
    if (onClick) {
      onClick({
        ...token,
        routeAddress: token.pairAddress, // Use pairAddress for routing
        tokenAddress: token.tokenAddress // Include tokenAddress for GMGN chart
      });
    }
  };
  
  return (
    <div className="token-card" onClick={handleClick} style={{ cursor: 'pointer' }}>
      <div className="card-header">
        <div className="token-icon">
          {tokenImage && logoLoaded ? (
            <img 
              src={tokenImage} 
              alt={tokenTicker}
              onError={() => setLogoLoaded(false)}
              className="token-image"
            />
          ) : (
            <div className="token-image-fallback">{tokenTicker ? tokenTicker.charAt(0) : 'T'}</div>
          )}
          {protocol && protocol.includes("Pump") && (
            <div className="verified-badge"></div>
          )}
        </div>
        
        <div className="token-info">
          <div className="token-name-row">
            <div className="token-name">{tokenTicker || 'Unknown'} <span className="token-subname">{tokenName}</span></div>
            <div className="market-cap">MC <span className="mc-value">{formatUSD(marketCapSol)}</span></div>
          </div>
          
          <div className="token-meta-row">
            <div className="token-time">{timeSince}</div>
            <div className="social-icons">
              {twitter && (
                <a 
                  href={twitter} 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="social-icon"
                  onClick={(e) => e.stopPropagation()} // Prevent card click when clicking social icon
                >
                  <svg viewBox="0 0 24 24" width="12" height="12" stroke="currentColor" strokeWidth="2" fill="none">
                    <path d="M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2.6 5.6 4.1 9 4-.9-4.2 4-6.6 7-3.8 1.1 0 3-1.2 3-1.2z"></path>
                  </svg>
                </a>
              )}
              {website && (
                <a 
                  href={website} 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="social-icon"
                  onClick={(e) => e.stopPropagation()} // Prevent card click when clicking social icon
                >
                  <svg viewBox="0 0 24 24" width="12" height="12" stroke="currentColor" strokeWidth="2" fill="none">
                    <circle cx="12" cy="12" r="10"></circle>
                    <line x1="2" y1="12" x2="22" y2="12"></line>
                    <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path>
                  </svg>
                </a>
              )}
              {telegram && (
                <a 
                  href={telegram} 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="social-icon"
                  onClick={(e) => e.stopPropagation()} // Prevent card click when clicking social icon
                >
                  <svg viewBox="0 0 24 24" width="12" height="12" stroke="currentColor" strokeWidth="2" fill="none">
                    <path d="M21.198 2.433a2.242 2.242 0 0 0-1.022.215l-16.5 7.5a2.25 2.25 0 0 0 .104 4.114l4.22 1.408 1.408 4.22a2.25 2.25 0 0 0 4.114.104l7.5-16.5a2.25 2.25 0 0 0-1.02-3.06z"></path>
                    <path d="M11 7l5 5-4 4-2-6z"></path>
                  </svg>
                </a>
              )}
            </div>
          </div>
        </div>
      </div>
      
      <div className="token-data-row">
        <div className="token-stats">
          <div className={`stat-item ${devHoldsPercent > 50 ? 'negative' : ''}`}>
            <span className="stat-value">{Math.round(devHoldsPercent || 0)}%</span>
            <span className="stat-icon">👤</span>
          </div>
          
          <div className={`stat-item ${buySellRatio > 60 ? 'positive' : 'negative'}`}>
            <span className="stat-value">{buySellRatio}%</span>
            <span className="stat-icon">🔄</span>
          </div>
          
          <div className={`stat-item ${bondingCurvePercent > 50 ? 'positive' : 'negative'}`}>
            <span className="stat-value">{Math.round(bondingCurvePercent || 0)}%</span>
            <span className="stat-icon">📈</span>
          </div>
          
          <div className={`stat-item ${numHolders > 30 ? 'positive' : ''}`}>
            <span className="stat-value">{numHolders || 0}</span>
            <span className="stat-icon">👥</span>
          </div>
        </div>
        
        <div className="token-price-info">
          <div className="price-down">↓ {formatUSD(liquiditySol/10)}</div>
          <div className="tx-counter">TX {txDisplay}</div>
        </div>
      </div>
      
      <div className="token-footer">
        <div className="token-address">{pumpAddress}</div>
        
        <div 
          className="action-button"
          onClick={(e) => {
            e.stopPropagation(); // Prevent card click when clicking action button
            window.open(`https://solscan.io/token/${tokenAddress || tokenAddress}`, '_blank');
          }}
        >
          <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="#ffffff" strokeWidth="2">
            <path d="M19 12l-7-7v4H6v6h6v4l7-7z" />
          </svg>
        </div>
      </div>
      
      <style jsx>{`
        .token-card {
          background-color: #141414;
          border-radius: 8px;
          margin-bottom: 0.75rem;
          padding: 0.75rem;
          border: 1px solid rgba(80, 80, 80, 0.2);
          display: flex;
          flex-direction: column;
          position: relative;
          overflow: hidden;
          transition: all 0.2s ease;
        }
        
        .token-card:hover {
          transform: translateY(-2px);
          border-color: rgba(111, 66, 193, 0.3);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
        }
        
        .token-card::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 2px;
          background: linear-gradient(90deg, rgba(111, 66, 193, 0), rgba(111, 66, 193, 0.5), rgba(111, 66, 193, 0));
          opacity: 0;
          transition: opacity 0.3s ease;
        }
        
        .token-card:hover::before {
          opacity: 1;
        }
        
        .card-header {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          margin-bottom: 0.5rem;
        }
        
        .token-icon {
          position: relative;
          width: 36px;
          height: 36px;
          border-radius: 50%;
          overflow: hidden;
          flex-shrink: 0;
        }
        
        .token-image {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }
        
        .token-image-fallback {
          width: 100%;
          height: 100%;
          background: linear-gradient(135deg, #2a2a2a, #333333);
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 600;
          color: #ffffff;
          font-size: 1rem;
        }
        
        .verified-badge {
          position: absolute;
          bottom: 0;
          right: 0;
          width: 12px;
          height: 12px;
          border-radius: 50%;
          background-color: #6f42c1;
          border: 2px solid #141414;
        }
        
        .token-info {
          flex-grow: 1;
          min-width: 0;
        }
        
        .token-name-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 0.25rem;
        }
        
        .token-name {
          font-size: 0.95rem;
          font-weight: 600;
          color: #ffffff;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        
        .token-subname {
          font-size: 0.7rem;
          font-weight: normal;
          color: rgba(255, 255, 255, 0.5);
          margin-left: 0.25rem;
        }
        
        .market-cap {
          display: flex;
          align-items: center;
          font-size: 0.7rem;
          color: rgba(255, 255, 255, 0.5);
        }
        
        .mc-value {
          color: #6f42c1;
          font-weight: 600;
          margin-left: 0.25rem;
        }
        
        .token-meta-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        
        .token-time {
          font-size: 0.75rem;
          color: rgba(255, 255, 255, 0.7);
          background-color: rgba(111, 66, 193, 0.1);
          padding: 0.1rem 0.3rem;
          border-radius: 4px;
        }
        
        .social-icons {
          display: flex;
          gap: 0.35rem;
        }
        
        .social-icon {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 20px;
          height: 20px;
          color: rgba(255, 255, 255, 0.5);
          background-color: rgba(80, 80, 80, 0.3);
          border-radius: 50%;
          transition: all 0.2s;
        }
        
        .social-icon:hover {
          background-color: rgba(111, 66, 193, 0.3);
          color: #ffffff;
        }
        
        .token-data-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin: 0.75rem 0;
          padding: 0.5rem 0;
          border-top: 1px solid rgba(80, 80, 80, 0.15);
          border-bottom: 1px solid rgba(80, 80, 80, 0.15);
        }
        
        .token-stats {
          display: flex;
          gap: 0.5rem;
        }
        
        .stat-item {
          display: flex;
          align-items: center;
          gap: 0.25rem;
          font-size: 0.75rem;
          color: rgba(255, 255, 255, 0.7);
        }
        
        .stat-value {
          font-weight: 600;
        }
        
        .positive .stat-value {
          color: #00e676;
        }
        
        .negative .stat-value {
          color: #ff4d4d;
        }
        
        .token-price-info {
          display: flex;
          align-items: center;
          gap: 0.75rem;
        }
        
        .price-down {
          font-size: 0.9rem;
          font-weight: 600;
          color: #ffffff;
        }
        
        .tx-counter {
          font-size: 0.7rem;
          color: rgba(255, 255, 255, 0.5);
          background-color: rgba(80, 80, 80, 0.2);
          padding: 0.1rem 0.3rem;
          border-radius: 4px;
        }
        
        .token-footer {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-top: 0.25rem;
        }
        
        .token-address {
          font-size: 0.7rem;
          color: rgba(255, 255, 255, 0.4);
          font-family: monospace;
        }
        
        .action-button {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 28px;
          height: 28px;
          background: linear-gradient(135deg, #6f42c1, #8c54d0);
          border-radius: 50%;
          cursor: pointer;
          transition: all 0.2s;
        }
        
        .action-button:hover {
          background: linear-gradient(135deg, #5a2d9e, #7a45bc);
          transform: translateY(-1px);
        }
      `}</style>
    </div>
  );
};

export default EnhancedTokenCard;