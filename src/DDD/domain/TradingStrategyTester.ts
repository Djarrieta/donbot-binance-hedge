import { getDate } from "../../utils/getDate";
import type { BacktestDataService } from "../infrastructure/BacktestDataService";
import type { MarketDataService } from "../infrastructure/MarketDataService";
import type { Candle } from "./Candle";
import { Interval } from "./Interval";
import type { PositionBT, PositionSide } from "./Position";
import type { Stat } from "./Stat";
import type { Strategy, StrategyResponse } from "./Strategy";

export type BacktestConfig = {
	backtestStart: number;
	backtestEnd: number;
	forwardTestEnd: number;
	interval: Interval;
	lookBackLength: number;
	slArray: number[];
	tpArray: number[];
	riskPt: number;
	feePt: number;
	maxTradeLengthArray: number[];
	minAmountToTradeUSDT: number;
	apiLimit: number;
};

type Trade = StrategyResponse & {
	profitStick: Candle[];
};

export class TradingStrategyTester {
	constructor(
		private readonly config: BacktestConfig,
		private readonly backtestDataService: BacktestDataService,
		private readonly marketDataService: MarketDataService,
		private readonly strategies: Strategy[]
	) {
		this.config = config;
		this.backtestDataService = backtestDataService;
		this.marketDataService = marketDataService;
		this.strategies = strategies;
	}

	public async prepare(): Promise<void> {
		this.validateTimeRanges(
			this.config.backtestStart,
			this.config.backtestEnd,
			this.config.forwardTestEnd
		);

		console.log("\n\n");
		console.log(
			"======================================================================================================="
		);
		console.log(
			`Preparing backtest for  ${(
				(this.config.forwardTestEnd - this.config.backtestStart) /
				Interval["1d"]
			).toFixed(1)} days`
		);
		console.log(`Interval: ${Interval[this.config.interval]}`);
		console.log(
			`Backtest: ${getDate(this.config.backtestStart).dateString} to ${
				getDate(this.config.backtestEnd).dateString
			} `
		);
		console.log(
			`ForwardTest: ${getDate(this.config.backtestEnd).dateString} to ${
				getDate(this.config.forwardTestEnd).dateString
			}`
		);
		console.log(
			"======================================================================================================="
		);
		console.log("\n\n");

		const pairList = await this.marketDataService.getPairList({
			minAmountToTradeUSDT: this.config.minAmountToTradeUSDT,
		});
		console.log("Available trading pairs:", pairList.length);

		this.backtestDataService.deleteCandlestickRows();

		for (const pair of pairList) {
			console.log(`Downloading and processing candlestick data for ${pair}`);

			const rawCandlesticks = await this.marketDataService.getCandlestick({
				pair,
				start: this.config.backtestStart,
				end: this.config.forwardTestEnd,
				interval: this.config.interval,
				apiLimit: this.config.apiLimit,
			});

			const fixedCandlesticks = this.fixCandlestick({
				candlestick: rawCandlesticks,
				start: this.config.backtestStart,
				end: this.config.forwardTestEnd,
				interval: this.config.interval,
			});

			this.backtestDataService.saveCandlestick(fixedCandlesticks);
			console.log(`Saved candlestick data for ${pair}`);
		}

		this.backtestDataService.showSavedCandlestick();
	}

	async backtest() {
		this.backtestDataService.showSavedCandlestick();

		this.backtestDataService.deleteStatsRows();

		console.log(
			"\nStarting backtest from " +
				getDate(this.config.backtestStart).dateString +
				" to " +
				getDate(this.config.backtestEnd).dateString +
				"..."
		);
		const pairList = this.backtestDataService.getPairList();

		for (const sl of this.config.slArray) {
			for (const tp of this.config.tpArray) {
				for (const maxTradeLength of this.config.maxTradeLengthArray) {
					const positions: PositionBT[] = [];

					let start = this.config.backtestStart;
					let end =
						this.config.backtestStart +
						(this.config.lookBackLength + maxTradeLength - 1) *
							this.config.interval;
					let endCandlestick =
						this.config.backtestStart +
						this.config.lookBackLength * this.config.interval;

					do {
						const trades = this.processBacktestTrades({
							start,
							end,
							pairList,
							endCandlestick,
						});

						const snapPositions = this.processBacktestPositions({
							trades,
							sl,
							tp,
						});

						positions.push(...snapPositions);
						start += this.config.interval;
						end += this.config.interval;
						endCandlestick += this.config.interval;
					} while (end < this.config.backtestEnd);
					const stats = this.processStats({
						positions,
						pairList,
						tp,
						sl,
						maxTradeLength,
					});
					this.backtestDataService.saveStats(stats);
				}
			}
		}

		this.backtestDataService.showSavedStats();
	}

	private processBacktestTrades({
		start,
		end,
		pairList,
		endCandlestick,
	}: {
		start: number;
		end: number;
		pairList: string[];
		endCandlestick: number;
	}) {
		const candlesticksAllSymbols = this.backtestDataService.getCandlestick({
			start,
			end,
		});
		const trades: Trade[] = [];
		for (const pair of pairList) {
			const candlestick = candlesticksAllSymbols.filter(
				(c) => c.pair === pair && c.openTime < endCandlestick
			);

			const profitStick = candlesticksAllSymbols.filter(
				(c) => c.pair === pair && c.openTime >= endCandlestick
			);

			for (const strategy of this.strategies) {
				const stgResponse = strategy?.validate({
					candlestick,
					pair,
				});
				if (stgResponse.positionSide) {
					trades.push({ ...stgResponse, profitStick });
				}
			}
		}

		return trades;
	}

