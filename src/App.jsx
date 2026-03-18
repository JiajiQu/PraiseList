import { useState, useEffect } from 'react'
import './App.css'
import Header from './components/Header'
import PraiseForm from './components/PraiseForm'
import PraiseFeed from './components/PraiseFeed'
import BountyClaimModal from './components/BountyClaimModal'
import StripePaymentModal from './components/StripePaymentModal'
import AdminDashboard from './components/AdminDashboard'

function App() {
  const [praises, setPraises] = useState([])

  // Simple hash-based routing
  const [page, setPage] = useState(window.location.hash === '#/admin' ? 'admin' : 'main')
  useEffect(() => {
    const onHash = () => setPage(window.location.hash === '#/admin' ? 'admin' : 'main')
    window.addEventListener('hashchange', onHash)
    return () => window.removeEventListener('hashchange', onHash)
  }, [])

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
  
  // State for handling the Stripe payment flow
  const [paymentState, setPaymentState] = useState({ active: false, praise: null })

  const handleAddPraise = (newPraise) => {
    if (newPraise.bountyAmount > 0) {
      // Has a bounty — show Stripe payment modal FIRST
      setPaymentState({ active: true, praise: newPraise })
    } else {
      // No bounty — save immediately
      savePraise(newPraise)
    }
  }

  const savePraise = (praise) => {
    fetch(`${API_URL}/api/praises`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(praise)
    }).catch(err => console.error(err))

    setPraises(current => [praise, ...current])
  }

  const handlePaymentSuccess = () => {
    // Payment succeeded — now save the praise with 'open' bounty status
    if (paymentState.praise) {
      savePraise(paymentState.praise)
    }
    setPaymentState({ active: false, praise: null })
  }

  const handlePaymentCancel = () => {
    setPaymentState({ active: false, praise: null })
  }

  const handleOpenClaimModal = (praise) => {
    setClaimingPraise(praise)
  }

  const handleCloseClaimModal = () => {
    setClaimingPraise(null)
  }

  const handleSubmitClaim = (praiseId, claimDetails) => {
    setClaimingPraise(null)
    
    // Post claim to backend
    fetch(`${API_URL}/api/claims`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ praiseId, claimDetails })
    }).catch(err => console.error(err))

    // Update UI optimistically
    setPraises(currentPraises => 
      currentPraises.map(p => 
        p.id === praiseId 
          ? { ...p, status: 'pending_review', claimDetails }
          : p
      )
    )
  }

  // Track user votes in localStorage
  const [userVotes, setUserVotes] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('praiseVotes') || '{}')
    } catch { return {} }
  })

  const saveVotes = (votes) => {
    setUserVotes(votes)
    localStorage.setItem('praiseVotes', JSON.stringify(votes))
  }

  const handleVote = async (praiseId, direction) => {
    const currentVote = userVotes[praiseId]
    
    // Already voted in this direction — ignore
    if (currentVote === direction) return

    const endpoint = direction === 'up' ? 'upvote' : 'downvote'
    try {
      // If switching direction, undo the previous vote first
      if (currentVote) {
        const undoEndpoint = currentVote === 'up' ? 'downvote' : 'upvote'
        await fetch(`${API_URL}/api/vote/${undoEndpoint}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ praiseId })
        })
      }

      const res = await fetch(`${API_URL}/api/vote/${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ praiseId })
      })
      const data = await res.json()
      if (data.success) {
        setPraises(currentPraises =>
          currentPraises.map(p =>
            p.id === praiseId ? { ...p, upvotes: data.upvotes } : p
          )
        )
        saveVotes({ ...userVotes, [praiseId]: direction })
      }
    } catch (err) {
      console.error('Vote failed:', err)
    }
  }

  // If on admin page, render admin dashboard
  if (page === 'admin') {
    return <AdminDashboard apiUrl={API_URL} />
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
            onVote={handleVote}
            userVotes={userVotes}
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

      {paymentState.active && paymentState.praise && (
        <StripePaymentModal 
          amount={paymentState.praise.bountyAmount}
          praiseId={paymentState.praise.id}
          onSuccess={handlePaymentSuccess}
          onCancel={handlePaymentCancel}
          apiUrl={API_URL}
        />
      )}

      <footer className="admin-footer">
        <a href="#/admin">Admin Dashboard</a>
      </footer>
    </div>
  )
}

export default App
