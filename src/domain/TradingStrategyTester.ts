import cliProgress from "cli-progress";
import type { BacktestDataService } from "../infrastructure/BacktestDataService";
import type { MarketDataService } from "../infrastructure/MarketDataService";
import { formatPercent } from "../utils/formatPercent";
import { getDate } from "../utils/getDate";
import type { Alert, AlertRepository } from "./Alert";
import type { CandleBt as Candle } from "./Candle";
import { Interval } from "./Interval";
import type { PositionBT, PositionSide } from "./Position";
import type { Stat } from "./Stat";
import type { Strategy } from "./Strategy";

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
	steps: {
		overrideHistoricalRecords: boolean;
		overrideAlerts: boolean;
	};
};

export class TradingStrategyTester {
	constructor(
		private readonly config: BacktestConfig,
		private readonly backtestDataService: BacktestDataService,
		private readonly marketDataService: MarketDataService,
		private readonly alertService: AlertRepository,
		private readonly strategies: Strategy[]
	) {
		this.config = config;
		this.backtestDataService = backtestDataService;
		this.marketDataService = marketDataService;
		this.alertService = alertService;
		this.strategies = strategies;
	}
	private progressBar = new cliProgress.SingleBar(
		{},
		cliProgress.Presets.shades_classic
	);

	private showConfig() {
		console.log(`	
			=================================================================
			Running backtest and forwardtest for ${(
				(this.config.forwardTestEnd - this.config.backtestStart) /
				Interval["1d"]
			).toFixed(1)} days
			Interval: ${Interval[this.config.interval]}, ${
			1 +
			(this.config.forwardTestEnd - this.config.backtestStart) /
				this.config.interval
		} candles
			Backtest: ${(
				(this.config.backtestEnd - this.config.backtestStart) /
				Interval["1d"]
			).toFixed(1)} days, from ${
			getDate(this.config.backtestStart).dateString
		} to ${getDate(this.config.backtestEnd).dateString}
			ForwardTest: ${(
				(this.config.forwardTestEnd - this.config.backtestEnd) /
				Interval["1d"]
			).toFixed(1)} days, from ${
			getDate(this.config.backtestEnd).dateString
		} to ${getDate(this.config.forwardTestEnd).dateString}

			StopLoss array: ${this.config.slArray.map((x) => formatPercent(x)).join(", ")}
			TakeProfit array: ${this.config.tpArray.map((x) => formatPercent(x)).join(", ")}
			MaxTradeLength array: ${this.config.maxTradeLengthArray.join(", ")}
			
			Steps: 
				OverrideHistoricalRecords: ${
					this.config.steps.overrideHistoricalRecords ? "TRUE" : "FALSE"
				}
				OverrideAlerts: ${this.config.steps.overrideAlerts ? "TRUE" : "FALSE"}
			=================================================================
						
		
			`);
	}

	async backtest() {
		if (
			this.config.backtestStart >= this.config.backtestEnd ||
			this.config.backtestEnd >= this.config.forwardTestEnd
		) {
			throw new Error(
				"Backtest startTime should be < endTime should be < forwardEnd"
			);
		}

		this.showConfig();

		console.log(getDate().dateString);

		if (this.config.steps.overrideHistoricalRecords) {
			await this.saveHistoricalRecords();
		} else {
			this.backtestDataService.showSavedCandlestick();
		}

		console.log(getDate().dateString);

		const alerts = this.config.steps.overrideAlerts
			? this.saveAlerts({
					start: this.config.backtestStart,
					end: this.config.forwardTestEnd,
					lookBackLength: this.config.lookBackLength,
					maxTradeLength: Math.max(...this.config.maxTradeLengthArray),
					interval: this.config.interval,
			  })
			: await this.alertService.getAlerts({
					start: this.config.backtestStart,
					end: this.config.forwardTestEnd,
			  });

		console.log(getDate().dateString);

		this.backtestDataService.deleteStatsRows();

		for (const sl of this.config.slArray) {
			for (const tp of this.config.tpArray) {
				for (const maxTradeLength of this.config.maxTradeLengthArray) {
					const positions = this.processPositions({
						alerts,
						sl,
						tp,
						maxTradeLength,
					});

					const stats = this.processStats({
						positions,
						tp,
						sl,
						maxTradeLength,
						backtestEnd: this.config.backtestEnd,
					});
					this.backtestDataService.saveStats(stats);
				}
			}
		}

		this.backtestDataService.showSavedStats();
	}

