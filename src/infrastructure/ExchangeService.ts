import type {
	CandleChartInterval_LT,
	CandleChartResult,
	Binance as IBinance,
} from "binance-api-node";
import Binance from "binance-api-node";
import OldBinance from "node-binance-api";
import { type CandleBt } from "../domain/Candle";
import type {
	Exchange,
	GetCandlestickProps,
	GetSymbolsDataProps,
	UpdateSymbolProps,
} from "../domain/Exchange";
import { Interval } from "../domain/Interval";
import type { Strategy } from "../domain/Strategy";
import { type Symbol } from "../domain/Symbol";
import { getDate } from "../utils/getDate";

export class ExchangeService implements Exchange {
	private exchange: IBinance;

	constructor() {
		this.exchange = Binance();
	}

	public async getPairList({
		minAmountToTradeUSDT,
		strategies,
	}: {
		minAmountToTradeUSDT: number;
		strategies: Strategy[];
	}): Promise<string[]> {
		let pairList: string[] = [];
		const pairsInStrategies = Array.from(
			new Set(strategies.map((s) => s.allowedPairs).flat())
		) as string[];

		try {
			const { symbols: unformattedList } =
				await this.exchange.futuresExchangeInfo();

			const filteredSymbols = pairsInStrategies.length
				? unformattedList.filter((symbol) => {
						return pairsInStrategies.includes(symbol.symbol);
				  })
				: unformattedList;
			const prices = await this.exchange.futuresMarkPrice();

			for (const symbol of filteredSymbols) {
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
		candlestickAPILimit,
	}: GetCandlestickProps): Promise<CandleBt[]> {
		let candlestick: CandleBt[] = [];

		let dynamicStart = start;

		while (dynamicStart < end) {
			const lookBackLength = Math.min(
				Math.floor((end - dynamicStart) / interval),
				candlestickAPILimit
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
	): CandleBt[] {
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

	subscribeToSymbolUpdates({
		pair,
		interval,
		updateSymbol,
	}: {
		pair: string;
		interval: Interval;
		updateSymbol: (props: UpdateSymbolProps) => void;
	}) {
		const exchange = new OldBinance();
		const intervalText = Interval[interval] as CandleChartInterval_LT;

		exchange.futuresSubscribe(
			pair.toLocaleLowerCase() + "@kline_" + intervalText,
			(data) => {
				if (!data.k.x) {
					updateSymbol({ pair: data?.s, price: Number(data.k.c) });
					return;
				}

				const newCandle: CandleBt = {
					pair: data?.s,
					open: Number(data.k.o),
					high: Number(data.k.h),
					close: Number(data.k.c),
					low: Number(data.k.l),
					openTime: getDate(Number(data.k.t)).dateMs,
					volume: Number(data.k.v),
				};

				updateSymbol({
					pair: data?.s,
					newCandle,
				});
			}
		);
	}

	async getSymbolsData({
		minAmountToTradeUSDT,
		interval,
		lookBackLength,
		candlestickAPILimit,
		strategies,
	}: GetSymbolsDataProps): Promise<Symbol[]> {
		const exchange = Binance();
		const symbolList: Symbol[] = [];
		const pairList = await this.getPairList({
			minAmountToTradeUSDT,
			strategies,
		});
		if (!pairList.length) return symbolList;

		const symbolListInfo = await exchange.futuresExchangeInfo();
		for (const pair of pairList) {
			const symbolInfo = symbolListInfo.symbols.find(
				(p) => p.symbol === pair
			) as any;
			if (!symbolInfo) continue;

			const start = getDate().dateMs - (lookBackLength + 1) * interval;
			const end = start + lookBackLength * interval;

			const candlestick = await this.getCandlestick({
				pair,
				start,
				end,
				interval,
				candlestickAPILimit,
			});
			const currentPrice =
				Number(candlestick[candlestick.length - 1]?.close) || 0;

			symbolList.push({
				pair,
				pricePrecision: Number(symbolInfo.pricePrecision),
				quantityPrecision: Number(symbolInfo.quantityPrecision),
				isReady: true,
				candlestick,
				currentPrice,
			});
		}

		return symbolList;
	}
}
