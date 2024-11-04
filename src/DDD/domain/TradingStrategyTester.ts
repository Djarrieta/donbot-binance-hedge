import { getDate } from "../../utils/getDate";
import type { BacktestDataService } from "../infrastructure/BacktestDataService";
import type { MarketDataService } from "../infrastructure/MarketDataService";
import cliProgress from "cli-progress";
import type { Interval } from "./Interval";
import type { Strategy, StrategyResponse } from "./Strategy";
import type { Candle } from "./Candle";
import type { Position, PositionSide } from "./Position";

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

type PositionBT = Pick<
	Position,
	"pair" | "positionSide" | "startTime" | "entryPriceUSDT" | "pnl" | "stgName"
> & {
	tradeLength: number;
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
		console.log(`Preparing backtest`);

		this.validateTimeRanges(
			this.config.backtestStart,
			this.config.backtestEnd,
			this.config.forwardTestEnd
		);

		const pairList = await this.marketDataService.getPairList({
			minAmountToTradeUSDT: this.config.minAmountToTradeUSDT,
		});
		console.log("Available trading pairs:", pairList.length);

		this.backtestDataService.deleteRows();

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

		this.backtestDataService.showSavedInformation();
	}

	async backtest() {
		this.backtestDataService.showSavedInformation();

		console.log(
			"\nStarting backtest from " +
				getDate(this.config.backtestStart).dateString +
				" to " +
				getDate(this.config.backtestEnd).dateString +
				"..."
		);
		const pairList = this.backtestDataService.getPairList();

		const totalLookBackLength =
			(this.config.backtestEnd -
				this.config.backtestStart -
				this.config.interval * (1 + this.config.lookBackLength)) /
			this.config.interval;
		const progressTotal =
			this.config.slArray.length *
			this.config.tpArray.length *
			this.config.maxTradeLengthArray.length *
			totalLookBackLength;

		const progressBar = new cliProgress.SingleBar(
			{},
			cliProgress.Presets.shades_classic
		);
		progressBar.start(progressTotal, 0);
		let progress = 0;
		for (const sl of this.config.slArray) {
			for (const tp of this.config.tpArray) {
				for (const maxTradeLength of this.config.maxTradeLengthArray) {
					const closedPositions: PositionBT[] = [];

					let start = this.config.backtestStart;
					let end =
						this.config.backtestStart +
						(this.config.lookBackLength + maxTradeLength - 1) *
							this.config.interval;
					let endCandlestick =
						this.config.backtestStart +
						this.config.lookBackLength * this.config.interval;

					do {
						const candlesticksAllSymbols =
							this.backtestDataService.getCandlestick({
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

						tradeLoop: for (const trade of trades) {
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
										(candle.high >= takeProfit ||
											candle.close >= takeProfit)) ||
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

						start += this.config.interval;
						end += this.config.interval;
						endCandlestick += this.config.interval;
						progress++;
						progressBar.update(progress);
					} while (end < this.config.backtestEnd);
					console.log(closedPositions);
				}
			}
		}
		progressBar.stop();
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

		console.log(
			`Backtest: ${getDate(backtestStartTime).dateString} to ${
				getDate(backtestEndTime).dateString
			} `
		);
		console.log(
			`ForwardTest: ${getDate(backtestEndTime).dateString} to ${
				getDate(forwardTestEndTime).dateString
			}`
		);
		console.log(`Interval: ${this.config.interval}`);
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
