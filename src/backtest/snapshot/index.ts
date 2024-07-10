import { params } from "../../Params";
import type { Candle } from "../../sharedModels/Candle";
import { type Position } from "../../sharedModels/Position";
import { type Symbol } from "../../symbol/Symbol";
import { chosenStrategies } from "../../strategies";
import { formatPercent } from "../../utils/formatPercent";
import { getDate } from "../../utils/getDate";
import { Context } from "../../Context";
import { getSymbolsBTService } from "../services";
import type { StatSnapBT } from "../StatSnapBT";

export const snapshot = async ({ log }: { log: boolean }) => {
	const symbolsData = getSymbolsBTService();

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
		throw new Error("No symbols found trying to backtest snapshot");
	}

	let candleIndex = params.lookBackLength;
	const closedPositions: Position[] = [];

	do {
		const candlestickStartIndex = candleIndex - params.lookBackLength;
		const candlestickEndIndex = candleIndex;
		const profitStickEndIndex = candleIndex + params.maxTradeLength;

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
		tradeLoop: for (const tradeCommand of trades) {
			const { positionSide: shouldTrade, sl, tp, stgName, pair } = tradeCommand;
			const openedSymbol = readySymbols.find((s) => s.pair === pair);

			if (
				shouldTrade === null ||
				!openedSymbol ||
				!openedSymbol.profitStick.length
			) {
				continue tradeLoop;
			}

			const entryPriceUSDT = openedSymbol.profitStick[0].open;

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

			const startTime = openedSymbol.profitStick[0].openTime;
			const endTime = getDate(
				getDate(startTime).dateMs + tradeLength * params.interval
			).date;

			for (
				let stickIndex = 0;
				stickIndex <= openedSymbol.profitStick.length - 1;
				stickIndex++
			) {
				const candle = openedSymbol.profitStick[stickIndex];
				tradeLength++;
				if (
					(shouldTrade === "LONG" &&
						(candle.low <= stopLoss || candle.close <= stopLoss)) ||
					(shouldTrade === "SHORT" &&
						(candle.high >= stopLoss || candle.close >= stopLoss))
				) {
					pnl = params.amountToTradePt * (-sl - params.fee);

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

					continue tradeLoop;
				}

				if (
					(shouldTrade === "LONG" &&
						(candle.high >= takeProfit || candle.close >= takeProfit)) ||
					(shouldTrade === "SHORT" &&
						(candle.low <= takeProfit || candle.close <= takeProfit))
				) {
					pnl = params.amountToTradePt * (tp - params.fee);

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

					continue tradeLoop;
				}
			}
			if (pnl === 0) {
				const lastPrice =
					openedSymbol.profitStick[openedSymbol.profitStick.length - 1].close;
				pnl =
					(params.amountToTradePt *
						(shouldTrade === "LONG"
							? lastPrice - entryPriceUSDT
							: entryPriceUSDT - lastPrice)) /
					entryPriceUSDT;
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
		params.lookBackLengthBacktest + params.lookBackLength
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

	const stats: StatSnapBT = {
		maxTradeLength: params.maxTradeLength,
		sl: params.defaultSL,
		tp: params.defaultTP,
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
