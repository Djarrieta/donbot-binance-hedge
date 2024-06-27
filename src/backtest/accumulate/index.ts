import { params } from "../../Params";
import { db } from "../../db/db";
import type { Candle } from "../../sharedModels/Candle";
import type { Position } from "../../sharedModels/Position";
import { type Symbol } from "../../symbol/Symbol";
import { symbolsBT, type StatsAccBT } from "../../db/schema";
import { chosenStrategies } from "../../strategies";
import { formatPercent } from "../../utils/formatPercent";
import { getDate } from "../../utils/getDate";
import { Context } from "../../Context";

export const accumulate = async ({ log }: { log: boolean }) => {
	const symbolsData = await db.select().from(symbolsBT);

	log &&
		console.table({
			sl: formatPercent(params.defaultSL),
			tp: formatPercent(params.defaultTP),
			maxTradeLength: params.maxTradeLength,
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
			isReady: true,
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

	let candleIndex = params.lookBackLength;
	let openPosition: Position | null = null;
	const closedPositions: Position[] = [];
	let maxAccPnl = 0;
	let minAccPnl = 0;
	let accPnl = 0;
	let minDrawdown = 0;

	do {
		const candlestickStartIndex = candleIndex - params.lookBackLength;
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
		const context = await Context.getInstance({
			symbolList: readySymbols,
			userList: [],
			strategies: chosenStrategies,
		});

		if (!context) return;
		context.symbolList = readySymbols;

		const { trades } = context.checkForTrades({
			logs: false,
			checkSymbols: false,
		});

		if (openPosition !== null) {
			const symbolOpened = readySymbols.find(
				(s) => s.pair === openPosition?.pair
			);

			if (!symbolOpened) {
				candleIndex++;
				continue;
			}
			const lastCandle =
				symbolOpened.candlestick[symbolOpened.candlestick.length - 1];
			if (!lastCandle) {
				candleIndex++;
				continue;
			}

			const stopLoss =
				openPosition.positionSide === "LONG"
					? openPosition.entryPriceUSDT * (1 - params.defaultSL)
					: openPosition.entryPriceUSDT * (1 + params.defaultSL);
			const takeProfit =
				openPosition.positionSide === "LONG"
					? openPosition.entryPriceUSDT * (1 + params.defaultTP)
					: openPosition.entryPriceUSDT * (1 - params.defaultTP);

			if (
				(openPosition.positionSide === "LONG" &&
					(lastCandle.low <= stopLoss || lastCandle.close <= stopLoss)) ||
				(openPosition.positionSide === "SHORT" &&
					(lastCandle.high >= stopLoss || lastCandle.close >= stopLoss))
			) {
				openPosition.pnl = -params.defaultSL - params.fee;
				openPosition.tradeLength = Number(openPosition.tradeLength) + 1;
				accPnl += openPosition.pnl;
				if (accPnl > maxAccPnl) maxAccPnl = accPnl;
				if (accPnl < minAccPnl) minAccPnl = accPnl;
				if (maxAccPnl - accPnl > minDrawdown) minDrawdown = maxAccPnl - accPnl;
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
				openPosition.pnl = params.defaultTP - params.fee;

				openPosition.tradeLength = Number(openPosition.tradeLength) + 1;

				accPnl += openPosition.pnl;
				if (accPnl > maxAccPnl) maxAccPnl = accPnl;
				if (accPnl < minAccPnl) minAccPnl = accPnl;
				if (maxAccPnl - accPnl > minDrawdown) minDrawdown = maxAccPnl - accPnl;
				closedPositions.push({ ...openPosition, endTime: lastCandle.openTime });

				candleIndex++;

				openPosition = null;

				continue;
			}
			if (Number(openPosition.tradeLength) + 1 >= params.maxTradeLength) {
				const pnlWithoutFee =
					openPosition.positionSide === "LONG"
						? (lastCandle.close - openPosition.entryPriceUSDT) /
						  openPosition.entryPriceUSDT
						: (openPosition.entryPriceUSDT - lastCandle.close) /
						  openPosition.entryPriceUSDT;

				openPosition.pnl = pnlWithoutFee - params.fee;

				openPosition.tradeLength = Number(openPosition.tradeLength) + 1;

				accPnl += openPosition.pnl;
				if (accPnl > maxAccPnl) maxAccPnl = accPnl;
				if (accPnl < minAccPnl) minAccPnl = accPnl;
				if (maxAccPnl - accPnl > minDrawdown) minDrawdown = maxAccPnl - accPnl;
				closedPositions.push({ ...openPosition, endTime: lastCandle.openTime });
				candleIndex++;
				openPosition = null;
				continue;
			}
			openPosition.tradeLength = Number(openPosition.tradeLength) + 1;
			candleIndex++;
			continue;
		}

		if (trades.length && !openPosition) {
			const symbolOpened = readySymbols.find((s) => s.pair === trades[0].pair);
			if (!symbolOpened) {
				candleIndex++;
				continue;
			}
			const startTime =
				symbolOpened.candlestick[symbolOpened.candlestick.length - 1].openTime;
			openPosition = {
				pair: symbolOpened.pair,
				status: "UNKNOWN",
				startTime,
				positionSide: trades[0].positionSide || "LONG",
				pnl: 0,
				isHedgeUnbalance: false,
				entryPriceUSDT:
					symbolOpened.candlestick[symbolOpened.candlestick.length - 1].close,
				stgName: trades[0].stgName,
				tradeLength: 0,
			};

			candleIndex++;
			continue;
		}
		candleIndex++;
	} while (
		candleIndex <=
		params.lookBackLengthBacktest + params.lookBackLength
	);

	const tradesQty = closedPositions.length;
	const winningPositions = closedPositions.filter((p) => p.pnl > 0);
	const winRate = winningPositions.length / tradesQty;

	const avTradeLength =
		closedPositions.reduce((acc, a) => acc + Number(a.tradeLength), 0) /
			tradesQty || 0;
	const stats: StatsAccBT = {
		maxTradeLength: params.maxTradeLength,
		sl: params.defaultSL,
		tp: params.defaultTP,
		tradesQty,
		maxAccPnl,
		minAccPnl,
		accPnl,
		minDrawdown: -minDrawdown,
		winRate,
		avPnl: accPnl / tradesQty,
		avTradeLength,
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
