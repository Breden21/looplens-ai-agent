# LoopLens - AI Agent

Autonomous AI agent that creates prediction markets every 6 hours using real crypto data.

## 🤖 What It Does

- Fetches real-time crypto prices (BTC, ETH, SOL)
- Analyzes market sentiment and volatility
- Generates interesting market questions
- Uses Groq AI (Llama 3.3 70B) to validate proposals
- Creates markets on-chain via smart contract
- Runs 24/7 on Railway

## 🎯 Market Types Generated

1. **Price Movements** - "Will BTC exceed $96k in 24h?"
2. **Relative Performance** - "Will ETH outperform BTC?"
3. **Volatility** - "Will BTC move >5% in 48h?"
4. **Milestones** - "Will ETH reach $4,000 this week?"
5. **Temporal Patterns** - "Higher volatility this weekend?"

## 🛠 Tech Stack

- Node.js + TypeScript
- Groq API (Llama 3.3 70B)
- CoinGecko API (real-time data)
- Ethers.js (blockchain interaction)
- Node-cron (scheduling)
- Railway (24/7 hosting)

## 🚀 Local Development
```bash
npm install
npm run start
```

## 📦 Environment Variables
```env
GROQ_API_KEY=gsk_...
PREDICTION_MARKET_ADDRESS=0xb69477DBeB7C0CD962D88D25024F1e4f6FCD3a99
USDC_ADDRESS=0x036CbD53842c5426634e7929541eC2318f3dCF7e
BASE_SEPOLIA_RPC=https://sepolia.base.org
DEPLOYER_PRIVATE_KEY=0x...
```

## ⏰ Schedule

Creates new markets every **6 hours**:
- 00:00 UTC
- 06:00 UTC
- 12:00 UTC
- 18:00 UTC

## 🎨 AI Confidence Algorithm

Dynamic confidence levels (55-88%) based on:
- Price momentum
- Market sentiment (bullish/bearish/neutral)
- Volume trends
- Historical volatility
- Timeframe uncertainty

## 🔗 Related Repos

- Frontend: [looplens-market-deck](https://github.com/Breden21/looplens-market-deck)
- Smart Contracts: [looplens-contracts](https://github.com/Breden21/looplens-contracts)

## 📊 Example Output
```
🤖 AI Agent analyzing market data...

Found 3 market opportunities:

1. Will BTC close above $96,000 in 24 hours?
   Confidence: 76%
   Reasoning: Current: $95,200, 24h: +2.5%, Momentum: bullish

🤖 Groq Decision: 1

✅ Creating market: Will BTC close above $96,000 in 24 hours?
📝 Creating market on-chain...
✅ MARKET CREATED SUCCESSFULLY!
Market ID: 2
```

## 🌐 Deployment

Deployed on Railway: Runs continuously, creating markets every 6 hours.

## 📄 License

MIT
