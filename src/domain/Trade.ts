import cliProgress from "cli-progress";
import { delay } from "../utils/delay";
import { formatPercent } from "../utils/formatPercent";
import { getDate } from "../utils/getDate";
import { getVolatility } from "../utils/getVolatility";
import type { Alert } from "./Alert";
import type { ConfigTrade } from "./ConfigTrade";
import type { IAuthExchange } from "./IAuthExchange";
import type { IExchange, UpdateSymbolProps } from "./IExchange";
import type { ILog } from "./ILog";
import type { LogType } from "./Log";
import { OrderType } from "./Order";
import type { PositionSide } from "./Position";
import type { Strategy, StrategyResponse } from "./Strategy";
import type { Symbol } from "./Symbol";
import type { User } from "./User";
import { promiseWithTimeout } from "../utils/promiseWithTimeout";

export class Trade {
	exchange: IExchange;
	authExchange: IAuthExchange;
	symbolList: Symbol[] = [];
	userList: User[] = [];
	strategies: Strategy[];
	config: ConfigTrade;
	logs: ILog;

	constructor(
		exchange: IExchange,
		authExchange: IAuthExchange,
		config: ConfigTrade,
		strategies: Strategy[],
		logs: ILog
	) {
		this.exchange = exchange;
		this.authExchange = authExchange;
		this.config = config;
		this.strategies = strategies;
		this.logs = logs;
	}

	private progressBar = new cliProgress.SingleBar(
		{},
		cliProgress.Presets.shades_classic
	);
	isLoading: boolean = true;

	async initialize() {
		const [symbolList, userList] = await Promise.all([
			this.exchange.getSymbolsData({
				apiLimit: this.config.apiLimit,
				lookBackLength: this.config.lookBackLength,
				interval: this.config.interval,
				minAmountToTradeUSDT: this.config.minAmountToTradeUSDT,
				candlestickAPILimit: this.config.apiLimit,
				strategies: this.strategies,
			}),
			this.authExchange.getUsersData({
				interval: this.config.interval,
			}),
		]);

		this.symbolList = symbolList;
		this.userList = userList;

		this.showConfig();

		if (this.config.setLeverage) {
			console.log("Checking and setting leverage");
			this.progressBar.start(this.userList.length * this.symbolList.length, 0);
			for (const user of this.userList) {
				for (const symbol of this.symbolList) {
					await this.authExchange.setLeverage({
						user,
						symbol,
						leverage: this.config.leverage,
					});
					this.progressBar.increment();
				}
			}
			this.progressBar.stop();
		}

		for (const user of this.userList) {
			this.handleExistingPositions({ userName: user.name });
		}

		for (const user of this.userList) {
			this.securePositions({ userName: user.name });
		}

		this.runSubscribers();
		this.isLoading = false;
		this.saveLogs({ type: "Init" });
	}

	async updateSymbolsCandlestick() {
		try {
			const pairList = this.symbolList.length
				? this.symbolList.map((s) => s.pair)
				: await this.exchange.getPairList({
					minAmountToTradeUSDT: this.config.minAmountToTradeUSDT,
					strategies: this.strategies,
				});

			const start =
				getDate().dateMs -
				(this.config.lookBackLength + 1) * this.config.interval;
			const end = start + this.config.lookBackLength * this.config.interval;

			const promiseArray = pairList.map((pair) =>
				this.exchange.getCandlestick({
					pair,
					candlestickAPILimit: this.config.apiLimit,
					interval: this.config.interval,
					start,
					end,
				})
			);

			const MAX_PROMISE_TIME = 20000;

			const promiseResponse = await promiseWithTimeout(
				Promise.all(promiseArray),
				MAX_PROMISE_TIME
			);

			const candlesticks = promiseResponse.flat();

			for (
				let symbolIndex = 0;
				symbolIndex < this.symbolList.length;
				symbolIndex++
			) {
				const pair = this.symbolList[symbolIndex].pair;
				this.symbolList[symbolIndex].candlestick = candlesticks.filter(
					(c) => c.pair === pair
				);
				this.symbolList[symbolIndex].currentPrice =
					this.symbolList[symbolIndex].candlestick[
						this.symbolList[symbolIndex].candlestick.length - 1
					].close;
			}
		} catch (error) {
			this.saveLogs({ type: "Error", eventData: error });
		}
	}

