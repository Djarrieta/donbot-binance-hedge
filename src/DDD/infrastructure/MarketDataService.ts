import type {
	CandleChartInterval_LT,
	CandleChartResult,
	Binance as IBinance,
} from "binance-api-node";
import Binance from "binance-api-node";
import type { Candle } from "../domain/Candle";
import { Interval } from "../domain/Interval";

export class MarketDataService {
	private exchange: IBinance;

	constructor() {
		this.exchange = Binance();
	}

	public async getPairList({
		minAmountToTradeUSDT,
	}: {
		minAmountToTradeUSDT: number;
	}): Promise<string[]> {
		const pairList: string[] = [];
		try {
			const { symbols: unformattedList } =
				await this.exchange.futuresExchangeInfo();
			const prices = await this.exchange.futuresMarkPrice();

			for (const symbol of unformattedList) {
				if (this.isValidSymbol(symbol, prices, minAmountToTradeUSDT)) {
					pairList.push(symbol.symbol);
				}
			}
		} catch (error) {
			console.error("Error fetching pair list:", error);
		}
		return pairList;
	}

	public async getCandlestick({
		pair,
		start,
		end,
		interval,
		apiLimit,
	}: {
		pair: string;
		interval: Interval;
		start: number;
		end: number;
		apiLimit: number;
	}): Promise<Candle[]> {
		let candlestick: Candle[] = [];

		let dynamicStart = start;

		while (dynamicStart < end) {
			const lookBackLength = Math.min(
				Math.floor((end - dynamicStart) / interval),
				apiLimit
			);
			const unformattedCandlestick = await this.fetchCandles(
				pair,
				interval,
				dynamicStart,
				lookBackLength
			);

			candlestick.push(...this.formatCandlestick(unformattedCandlestick, pair));

			dynamicStart = dynamicStart + lookBackLength * interval;
		}

		return candlestick;
	}

	private isValidSymbol(
		symbol: any,
		prices: any[],
		minAmountToTradeUSDT: number
	): boolean {
		const {
			symbol: pair,
			status,
			quoteAsset,
			baseAsset,
			contractType,
			filters,
		} = symbol;

		const minQty = Number(
			filters.find((f: any) => f.filterType === "LOT_SIZE").minQty
		);
		const minNotional = Number(
			filters.find((f: any) => f.filterType === "MIN_NOTIONAL").notional
		);
		const currentPrice =
			Number(prices.find((p: any) => p.symbol === pair)?.markPrice) || 0;
		const minQuantityUSD = minQty * currentPrice;

		return (
			status === "TRADING" &&
			quoteAsset === "USDT" &&
			baseAsset !== "USDT" &&
			contractType === "PERPETUAL" &&
			minQuantityUSD <= minAmountToTradeUSDT &&
			minNotional <= minAmountToTradeUSDT
		);
	}

	private async fetchCandles(
		pair: string,
		interval: Interval,
		startTime: number,
		limit: number
	): Promise<CandleChartResult[]> {
		return (await this.exchange.futuresCandles({
			symbol: pair,
			interval: Interval[interval] as CandleChartInterval_LT,
			startTime,
			limit,
		})) as CandleChartResult[];
	}

	private formatCandlestick(
		unformattedCandlestick: CandleChartResult[],
		pair: string
	): Candle[] {
		return unformattedCandlestick.map(
			({ close, open, high, low, openTime, volume }) => ({
				pair,
				close: Number(close),
				open: Number(open),
				high: Number(high),
				low: Number(low),
				openTime: Number(openTime),
				volume: Number(volume),
			})
		);
	}
}