	private processBacktestPositions({
		trades,
		sl,
		tp,
	}: {
		trades: Trade[];
		sl: number;
		tp: number;
	}) {
		const closedPositions: PositionBT[] = [];

		for (const trade of trades) {
			const { profitStick, pair } = trade;

			const entryPriceUSDT = profitStick[0].open;

			let pnl = 0;
			let stickIndex = 0;
			let done = false;
			do {
				const candle = profitStick[stickIndex];
				const stopLoss =
					trade.positionSide === "LONG"
						? entryPriceUSDT * (1 - sl)
						: entryPriceUSDT * (1 + sl);
				const takeProfit = tp
					? trade.positionSide === "LONG"
						? entryPriceUSDT * (1 + tp)
						: entryPriceUSDT * (1 - tp)
					: 0;

				if (
					(trade.positionSide === "LONG" &&
						(candle.low <= stopLoss || candle.close <= stopLoss)) ||
					(trade.positionSide === "SHORT" &&
						(candle.high >= stopLoss || candle.close >= stopLoss))
				) {
					pnl = -this.config.riskPt - this.config.feePt;
					done = true;
				}

				if (
					(trade.positionSide === "LONG" &&
						(candle.high >= takeProfit || candle.close >= takeProfit)) ||
					(trade.positionSide === "SHORT" &&
						(candle.low <= takeProfit || candle.close <= takeProfit))
				) {
					pnl = this.config.riskPt * (tp / sl) - this.config.feePt;
					done = true;
				}

				stickIndex++;
			} while (done !== true && stickIndex < profitStick.length - 1);

			if (pnl === 0) {
				const lastPrice = profitStick[profitStick.length - 1].close;
				const pnlGraph =
					(trade.positionSide === "LONG"
						? lastPrice - profitStick[0].open
						: profitStick[0].open - lastPrice) / profitStick[0].open;

				pnl = this.config.riskPt * (pnlGraph / sl) - this.config.feePt;
			}
			closedPositions.push({
				pair,
				positionSide: trade.positionSide as PositionSide,
				startTime: profitStick[0].openTime,
				entryPriceUSDT: profitStick[0].open,
				pnl,
				tradeLength: stickIndex,
				stgName: trade.stgName,
			});
		}

		return closedPositions;
	}

	private processStats({
		positions,
		pairList,
		tp,
		sl,
		maxTradeLength,
	}: {
		positions: PositionBT[];
		pairList: string[];
		tp: number;
		sl: number;
		maxTradeLength: number;
	}) {
		let winningPairs: string[] = [];

		for (const pair of pairList) {
			const closedPosForSymbol = positions.filter((pos) => pos.pair === pair);
			const tradesQty = closedPosForSymbol.length;
			const totalPnl = closedPosForSymbol.reduce((acc, a) => acc + a.pnl, 0);
			const avPnl = totalPnl / tradesQty || 0;

			if (avPnl > 0) {
				winningPairs.push(pair);
			}
		}

		const positionsWP = positions.filter((p) => {
			return winningPairs.includes(p.pair);
		});

		const tradesQtyWP = positionsWP.length;
		const winningPositionsWP = positionsWP.filter((p) => p.pnl > 0);
		const winRateWP = winningPositionsWP.length / tradesQtyWP;
		const accPnlWP = positionsWP.reduce((acc, p) => acc + p.pnl, 0);
		const avPnlWP = accPnlWP / tradesQtyWP || 0;

		const positionsAcc = [];
		let openPosTime = 0;
		for (const position of positionsWP) {
			if (position.startTime > openPosTime) {
				positionsAcc.push(position);
				openPosTime =
					position.startTime + position.tradeLength * this.config.interval;
			}
		}

		const tradesQtyAcc = positionsAcc.length;
		const winningPositionsAcc = positionsAcc.filter((p) => p.pnl > 0);
		const winRateAcc = winningPositionsAcc.length / tradesQtyAcc;
		const accPnlAcc = positionsAcc.reduce((acc, p) => acc + p.pnl, 0);
		const avPnlAcc = accPnlAcc / tradesQtyAcc || 0;

		const stats: Stat = {
			sl,
			tp,
			maxTradeLength,
			positions,
			winningPairs,
			positionsWP,
			winRateWP,
			avPnlWP,
			winRateAcc,
			avPnlAcc,
			positionsAcc,
		};

		return stats;
	}

	private validateTimeRanges(
		backtestStartTime: number,
		backtestEndTime: number,
		forwardTestEndTime: number
	): void {
		if (
			backtestStartTime >= backtestEndTime ||
			backtestEndTime >= forwardTestEndTime
		) {
			throw new Error(
				"Backtest startTime should be < endTime should be < forwardEnd"
			);
		}
	}

	private fixCandlestick({
		candlestick,
		start,
		end,
		interval,
	}: {
		candlestick: Candle[];
		start: number;
		end: number;
		interval: Interval;
	}): Candle[] {
		const fixedCandlestick: Candle[] = [];
		let time = start;
		let prevCandle: Candle | undefined;
		do {
			const candle = candlestick.find((c) => c.openTime === time);
			if (candle) {
				fixedCandlestick.push(candle);
				prevCandle = candle;
			} else if (prevCandle) {
				fixedCandlestick.push({
					...prevCandle,
					openTime: time,
				});
			}
			time += interval;
		} while (time < end);
		return fixedCandlestick;
	}
}