	async loop() {
		if (this.isLoading) {
			console.log("Loop time but still initializing");
			return;
		}
		await this.updateSymbolsCandlestick();
		this.showConfig();
		this.checkSymbols();

		const { text: alertText, alerts } = this.checkForTrades();

		if (alerts.length) {
			console.log(alertText);
			this.saveLogs({ type: "Alert", eventData: alerts });
			const symbol = this.symbolList.find((s) => s.pair === alerts[0].pair);
			if (!symbol) {
				console.log("Symbol not found");
				return;
			}
			for (const user of this.userList) {
				for (const alert of alerts) {
					if (alert.positionSide) {
						this.openPosition({
							user,
							symbol,
							alert,
						});
					}
				}
			}
		} else {
			console.log("No trades found");
		}

		await delay(1000);
		this.userList = await this.authExchange.getUsersData({
			interval: this.config.interval,
		});

		for (const user of this.userList) {
			this.handleExistingPositions({ userName: user.name });
		}

		for (const user of this.userList) {
			this.securePositions({ userName: user.name });
		}

		this.runSubscribers();
	}
	handleSymbolUpdate({ pair, price, newCandle }: UpdateSymbolProps) {
		const symbolIndex = this.symbolList.findIndex((s) => s.pair === pair);
		if (symbolIndex === -1) return;
		if (price) {
			this.symbolList[symbolIndex].currentPrice = price;
		}

		if (newCandle) {
			this.symbolList[symbolIndex].candlestick = [
				...this.symbolList[symbolIndex].candlestick.slice(1),
				newCandle,
			];
		}
	}
	private runSubscribers() {
		for (const symbol of this.symbolList) {
			try {
				this.exchange.subscribeToSymbolUpdates({
					pair: symbol.pair,
					interval: this.config.interval,
					updateSymbol: this.handleSymbolUpdate.bind(this),
				});
			} catch (e) {
				console.error(e);
			}
		}

		for (const user of this.userList) {
			try {
				this.authExchange.subscribeToUserUpdates({
					user,
					handleClearOrders: () => {
						this.clearOrders.bind(this);

					},
				});
			} catch (e) {
				console.error(e);
			}
		}
	}

	getTransactionProps({
		user,
		symbol,
		alert,
	}: {
		user: User;
		symbol: Symbol;
		alert: StrategyResponse;
	}) {

		const calcSl =
			alert.sl &&
				Number(alert.sl) > this.config.minSlTp &&
				Number(alert.sl) < this.config.maxSl
				? alert.sl
				: this.config.maxSl;

		//TODO: Delete after check
				console.log({
			calcSl,
			alertSl: alert.sl,
			minSlTp: this.config.minSlTp,
			maxSl: this.config.maxSl,
		}
		)
		let calcTp =
			alert.tp && Number(alert.tp) > calcSl * this.config.tpSlRatio
				? alert.tp
				: calcSl * this.config.tpSlRatio;

		const slPrice =
			alert.positionSide === "LONG"
				? symbol.currentPrice * (1 - calcSl)
				: symbol.currentPrice * (1 + calcSl);

		const tpPrice =
			alert.positionSide === "LONG"
				? symbol.currentPrice * (1 + calcTp)
				: symbol.currentPrice * (1 - calcTp);

		const quantityUSDT = Math.max(
			(user.balanceUSDT * this.config.riskPt) / this.config.maxSl,
			this.config.minAmountToTradeUSDT
		);

		const realPositionRiskUSDT = quantityUSDT * calcSl;
		const realPositionRiskPt = realPositionRiskUSDT / user.balanceUSDT;

		const coinQuantity = Math.max(
			quantityUSDT / symbol.currentPrice,
			quantityUSDT / tpPrice,
			quantityUSDT / slPrice
		);

		return {
			coinQuantity,
			slPrice,
			tpPrice,
			realPositionRiskUSDT,
			realPositionRiskPt,
		};
	}

