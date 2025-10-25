import 'dotenv/config'; // ✅ Add this at the very top
import { AIAgent } from './aiAgent';
import cron from 'node-cron';

async function main() {
  console.log('🚀 Starting LoopLens AI Agent...\n');

  const agent = new AIAgent();
  await agent.initialize();

  console.log('\n');

  // Run immediately on startup
  try {
    await agent.analyzeAndCreateMarkets();
  } catch (error) {
    console.error('Error in initial market creation:', error);
  }

  // Schedule to run every 6 hours
  console.log('\n📊 Scheduling automatic market creation every 6 hours...');
  console.log('Press Ctrl+C to stop\n');

  cron.schedule('0 */6 * * *', async () => {
    console.log('\n⏰ Scheduled run - Creating new market...\n');
    try {
      await agent.analyzeAndCreateMarkets();
    } catch (error) {
      console.error('Error in scheduled market creation:', error);
    }
  });

  // Keep the process running
  console.log('✅ Agent is running and will create markets every 6 hours');
}

main().catch(console.error);