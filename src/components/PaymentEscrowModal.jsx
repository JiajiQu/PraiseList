import './PaymentEscrowModal.css'

export default function PaymentEscrowModal({ amount, type, onComplete }) {
  // type can be 'deposit' or 'release'
  
  return (
    <div className="modal-overlay animate-in">
      <div className="modal-content glass-panel escrow-modal">
        <div className="escrow-header">
          <div className="spinner"></div>
          <h3>{type === 'deposit' ? 'Depositing to Escrow...' : 'Releasing Escrow Funds...'}</h3>
        </div>
        
        <div className="escrow-body">
          <p className="escrow-amount">${amount}.00</p>
          <div className="progress-bar-container">
             <div className="progress-bar-fill animate-progress"></div>
          </div>
          <p className="escrow-status">
            {type === 'deposit' 
              ? 'Securing bounty funds securely. Please wait...' 
              : 'Transferring bounty to claimer. Please wait...'}
          </p>
        </div>
        
        {/* We auto-complete after animation, but provide a manual button just in case */}
        <button 
          className="btn-primary skip-btn" 
          onClick={onComplete}
        >
          Simulate Complete
        </button>
      </div>
    </div>
  )
}
