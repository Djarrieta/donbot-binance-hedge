import cron from "node-cron";
import type { User } from "./userLegacy/User";
import type { Symbol } from "./domain/Trade/Symbol";
import type { TradeConfig } from "./domain/Trade/TradeConfig";
import { getDate } from "./utils/getDate";
import { delay } from "./utils/delay";
import { Interval } from "./domain/Interval";
import type { PositionSide } from "./domain/Position";
import type { Alert } from "./domain/Alert";
import type { Strategy, StrategyResponse } from "./domain/Strategy";
import { getVolatility } from "./utils/getVolatility";
import { strategies } from "./config";
import { OrderType } from "./domain/Order";

type Exchange = {
	quitPosition(arg0: {
		user: User;
		symbol: Symbol;
		positionSide: PositionSide;
		coinQuantity: number;
	}): unknown;
	cancelOrders(arg0: { user: User; pair: any }): unknown;
	openPosition(arg0: {
		user: User;
		pair: string;
		positionSide: PositionSide;
		sl: number;
		tp: number;
		stgName: string;
	}): unknown;
	getUsersData(): Promise<unknown>;
	getSymbolsData(): Promise<unknown>;
	subscribeToUserUpdates(arg0: { user: User }): Promise<void>;
	subscribeToSymbolUpdates(arg0: {
		pair: string;
		interval: any;
	}): Promise<void>;
};

class Trade {
	exchange: Exchange;
	symbolList: Symbol[] = [];
	userList: User[] = [];
	strategies: Strategy[];
	config: TradeConfig;

	constructor(exchange: Exchange, config: TradeConfig, strategies: Strategy[]) {
		this.exchange = exchange;
		this.config = config;
		this.strategies = strategies;
	}

	async initialize() {
		this.showConfig();
		const [symbolList, userList] = await Promise.all([
			this.exchange.getSymbolsData() as Promise<Symbol[]>,
			this.exchange.getUsersData() as Promise<User[]>,
		]);

		this.symbolList = symbolList;
		this.userList = userList;

		for (const user of this.userList) {
			this.handleExistingPositions({ userName: user.name });
		}

		this.securePositions();
		this.runSubscribers();
	}

	async loop() {
		await delay(5000);
		console.log(getDate().dateString);

		const { text: alertText, alerts } = this.checkForTrades();

		if (!!alerts.length) {
			console.log(alertText);
			for (const user of this.userList) {
				for (const alert of alerts) {
					if (alert.positionSide) {
						this.handleNewPosition({
							user,
							pair: alert.pair,
							positionSide: alert.positionSide,
							sl: this.config.sl,
							tp: this.config.tp,
							stgName: alert.stgName,
						});
					}
				}
			}
		} else {
			console.log("No trades found");
		}

		await delay(5000);
		await this.exchange.getUsersData();

		for (const user of this.userList) {
			this.handleExistingPositions({ userName: user.name });
		}

		await this.exchange.getUsersData();
		this.securePositions();
		this.runSubscribers();
	}

	private runSubscribers() {
		console.log("Running subscribers");

		// Subscribe to symbol updates
		for (const symbol of this.symbolList) {
			try {
				this.exchange.subscribeToSymbolUpdates({
					pair: symbol.pair,
					interval: this.config.interval,
				});
			} catch (e) {
				console.error(e);
			}
		}

		// Subscribe to user updates
		for (const user of this.userList) {
			try {
				this.exchange.subscribeToUserUpdates({ user });
			} catch (e) {
				console.error(e);
			}
		}
	}

	async handleNewPosition({
		user,
		pair,
		positionSide,
		sl,
		tp,
		stgName,
	}: {
		user: User;
		pair: string;
		positionSide: PositionSide;
		sl: number;
		tp: number;
		stgName: string;
	}) {
		if (user.isAddingPosition) return;

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
			user.isAddingPosition ||
			openPosUniquePairs.includes(pair)
		) {
			return;
		}
		const symbol = this.symbolList.find((s) => s.pair === pair);

		if (!symbol) {
			return;
		}

