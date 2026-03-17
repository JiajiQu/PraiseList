require('dotenv').config()
const express = require('express')
const cors = require('cors')
const db = require('./database')
const Stripe = require('stripe')

const app = express()
app.use(cors())

// For Mock Stripe config
const stripe = Stripe(process.env.STRIPE_SECRET_KEY || 'sk_test_mock')
const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET || '';

// Webhook must be parsed as raw body
app.post('/api/webhook', express.raw({type: 'application/json'}), async (request, response) => {
  const sig = request.headers['stripe-signature'];
  let event;

  try {
    event = stripe.webhooks.constructEvent(request.body, sig, endpointSecret);
  } catch (err) {
    console.error(`Webhook Error: ${err.message}`);
    return response.status(400).send(`Webhook Error: ${err.message}`);
  }

  // Handle the event
  switch (event.type) {
    case 'payment_intent.succeeded':
      const paymentIntentSucceeded = event.data.object;
      const praiseId = paymentIntentSucceeded.metadata.praiseId;
      
      console.log(`PaymentIntent for ${paymentIntentSucceeded.amount} was successful for praise ${praiseId}!`);
      
      if (praiseId) {
        try {
          await db.query(`UPDATE praises SET status = 'funded' WHERE id = $1`, [praiseId]);
        } catch (dbErr) {
          console.error("Error updating DB after payment:", dbErr);
        }
      }
      break;
    default:
      console.log(`Unhandled event type ${event.type}`);
  }

  // Return a 200 response to acknowledge receipt of the event
  response.send();
});

// Regular routes use JSON parsing
app.use(express.json())

const PORT = process.env.PORT || 3001

app.get('/api/praises', async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM praises ORDER BY timestamp DESC');
    const rows = result.rows;
    
    // Parse the flattened DB columns back into the nested claimDetails format the frontend expects
    const praises = rows.map(row => {
      const praise = { ...row }
      if (row.claimername) { // PG returns lowercase columns by default unless quoted
        praise.claimDetails = {
          claimerName: row.claimername,
          evidenceLink: row.evidencelink,
          chatScreenshot: row.chatscreenshot,
          claimedAt: row.claimedat
        }
      }
      // Remove flattened claim columns to match frontend model
      delete praise.claimername
      delete praise.evidencelink
      delete praise.chatscreenshot
      delete praise.claimedat
      
      // camelCase conversion if needed for standard rows
      praise.playerName = row.playername || row.playerName
      praise.bountyAmount = row.bountyamount || row.bountyAmount
      
      return praise
    })

    res.json(praises)
  } catch (err) {
    return res.status(500).json({ error: err.message })
  }
})

app.post('/api/praises', async (req, res) => {
  const { id, playerName, game, region, category, comment, bountyAmount, status, timestamp, upvotes } = req.body
  
  try {
    await db.query(`
      INSERT INTO praises 
      (id, playerName, game, region, category, comment, bountyAmount, status, timestamp, upvotes)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
    `, [id, playerName, game, region, category, comment, bountyAmount, status, timestamp, upvotes || 0])
    res.json({ success: true, id })
  } catch (err) {
    return res.status(500).json({ error: err.message })
  }
})

app.post('/api/claims', async (req, res) => {
  const { praiseId, claimDetails } = req.body
  const { claimerName, evidenceLink, chatScreenshot, claimedAt } = claimDetails

  try {
    // In Phase 3, we set status to 'pending_review' when claimed
    await db.query(`
      UPDATE praises
      SET status = 'pending_review',
          claimerName = $1,
          evidenceLink = $2,
          chatScreenshot = $3,
          claimedAt = $4
      WHERE id = $5
    `, [claimerName, evidenceLink, chatScreenshot, claimedAt, praiseId])
    res.json({ success: true, praiseId })
  } catch (err) {
    return res.status(500).json({ error: err.message })
  }
})

// Real Stripe - Deposit API (When placing a bounty)
app.post('/api/create-payment-intent', async (req, res) => {
  const { amount, praiseId } = req.body;
  
  if (!amount || amount <= 0) {
    return res.status(400).json({ error: 'Invalid amount' });
  }

  try {
    // Create a PaymentIntent with the order amount and currency
    const paymentIntent = await stripe.paymentIntents.create({
      amount: amount, // amount in cents
      currency: 'usd',
      // In the latest version of the API, specifying the `automatic_payment_methods` parameter is optional because Stripe enables its functionality by default.
      automatic_payment_methods: {
        enabled: true,
      },
      metadata: {
        praiseId: praiseId // Store the praise ID so the webhook knows which database row to update
      }
    });

    res.json({
      clientSecret: paymentIntent.client_secret,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
})

// MODERATOR API - Approve claim and Trigger Payout
app.post('/api/admin/approve-claim', async (req, res) => {
  const { praiseId } = req.body
  
  try {
    // 1. Mark in DB as fully claimed
    await db.query(`UPDATE praises SET status = 'claimed' WHERE id = $1`, [praiseId])
    
    // 2. Real: Trigger Stripe Transfer (Requires connected accounts which is complex, 
    // for this deployment we will just mark as claimed in DB and log it).
    console.log(`Admin approved claim for ${praiseId}. In a full production app with Stripe Connect, this would trigger a transfer.`);
    // await stripe.transfers.create({ amount: ..., destination: 'acct_123...' })
    
    res.json({ success: true, message: 'Claim approved. Payout must be handled manually.' })
  } catch (err) {
    return res.status(500).json({ error: err.message })
  }
})

app.listen(PORT, () => {
  console.log(`Backend server running on http://localhost:${PORT}`)
})
