// For Pages Router (pages/pulse.js)

import { useState } from 'react';

export default function PulsePage() {
  const [table, setTable] = useState('newPairs');
  const [pulseData, setPulseData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchPulseData = async (tableType) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/pulse', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ table: tableType }),
      });

      if (!response.ok) {
        throw new Error('Failed to fetch pulse data');
      }

      const data = await response.json();
      setPulseData(data);
    } catch (err) {
      console.error('Error fetching pulse data:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleTableChange = (e) => {
    const newTable = e.target.value;
    setTable(newTable);
    fetchPulseData(newTable);
  };

  return (
    <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif' }}>
      <h1>Axiom Pulse Data</h1>
      
      <div style={{ marginBottom: '20px' }}>
        <label htmlFor="tableSelect" style={{ marginRight: '10px' }}>Select Table:</label>
        <select 
          id="tableSelect" 
          value={table} 
          onChange={handleTableChange}
          style={{ padding: '8px', borderRadius: '4px' }}
        >
          <option value="newPairs">New Pairs</option>
          <option value="finalStretch">Final Stretch</option>
          <option value="migrated">Migrated</option>
        </select>
        
        <button 
          onClick={() => fetchPulseData(table)}
          style={{
            marginLeft: '10px',
            padding: '8px 16px',
            backgroundColor: '#4CAF50',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          Fetch Data
        </button>
      </div>

      {loading && <div>Loading...</div>}
      {error && <div style={{ color: 'red' }}>Error: {error}</div>}
      
      {pulseData && (
        <div>
          <h2>Results for {table}</h2>
          
          {pulseData.length > 0 ? (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr>
                    {Object.keys(pulseData[0]).map(key => (
                      <th key={key} style={{ border: '1px solid #ddd', padding: '8px', textAlign: 'left' }}>
                        {key}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {pulseData.map((item, index) => (
                    <tr key={index}>
                      {Object.values(item).map((value, i) => (
                        <td key={i} style={{ border: '1px solid #ddd', padding: '8px' }}>
                          {typeof value === 'object' ? JSON.stringify(value) : String(value)}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div>No data available</div>
          )}
        </div>
      )}
    </div>
  );
}

// For App Router (app/pulse/page.js)
/*
'use client';

import { useState } from 'react';

export default function PulsePage() {
  // Same component code as above
}
*/