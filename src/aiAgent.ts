import Groq from 'groq-sdk';
import Groq from 'groq-sdk';
import { MarketGenerator } from './marketGenerator';
import { ethers } from 'ethers';

const PREDICTION_MARKET_ABI = [
  'function createMarket(string memory _title, uint256 _duration, uint8 _aiConfidence) external returns (uint256)',
  'function marketCount() external view returns (uint256)',
];

export class AIAgent {
  private groq!: Groq;
  private marketGenerator!: MarketGenerator;

  async initialize() {
    console.log('Initializing AI Agent...');
    
    this.groq = new Groq({
      apiKey: process.env.GROQ_API_KEY,
    });

    this.marketGenerator = new MarketGenerator();
    console.log('✅ AI Agent initialized with Groq!');
  }

  async analyzeAndCreateMarkets() {
    console.log('🤖 AI Agent analyzing market data...\n');

    const proposals = await this.marketGenerator.generateMarketQuestions();

    console.log(`Found ${proposals.length} market opportunities:\n`);
    proposals.forEach((p, i) => {
      console.log(`${i + 1}. ${p.title}`);
      console.log(`   Confidence: ${p.aiConfidence}%`);
      console.log(`   Reasoning: ${p.reasoning}\n`);
    });

    // Ask Groq to validate using UPDATED MODEL
    const prompt = `You are an AI prediction market analyst. Review these market proposals and decide which ONE is best to create right now:

${proposals.map((p, i) => `${i + 1}. ${p.title}
   - AI Confidence: ${p.aiConfidence}%
   - Reasoning: ${p.reasoning}
`).join('\n')}

Respond with ONLY the number of the best market to create (1, 2, or 3). Be brief.`;

    try {
      const response = await this.groq.chat.completions.create({
        messages: [{ role: 'user', content: prompt }],
        model: 'llama-3.3-70b-versatile', // ✅ UPDATED MODEL
        temperature: 0.7,
        max_tokens: 100,
      });

      const decision = response.choices[0]?.message?.content || '1';
      console.log('🤖 Groq Decision:', decision);

      // Extract number and create that market
      const marketIndex = parseInt(decision.match(/\d+/)?.[0] || '1') - 1;
      const selectedMarket = proposals[marketIndex] || proposals[0];

      console.log(`\n✅ Creating market: ${selectedMarket.title}\n`);
      const result = await this.createMarketOnChain(selectedMarket);
      
      return result;
    } catch (error) {
      console.error('❌ Groq API Error:', error);
      // Fallback: just create the first market
      console.log('⚠️ Using fallback - creating first market');
      const result = await this.createMarketOnChain(proposals[0]);
      return result;
    }
  }

  async createMarketOnChain(proposal: any) {
    console.log(`📝 Creating market on-chain...`);
    console.log(`Title: ${proposal.title}`);
    console.log(`Duration: ${proposal.duration}s (${proposal.duration / 3600}h)`);
    console.log(`AI Confidence: ${proposal.aiConfidence}%\n`);

    try {
      const provider = new ethers.JsonRpcProvider(process.env.BASE_SEPOLIA_RPC);
      const signer = new ethers.Wallet(process.env.DEPLOYER_PRIVATE_KEY!, provider);
      
      console.log(`Using wallet: ${signer.address}`);
      console.log(`Contract: ${process.env.PREDICTION_MARKET_ADDRESS}\n`);

      const contract = new ethers.Contract(
        process.env.PREDICTION_MARKET_ADDRESS!,
        PREDICTION_MARKET_ABI,
        signer
      );

      // Create market transaction
      const tx = await contract.createMarket(
        proposal.title,
        proposal.duration,
        proposal.aiConfidence
      );

      console.log('✅ Transaction sent!');
      console.log(`Hash: ${tx.hash}`);
      console.log('Waiting for confirmation...\n');
      
      const receipt = await tx.wait();
      const marketCount = await contract.marketCount();
      const marketId = (marketCount - 1n).toString();

      console.log('═══════════════════════════════════════');
      console.log('🎉 MARKET CREATED SUCCESSFULLY!');
      console.log('═══════════════════════════════════════');
      console.log(`Market ID: ${marketId}`);
      console.log(`Block: ${receipt.blockNumber}`);
      console.log(`Gas Used: ${receipt.gasUsed.toString()}`);
      console.log(`View on Basescan:`);
      console.log(`https://sepolia.basescan.org/tx/${tx.hash}`);
      console.log('═══════════════════════════════════════\n');

      return { 
        marketId, 
        txHash: tx.hash,
        receipt 
      };
    } catch (error: any) {
      console.error('❌ Error creating market on-chain:');
      console.error(error.message || error);
      
      if (error.code === 'INSUFFICIENT_FUNDS') {
        console.error('\n⚠️ Not enough ETH for gas fees!');
        console.error('Get testnet ETH: https://www.coinbase.com/faucets/base-ethereum-sepolia-faucet');
      }
      
      throw error;
    }
  }
}