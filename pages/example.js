import { useRouter } from 'next/router';

export default function ExamplePage() {
  const router = useRouter();
  
  const viewTradersForPair = (tokenAddress) => {
    router.push(`/traders/${tokenAddress}`);
  };
  
  return (
    <div style={{ padding: '20px' }}>
      <h1>Axiom Traders Example</h1>
      <p>Click the button below to view traders for a specific pair:</p>
      <button 
        onClick={() => viewTradersForPair('GMuP9hdawKxTv8oRvmzD72fe9ricJSM91LbJDkYEbPK5')}
        style={{
          padding: '10px 15px',
          backgroundColor: '#4CAF50',
          color: 'white',
          border: 'none',
          borderRadius: '4px',
          cursor: 'pointer'
        }}
      >
        View Traders
      </button>
    </div>
  );
}
