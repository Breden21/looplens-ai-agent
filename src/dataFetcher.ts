import axios from 'axios';

interface CryptoPrice {
  symbol: string;
  price: number;
  change24h: number;
  volume24h: number;
  marketCap?: number;
}

export class DataFetcher {
  // Fetch current crypto prices from CoinGecko
  async getCryptoPrices(): Promise<CryptoPrice[]> {
    try {
      const response = await axios.get(
        'https://api.coingecko.com/api/v3/simple/price',
        {
          params: {
            ids: 'bitcoin,ethereum,solana,binancecoin',
            vs_currencies: 'usd',
            include_24hr_change: true,
            include_24hr_vol: true,
            include_market_cap: true,
          },
        }
      );

      const cryptos: CryptoPrice[] = [];
      
      for (const [id, data] of Object.entries(response.data) as [string, any][]) {
        cryptos.push({
          symbol: id.toUpperCase(),
          price: data.usd || 0,
          change24h: data.usd_24h_change || 0,
          volume24h: data.usd_24h_vol || 0,
          marketCap: data.usd_market_cap || 0,
        });
      }

      console.log('✅ Fetched prices for', cryptos.length, 'cryptocurrencies');
      return cryptos;
    } catch (error: any) {
      console.error('❌ Error fetching crypto prices:', error.message);
      // Return mock data if API fails
      return this.getMockPrices();
    }
  }

  // Get market sentiment based on multiple factors
  async getMarketSentiment(): Promise<'bullish' | 'bearish' | 'neutral'> {
    try {
      const prices = await this.getCryptoPrices();
      const btc = prices.find(p => p.symbol === 'BITCOIN');
      const eth = prices.find(p => p.symbol === 'ETHEREUM');
      
      if (!btc || !eth) return 'neutral';

      // Calculate overall sentiment
      const avgChange = (btc.change24h + eth.change24h) / 2;
      const volumeRatio = btc.volume24h / 30000000000; // Normalized against typical volume

      let sentimentScore = 0;

      // Price momentum
      if (avgChange > 3) sentimentScore += 2;
      else if (avgChange > 1) sentimentScore += 1;
      else if (avgChange < -3) sentimentScore -= 2;
      else if (avgChange < -1) sentimentScore -= 1;

      // Volume (high volume = strong conviction)
      if (volumeRatio > 1.2) sentimentScore += Math.sign(avgChange);
      
      // Determine sentiment
      if (sentimentScore >= 2) return 'bullish';
      if (sentimentScore <= -2) return 'bearish';
      return 'neutral';
    } catch (error) {
      console.error('Error calculating sentiment:', error);
      return 'neutral';
    }
  }

  // Get Fear & Greed Index (if available)
  async getFearGreedIndex(): Promise<number> {
    try {
      const response = await axios.get('https://api.alternative.me/fng/');
      const index = parseInt(response.data.data[0].value);
      console.log('✅ Fear & Greed Index:', index);
      return index;
    } catch (error) {
      console.log('⚠️ Could not fetch Fear & Greed Index');
      return 50; // Neutral default
    }
  }

  // Get trending coins (for generating interesting markets)
  async getTrendingCoins(): Promise<string[]> {
    try {
      const response = await axios.get('https://api.coingecko.com/api/v3/search/trending');
      const trending = response.data.coins.slice(0, 5).map((coin: any) => coin.item.name);
      console.log('✅ Trending coins:', trending.join(', '));
      return trending;
    } catch (error) {
      console.log('⚠️ Could not fetch trending coins');
      return ['Bitcoin', 'Ethereum', 'Solana'];
    }
  }

  // Mock data fallback
  private getMockPrices(): CryptoPrice[] {
    return [
      {
        symbol: 'BITCOIN',
        price: 95000,
        change24h: 2.5,
        volume24h: 28000000000,
        marketCap: 1900000000000,
      },
      {
        symbol: 'ETHEREUM',
        price: 3500,
        change24h: 1.8,
        volume24h: 15000000000,
        marketCap: 420000000000,
      },
      {
        symbol: 'SOLANA',
        price: 150,
        change24h: 3.2,
        volume24h: 2500000000,
        marketCap: 70000000000,
      },
    ];
  }

  // Get additional market metrics
  async getMarketMetrics() {
    const prices = await this.getCryptoPrices();
    const sentiment = await this.getMarketSentiment();
    const fearGreed = await this.getFearGreedIndex();

    const btc = prices.find(p => p.symbol === 'BITCOIN');
    const eth = prices.find(p => p.symbol === 'ETHEREUM');

    return {
      btcPrice: btc?.price || 0,
      ethPrice: eth?.price || 0,
      btcChange: btc?.change24h || 0,
      ethChange: eth?.change24h || 0,
      totalVolume: prices.reduce((sum, p) => sum + p.volume24h, 0),
      sentiment,
      fearGreedIndex: fearGreed,
      marketCap: prices.reduce((sum, p) => sum + (p.marketCap || 0), 0),
    };
  }
}