	async handleExistingPositions({
		userName,
		alerts,
	}: {
		userName: string;
		alerts?: Alert[];
	}) {
		const userIndex = this.userList.findIndex((u) => u.name === userName);
		const user = this.userList[userIndex];
		if (userIndex === -1) return;

		const openOrdersUniquePairs = Array.from(
			new Set(this.userList[userIndex].openOrders.map((x) => x.pair))
		);
		const openPosUniquePairs = Array.from(
			new Set(this.userList[userIndex].openPositions.map((x) => x.pair))
		);
		const hedgePosUniquePairs = Array.from(
			new Set(
				this.userList[userIndex].openPositions
					.filter((p) => p.status === "HEDGED")
					.map((x) => x.pair)
			)
		);

		//Cancel orders when no open positions
		for (const pair of openOrdersUniquePairs) {
			if (openPosUniquePairs.includes(pair)) continue;

			this.clearOrders({ user, pair });
		}

		//Cancel orders for Hedge positions
		const pairWithOpenOrderForHedgePos = this.userList[userIndex].openOrders
			.filter((o) => hedgePosUniquePairs.includes(o.pair))
			.map((o) => o.pair);
		for (const pair of pairWithOpenOrderForHedgePos) {
			this.clearOrders({ user, pair });
		}

		//Protect unprotected positions
		const unprotectedPos = this.userList[userIndex].openPositions.filter(
			(p) => p.status === "UNPROTECTED"
		);
		for (const { pair, positionSide } of unprotectedPos) {
			await this.protectPosition({
				userName,
				pair,
				positionSide,
			});
		}

		//Quit if good Pnl
		for (const pair of hedgePosUniquePairs) {
			const openPosSamePair = this.userList[userIndex].openPositions.filter(
				(p) => p.pair === pair
			);
			const samePairOpenPosPnlPt = openPosSamePair.reduce((acc, pos) => {
				return acc + pos.pnl;
			}, 0);
			const symbol = this.symbolList.find((s) => s.pair === pair);
			if (!symbol) continue;

			if (
				this.userList[userIndex].totalPnlPt + samePairOpenPosPnlPt > 0 ||
				samePairOpenPosPnlPt > 0
			) {
				for (const pos of openPosSamePair) {
					if (!pos.coinQuantity) continue;
					console.log(
						"Quitting good pnl " +
						pos.positionSide +
						" position for" +
						this.userList[userIndex].name +
						" in " +
						symbol.pair
					);
					await this.quitPosition({
						user,
						positionSide: pos.positionSide,
						pair,
						coinQuantity: pos.coinQuantity,
					});
				}
				return;
			}
		}

		// Quit position if it is taking too long
		const positionsTakingTooLong = this.userList[
			userIndex
		].openPositions.filter(
			(p) =>
				(p.status === "PROTECTED" || p.status === "SECURED") &&
				Number(p.tradeLength) >= this.config.maxTradeLength
		);
		for (const {
			positionSide,
			coinQuantity = 0,
			pair,
		} of positionsTakingTooLong) {
			const symbol = this.symbolList.find((s) => s.pair === pair);
			if (!symbol) continue;
			console.log(
				"Quitting " +
				positionSide +
				" position taking too long for" +
				this.userList[userIndex].name +
				" in " +
				symbol.pair
			);
			this.quitPosition({
				user,
				positionSide,
				pair,
				coinQuantity,
			});
		}

		// Quit unbalanced position
		const unbalancedPositions = this.userList[userIndex].openPositions.filter(
			(p) => p.isHedgeUnbalance
		);
		for (const {
			positionSide,
			coinQuantity = 0,
			pair,
		} of unbalancedPositions) {
			const symbol = this.symbolList.find((s) => s.pair === pair);
			if (!symbol) continue;
			console.log(
				"Quitting unbalanced " +
				positionSide +
				" position for" +
				this.userList[userIndex].name +
				" in " +
				symbol.pair
			);
			this.quitPosition({
				user,
				positionSide,
				pair,
				coinQuantity,
			});
		}

		//Quit position if reverting direction
		const securedPositionsReverting = this.userList[
			userIndex
		].openPositions.filter((p) => {
			const tradesSamePairOppositeSide = alerts?.filter(
				(t) =>
					t.pair === p.pair &&
					t.positionSide !== null &&
					t.positionSide !== p.positionSide
			);
			return p.status === "SECURED" && tradesSamePairOppositeSide?.length;
		});
		for (const {
			positionSide,
			coinQuantity = 0,
			pair,
		} of securedPositionsReverting) {
			const symbol = this.symbolList.find((s) => s.pair === pair);
			if (!symbol) continue;
			console.log(
				"Quitting " +
				positionSide +
				" position trending in opposite direction for " +
				this.userList[userIndex].name +
				" in " +
				symbol.pair
			);
			this.quitPosition({
				user,
				positionSide,
				pair,
				coinQuantity,
			});
		}
	}

