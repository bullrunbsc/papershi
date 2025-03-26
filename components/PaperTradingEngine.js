import React, { useState, useEffect } from 'react';

const PaperTradingEngine = ({ tokenAddress, tokenSymbol, currentPrice, tokenData }) => {
  // Trading state
  const [balance, setBalance] = useState(parseFloat(localStorage.getItem("paperBalance")) || 100.0);
  const [positions, setPositions] = useState(JSON.parse(localStorage.getItem(`positions_${tokenAddress}`)) || []);
  const [amount, setAmount] = useState('0.0');
  const [activeTab, setActiveTab] = useState('market');
  const [pnl, setPnl] = useState({
    total: 0,
    percentage: 0,
    display: '0.00%'
  });
  
  // Save state to localStorage
  useEffect(() => {
    localStorage.setItem("paperBalance", balance.toString());
    localStorage.setItem(`positions_${tokenAddress}`, JSON.stringify(positions));
    
    // Calculate PNL
    calculatePnl();
  }, [balance, positions, currentPrice, tokenAddress]);
  
  // Calculate profit/loss
  const calculatePnl = () => {
    if (!positions.length || !currentPrice) {
      setPnl({ total: 0, percentage: 0, display: '0.00%' });
      return;
    }
    
    const totalInvested = positions.reduce((sum, pos) => sum + pos.invested, 0);
    const currentValue = positions.reduce((sum, pos) => {
      return sum + (pos.amount * currentPrice);
    }, 0);
    
    const totalPnl = currentValue - totalInvested;
    const pnlPercentage = (totalPnl / totalInvested) * 100;
    
    setPnl({
      total: totalPnl,
      percentage: pnlPercentage,
      display: `${pnlPercentage >= 0 ? '+' : ''}${pnlPercentage.toFixed(2)}%`
    });
  };
  
  // Execute a buy trade
  const executeBuy = (customAmount = null) => {
    const buyAmount = customAmount !== null ? customAmount : parseFloat(amount);
    
    if (isNaN(buyAmount) || buyAmount <= 0) {
      alert("Please enter a valid amount");
      return;
    }
    
    if (buyAmount > balance) {
      alert("Insufficient balance");
      return;
    }
    
    // Calculate token amount based on current price
    const tokenAmount = buyAmount / currentPrice;
    
    // Update state
    setBalance(prev => prev - buyAmount);
    setPositions(prev => [
      ...prev, 
      {
        id: Date.now(),
        amount: tokenAmount,
        entryPrice: currentPrice,
        invested: buyAmount,
        time: new Date().toISOString()
      }
    ]);
    
    // Reset amount input
    setAmount('0.0');
  };
  
  // Execute a sell trade (selling a percentage of holdings)
  const executeSell = (percentage) => {
    if (!positions.length) {
      alert("No positions to sell");
      return;
    }
    
    // Calculate total token amount
    const totalTokens = positions.reduce((sum, pos) => sum + pos.amount, 0);
    const sellAmount = totalTokens * (percentage / 100);
    
    if (sellAmount <= 0) {
      alert("Nothing to sell");
      return;
    }
    
    // Calculate value at current price
    const sellValue = sellAmount * currentPrice;
    
    // Remove tokens from positions (FIFO order)
    let remainingToSell = sellAmount;
    let newPositions = [...positions];
    
    while (remainingToSell > 0 && newPositions.length > 0) {
      const position = newPositions[0];
      
      if (position.amount <= remainingToSell) {
        // Sell entire position
        remainingToSell -= position.amount;
        newPositions.shift();
      } else {
        // Sell part of the position
        position.amount -= remainingToSell;
        position.invested = position.amount * position.entryPrice;
        remainingToSell = 0;
      }
    }
    
    // Update state
    setBalance(prev => prev + sellValue);
    setPositions(newPositions);
  };

  // Format values for display
  const formatValue = (value, prefix = '') => {
    if (value === undefined || value === null) return `${prefix}0`;
    
    if (value >= 1_000_000_000) {
      return `${prefix}${(value / 1_000_000_000).toFixed(2)}B`;
    } else if (value >= 1_000_000) {
      return `${prefix}${(value / 1_000_000).toFixed(2)}M`;
    } else if (value >= 1_000) {
      return `${prefix}${(value / 1_000).toFixed(2)}K`;
    }
    
    return `${prefix}${Number(value).toFixed(2)}`;
  };

  // Calculate trade summary
  const volume = tokenData?.volumeSol || 0;
  const buys = tokenData?.numBuys || 0;
  const buysVolume = tokenData?.volumeSol ? tokenData.volumeSol * 0.5 : 0;
  const sells = tokenData?.numSells || 0;
  const sellsVolume = tokenData?.volumeSol ? tokenData.volumeSol * 0.49 : 0;
  const netVolume = buysVolume - sellsVolume;
  
  return (
    <div className="trading-panel">
      {/* Volume Stats Bar */}
      <div className="volume-stats-bar">
        <div className="volume-stat">
          <div className="stat-label">6h Vol</div>
          <div className="stat-value">{formatValue(volume, '$')}</div>
        </div>
        <div className="volume-stat">
          <div className="stat-label">Buys</div>
          <div className="stat-value buys">{formatValue(buys)} / {formatValue(buysVolume, '$')}</div>
        </div>
        <div className="volume-stat">
          <div className="stat-label">Sells</div>
          <div className="stat-value sells">{formatValue(sells)} / {formatValue(sellsVolume, '$')}</div>
        </div>
        <div className="volume-stat">
          <div className="stat-label">Net Vol.</div>
          <div className={`stat-value ${netVolume >= 0 ? 'positive' : 'negative'}`}>
            {netVolume >= 0 ? '+' : ''}{formatValue(netVolume, '$')}
          </div>
        </div>
      </div>
      
      {/* Trade Type Tabs */}
      <div className="trading-tabs">
        <button 
          className={`tab-button ${activeTab === 'market' ? 'active' : ''}`}
          onClick={() => setActiveTab('market')}
        >
          Market
        </button>
        <button 
          className={`tab-button ${activeTab === 'limit' ? 'active' : ''}`}
          onClick={() => setActiveTab('limit')}
        >
          Limit
        </button>
        <button 
          className={`tab-button ${activeTab === 'adv' ? 'active' : ''}`}
          onClick={() => setActiveTab('adv')}
        >
          Adv.
        </button>
      </div>
      
      {/* Trading Content */}
      <div className="trading-content">
        {/* Amount Input */}
        <div className="amount-section">
          <div className="amount-label">AMOUNT</div>
          <div className="amount-input">
            <input 
              type="text" 
              value={amount} 
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.0"
            />
            <button className="token-selector">≡</button>
          </div>
        </div>
        
        {/* Amount Presets */}
        <div className="amount-presets">
          <button onClick={() => setAmount('.5')}>.5</button>
          <button onClick={() => setAmount('50')}>50</button>
          <button onClick={() => setAmount('100')}>100</button>
          <button onClick={() => setAmount('200')}>200</button>
          <button className="custom-amount">✎</button>
        </div>
        
        {/* Trading Parameters */}
        <div className="trading-parameters">
          <div className="parameter">
            <span className="parameter-icon">🔄</span>
            <span>20%</span>
          </div>
          <div className="parameter">
            <span className="parameter-icon">📈</span>
            <span>0.001</span>
          </div>
          <div className="parameter">
            <span className="parameter-icon">🔍</span>
            <span>0.001</span>
          </div>
          <div className="parameter">
            <span className="parameter-icon">🖥️</span>
            <span>On</span>
          </div>
        </div>
        
        {/* Buy Button */}
        <button className="buy-button" onClick={() => executeBuy()}>
          Buy {tokenSymbol}
        </button>
        
        {/* Portfolio Status */}
        <div className="portfolio-status">
          <div className="status-item">
            <div className="status-label">Bought</div>
            <div className="status-value bought">${positions.reduce((sum, pos) => sum + pos.invested, 0).toFixed(2)}</div>
          </div>
          <div className="status-item">
            <div className="status-label">Sold</div>
            <div className="status-value sold">$0</div>
          </div>
          <div className="status-item">
            <div className="status-label">Holding</div>
            <div className="status-value">
              ${(positions.reduce((sum, pos) => sum + pos.amount, 0) * currentPrice).toFixed(2)}
            </div>
          </div>
          <div className="status-item">
            <div className="status-label">PnL</div>
            <div className={`status-value ${pnl.total >= 0 ? 'positive' : 'negative'}`}>
              {pnl.total >= 0 ? '+' : ''}{formatValue(pnl.total, '$')} ({pnl.display})
            </div>
          </div>
        </div>
        
        {/* Token Info */}
        <div className="token-info-section">
          <div className="token-info-header">
            <span>Token Info</span>
            <span className="toggle-icon">▼</span>
          </div>
          
          <div className="token-info-grid">
            <div className="token-info-row">
              <div className="token-info-item">
                <span className="info-value negative">{tokenData?.top10HoldersPercent || 21.55}%</span>
                <span className="info-label">Top 10 H.</span>
              </div>
              
              <div className="token-info-item">
                <span className="info-value">{tokenData?.devHoldsPercent || 1.2}%</span>
                <span className="info-label">Dev H.</span>
              </div>
            </div>
            
            <div className="token-info-row">
              <div className="token-info-item">
                <span className="info-value positive">{tokenData?.insidersHoldPercent || 18.34}%</span>
                <span className="info-label">Insiders</span>
              </div>
              
              <div className="token-info-item">
                <span className="info-value negative">{tokenData?.bundlersHoldPercent || 5.07}%</span>
                <span className="info-label">Bundlers</span>
              </div>
            </div>
            
            <div className="token-info-row">
              <div className="token-info-item">
                <span className="info-value">{tokenData?.numHolders || 723}</span>
                <span className="info-label">Holders</span>
              </div>
              
              <div className="token-info-item">
                <span className="info-value">{tokenData?.numTradingBotUsers || 402}</span>
                <span className="info-label">Pro Traders</span>
              </div>
            </div>
            
            <div className="token-info-row">
              <div className="token-info-item">
                <span className="info-value positive">{tokenData?.snipersHoldPercent || 1.33}%</span>
                <span className="info-label">Snipers H.</span>
              </div>
              
              <div className="token-info-item">
                <span className="info-value positive">{tokenData?.lpBurned || 99.98}%</span>
                <span className="info-label">LP Burned</span>
              </div>
            </div>
            
            <div className="token-info-row">
              <div className="token-info-item">
                <span className="info-value positive">Paid</span>
                <span className="info-label">Dex Paid</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaperTradingEngine;