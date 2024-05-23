import { InitialParams } from "../../InitialParams";
import { db } from "../../db";
import type { Candle } from "../../models/Candle";
import { type Position } from "../../models/Position";
import type { Strategy } from "../../models/Strategy";
import { type Symbol } from "../../models/Symbol";
import { symbolsBT, type StatsSnapBT } from "../../schema";
import { chosenStrategies } from "../../strategies";
import { formatPercent } from "../../utils/formatPercent";
import { getDate } from "../../utils/getDate";

export const snapshot = async ({
	strategy,
	log,
}: {
	strategy: Strategy;
	log: boolean;
}) => {
	const symbolsData = await db.select().from(symbolsBT);

	log &&
		console.table({
			stgName: strategy.stgName,
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
	const closedPositions: Position[] = [];

	for (let symbolIndex = 0; symbolIndex < symbolList.length; symbolIndex++) {
		const symbol = symbolList[symbolIndex];
		let candleIndex = 0;
		do {
			const endIndex = candleIndex + InitialParams.lookBackLength;
			const candlestick = symbol.candlestick.slice(candleIndex, endIndex);
			const profitStick = symbol.candlestick.slice(
				endIndex,
				Math.min(
					symbol.candlestick.length,
					endIndex + InitialParams.maxTradeLength
				)
			);
			const {
				positionSide: shouldTrade,
				sl,
				tp,
				stgName,
			} = strategy.validate({
				candlestick,
				pair: symbol.pair,
			});
			if (shouldTrade) {
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

						break;
					}

					if (
						(shouldTrade === "LONG" &&
							(candle.high >= takeProfit || candle.close >= takeProfit)) ||
						(shouldTrade === "SHORT" &&
							(candle.low <= takeProfit || candle.close <= takeProfit))
					) {
						pnl = tp - InitialParams.fee;

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
				const startTime = profitStick[0].openTime;
				const endTime = getDate(
					getDate(startTime).dateMs + tradeLength * InitialParams.interval
				).date;
				closedPositions.push({
					pair: symbol.pair,
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
			candleIndex <
			symbol.candlestick.length + InitialParams.lookBackLength
		);
	}

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
	};

	return stats;
};

// const result = await snapshot({ strategy: chosenStrategies[0], log: true });

// console.table({
// 	sl: formatPercent(Number(result.sl)),
// 	tp: formatPercent(Number(result.tp)),
// 	maxTradeLength: Number(result.maxTradeLength),
// 	tradesQty: Number(result.tradesQty),
// 	accPnl: formatPercent(Number(result.accPnl)),
// 	winRate: formatPercent(Number(result.winRate)),
// 	avPnl: formatPercent(Number(result.avPnl)),
// 	avTradeLength: formatPercent(Number(result.avTradeLength)),
// });

// console.log(result.winningPairs);