	async openPosition({
		user,
		symbol,
		alert,
	}: {
		user: User;
		symbol: Symbol;
		alert: StrategyResponse;
	}) {
		if (user.isAddingPosition) return;

		const userIndex = this.userList.findIndex((u) => u.name === user.name);

		if (userIndex === -1) return;
		this.userList[userIndex].isAddingPosition = true;

		const hedgedPosUniquePairs = Array.from(
			new Set(
				user.openPositions
					.filter((p) => p.status === "HEDGED")
					.map((x) => x.pair)
			)
		);

		const openPosUniquePairs = Array.from(
			new Set(user.openPositions.map((x) => x.pair))
		);

		const openPosUnsecuredUniquePairs = Array.from(
			new Set(
				user.openPositions
					.filter((p) => p.status !== "SECURED")
					.map((x) => x.pair)
			)
		);

		const tooManyOpenWithoutHedge =
			!hedgedPosUniquePairs.length &&
			openPosUnsecuredUniquePairs.length >= this.config.maxProtectedPositions;

		const tooManyOpenWithHedge =
			hedgedPosUniquePairs.length &&
			openPosUnsecuredUniquePairs.length - hedgedPosUniquePairs.length >=
			this.config.maxProtectedPositions;

		const tooManyHedge =
			hedgedPosUniquePairs.length >= this.config.maxHedgePositions;

		if (
			tooManyOpenWithoutHedge ||
			tooManyOpenWithHedge ||
			tooManyHedge ||
			openPosUniquePairs.includes(symbol.pair)
		) {
			return;
		}

		if (!alert.positionSide) {
			return;
		}

		const {
			coinQuantity,
			slPrice,
			tpPrice,
			realPositionRiskPt,
			realPositionRiskUSDT,
		} = this.getTransactionProps({
			user,
			symbol,
			alert,
		});

		console.log(
			`Adding position ${alert.positionSide} for ${user.name} in ${symbol.pair
			}, real position risk: ${formatPercent(
				realPositionRiskPt
			)} $${realPositionRiskUSDT.toFixed(2)}`
		);

		await this.authExchange.openPosition({
			user,
			symbol,
			positionSide: alert.positionSide,
			slPrice,
			tpPrice,
			coinQuantity,
		});
		this.userList[userIndex].isAddingPosition = false;
		this.saveLogs({
			type: "OpenPos",
			eventData: {
				userName: user.name, alert, realRisk: {
					percent: realPositionRiskPt,
					usdt: realPositionRiskUSDT
				}
			},
		});
	}
	async quitPosition({
		user,
		pair,
		positionSide,
		coinQuantity,
	}: {
		user: User;
		pair: string;
		positionSide: PositionSide;
		coinQuantity: number;
	}) {
		const symbolIndex = this.symbolList.findIndex((s) => s.pair === pair);
		if (symbolIndex === -1) return;

		const userIndex = this.userList.findIndex((u) => u.name === user.name);
		if (userIndex === -1) return;

		try {
			await this.authExchange.quitPosition({
				user,
				symbol: this.symbolList[symbolIndex],
				positionSide,
				coinQuantity,
			});

			this.userList[userIndex].openPositions = this.userList[
				userIndex
			].openPositions.filter((p) => p.pair !== pair);

			this.clearOrders({ user, pair });
			this.saveLogs({
				type: "ClosePos",
				eventData: { pair, positionSide, userName: user.name },
			});
		} catch (e) {
			console.error(e);
		}
	}

