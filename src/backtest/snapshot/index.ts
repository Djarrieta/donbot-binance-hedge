import { InitialParams } from "../../InitialParams";
import { db } from "../../db";
import type { Candle } from "../../models/Candle";
import { type Position } from "../../models/Position";
import { type Symbol } from "../../models/Symbol";
import { symbolsBT, type StatsSnapBT } from "../../schema";
import { checkForTrades } from "../../services/checkForTrades";
import { chosenStrategies } from "../../strategies";
import { formatPercent } from "../../utils/formatPercent";
import { getDate } from "../../utils/getDate";

export const snapshot = async ({ log }: { log: boolean }) => {
	const symbolsData = await db.select().from(symbolsBT);

	log &&
		console.table({
			sl: formatPercent(InitialParams.defaultSL),
			tp: formatPercent(InitialParams.defaultTP),
			maxTradeLength: InitialParams.maxTradeLength,
		});

	const symbolList: Symbol[] = symbolsData.map((s) => {
		const unformattedCandlestick = JSON.parse(s.candlestickBT as string);

		const candlestick: Candle[] = unformattedCandlestick.map((c: Candle) => {
			return {
				...c,
				openTime: getDate(c.openTime).date,
			};
		});

		return {
			pair: s.pair,
			candlestick,
			currentPrice: 0,
			isReady: false,
			isLoading: false,
			volatility: 0,
			pricePrecision: 0,
			quantityPrecision: 0,
			minQuantityUSD: 0,
			minNotional: 0,
		};
	});

	if (!symbolList.length) {
		throw new Error("No symbols found trying to backtest snapshot");
	}

	let candleIndex = InitialParams.lookBackLength;
	const closedPositions: Position[] = [];

	do {
		const candlestickStartIndex = candleIndex - InitialParams.lookBackLength;
		const candlestickEndIndex = candleIndex;
		const profitStickEndIndex = candleIndex + InitialParams.maxTradeLength;

		const readySymbols = symbolList.map((s) => {
			return {
				...s,
				candlestick: s.candlestick.slice(
					candlestickStartIndex,
					candlestickEndIndex
				),
				profitStick: s.candlestick.slice(
					candlestickEndIndex,
					profitStickEndIndex
				),
			};
		});

		const { tradeArray } = await checkForTrades({
			symbolList: readySymbols,
			strategies: chosenStrategies,
			logs: false,
			interval: InitialParams.interval,
		});

		for (const tradeCommand of tradeArray) {
			const {
				symbol: { pair },
				stgResponse: { positionSide: shouldTrade, sl, tp, stgName },
			} = tradeCommand;
			if (shouldTrade === null) continue;
			const openedSymbol = readySymbols.find((s) => s.pair === pair);
			if (!openedSymbol) continue;
			const profitStick = openedSymbol.profitStick;
			if (!profitStick.length) continue;

			const entryPriceUSDT = profitStick[0].open;

			const stopLoss =
				shouldTrade === "LONG"
					? entryPriceUSDT * (1 - sl)
					: entryPriceUSDT * (1 + sl);
			const takeProfit = tp
				? shouldTrade === "LONG"
					? entryPriceUSDT * (1 + tp)
					: entryPriceUSDT * (1 - tp)
				: 0;

			let pnl = 0;
			let tradeLength = 0;

			const startTime = profitStick[0].openTime;
			const endTime = getDate(
				getDate(startTime).dateMs + tradeLength * InitialParams.interval
			).date;

			for (
				let stickIndex = 0;
				stickIndex <= profitStick.length - 1;
				stickIndex++
			) {
				const candle = profitStick[stickIndex];
				tradeLength++;
				if (
					(shouldTrade === "LONG" &&
						(candle.low <= stopLoss || candle.close <= stopLoss)) ||
					(shouldTrade === "SHORT" &&
						(candle.high >= stopLoss || candle.close >= stopLoss))
				) {
					pnl = -sl - InitialParams.fee;

					closedPositions.push({
						pair: openedSymbol.pair,
						entryPriceUSDT,
						startTime,
						endTime,
						pnl,
						tradeLength,
						stgName,
						positionSide: shouldTrade,
						status: "UNKNOWN",
					});

					break;
				}

				if (
					(shouldTrade === "LONG" &&
						(candle.high >= takeProfit || candle.close >= takeProfit)) ||
					(shouldTrade === "SHORT" &&
						(candle.low <= takeProfit || candle.close <= takeProfit))
				) {
					pnl = tp - InitialParams.fee;

					closedPositions.push({
						pair: openedSymbol.pair,
						entryPriceUSDT,
						startTime,
						endTime,
						pnl,
						tradeLength,
						stgName,
						positionSide: shouldTrade,
						status: "UNKNOWN",
					});

					break;
				}
			}
			if (pnl === 0) {
				const lastPrice = profitStick[profitStick.length - 1].close;
				pnl =
					(shouldTrade === "LONG"
						? lastPrice - entryPriceUSDT
						: entryPriceUSDT - lastPrice) / entryPriceUSDT;
			}

			closedPositions.push({
				pair: openedSymbol.pair,
				entryPriceUSDT,
				startTime,
				endTime,
				pnl,
				tradeLength,
				stgName,
				positionSide: shouldTrade,
				status: "UNKNOWN",
			});
		}
		candleIndex++;
	} while (
		candleIndex <=
		InitialParams.lookBackLengthBacktest + InitialParams.lookBackLength
	);

	const tradesQty = closedPositions.length;
	const winningPositions = closedPositions.filter((p) => p.pnl > 0);
	const winRate = winningPositions.length / tradesQty;
	const accPnl = closedPositions.reduce((acc, p) => acc + p.pnl, 0);
	const avPnl = accPnl / tradesQty || 0;
	const avTradeLength =
		closedPositions.reduce((acc, a) => acc + Number(a.tradeLength), 0) /
			tradesQty || 0;

	let winningPairs: string[] = [];

	for (let symbolIndex = 0; symbolIndex < symbolList.length; symbolIndex++) {
		const { pair } = symbolList[symbolIndex];
		const closedPosForSymbol = closedPositions.filter(
			(pos) => pos.pair === pair
		);
		const tradesQty = closedPosForSymbol.length;
		const totalPnl = closedPosForSymbol.reduce((acc, a) => acc + a.pnl, 0);
		const avPnl = totalPnl / tradesQty || 0;

		if (avPnl > 0) {
			winningPairs.push(pair);
		}
	}

	const stats: StatsSnapBT = {
		maxTradeLength: InitialParams.maxTradeLength,
		sl: InitialParams.defaultSL,
		tp: InitialParams.defaultTP,
		avPnl,
		avTradeLength,
		winRate,
		accPnl,
		tradesQty,
		winningPairs: JSON.stringify(winningPairs),
		closedPositions: JSON.stringify(
			closedPositions.map((p) => {
				return {
					...p,
					startTime: getDate(p.startTime).dateString,
					endTime: p.endTime ? getDate(p.endTime).dateString : null,
				};
			})
		),
	};

	return stats;
};