		await this.exchange.openPosition({
			user,
			pair,
			positionSide,
			sl,
			tp,
			stgName,
		});
	}

	async handleExistingPositions({
		userName,
		alerts,
	}: {
		userName: string;
		alerts?: Alert[];
	}) {
		console.log("Handling existing positions for " + userName);
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
			await this.exchange.cancelOrders({ user, pair });
			this.clearOrders({ userName, pair });
		}

		//Cancel orders for Hedge positions
		const pairWithOpenOrderForHedgePos = this.userList[userIndex].openOrders
			.filter((o) => hedgePosUniquePairs.includes(o.pair))
			.map((o) => o.pair);
		for (const pair of pairWithOpenOrderForHedgePos) {
			await this.exchange.cancelOrders({
				user,
				pair,
			});
			this.clearOrders({ userName, pair });
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
			await this.exchange.quitPosition({
				user,
				symbol: this.symbolList[symbolIndex],
				positionSide,
				coinQuantity,
			});

			this.userList[userIndex].openPositions = this.userList[
				userIndex
			].openPositions.filter((p) => p.pair !== pair);

			this.clearOrders({ userName: user.name, pair });
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

		const openPosIndex = this.userList[userIndex].openPositions.findIndex(
			(p) => p.pair === pair
		);
		if (openPosIndex === -1) return;
		const openPos = this.userList[userIndex].openPositions[openPosIndex];

		await this.exchange.cancelOrders({ user, pair });
		const slPrice =
			openPos.positionSide === "LONG"
				? this.symbolList[symbolIndex].currentPrice * (1 - this.config.sl)
				: this.symbolList[symbolIndex].currentPrice * (1 + this.config.sl);

		const tpPrice =
			openPos.positionSide === "LONG"
				? this.symbolList[symbolIndex].currentPrice * (1 + this.config.tp)
				: this.symbolList[symbolIndex].currentPrice * (1 - this.config.tp);
		console.log(
			"Protecting position for " + userName + " " + pair + " " + positionSide
		);
		try {
			// await protectPositionService({
			// 	symbol: this.symbolList[symbolIndex],
			// 	user: this.userList[userIndex],
			// 	positionSide,
			// 	coinQuantity: Number(openPos.coinQuantity),
			// 	slPrice,
			// 	tpPrice,
			// });

			this.userList[userIndex].openPositions[openPosIndex].status = "PROTECTED";
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

	clearOrders({ userName, pair }: { userName: string; pair: string }) {
		const userIndex = this.userList.findIndex((u) => u.name === userName);
		if (userIndex === -1) return;

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

		for (
			let symbolIndex = 0;
			symbolIndex < this.symbolList.length;
			symbolIndex++
		) {
			const symbol = this.symbolList[symbolIndex];
			this.symbolList[symbolIndex].volatility = getVolatility({
				candlestick: symbol.candlestick,
			});
		}

		const readySymbols = [...this.symbolList]
			.filter((s) => s.isReady)
			.sort((a, b) => Number(b.volatility) - Number(a.volatility));

		if (readySymbols.length) {
			readySymbols.length > 4
				? console.log(
						"Checking for trades in  " +
							readySymbols[0].pair +
							", " +
							readySymbols[1].pair +
							", ...(" +
							(readySymbols.length - 2) +
							" more) "
				  )
				: console.log(
						"Checking for trades in  " +
							readySymbols.map((s) => s.pair).join(", ")
				  );
		}

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

	async securePositions() {
		for (let userIndex = 0; userIndex < this.userList.length; userIndex++) {
			for (
				let posIndex = 0;
				posIndex < this.userList[userIndex].openPositions.length;
				posIndex++
			) {
				const pos = this.userList[userIndex].openPositions[posIndex];

				if (pos.status !== "PROTECTED" && pos.status !== "SECURED") continue;

				const symbol = this.symbolList.find((s) => s.pair === pos.pair);

				if (!symbol || !symbol.currentPrice) continue;
				const breakOrdersSameSymbol = this.userList[
					userIndex
				].openOrders.filter(
					(order) =>
						order.pair === pos.pair && order.orderType === OrderType.BREAK
				);

				const pnlGraph =
					pos.positionSide === "LONG"
						? (symbol.currentPrice - pos.entryPriceUSDT) / pos.entryPriceUSDT
						: (pos.entryPriceUSDT - symbol.currentPrice) / pos.entryPriceUSDT;
				for (
					let alertIndex = 0;
					alertIndex < this.config.breakEventAlerts.length;
					alertIndex++
				) {
					const alert = this.config.breakEventAlerts[alertIndex];
					if (
						pnlGraph > alert.alert &&
						Number(pos.tradeLength) >= alert.len &&
						breakOrdersSameSymbol.length <= alertIndex
					) {
						const bePrice =
							pos.positionSide === "LONG"
								? pos.entryPriceUSDT * (1 + alert.value)
								: pos.entryPriceUSDT * (1 - alert.value);
						console.log(
							"Securing position for " +
								this.userList[userIndex].name +
								" " +
								pos.pair +
								" " +
								pos.positionSide
						);
						try {
							// await securePositionService({
							// 	symbol,
							// 	user: this.userList[userIndex],
							// 	positionSide:
							// 		this.userList[userIndex].openPositions[posIndex].positionSide,
							// 	coinQuantity: Number(
							// 		this.userList[userIndex].openPositions[posIndex].coinQuantity
							// 	),
							// 	bePrice,
							// });

							this.userList[userIndex].openPositions[posIndex].status =
								"SECURED";
							breakOrdersSameSymbol.push({
								pair: pos.pair,
								orderType: OrderType.BREAK,
								price: bePrice,
								coinQuantity: 0,
								orderId: 0,
								clientOrderId: "",
							});
						} catch (e) {
							console.error(e);
						}
					}
				}
			}
		}
	}

	showConfig() {
		throw new Error("Method not implemented.");
	}
}

const exchangeService: Exchange = {
	subscribeToSymbolUpdates: async (arg0) => {},
	subscribeToUserUpdates: async (arg0) => {},
	getUsersData: async () => {},
	getSymbolsData: async () => {},
	quitPosition: async (arg0) => {},
	cancelOrders: async (arg0) => {},
	openPosition: async (arg0) => {},
};

//main.ts

const config: TradeConfig = {
	interval: Interval["1m"],
	lookBackLength: 200,
	sl: 0.02,
	tp: 0.05,
	riskPt: 0.5 / 100,
	feePt: 0.0005,
	maxTradeLength: 100,
	minAmountToTradeUSDT: 6,
	apiLimit: 500,
	maxProtectedPositions: 10,
	maxHedgePositions: 5,
	breakEventAlerts: [],
};

const trade = new Trade(exchangeService, config, strategies);

trade.initialize();

cron.schedule("* * * * *", async () => {
	await trade.loop();
});
