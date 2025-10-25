import { DataFetcher } from './dataFetcher';

interface MarketProposal {
  title: string;
  duration: number; // in seconds
  aiConfidence: number; // 0-100
  reasoning: string;
  category: string;
}

export class MarketGenerator {
  private dataFetcher: DataFetcher;

  constructor() {
    this.dataFetcher = new DataFetcher();
  }

  async generateMarketQuestions(): Promise<MarketProposal[]> {
    const prices = await this.dataFetcher.getCryptoPrices();
    const sentiment = await this.dataFetcher.getMarketSentiment();

    const proposals: MarketProposal[] = [];

    // Get BTC and ETH data
    const btc = prices.find(p => p.symbol === 'BITCOIN');
    const eth = prices.find(p => p.symbol === 'ETHEREUM');

    // 1. BTC Price Movement (Short-term)
    if (btc) {
      const currentPrice = Math.round(btc.price);
      const priceChange = btc.change24h;
      
      // Smart price targets based on volatility
      let targetChange = 0.03; // 3% default
      if (Math.abs(priceChange) > 5) targetChange = 0.05; // More volatile
      if (Math.abs(priceChange) < 2) targetChange = 0.02; // Less volatile

      const direction = priceChange > 0 ? 'above' : 'below';
      const targetPrice = priceChange > 0 
        ? Math.round(currentPrice * (1 + targetChange) / 100) * 100 // Round to nearest 100
        : Math.round(currentPrice * (1 - targetChange) / 100) * 100;

      const confidence = this.calculatePriceConfidence(priceChange, sentiment, 'short');

      proposals.push({
        title: `Will BTC close ${direction} $${targetPrice.toLocaleString()} in 24 hours?`,
        duration: 86400, // 24 hours
        aiConfidence: confidence,
        reasoning: `Current: $${currentPrice.toLocaleString()}, 24h: ${priceChange > 0 ? '+' : ''}${priceChange.toFixed(1)}%, Momentum: ${sentiment}`,
        category: 'crypto-price',
      });
    }

    // 2. ETH vs BTC Performance (Medium-term)
    if (eth && btc) {
      const ethChange = eth.change24h;
      const btcChange = btc.change24h;
      const confidence = this.calculateRelativeConfidence(ethChange, btcChange, sentiment);

      const winner = ethChange > btcChange ? 'ETH' : 'BTC';
      const opposite = winner === 'ETH' ? 'BTC' : 'ETH';

      proposals.push({
        title: `Will ${winner} outperform ${opposite} over the next 3 days?`,
        duration: 259200, // 3 days
        aiConfidence: confidence,
        reasoning: `ETH 24h: ${ethChange > 0 ? '+' : ''}${ethChange.toFixed(1)}%, BTC 24h: ${btcChange > 0 ? '+' : ''}${btcChange.toFixed(1)}%`,
        category: 'relative-performance',
      });
    }

    // 3. Market Volatility (Pattern-based)
    if (btc) {
      const isVolatile = Math.abs(btc.change24h) > 3;
      const confidence = this.calculateVolatilityConfidence(btc.change24h, sentiment);

      const threshold = isVolatile ? '5%' : '3%';
      
      proposals.push({
        title: `Will BTC price move more than ${threshold} in either direction within 48h?`,
        duration: 172800, // 48 hours
        aiConfidence: confidence,
        reasoning: `Recent volatility: ${Math.abs(btc.change24h).toFixed(1)}%, Volume trending ${btc.volume24h > 25000000000 ? 'high' : 'normal'}`,
        category: 'volatility',
      });
    }

    // 4. Crypto Market Cap Milestones
    if (eth) {
      const currentPrice = Math.round(eth.price);
      const milestone = this.getNextMilestone(currentPrice);
      const confidence = this.calculateMilestoneConfidence(currentPrice, milestone, eth.change24h);

      proposals.push({
        title: `Will ETH reach $${milestone.toLocaleString()} within the next week?`,
        duration: 604800, // 7 days
        aiConfidence: confidence,
        reasoning: `Current: $${currentPrice.toLocaleString()}, Distance: ${((milestone - currentPrice) / currentPrice * 100).toFixed(1)}%, Trend: ${eth.change24h > 0 ? 'bullish' : 'bearish'}`,
        category: 'milestone',
      });
    }

    // 5. Weekend Effect (Time-based pattern)
    const dayOfWeek = new Date().getDay();
    if (dayOfWeek >= 4 && btc) { // Thursday or later
      const confidence = this.calculateWeekendConfidence(sentiment, btc.change24h);
      
      proposals.push({
        title: `Will crypto markets see higher volatility this weekend vs weekdays?`,
        duration: 172800, // 48 hours
        aiConfidence: confidence,
        reasoning: `Historical weekend pattern: increased retail activity, Sentiment: ${sentiment}`,
        category: 'temporal-pattern',
      });
    }

    // Return top 3 most interesting markets
    return proposals.slice(0, 3);
  }