	public async saveHistoricalRecords(): Promise<void> {
		console.log("Saving historical records...");
		this.backtestDataService.deleteCandlestickRows();

		const pairList = await this.marketDataService.getPairList({
			minAmountToTradeUSDT: this.config.minAmountToTradeUSDT,
		});
		console.log("Available trading pairs:", pairList.length);

		this.progressBar.start(pairList.length, 0);
		for (let pairIndex = 0; pairIndex < pairList.length; pairIndex++) {
			const pair = pairList[pairIndex];

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
			this.progressBar.update(pairIndex + 1);
		}
		this.progressBar.stop();

		this.backtestDataService.showSavedCandlestick();
	}

	private saveAlerts({
		start,
		end,
		lookBackLength,
		maxTradeLength,
		interval,
	}: {
		start: number;
		end: number;
		lookBackLength: number;
		maxTradeLength: number;
		interval: Interval;
	}) {
		console.log(`Processing alerts...`);
		this.alertService.deleteAlerts();

		const alerts: Alert[] = [];
		const pairList = this.backtestDataService.getPairList();

		this.progressBar.start(pairList.length, 0);
		for (let pairIndex = 0; pairIndex < pairList.length; pairIndex++) {
			const pair = pairList[pairIndex];
			const candlesticksAllTime = this.backtestDataService.getCandlestick({
				start,
				end,
				pair,
			});

			let startSnap = start;
			let endSnap = start + (lookBackLength + maxTradeLength - 1) * interval;
			let endCandlestick = start + lookBackLength * interval;

			do {
				const candlestick = candlesticksAllTime.filter(
					(c) => c.openTime < endCandlestick && c.openTime >= startSnap
				);

				const profitStick = candlesticksAllTime.filter(
					(c) => c.openTime >= endCandlestick && c.openTime <= endSnap
				);

				for (const strategy of this.strategies) {
					const stgResponse = strategy?.validate({
						candlestick,
						pair,
					});
					if (stgResponse.positionSide) {
						alerts.push({ ...stgResponse, profitStick, start: startSnap });
					}
				}

				startSnap += interval;
				endSnap += interval;
				endCandlestick += interval;
			} while (endSnap < end);
			this.progressBar.update(pairIndex + 1);
		}

		this.alertService.saveAlerts(alerts);
		this.progressBar.stop();
		return alerts;
	}

