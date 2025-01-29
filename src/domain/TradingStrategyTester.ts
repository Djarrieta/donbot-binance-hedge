import cliProgress from "cli-progress";
import { formatPercent } from "../utils/formatPercent";
import { getDate } from "../utils/getDate";
import { processStats } from "../utils/processStats";
import { withRetry } from "../utils/withRetry";
import type { Alert } from "./Alert";
import type { CandleBt as Candle } from "./Candle";
import type { ConfigBacktest } from "./ConfigBacktest";
import type { IAlert } from "./IAlert";
import type { IExchange } from "./IExchange";
import type { IHistoryData } from "./IHistoryData";
import { Interval } from "./Interval";
import type { IStatsData } from "./IStatsData";
import type { PositionBT, PositionSide } from "./Position";
import type { Stat } from "./Stat";
import type { Strategy } from "./Strategy";

export class TradingStrategyTester {
	constructor(
		private readonly config: ConfigBacktest,
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
			this.historyDataService.showSavedData();
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

		for (const sl of this.config.maxSlArray) {
			for (const tpSlRatio of this.config.tpSlRatioArray) {
				for (const maxTradeLength of this.config.maxTradeLengthArray) {
					const positions = this.processPositions({
						alerts,
						sl,
						tpSlRatio,
						maxTradeLength,
					});
					const positionsBacktest = positions.filter(
						(p) => p.startTime <= this.config.backtestEnd
					);


					const {
						winningPairs,
					} = processStats({
						positions: positionsBacktest,
						sl,
						tpSlRatio,
						maxTradeLength,
						strategies: this.strategies,
						interval: this.config.interval,
					});

					const positionsWinningPairs = positions.filter((p) =>
						winningPairs.includes(p.pair)
					);


					const {
						winRate,
						avPnl,
						winRateAcc,
						avPnlAcc,
						accPnlAcc,
						accPnl,
						drawdownAcc,
						drawdownMonteCarloAcc,
						badRunAcc,
						badRunMonteCarloAcc,
						avPnlPerDay,
						avPosPerDay
					} = processStats({
						positions: positionsWinningPairs,
						sl,
						tpSlRatio,
						maxTradeLength,
						strategies: this.strategies,
						interval: this.config.interval,
					});

					const positionsFwdWinningPairs = positions.filter((p) =>
						winningPairs.includes(p.pair) &&  p.startTime > this.config.backtestEnd
					);

					const {
						winRateAcc: winRateFwd,
						avPnlAcc: avPnlFwd,
						accPnlAcc: accPnlFwd,
					} = processStats({
						positions: positionsFwdWinningPairs,
						sl,
						tpSlRatio,
						maxTradeLength,
						strategies: this.strategies,
						interval: this.config.interval,
					});
					const stats: Stat = {
						sl,
						tpSlRatio,
						maxTradeLength,
						positions,

						winRate,
						winRateAcc,
						winRateFwd,

						avPnl,
						avPnlAcc,
						avPnlFwd,

						accPnl,
						accPnlAcc,
						accPnlFwd,

						drawdown: drawdownAcc || 0,
						badRun: badRunAcc || 0,

						drawdownMC: drawdownMonteCarloAcc,
						badRunMC: badRunMonteCarloAcc,

						avPnlPerDay,
						avPosPerDay,
					};
					this.statsDataService.save(stats);
				}
			}
		}

		this.statsDataService.showStats();
		console.log(getDate().dateString);
	}