  // Calculate confidence based on price momentum and sentiment
  private calculatePriceConfidence(priceChange: number, sentiment: string, timeframe: 'short' | 'long'): number {
    let confidence = 60; // Base

    // Strong momentum = higher confidence
    if (Math.abs(priceChange) > 5) confidence += 12;
    else if (Math.abs(priceChange) > 3) confidence += 8;
    else if (Math.abs(priceChange) > 1) confidence += 4;

    // Sentiment alignment
    if (sentiment === 'bullish' && priceChange > 0) confidence += 8;
    if (sentiment === 'bearish' && priceChange < 0) confidence += 8;
    if (sentiment === 'neutral') confidence += 3; // Slight uncertainty

    // Timeframe adjustment
    if (timeframe === 'long') confidence -= 5; // More time = more uncertainty

    return Math.max(55, Math.min(88, confidence));
  }

  // Calculate confidence for relative performance
  private calculateRelativeConfidence(ethChange: number, btcChange: number, sentiment: string): number {
    const difference = Math.abs(ethChange - btcChange);
    let confidence = 62;

    // Large difference = clearer trend
    if (difference > 3) confidence += 10;
    else if (difference > 1.5) confidence += 6;
    else if (difference > 0.5) confidence += 3;

    // Sentiment boost
    if (sentiment === 'bullish') confidence += 5;
    if (sentiment === 'bearish') confidence += 5;

    return Math.max(58, Math.min(85, confidence));
  }

  // Calculate confidence for volatility predictions
  private calculateVolatilityConfidence(recentChange: number, sentiment: string): number {
    let confidence = 65;

    // High recent volatility = likely to continue
    if (Math.abs(recentChange) > 5) confidence += 12;
    else if (Math.abs(recentChange) > 3) confidence += 7;
    else confidence -= 5;

    // Extreme sentiment = volatility expected
    if (sentiment === 'bullish' || sentiment === 'bearish') confidence += 5;

    return Math.max(55, Math.min(82, confidence));
  }

  // Calculate confidence for milestone predictions
  private calculateMilestoneConfidence(current: number, milestone: number, momentum: number): number {
    const distance = Math.abs(milestone - current) / current;
    let confidence = 58;

    // Closer to milestone = higher confidence
    if (distance < 0.05) confidence += 15; // Within 5%
    else if (distance < 0.10) confidence += 10; // Within 10%
    else if (distance < 0.15) confidence += 5; // Within 15%

    // Momentum alignment
    if ((milestone > current && momentum > 0) || (milestone < current && momentum < 0)) {
      confidence += 8;
    }

    return Math.max(52, Math.min(80, confidence));
  }

  // Calculate confidence for weekend patterns
  private calculateWeekendConfidence(sentiment: string, momentum: number): number {
    let confidence = 64; // Historical weekend patterns exist

    if (Math.abs(momentum) > 3) confidence += 7; // Already volatile
    if (sentiment !== 'neutral') confidence += 5;

    return Math.max(58, Math.min(78, confidence));
  }

  // Get next price milestone
  private getNextMilestone(currentPrice: number): number {
    const milestones = [2500, 3000, 3500, 4000, 4500, 5000, 5500, 6000];
    
    for (const milestone of milestones) {
      if (milestone > currentPrice) {
        return milestone;
      }
    }
    
    return Math.ceil(currentPrice / 500) * 500;
  }
}