	private processPositions({
		alerts,
		sl,
		tp,
		maxTradeLength,
	}: {
		alerts: Alert[];
		sl: number;
		tp: number;
		maxTradeLength: number;
	}) {
		const closedPositions: PositionBT[] = [];

		for (const alert of alerts) {
			const { profitStick: maxProfitStick, pair } = alert;
			const profitStick = maxProfitStick.slice(0, maxTradeLength);

			const entryPriceUSDT = profitStick[0].open;

			let pnl = 0;
			let stickIndex = 0;
			let done = false;
			do {
				const candle = profitStick[stickIndex];
				const stopLoss =
					alert.positionSide === "LONG"
						? entryPriceUSDT * (1 - sl)
						: entryPriceUSDT * (1 + sl);
				const takeProfit = tp
					? alert.positionSide === "LONG"
						? entryPriceUSDT * (1 + tp)
						: entryPriceUSDT * (1 - tp)
					: 0;

				if (
					(alert.positionSide === "LONG" &&
						(candle.low <= stopLoss || candle.close <= stopLoss)) ||
					(alert.positionSide === "SHORT" &&
						(candle.high >= stopLoss || candle.close >= stopLoss))
				) {
					pnl = -this.config.riskPt - this.config.feePt;
					done = true;
				}

				if (
					(alert.positionSide === "LONG" &&
						(candle.high >= takeProfit || candle.close >= takeProfit)) ||
					(alert.positionSide === "SHORT" &&
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
					(alert.positionSide === "LONG"
						? lastPrice - profitStick[0].open
						: profitStick[0].open - lastPrice) / profitStick[0].open;

				pnl = this.config.riskPt * (pnlGraph / sl) - this.config.feePt;
			}
			closedPositions.push({
				pair,
				positionSide: alert.positionSide as PositionSide,
				startTime: profitStick[0].openTime,
				entryPriceUSDT: profitStick[0].open,
				pnl,
				tradeLength: stickIndex,
				stgName: alert.stgName,
			});
		}

		return closedPositions;
	}

	public processStats({
		positions,
		tp,
		sl,
		maxTradeLength,
		backtestEnd,
	}: {
		positions: PositionBT[];
		tp: number;
		sl: number;
		maxTradeLength: number;
		backtestEnd: number;
	}) {
		const pairList = new Set<string>(positions.map((p) => p.pair));

		const positionsBacktest = positions.filter(
			(pos) => pos.startTime <= backtestEnd
		);

		let winningPairs: string[] = [];

		for (const pair of pairList) {
			const closedPosForSymbol = positionsBacktest.filter(
				(pos) => pos.pair === pair
			);
			const tradesQty = closedPosForSymbol.length;
			const totalPnl = closedPosForSymbol.reduce((acc, a) => acc + a.pnl, 0);
			const avPnl = totalPnl / tradesQty || 0;

			if (avPnl > 0) {
				winningPairs.push(pair);
			}
		}

		const positionsWP = positionsBacktest.filter((p) => {
			return winningPairs.includes(p.pair);
		});

		const {
			winRate: winRateWP,
			accPnl: accPnlWP,
			avPnl: avPnlWP,
		} = this.getStats(positionsWP);

		const positionsAcc = [];
		let openPosTime = 0;
		for (const position of positionsWP) {
			if (position.startTime > openPosTime) {
				positionsAcc.push(position);
				openPosTime =
					position.startTime + position.tradeLength * this.config.interval;
			}
		}

		const {
			winRate: winRateAcc,
			accPnl: accPnlAcc,
			avPnl: avPnlAcc,
		} = this.getStats(positionsAcc);

		const positionsFwdFullList = positions.filter(
			(p) => winningPairs.includes(p.pair) && p.startTime > backtestEnd
		);
		const positionsFwd = [];
		let openPosFwdTime = 0;
		for (const pos of positionsFwdFullList) {
			if (pos.startTime > openPosFwdTime) {
				positionsFwd.push(pos);
				openPosFwdTime = pos.startTime + pos.tradeLength * this.config.interval;
			}
		}

		const {
			winRate: winRateFwd,
			accPnl: accPnlFwd,
			avPnl: avPnlFwd,
		} = this.getStats(positionsFwd);

		const stats: Stat = {
			sl,
			tp,
			maxTradeLength,
			winningPairs,
			positions,
			positionsWP,
			positionsAcc,
			positionsFwd,

			winRateWP,
			winRateAcc,
			winRateFwd,

			avPnlWP,
			avPnlAcc,
			avPnlFwd,

			accPnlWP,
			accPnlAcc,
			accPnlFwd,
		};

		return stats;
	}

	private getStats(positions: PositionBT[]) {
		const tradesQty = positions.length;
		const winningPositions = positions.filter((p) => p.pnl > 0);
		const lostPositions = positions.filter((p) => p.pnl < 0);
		const winRate =
			winningPositions.length /
			(winningPositions.length + lostPositions.length);
		const accPnl = positions.reduce((acc, p) => acc + p.pnl, 0);
		const avPnl = accPnl / tradesQty || 0;

		return {
			winRate,
			accPnl,
			avPnl,
		};
	}

	public fixCandlestick({
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
		const firstCandle = candlestick[0];
		const fixedCandlestick: Candle[] = [];
		let time = start;
		let prevCandle: Candle = {
			pair: firstCandle.pair,
			openTime: start,
			open: 0,
			close: 0,
			high: 0,
			low: 0,
			volume: 0,
		};
		do {
			const candle = candlestick.find((c) => c.openTime === time);
			if (candle) {
				fixedCandlestick.push(candle);
				prevCandle = candle;
			} else {
				fixedCandlestick.push({
					...prevCandle,
					openTime: time,
				});
			}
			time += interval;
		} while (time <= end);
		return fixedCandlestick;
	}
}
