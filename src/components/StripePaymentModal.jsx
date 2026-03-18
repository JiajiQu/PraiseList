import { useState } from 'react'
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js'
import { loadStripe } from '@stripe/stripe-js'
import './StripePaymentModal.css'

const stripePromise = loadStripe(
  import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || 'pk_test_51TBurl1Y2kZKfDADIlmt7rL3Dszoxd0uPw8WktXsufqyQ82igIRSpAzjxuJVoOm0P7cbMkrHaz75mzT06HhpZsCL002jP2kXMy'
)

const CARD_ELEMENT_OPTIONS = {
  style: {
    base: {
      color: '#f8fafc',
      fontFamily: 'Rajdhani, sans-serif',
      fontSize: '16px',
      fontWeight: '500',
      '::placeholder': { color: '#94a3b8' },
      iconColor: '#38bdf8',
    },
    invalid: {
      color: '#f87171',
      iconColor: '#f87171',
    },
  },
}

function CheckoutForm({ amount, praiseId, onSuccess, onCancel, apiUrl }) {
  const stripe = useStripe()
  const elements = useElements()
  const [processing, setProcessing] = useState(false)
  const [error, setError] = useState(null)

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!stripe || !elements) return

    setProcessing(true)
    setError(null)

    try {
      // 1. Create PaymentIntent on the backend
      const res = await fetch(`${apiUrl}/api/create-payment-intent`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          amount: Math.round(amount * 100), // Convert dollars to cents
          praiseId 
        })
      })
      const { clientSecret, error: serverError } = await res.json()
      
      if (serverError) {
        setError(serverError)
        setProcessing(false)
        return
      }

      // 2. Confirm the payment with Stripe
      const { error: stripeError, paymentIntent } = await stripe.confirmCardPayment(clientSecret, {
        payment_method: {
          card: elements.getElement(CardElement),
        }
      })

      if (stripeError) {
        setError(stripeError.message)
        setProcessing(false)
      } else if (paymentIntent.status === 'succeeded') {
        onSuccess()
      }
    } catch (err) {
      setError('Payment failed. Please try again.')
      setProcessing(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="stripe-form">
      <div className="card-element-wrapper">
        <label>Card Details</label>
        <div className="card-element-container">
          <CardElement options={CARD_ELEMENT_OPTIONS} />
        </div>
      </div>

      {error && <div className="payment-error">{error}</div>}

      <div className="payment-actions">
        <button 
          type="button" 
          className="btn-secondary" 
          onClick={onCancel}
          disabled={processing}
        >
          Cancel
        </button>
        <button 
          type="submit" 
          className="btn-primary" 
          disabled={!stripe || processing}
        >
          {processing ? 'Processing...' : `Pay $${amount.toFixed(2)}`}
        </button>
      </div>

      <p className="stripe-disclaimer">
        🔒 Secured by Stripe. Test mode — use card 4242 4242 4242 4242
      </p>
    </form>
  )
}

export default function StripePaymentModal({ amount, praiseId, onSuccess, onCancel, apiUrl }) {
  return (
    <div className="modal-overlay animate-in">
      <div className="modal-content glass-panel stripe-modal">
        <button className="close-btn" onClick={onCancel}>&times;</button>
        
        <div className="modal-header">
          <h3>💰 Fund Your Bounty</h3>
          <p className="payment-subtitle">
            You're placing a <span className="highlight-amount">${amount.toFixed(2)}</span> bounty
          </p>
        </div>

        <Elements stripe={stripePromise}>
          <CheckoutForm 
            amount={amount} 
            praiseId={praiseId}
            onSuccess={onSuccess} 
            onCancel={onCancel}
            apiUrl={apiUrl}
          />
        </Elements>
      </div>
    </div>
  )
}