	async protectPosition({
		userName,
		pair,
		positionSide,
	}: {
		userName: string;
		pair: string;
		positionSide: PositionSide;
	}) {
		const userIndex = this.userList.findIndex((u) => u.name === userName);
		if (userIndex === -1) return;
		const user = this.userList[userIndex];

		const symbolIndex = this.symbolList.findIndex((s) => s.pair === pair);
		if (symbolIndex === -1) return;
		const symbol = this.symbolList[symbolIndex];

		const openPosIndex = this.userList[userIndex].openPositions.findIndex(
			(p) => p.pair === pair
		);
		if (openPosIndex === -1) return;
		const openPos = this.userList[userIndex].openPositions[openPosIndex];

		await this.authExchange.cancelOrders({ user, pair });

		console.log(
			"Protecting position for " + userName + " " + pair + " " + positionSide
		);
		const { slPrice, tpPrice } = this.getTransactionProps({
			user,
			symbol,
			alert: openPos,
		});

		try {
			this.authExchange.protectPosition({
				user,
				symbol,
				positionSide,
				coinQuantity: Number(openPos.coinQuantity),
				slPrice,
				tpPrice,
			});

			this.userList[userIndex].openPositions[openPosIndex].status = "PROTECTED";
			this.saveLogs({
				type: "ProtectPos",
				eventData: { pair, positionSide, userName: user.name },
			});
		} catch (e) {
			console.error(e);
			await this.quitPosition({
				user,
				pair,
				positionSide,
				coinQuantity: Number(openPos.coinQuantity),
			});
		}
	}

	async securePositions({ userName }: { userName: string }) {
		const userIndex = this.userList.findIndex((u) => u.name === userName);
		if (userIndex === -1) return;

		const user = this.userList[userIndex];

		for (
			let posIndex = 0;
			posIndex < this.userList[userIndex].openPositions.length;
			posIndex++
		) {
			const pos = this.userList[userIndex].openPositions[posIndex];

			if (pos.status !== "PROTECTED" && pos.status !== "SECURED") continue;

			const symbol = this.symbolList.find((s) => s.pair === pos.pair);

			if (!symbol || !symbol.currentPrice) continue;
			const breakOrdersSameSymbol = this.userList[userIndex].openOrders.filter(
				(order) =>
					order.pair === pos.pair && order.orderType === OrderType.BREAK
			);

			const pnlGraph =
				pos.positionSide === "LONG"
					? (symbol.currentPrice - pos.entryPriceUSDT) / pos.entryPriceUSDT
					: (pos.entryPriceUSDT - symbol.currentPrice) / pos.entryPriceUSDT;
			for (
				let breakevenIndex = 0;
				breakevenIndex < this.config.breakEventAlerts.length;
				breakevenIndex++
			) {
				const breakeven = this.config.breakEventAlerts[breakevenIndex];
				if (
					pnlGraph > breakeven.trigger &&
					Number(pos.tradeLength) >= breakeven.minLength &&
					breakOrdersSameSymbol.length <= breakevenIndex
				) {
					const bePrice =
						pos.positionSide === "LONG"
							? pos.entryPriceUSDT * (1 + breakeven.break)
							: pos.entryPriceUSDT * (1 - breakeven.break);
					console.log(
						"Securing position for " +
						this.userList[userIndex].name +
						" " +
						pos.pair +
						" " +
						pos.positionSide
					);
					try {
						this.authExchange.securePosition({
							user,
							symbol,
							positionSide: pos.positionSide,
							coinQuantity: Number(pos.coinQuantity),
							bePrice,
						});

						this.userList[userIndex].openPositions[posIndex].status = "SECURED";
						breakOrdersSameSymbol.push({
							pair: pos.pair,
							orderType: OrderType.BREAK,
							price: bePrice,
							coinQuantity: 0,
							orderId: 0,
							clientOrderId: "",
						});

						this.saveLogs({
							type: "SecurePos",
							eventData: {
								pair: pos.pair,
								positionSide: pos.positionSide,
								userName: user.name,
							},
						});
					} catch (e) {
						console.error(e);
					}
				}
			}
		}
	}

