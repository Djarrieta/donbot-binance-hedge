import cliProgress from "cli-progress";
import { formatPercent } from "../utils/formatPercent";
import { getDate } from "../utils/getDate";
import { monteCarloAnalysis } from "../utils/monteCarloAnalysis";
import type { Alert } from "./Alert";
import type { BreakEventAlert } from "./BreakEvenAlert";
import type { CandleBt as Candle } from "./Candle";
import type { IAlert } from "./IAlert";
import type { IExchange } from "./IExchange";
import type { IHistoryData } from "./IHistoryData";
import { Interval } from "./Interval";
import type { IStatsData } from "./IStatsData";
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
	breakEventAlerts: BreakEventAlert[];
	steps: {
		overrideHistoricalRecords: boolean;
		overrideAlerts: boolean;
	};
};

export class TradingStrategyTester {
	constructor(
		private readonly config: BacktestConfig,
		private readonly exchange: IExchange,
		private readonly statsDataService: IStatsData,
		private readonly historyDataService: IHistoryData,
		private readonly alertService: IAlert,
		private readonly strategies: Strategy[]
	) {
		this.config = config;
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
			this.historyDataService.showSavedCandlestick();
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

		this.statsDataService.deleteRows();

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
					this.statsDataService.save(stats);
				}
			}
		}

		this.statsDataService.showStats();
	}

	public async saveHistoricalRecords(): Promise<void> {
		console.log("Saving historical records...");
		this.historyDataService.deleteRows();

		const pairList = await this.exchange.getPairList({
			minAmountToTradeUSDT: this.config.minAmountToTradeUSDT,
			strategies: this.strategies,
		});
		console.log("Available trading pairs:", pairList.length);

		this.progressBar.start(pairList.length, 0);
		for (let pairIndex = 0; pairIndex < pairList.length; pairIndex++) {
			const pair = pairList[pairIndex];

			const rawCandlesticks = await this.exchange.getCandlestick({
				pair,
				start: this.config.backtestStart,
				end: this.config.forwardTestEnd,
				interval: this.config.interval,
				candlestickAPILimit: this.config.apiLimit,
			});

			const fixedCandlesticks = this.fixCandlestick({
				candlestick: rawCandlesticks,
				start: this.config.backtestStart,
				end: this.config.forwardTestEnd,
				interval: this.config.interval,
			});

			this.historyDataService.saveCandlestick(fixedCandlesticks);
			this.progressBar.update(pairIndex + 1);
		}
		this.progressBar.stop();

		this.historyDataService.showSavedCandlestick();
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
		const pairList = this.historyDataService.getPairList();

		this.progressBar.start(pairList.length, 0);
		for (let pairIndex = 0; pairIndex < pairList.length; pairIndex++) {
			const pair = pairList[pairIndex];
			const candlesticksAllTime = this.historyDataService.getCandlestick({
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

			const stopLoss =
				alert.positionSide === "LONG"
					? entryPriceUSDT * (1 - sl)
					: entryPriceUSDT * (1 + sl);

			const takeProfit = tp
				? alert.positionSide === "LONG"
					? entryPriceUSDT * (1 + tp)
					: entryPriceUSDT * (1 - tp)
				: 0;

			const breakEvens = this.config.breakEventAlerts.map((be) => {
				return {
					...be,
					trigger:
						alert.positionSide === "LONG"
							? entryPriceUSDT * (1 + be.trigger)
							: entryPriceUSDT * (1 - be.trigger),
					break:
						alert.positionSide === "LONG"
							? entryPriceUSDT * (1 + be.break)
							: entryPriceUSDT * (1 - be.break),
				};
			});

			let pnl = 0;
			let stickIndex = 0;
			let secureLength = 0;
			let securePrice = 0;
			indexLoop: do {
				const candle = profitStick[stickIndex];

				if (
					(alert.positionSide === "LONG" &&
						(candle.low <= stopLoss || candle.close <= stopLoss)) ||
					(alert.positionSide === "SHORT" &&
						(candle.high >= stopLoss || candle.close >= stopLoss))
				) {
					pnl = -this.config.riskPt - this.config.feePt;
					stickIndex++;
					break indexLoop;
				}

				if (
					(alert.positionSide === "LONG" &&
						(candle.high >= takeProfit || candle.close >= takeProfit)) ||
					(alert.positionSide === "SHORT" &&
						(candle.low <= takeProfit || candle.close <= takeProfit))
				) {
					pnl = this.config.riskPt * (tp / sl) - this.config.feePt;
					stickIndex++;
					break indexLoop;
				}

				for (const be of breakEvens) {
					if (
						(alert.positionSide === "LONG" &&
							stickIndex > be.minLength &&
							Math.max(candle.high, candle.close) >= be.trigger &&
							be.break > securePrice) ||
						(alert.positionSide === "SHORT" &&
							stickIndex > be.minLength &&
							Math.min(candle.low, candle.close) <= be.trigger &&
							be.break < securePrice)
					) {
						securePrice = be.break;
						secureLength = stickIndex;
					}
				}

				if (securePrice) {
					if (
						(alert.positionSide === "LONG" &&
							Math.min(candle.low, candle.close) <= Number(securePrice)) ||
						(alert.positionSide === "SHORT" &&
							Math.max(candle.high, candle.close) >= Number(securePrice))
					) {
						const pnlGraph =
							(alert.positionSide === "LONG"
								? securePrice - entryPriceUSDT
								: entryPriceUSDT - securePrice) / entryPriceUSDT;
						pnl = this.config.riskPt * (pnlGraph / sl) - this.config.feePt;
						secureLength = stickIndex;
						break indexLoop;
					}
				}

				stickIndex++;
			} while (stickIndex < profitStick.length - 1);

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
				secureLength,
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
		let lastAccClosedTime = 0;
		for (const position of positionsWP) {
			if (position.startTime > lastAccClosedTime) {
				positionsAcc.push(position);
				lastAccClosedTime = position.secureLength
					? position.startTime + position.secureLength * this.config.interval
					: position.startTime + position.tradeLength * this.config.interval;
			}
		}

		const {
			winRate: winRateAcc,
			accPnl: accPnlAcc,
			avPnl: avPnlAcc,
			drawdownMonteCarlo: drawdownMC,
			badRunMonteCarlo: badRunMC,
		} = this.getStats(positionsAcc);

		const positionsFwdFullList = positions.filter(
			(p) => winningPairs.includes(p.pair) && p.startTime > backtestEnd
		);
		const positionsFwd = [];
		let lastFwdClosedTime = 0;
		for (const position of positionsFwdFullList) {
			if (position.startTime > lastFwdClosedTime) {
				positionsFwd.push(position);
				lastFwdClosedTime = position.secureLength
					? position.startTime + position.secureLength * this.config.interval
					: position.startTime + position.tradeLength * this.config.interval;
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

			drawdownMC,
			badRunMC,
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

		const { drawdownMonteCarlo, badRunMonteCarlo } = monteCarloAnalysis({
			values: positions.map((p) => p.pnl),
			confidenceLevel: 0.95,
			amountOfSimulations: 1000,
		});

		return {
			winRate,
			accPnl,
			avPnl,
			drawdownMonteCarlo,
			badRunMonteCarlo,
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
