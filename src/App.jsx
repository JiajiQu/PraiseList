import { useState, useEffect } from 'react'
import './App.css'
import Header from './components/Header'
import PraiseForm from './components/PraiseForm'
import PraiseFeed from './components/PraiseFeed'
import BountyClaimModal from './components/BountyClaimModal'
import PaymentEscrowModal from './components/PaymentEscrowModal'

function App() {
  const [praises, setPraises] = useState([])

  // API Base URL from env or fallback to local
  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001'

  // On mount, fetch praises from Node.js backend
  useEffect(() => {
    fetch(`${API_URL}/api/praises`)
      .then(res => res.json())
      .then(data => setPraises(data))
      .catch(err => console.error("Failed to load praises from backend", err))
  }, [])

  // State for handling the bounty claim modal
  const [claimingPraise, setClaimingPraise] = useState(null)
  
  // State for handling the mock payment flow
  const [escrowState, setEscrowState] = useState({ active: false, type: null, amount: 0, onComplete: null })

  const handleAddPraise = (newPraise) => {
    // 1. Post to Backend
    fetch(`${API_URL}/api/praises`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newPraise)
    }).catch(err => console.error(err))

    // 2. Mock Stripe Payment & Update UI Optimistically
    if (newPraise.bountyAmount > 0) {
      // Simulate escrow deposit
      setEscrowState({
        active: true,
        type: 'deposit',
        amount: newPraise.bountyAmount,
        onComplete: () => {
          setPraises([newPraise, ...praises])
          setEscrowState({ active: false, type: null, amount: 0, onComplete: null })
        }
      })
      
      // Auto complete the simulation after 3 seconds
      setTimeout(() => {
        setEscrowState(current => {
          if (current.active && current.onComplete) {
            current.onComplete()
          }
          return { active: false, type: null, amount: 0, onComplete: null }
        })
      }, 3000)
    } else {
      setPraises([newPraise, ...praises])
    }
  }

  const handleOpenClaimModal = (praise) => {
    setClaimingPraise(praise)
  }

  const handleCloseClaimModal = () => {
    setClaimingPraise(null)
  }

  const handleSubmitClaim = (praiseId, claimDetails) => {
    const praise = praises.find(p => p.id === praiseId)
    setClaimingPraise(null)
    
    // 1. Post claim to backend
    fetch(`${API_URL}/api/claims`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ praiseId, claimDetails })
    }).catch(err => console.error(err))

    // 2. Simulate escrow release & Update UI Optimistically
    setEscrowState({
      active: true,
      type: 'release',
      amount: praise.bountyAmount,
      onComplete: () => {
        setPraises(currentPraises => 
          currentPraises.map(p => 
            p.id === praiseId 
              ? { ...p, status: 'pending_review', claimDetails }
              : p
          )
        )
        setEscrowState({ active: false, type: null, amount: 0, onComplete: null })
      }
    })

    // Auto complete the simulation after 3 seconds
    setTimeout(() => {
      setEscrowState(current => {
        if (current.active && current.onComplete) {
          current.onComplete()
        }
        return { active: false, type: null, amount: 0, onComplete: null }
      })
    }, 3000)
  }

  return (
    <div className="app-container">
      <Header />
      
      <main className="content-grid animate-in">
        <aside>
          <PraiseForm onSubmit={handleAddPraise} />
        </aside>
        
        <section>
          <PraiseFeed 
            praises={praises} 
            onClaimBounty={handleOpenClaimModal}
          />
        </section>
      </main>

      {claimingPraise && (
        <BountyClaimModal 
          praise={claimingPraise} 
          onClose={handleCloseClaimModal}
          onSubmitClaim={handleSubmitClaim}
        />
      )}

      {escrowState.active && (
        <PaymentEscrowModal 
          amount={escrowState.amount}
          type={escrowState.type}
          onComplete={escrowState.onComplete}
        />
      )}
    </div>
  )
}

export default App