	async clearOrders({ user, pair }: { user: User; pair?: string }) {
		const userIndex = this.userList.findIndex((u) => u.name === user.name);
		if (userIndex === -1) return;

		if (!pair) {
			this.userList[userIndex].openOrders = [];
			return;
		}

		await this.authExchange.cancelOrders({ user, pair });

		this.userList[userIndex].openOrders = this.userList[
			userIndex
		].openOrders.filter((p) => p.pair !== pair);
		return;
	}
	checkForTrades() {
		const response: {
			text: string;
			alerts: StrategyResponse[];
		} = { text: "", alerts: [] };

		const readySymbols = [...this.symbolList]
			.filter((s) => s.isReady)
			.sort((a, b) => Number(b.volatility) - Number(a.volatility));

		for (const strategy of this.strategies) {
			for (const symbol of readySymbols) {
				const stgResponse = strategy?.validate({
					candlestick: symbol.candlestick,
					pair: symbol.pair,
				});
				if (stgResponse.positionSide) {
					response.alerts.push(stgResponse);
				}
			}
		}

		if (response.alerts.length > 4) {
			response.text =
				"+ Should trade " +
				response.alerts[0].pair +
				", " +
				response.alerts[1].pair +
				", ...(" +
				(response.alerts.length - 2) +
				" more) ";
		}
		if (response.alerts.length && response.alerts.length <= 4) {
			response.text =
				"+ Should trade " +
				response.alerts.map(
					(t) => " " + t.positionSide + " in " + t.pair + " with " + t.stgName
				);
		}

		return response;
	}

	checkSymbols() {
		for (
			let symbolIndex = 0;
			symbolIndex < this.symbolList.length;
			symbolIndex++
		) {
			const symbol = this.symbolList[symbolIndex];

			this.symbolList[symbolIndex].volatility = getVolatility({
				candlestick: symbol.candlestick,
			});

			if (!symbol.candlestick.length) {
				this.symbolList[symbolIndex].isReady = false;
				continue;
			}

			const lastOpenTime =
				symbol.candlestick[symbol.candlestick.length - 1].openTime;
			const lastDiff =
				(getDate().dateMs - getDate(lastOpenTime).dateMs) /
				this.config.interval;

			if (lastDiff > 2) {
				this.symbolList[symbolIndex].isReady = false;
				continue;
			}

			for (let index = 0; index < symbol.candlestick.length - 1; index++) {
				const currentCandle = symbol.candlestick[index];
				const nextCandle = symbol.candlestick[index + 1];

				const candlesDifference =
					(getDate(nextCandle.openTime).dateMs -
						getDate(currentCandle.openTime).dateMs) /
					this.config.interval;

				if (candlesDifference !== 1) {
					this.symbolList[symbolIndex].isReady = false;
					continue;
				}
			}
			this.symbolList[symbolIndex].isReady = true;
		}
	}

	saveLogs({ type, eventData }: { type: LogType; eventData?: any }) {
		this.logs.save({
			type,
			date: getDate().dateMs,
			tradeData: {
				symbolList: this.symbolList,
				userList: this.userList,
				config: this.config,
				strategies: this.strategies,
				isLoading: this.isLoading,
			},
			eventData,
		});
	}

	showConfig() {
		const userText = `${this.userList.map((u) => u.text).join(`\n`)}`;
		const symbolText = `${this.symbolList.filter((s) => s.isReady).length
			} symbols ready of ${this.symbolList.length}.`;

		const strategiesText = `Strategies: ${this.strategies
			.map((s) => s.stgName)
			.join(", ")}`;

		console.log(
			`\n${getDate().dateString}\n${userText}\n${symbolText}\n${strategiesText}`
		);
	}
}
