import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/router';
import EnhancedTokenCard from './EnhancedTokenCard';
import { getNewPairsData, getFinalStretchData, getMigratedData } from '../utils/axiomApi';

// Function to format date consistently between server and client
const formatTime = (date) => {
  if (!date) return '';
  
  // Use explicitly defined format options to ensure consistency
  const hours = date.getHours().toString().padStart(2, '0');
  const minutes = date.getMinutes().toString().padStart(2, '0');
  const seconds = date.getSeconds().toString().padStart(2, '0');
  
  return `${hours}:${minutes}:${seconds}`;
};

const AxiomPulseDashboard = () => {
  const router = useRouter();
  const [newPairs, setNewPairs] = useState([]);
  const [finalStretch, setFinalStretch] = useState([]);
  const [migrated, setMigrated] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [sortOption, setSortOption] = useState('default');
  const [filter, setFilter] = useState('');
  const [lastUpdate, setLastUpdate] = useState('');
  const [isClient, setIsClient] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [refreshInterval, setRefreshInterval] = useState(30); // Default 30 seconds
  const refreshTimerRef = useRef(null);

  // Handle token card click
  const handleTokenClick = (token) => {
    if (token && token.tokenAddress) {
      router.push(`/token/${token.pairAddress}`);
    }
  };

  // Handle client-side only rendering for time
  useEffect(() => {
    setIsClient(true);
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Fetch data from all three endpoints
      const [newPairsData, finalStretchData, migratedData] = await Promise.all([
        getNewPairsData(),
        getFinalStretchData(),
        getMigratedData()
      ]);
      
      setNewPairs(newPairsData || []);
      setFinalStretch(finalStretchData || []);
      setMigrated(migratedData || []);
      setLastUpdate(formatTime(new Date()));
      setError(null);
    } catch (err) {
      console.error('Error fetching data:', err);
      setError('Failed to fetch data. Please try again later.');
    } finally {
      setLoading(false);
    }
  };
  
  // Setup auto-refresh
  useEffect(() => {
    // Initial data fetch
    fetchData();
    
    // Setup auto-refresh timer
    const setupRefreshTimer = () => {
      if (autoRefresh) {
        refreshTimerRef.current = setInterval(() => {
          console.log(`Auto-refreshing data every ${refreshInterval} seconds`);
          fetchData();
        }, refreshInterval * 1000);
      }
    };
    
    setupRefreshTimer();
    
    // Cleanup function
    return () => {
      if (refreshTimerRef.current) {
        clearInterval(refreshTimerRef.current);
      }
    };
  }, [autoRefresh, refreshInterval]);
  
  // Reset timer when interval changes
  useEffect(() => {
    if (refreshTimerRef.current) {
      clearInterval(refreshTimerRef.current);
      if (autoRefresh) {
        refreshTimerRef.current = setInterval(() => {
          console.log(`Auto-refreshing data every ${refreshInterval} seconds`);
          fetchData();
        }, refreshInterval * 1000);
      }
    }
  }, [refreshInterval]);
  
  // Process tokens based on filter and sort options
  const processList = (tokens) => {
    if (!tokens || !Array.isArray(tokens)) return [];
    
    let processed = [...tokens];
    
    // Apply filter
    if (filter) {
      const lowerFilter = filter.toLowerCase();
      processed = processed.filter(token => 
        (token.tokenName && token.tokenName.toLowerCase().includes(lowerFilter)) || 
        (token.tokenTicker && token.tokenTicker.toLowerCase().includes(lowerFilter))
      );
    }
    
    // Apply sorting
    switch (sortOption) {
      case 'marketCap':
        processed.sort((a, b) => (b.marketCapSol || 0) - (a.marketCapSol || 0));
        break;
      case 'volume':
        processed.sort((a, b) => (b.volumeSol || 0) - (a.volumeSol || 0));
        break;
      case 'newest':
        processed.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        break;
      case 'holders':
        processed.sort((a, b) => (b.numHolders || 0) - (a.numHolders || 0));
        break;
      case 'bondingCurve':
        processed.sort((a, b) => (b.bondingCurvePercent || 0) - (a.bondingCurvePercent || 0));
        break;
      default:
        // Use default sorting from API
        break;
    }
    
    return processed;
  };
  
  const processedNewPairs = processList(newPairs);
  const processedFinalStretch = processList(finalStretch);
  const processedMigrated = processList(migrated);
  
  const handleFilterChange = (e) => {
    setFilter(e.target.value);
  };
  
  const handleSortChange = (e) => {
    setSortOption(e.target.value);
  };
  
  // Manual refresh handler
  const handleRefresh = () => {
    fetchData();
  };
  
  // Toggle auto-refresh
  const toggleAutoRefresh = () => {
    setAutoRefresh(!autoRefresh);
  };
  
  // Handle refresh interval change
  const handleIntervalChange = (e) => {
    setRefreshInterval(Number(e.target.value));
  };

  return (
    <div className="dashboard">
      <header className="dashboard-header">
        <div className="logo-area">
          <h1 className="logo">Paper Pulse</h1>
        </div>
        
        <div className="controls">
          <div className="search-box">
            <svg className="search-icon" viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" strokeWidth="2" fill="none">
              <circle cx="11" cy="11" r="8"></circle>
              <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
            </svg>
            <input
              type="text"
              placeholder="Search tokens..."
              value={filter}
              onChange={handleFilterChange}
              className="search-input"
            />
          </div>
          
          <div className="sort-box">
            <select value={sortOption} onChange={handleSortChange} className="sort-select">
              <option value="default">Default Sort</option>
              <option value="marketCap">Market Cap</option>
              <option value="volume">Volume</option>
              <option value="newest">Newest</option>
              <option value="holders">Holders</option>
              <option value="bondingCurve">Bonding Curve</option>
            </select>
          </div>
        
        </div>
      </header>
      
      <main className="dashboard-content">
        {error ? (
          <div className="error-message">
            <svg viewBox="0 0 24 24" width="24" height="24" stroke="currentColor" strokeWidth="2" fill="none">
              <circle cx="12" cy="12" r="10"></circle>
              <line x1="12" y1="8" x2="12" y2="12"></line>
              <line x1="12" y1="16" x2="12.01" y2="16"></line>
            </svg>
            <p>{error}</p>
            <button className="retry-button" onClick={handleRefresh}>Retry</button>
          </div>
        ) : (
          <div className="columns-container">
            <div className="column">
              <div className="column-header">
                <h2 className="column-title">New Pairs</h2>
                <div className="column-count">{processedNewPairs.length}</div>
              </div>
              
              <div className="token-list">
                {loading && processedNewPairs.length === 0 ? (
                  <div className="loading-indicator">
                    <div className="spinner"></div>
                    <p>Loading tokens...</p>
                  </div>
                ) : processedNewPairs.length === 0 ? (
                  <div className="empty-message">No tokens found</div>
                ) : (
                  processedNewPairs.map((token, index) => (
                    <EnhancedTokenCard 
                      key={`new-${token.tokenAddress || index}`} 
                      token={token} 
                      isNew={true}
                      onClick={handleTokenClick}
                    />
                  ))
                )}
              </div>
            </div>
            
            <div className="column">
              <div className="column-header">
                <h2 className="column-title">Final Stretch</h2>
                <div className="column-count">{processedFinalStretch.length}</div>
              </div>
              
              <div className="token-list">
                {loading && processedFinalStretch.length === 0 ? (
                  <div className="loading-indicator">
                    <div className="spinner"></div>
                    <p>Loading tokens...</p>
                  </div>
                ) : processedFinalStretch.length === 0 ? (
                  <div className="empty-message">No tokens found</div>
                ) : (
                  processedFinalStretch.map((token, index) => (
                    <EnhancedTokenCard 
                      key={`final-${token.tokenAddress || index}`} 
                      token={token}
                      onClick={handleTokenClick}
                    />
                  ))
                )}
              </div>
            </div>
            
            <div className="column">
              <div className="column-header">
                <h2 className="column-title">Migrated</h2>
                <div className="column-count">{processedMigrated.length}</div>
              </div>
              
              <div className="token-list">
                {loading && processedMigrated.length === 0 ? (
                  <div className="loading-indicator">
                    <div className="spinner"></div>
                    <p>Loading tokens...</p>
                  </div>
                ) : processedMigrated.length === 0 ? (
                  <div className="empty-message">No tokens found</div>
                ) : (
                  processedMigrated.map((token, index) => (
                    <EnhancedTokenCard 
                      key={`migrated-${token.tokenAddress || index}`} 
                      token={token}
                      isMigrated={true}
                      onClick={handleTokenClick}
                    />
                  ))
                )}
              </div>
            </div>
          </div>
        )}
      </main>
      
      <footer className="dashboard-footer">
        <div className="status-bar">
          <div className="refresh-info">
            {isClient ? (
              <>
                Last updated: {lastUpdate}
                {autoRefresh && <span className="auto-refresh-badge">Auto-refresh: {refreshInterval}s</span>}
              </>
            ) : (
              // Don't render the time on the server
              <>Last updated: --:--:--</>
            )}
          </div>
          <div className={`api-status ${error ? 'error' : 'online'}`}>
            API Status: {error ? 'Error' : 'Online'}
          </div>
        </div>
      </footer>
      
      <style jsx>{`
        /* New styles for auto-refresh controls */
        .refresh-controls {
          display: flex;
          align-items: center;
          gap: 10px;
        }
        
        .auto-refresh-controls {
          display: flex;
          align-items: center;
          gap: 5px;
          border-left: 1px solid rgba(80, 80, 80, 0.3);
          padding-left: 10px;
        }
        
        .auto-refresh-toggle {
          display: flex;
          align-items: center;
          gap: 5px;
          font-size: 0.8rem;
          color: rgba(255, 255, 255, 0.7);
          cursor: pointer;
        }
        
        .interval-select {
          background-color: rgba(80, 80, 80, 0.15);
          border: 1px solid rgba(80, 80, 80, 0.2);
          color: #ffffff;
          padding: 2px 5px;
          border-radius: 4px;
          font-size: 0.8rem;
        }
        
        .interval-select:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
        
        .auto-refresh-badge {
          margin-left: 10px;
          background-color: rgba(111, 66, 193, 0.2);
          color: rgba(111, 66, 193, 0.9);
          font-size: 0.75rem;
          padding: 2px 6px;
          border-radius: 4px;
        }
        
        .refresh-button.loading {
          opacity: 0.7;
          cursor: wait;
        }
        
        /* Spinner animation for loading states */
        .spinner {
          width: 24px;
          height: 24px;
          border: 2px solid rgba(111, 66, 193, 0.2);
          border-top: 2px solid rgba(111, 66, 193, 0.8);
          border-radius: 50%;
          animation: spin 1s linear infinite;
          margin-right: 10px;
        }
        
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default AxiomPulseDashboard;