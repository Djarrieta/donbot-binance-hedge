import { InitialParams } from "../../InitialParams";
import { db } from "../../db";
import type { Candle } from "../../models/Candle";
import type { Position } from "../../models/Position";
import { type Symbol } from "../../models/Symbol";
import { symbolsBT, type StatsAccBT } from "../../schema";
import { checkForTrades } from "../../services/checkForTrades";
import { chosenStrategies } from "../../strategies";
import { formatPercent } from "../../utils/formatPercent";
import { getDate } from "../../utils/getDate";

export const accumulate = async () => {
	const symbolsData = await db.select().from(symbolsBT);

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
		throw new Error("No symbols found");
	}

	let candleIndex = InitialParams.lookBackLength;
	let openPosition: Position | null = null;
	const closedPositions: Position[] = [];
	let maxAccPnl = 0;
	let minAccPnl = 0;
	let accPnl = 0;
	let maxDrawdown = 0;

	do {
		const candlestickStartIndex = candleIndex - InitialParams.lookBackLength;
		const candlestickEndIndex = candleIndex;

		const readySymbols = symbolList.map((s) => {
			return {
				...s,
				candlestick: s.candlestick.slice(
					candlestickStartIndex,
					candlestickEndIndex
				),
			};
		});

		const { tradeArray } = await checkForTrades({
			symbolList: readySymbols,
			strategies: chosenStrategies,
			logs: false,
			interval: InitialParams.interval,
		});

		if (openPosition !== null) {
			const symbolOpened = readySymbols.find(
				(s) => s.pair === openPosition?.pair
			);

			if (!symbolOpened) continue;
			const lastCandle =
				symbolOpened.candlestick[symbolOpened.candlestick.length - 1];
			if (!lastCandle) continue;

			const stopLoss =
				openPosition.positionSide === "LONG"
					? openPosition.entryPriceUSDT * (1 - InitialParams.defaultSL)
					: openPosition.entryPriceUSDT * (1 + InitialParams.defaultSL);
			const takeProfit =
				openPosition.positionSide === "LONG"
					? openPosition.entryPriceUSDT * (1 + InitialParams.defaultTP)
					: openPosition.entryPriceUSDT * (1 - InitialParams.defaultTP);

			if (
				(openPosition.positionSide === "LONG" &&
					(lastCandle.low <= stopLoss || lastCandle.close <= stopLoss)) ||
				(openPosition.positionSide === "SHORT" &&
					(lastCandle.high >= stopLoss || lastCandle.close >= stopLoss))
			) {
				openPosition.pnl = -InitialParams.defaultSL - InitialParams.fee;
				openPosition.tradeLength = Number(openPosition.tradeLength) + 1;
				accPnl += openPosition.pnl;
				if (accPnl > maxAccPnl) maxAccPnl = accPnl;
				if (accPnl < minAccPnl) minAccPnl = accPnl;
				if (maxAccPnl - accPnl > maxDrawdown) maxDrawdown = maxAccPnl - accPnl;
				closedPositions.push({ ...openPosition, endTime: lastCandle.openTime });
				candleIndex++;

				openPosition = null;

				continue;
			}

			if (
				(openPosition.positionSide === "LONG" &&
					(lastCandle.high >= takeProfit || lastCandle.close >= takeProfit)) ||
				(openPosition.positionSide === "SHORT" &&
					(lastCandle.low <= takeProfit || lastCandle.close <= takeProfit))
			) {
				openPosition.pnl = InitialParams.defaultTP - InitialParams.fee;

				openPosition.tradeLength = Number(openPosition.tradeLength) + 1;

				accPnl += openPosition.pnl;
				if (accPnl > maxAccPnl) maxAccPnl = accPnl;
				if (accPnl < minAccPnl) minAccPnl = accPnl;
				if (maxAccPnl - accPnl > maxDrawdown) maxDrawdown = maxAccPnl - accPnl;
				closedPositions.push({ ...openPosition, endTime: lastCandle.openTime });

				candleIndex++;

				openPosition = null;

				continue;
			}
			if (
				Number(openPosition.tradeLength) + 1 >=
				InitialParams.maxTradeLength
			) {
				const pnlWithoutFee =
					openPosition.positionSide === "LONG"
						? (lastCandle.close - openPosition.entryPriceUSDT) /
						  openPosition.entryPriceUSDT
						: (openPosition.entryPriceUSDT - lastCandle.close) /
						  openPosition.entryPriceUSDT;

				openPosition.pnl = pnlWithoutFee - InitialParams.fee;

				openPosition.tradeLength = Number(openPosition.tradeLength) + 1;

				accPnl += openPosition.pnl;
				if (accPnl > maxAccPnl) maxAccPnl = accPnl;
				if (accPnl < minAccPnl) minAccPnl = accPnl;
				if (maxAccPnl - accPnl > maxDrawdown) maxDrawdown = maxAccPnl - accPnl;
				closedPositions.push({ ...openPosition, endTime: lastCandle.openTime });

				candleIndex++;

				openPosition = null;

				continue;
			}
			openPosition.tradeLength = Number(openPosition.tradeLength) + 1;

			candleIndex++;
			continue;
		}

		if (tradeArray.length && !openPosition) {
			const symbolOpened = readySymbols.find(
				(s) => s.pair === tradeArray[0].symbol.pair
			);
			if (!symbolOpened) continue;
			const startTime =
				symbolOpened.candlestick[symbolOpened.candlestick.length - 1].openTime;
			openPosition = {
				pair: symbolOpened.pair,
				status: "UNKNOWN",
				startTime,
				positionSide: tradeArray[0].stgResponse.positionSide || "LONG",
				pnl: 0,
				isHedgeUnbalance: false,
				entryPriceUSDT:
					symbolOpened.candlestick[symbolOpened.candlestick.length - 1].close,
				stgName: tradeArray[0].stgResponse.stgName,
			};

			candleIndex++;
			continue;
		}
		candleIndex++;
	} while (
		candleIndex <=
		InitialParams.lookBackLengthBacktest + InitialParams.lookBackLength
	);

	const tradesQty = closedPositions.length;
	const winningPositions = closedPositions.filter((p) => p.pnl > 0);
	const winRate = winningPositions.length / tradesQty;

	const avTradeLength =
		closedPositions.reduce((acc, a) => acc + Number(a.tradeLength), 0) /
			tradesQty || 0;
	const stats: StatsAccBT = {
		maxTradeLength: InitialParams.maxTradeLength,
		sl: InitialParams.defaultSL,
		tp: InitialParams.defaultTP,
		tradesQty,
		maxAccPnl,
		minAccPnl,
		accPnl,
		maxDrawdown: -maxDrawdown,
		winRate,
		avPnl: accPnl / tradesQty,
		avTradeLength,
	};

	return stats;
};

// const result = await accumulate();
// console.table({
// 	sl: formatPercent(Number(result.sl)),
// 	tp: formatPercent(Number(result.tp)),
// 	maxTradeLength: Number(result.maxTradeLength),
// 	tradesQty: Number(result.tradesQty),
// 	maxDrawdown: formatPercent(Number(result.maxDrawdown)),
// 	maxAccPnl: formatPercent(Number(result.maxAccPnl)),
// 	minAccPnl: formatPercent(Number(result.minAccPnl)),
// 	accPnl: formatPercent(Number(result.accPnl)),
// 	winRate: formatPercent(Number(result.winRate)),
// 	avPnl: formatPercent(Number(result.avPnl)),
// 	avTradeLength: formatPercent(Number(result.avTradeLength)),
// });