	public async saveHistoricalRecords(): Promise<void> {
		console.log("Saving historical records...");

		const {
			startTime: savedStartTime,
			endTime: savedEndTime,
			pairsCount,
		} = this.historyDataService.getSavedData();
		const savedPairs = pairsCount ? this.historyDataService.getPairList() : [];

		const availablePairs = await this.exchange.getPairList({
			minAmountToTradeUSDT: this.config.minAmountToTradeUSDT,
			strategies: this.strategies,
		});

		const pairList = availablePairs.filter((p) => !savedPairs.includes(p));

		if (
			!savedPairs.length ||
			this.config.backtestStart !== savedStartTime ||
			this.config.forwardTestEnd !== savedEndTime
		) {
			this.historyDataService.deleteRows();
		}

		console.log("Available pairs:", availablePairs.length);

		this.progressBar.start(availablePairs.length, savedPairs.length);
		for (let pairIndex = 0; pairIndex < pairList.length; pairIndex++) {
			const pair = pairList[pairIndex];
			let candlestick: Candle[] = [];
			const rawCandlesticks = await withRetry(
				async () =>
					await this.exchange.getCandlestick({
						pair,
						start:
							savedStartTime > 0 ? savedStartTime : this.config.backtestStart,
						end: savedEndTime > 0 ? savedEndTime : this.config.forwardTestEnd,
						interval: this.config.interval,
						candlestickAPILimit: this.config.apiLimit,
					})
			);

			candlestick = this.fixCandlestick({
				candlestick: rawCandlesticks,
				start: this.config.backtestStart,
				end: this.config.forwardTestEnd,
				interval: this.config.interval,
			});

			this.historyDataService.saveCandlestick(candlestick);

			this.progressBar.update(pairIndex + 1);
		}
		this.progressBar.stop();

		this.historyDataService.showSavedData();
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
		tpSlRatio,
		maxTradeLength,
	}: {
		alerts: Alert[];
		sl: number;
		tpSlRatio: number;
		maxTradeLength: number;
	}) {
		const closedPositions: PositionBT[] = [];

		for (const alert of alerts) {
			const { profitStick: maxProfitStick, pair } = alert;
			const profitStick = maxProfitStick?.slice(0, maxTradeLength) || [];

			const entryPriceUSDT = profitStick[0].open;

			const calcSl =
				alert.sl &&
					Number(alert.sl) > this.config.minSlTp &&
					Number(alert.sl) < sl
					? alert.sl
					: sl;
			let calcTp =
				alert.tp && Number(alert.tp) > calcSl * tpSlRatio
					? alert.tp
					: calcSl * tpSlRatio;

			const stopLoss =
				alert.positionSide === "LONG"
					? entryPriceUSDT * (1 - calcSl)
					: entryPriceUSDT * (1 + calcSl);

			const takeProfit =
				alert.positionSide === "LONG"
					? entryPriceUSDT * (1 + calcTp)
					: entryPriceUSDT * (1 - calcTp);

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
					pnl =
						-this.config.feePt -
						(this.config.minAmountToTradeUSDT * calcSl) /
						this.config.balanceUSDT;

					stickIndex++;
					break indexLoop;
				}

				if (
					(alert.positionSide === "LONG" &&
						(candle.high >= takeProfit || candle.close >= takeProfit)) ||
					(alert.positionSide === "SHORT" &&
						(candle.low <= takeProfit || candle.close <= takeProfit))
				) {
					pnl =
						-this.config.feePt +
						(this.config.minAmountToTradeUSDT * calcTp) /
						this.config.balanceUSDT;

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
						pnl =
							-this.config.feePt +
							(this.config.minAmountToTradeUSDT * pnlGraph) /
							this.config.balanceUSDT;

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

				pnl =
					-this.config.feePt +
					(this.config.minAmountToTradeUSDT * pnlGraph) /
					this.config.balanceUSDT;
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

	private showConfig() {
		console.log(`	
			=================================================================
			Running backtest and forwardtest for ${(
				(this.config.forwardTestEnd - this.config.backtestStart) /
				Interval["1d"]
			).toFixed(1)} days
			Interval: ${Interval[this.config.interval]}, ${1 +
			(this.config.forwardTestEnd - this.config.backtestStart) /
			this.config.interval
			} candles
			Backtest: ${(
				(this.config.backtestEnd - this.config.backtestStart) /
				Interval["1d"]
			).toFixed(1)} days, from ${getDate(this.config.backtestStart).dateString
			} to ${getDate(this.config.backtestEnd).dateString}
			ForwardTest: ${(
				(this.config.forwardTestEnd - this.config.backtestEnd) /
				Interval["1d"]
			).toFixed(1)} days, from ${getDate(this.config.backtestEnd).dateString
			} to ${getDate(this.config.forwardTestEnd).dateString}

			StopLoss array: ${this.config.maxSlArray
				.map((x) => formatPercent(x))
				.join(", ")}
			TP Sl Ratio array: ${this.config.tpSlRatioArray.join(", ")}
			MaxTradeLength array: ${this.config.maxTradeLengthArray.join(", ")}
			
			Steps: 
				OverrideHistoricalRecords: ${this.config.steps.overrideHistoricalRecords ? "TRUE" : "FALSE"
			}
				OverrideAlerts: ${this.config.steps.overrideAlerts ? "TRUE" : "FALSE"}

			Strategies: ${this.strategies.map((s) => s.stgName).join(", ")}
			=================================================================
					
			`);
	}
}
