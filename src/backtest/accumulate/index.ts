import { Context } from "../../Context";
import { params } from "../../Params";
import type { Candle } from "../../sharedModels/Candle";
import type { Position } from "../../sharedModels/Position";
import { chosenStrategies } from "../../strategies";
import { type Symbol } from "../../symbol/Symbol";
import { formatPercent } from "../../utils/formatPercent";
import { getDate } from "../../utils/getDate";
import type { StatAccBT } from "../StatAccBT";
import { getSymbolsBTService } from "../services";
import { monteCarloAnalysis } from "./monteCarloAnalysis";

export const accumulate = async ({
	log,
	startPt = 0,
	endPt = 1,
}: {
	log: boolean;
	startPt?: number;
	endPt?: number;
}) => {
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
		throw new Error("No symbols found trying to backtest accumulate");
	}
	const dataInitialTime = Math.min(
		...symbolList.map((s) => getDate(s.candlestick[0].openTime).dateMs)
	);
	const dataFinalTime = Math.max(
		...symbolList.map(
			(s) => getDate(s.candlestick[s.candlestick.length - 1].openTime).dateMs
		)
	);
	const dataCandlesQty = (dataFinalTime - dataInitialTime) / params.interval;
	const dataStartCandleIndex = Math.floor(dataCandlesQty * startPt);
	const dataEndCandleIndex = Math.floor(dataCandlesQty * endPt);

	let candleIndex = params.lookBackLength + dataStartCandleIndex;
	let openPosition: Position | null = null;
	const closedPositions: Position[] = [];
	let maxAccPnl = 0;
	let minAccPnl = 0;
	let accPnl = 0;
	let drawdown = 0;

	do {
		const candlestickStartIndex = candleIndex - params.lookBackLength;
		const candlestickEndIndex = candleIndex;

		const readySymbols: Symbol[] = [];
		symbolList.forEach((s) => {
			const candlestick = s.candlestick.slice(
				candlestickStartIndex,
				candlestickEndIndex
			);

			if (!Number.isNaN(candlestick[0].open)) {
				readySymbols.push({
					...s,
					candlestick,
				});
			}
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
			const sl = openPosition.sl || params.defaultSL;
			const tp = openPosition.tp || params.defaultTP;

			const stopLoss =
				openPosition.positionSide === "LONG"
					? openPosition.entryPriceUSDT * (1 - sl)
					: openPosition.entryPriceUSDT * (1 + sl);
			const takeProfit =
				openPosition.positionSide === "LONG"
					? openPosition.entryPriceUSDT * (1 + tp)
					: openPosition.entryPriceUSDT * (1 - tp);

			if (
				(openPosition.positionSide === "LONG" &&
					(lastCandle.low <= stopLoss || lastCandle.close <= stopLoss)) ||
				(openPosition.positionSide === "SHORT" &&
					(lastCandle.high >= stopLoss || lastCandle.close >= stopLoss))
			) {
				openPosition.pnl = -params.riskPt - params.fee;
				openPosition.tradeLength = Number(openPosition.tradeLength) + 1;
				accPnl += openPosition.pnl;
				if (accPnl > maxAccPnl) maxAccPnl = accPnl;
				if (accPnl < minAccPnl) minAccPnl = accPnl;
				if (maxAccPnl - accPnl > drawdown) drawdown = maxAccPnl - accPnl;
				closedPositions.push({
					...openPosition,
					endTime: lastCandle.openTime,
					accPnl,
				});
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
				openPosition.pnl = params.riskPt * (tp / sl) - params.fee;

				openPosition.tradeLength = Number(openPosition.tradeLength) + 1;

				accPnl += openPosition.pnl;
				if (accPnl > maxAccPnl) maxAccPnl = accPnl;
				if (accPnl < minAccPnl) minAccPnl = accPnl;
				if (maxAccPnl - accPnl > drawdown) drawdown = maxAccPnl - accPnl;
				closedPositions.push({
					...openPosition,
					endTime: lastCandle.openTime,
					accPnl,
				});

				candleIndex++;

				openPosition = null;

				continue;
			}
			if (Number(openPosition.tradeLength) + 1 >= params.maxTradeLength) {
				const pnlGraph =
					(openPosition.positionSide === "LONG"
						? lastCandle.close - openPosition.entryPriceUSDT
						: openPosition.entryPriceUSDT - lastCandle.close) /
					openPosition.entryPriceUSDT;

				openPosition.pnl =
					params.riskPt * (pnlGraph / params.defaultSL) - params.fee;

				openPosition.tradeLength = Number(openPosition.tradeLength) + 1;

				accPnl += openPosition.pnl;
				if (accPnl > maxAccPnl) maxAccPnl = accPnl;
				if (accPnl < minAccPnl) minAccPnl = accPnl;
				if (maxAccPnl - accPnl > drawdown) drawdown = maxAccPnl - accPnl;
				closedPositions.push({
					...openPosition,
					endTime: lastCandle.openTime,
					accPnl,
				});
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
				sl: trades[0].sl,
				tp: trades[0].tp,
			};

			candleIndex++;
			continue;
		}
		candleIndex++;
	} while (candleIndex <= dataEndCandleIndex);

	const tradesQty = closedPositions.length;
	const winningPositions = closedPositions.filter((p) => p.pnl > 0);
	const winRate = winningPositions.length / tradesQty;

	const avTradeLength =
		closedPositions.reduce((acc, a) => acc + Number(a.tradeLength), 0) /
			tradesQty || 0;

	const { drawdownMonteCarlo, badRunMonteCarlo } = monteCarloAnalysis({
		values: closedPositions.map((p) => p.pnl),
		amountOfSimulations: 1000,
		confidenceLevel: 0.95,
	});

	const stats: StatAccBT = {
		maxTradeLength: params.maxTradeLength,
		sl: params.defaultSL,
		tp: params.defaultTP,
		tradesQty,
		maxAccPnl,
		minAccPnl,
		accPnl,
		drawdown,
		drawdownMonteCarlo,
		badRunMonteCarlo,
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
