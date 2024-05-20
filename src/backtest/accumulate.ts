import cliProgress from "cli-progress";
import { InitialParams } from "../InitialParams";
import { db } from "../db";
import type { Position } from "../models/Position";
import type { Symbol } from "../models/Symbol";
import { symbols, type Candle } from "../schema";
import { checkForTrades } from "../services/checkForTrades";
import { getPairList } from "../services/getPairList";
import { chosenStrategies } from "../strategies";
import { formatPercent } from "../utils/formatPercent";
import { getDate } from "../utils/getDate";
import { saveBacktestData } from "./services/saveBacktestData";

type AccumulateProps = {
	updateData?: boolean;
	log?: boolean;
};
export const accumulate = async ({
	updateData = false,
	log = false,
}: AccumulateProps) => {
	if (updateData) {
		const pairList = await getPairList();
		await saveBacktestData({ pairList });
	}

	const symbolList: Symbol[] = (await db.select().from(symbols)).map((s) => {
		const unformattedCandlestick = JSON.parse(s.candlestick as string);

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

	const endTime = getDate(
		symbolList[0].candlestick[symbolList[0].candlestick.length - 1].openTime
	).dateMs;

	const startTime = getDate(symbolList[0].candlestick[0].openTime).dateMs;

	log &&
		console.table({
			stgName: chosenStrategies.map((s) => s.stgName).join(", "),
			startTime: getDate(startTime).dateString,
			endTime: getDate(endTime).dateString,
			interval: InitialParams.interval / 1000 / 60 + "m",
			maxTradeLength: InitialParams.maxTradeLength,
			fee: formatPercent(InitialParams.fee),
		});

	const progressBar = new cliProgress.SingleBar(
		{},
		cliProgress.Presets.shades_classic
	);
	log && progressBar.start(InitialParams.lookBackLengthBacktest, 0);

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
				openPosition.len++;
				accPnl += openPosition.pnl;
				if (accPnl > maxAccPnl) maxAccPnl = accPnl;
				if (accPnl < minAccPnl) minAccPnl = accPnl;
				if (maxAccPnl - accPnl > maxDrawdown) maxDrawdown = maxAccPnl - accPnl;
				closedPositions.push({ ...openPosition, endTime: lastCandle.openTime });
				candleIndex++;
				log &&
					console.log(
						formatPercent(
							(candleIndex + 1) /
								(InitialParams.lookBackLengthBacktest +
									InitialParams.lookBackLength)
						) +
							" " +
							`${openPosition.pair} ${
								getDate(openPosition.startTime).dateString
							} ${openPosition.pnl > 0 ? "WON " : "LOST"} ${
								openPosition.positionSide === "LONG" ? "LONG " : "SHORT"
							} E:${openPosition.entryPriceUSDT.toFixed(
								3
							)} SL:${stopLoss.toFixed(3)}-TP:${takeProfit.toFixed(
								3
							)}-PNL:${formatPercent(openPosition.pnl)}-ACC:${formatPercent(
								accPnl
							)}`
					);

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

				openPosition.len++;
				accPnl += openPosition.pnl;
				if (accPnl > maxAccPnl) maxAccPnl = accPnl;
				if (accPnl < minAccPnl) minAccPnl = accPnl;
				if (maxAccPnl - accPnl > maxDrawdown) maxDrawdown = maxAccPnl - accPnl;
				closedPositions.push({ ...openPosition, endTime: lastCandle.openTime });

				candleIndex++;

				log &&
					console.log(
						formatPercent(
							(candleIndex + 1) /
								(InitialParams.lookBackLengthBacktest +
									InitialParams.lookBackLength)
						) +
							" " +
							`${openPosition.pair} ${
								getDate(openPosition.startTime).dateString
							} ${openPosition.pnl > 0 ? "WON " : "LOST"} ${
								openPosition.positionSide === "LONG" ? "LONG " : "SHORT"
							} E:${openPosition.entryPriceUSDT.toFixed(
								3
							)} SL:${stopLoss.toFixed(3)}-TP:${takeProfit.toFixed(
								3
							)}-PNL:${formatPercent(openPosition.pnl)}-ACC:${formatPercent(
								accPnl
							)}`
					);
				openPosition = null;

				continue;
			}
			if (openPosition.len + 1 >= InitialParams.maxTradeLength) {
				const pnlWithoutFee =
					openPosition.positionSide === "LONG"
						? (lastCandle.close - openPosition.entryPriceUSDT) /
						  openPosition.entryPriceUSDT
						: (openPosition.entryPriceUSDT - lastCandle.close) /
						  openPosition.entryPriceUSDT;

				openPosition.pnl = pnlWithoutFee - InitialParams.fee;

				openPosition.len++;
				accPnl += openPosition.pnl;
				if (accPnl > maxAccPnl) maxAccPnl = accPnl;
				if (accPnl < minAccPnl) minAccPnl = accPnl;
				if (maxAccPnl - accPnl > maxDrawdown) maxDrawdown = maxAccPnl - accPnl;
				closedPositions.push({ ...openPosition, endTime: lastCandle.openTime });

				candleIndex++;

				log &&
					console.log(
						formatPercent(
							(candleIndex + 1) /
								(InitialParams.lookBackLengthBacktest +
									InitialParams.lookBackLength)
						) +
							" " +
							`${openPosition.pair} ${
								getDate(openPosition.startTime).dateString
							} ${openPosition.pnl > 0 ? "WON " : "LOST"} ${
								openPosition.positionSide === "LONG" ? "LONG " : "SHORT"
							} E:${openPosition.entryPriceUSDT.toFixed(
								3
							)} SL:${stopLoss.toFixed(3)}-TP:${takeProfit.toFixed(
								3
							)}-PNL:${formatPercent(openPosition.pnl)}-ACC:${formatPercent(
								accPnl
							)}`
					);
				openPosition = null;

				continue;
			}
			openPosition.len++;
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
				coinQuantity: "0",
				status: "PROTECTED",
				startTime,
				endTime: null,
				positionSide: tradeArray[0].stgResponse.shouldTrade || "LONG",
				pnl: 0,
				len: 0,
				isHedgeUnbalance: false,
				entryPriceUSDT:
					symbolOpened.candlestick[symbolOpened.candlestick.length - 1].close,
			};

			candleIndex++;
			continue;
		}
		candleIndex++;
		progressBar.update(candleIndex - InitialParams.lookBackLength);
	} while (
		candleIndex <=
		InitialParams.lookBackLengthBacktest + InitialParams.lookBackLength
	);
	log && progressBar.update(InitialParams.lookBackLength);
	log && progressBar.stop();

	const totalPositions = closedPositions.length;
	const winningPositions = closedPositions.filter((p) => p.pnl > 0);
	const winRate = winningPositions.length / totalPositions;

	return {
		maxTradeLength: InitialParams.maxTradeLength,
		sl: InitialParams.defaultSL,
		tp: InitialParams.defaultTP,
		totalPositions,
		maxAccPnl,
		minAccPnl,
		accPnl,
		maxDrawdown,
		winRate,
	};
};

const slArray = [
	1 / 100,
	2 / 100,
	3 / 100,
	4 / 100,
	5 / 100,
	6 / 100,
	7 / 100,
	8 / 100,
	9 / 100,
	10 / 100,
];
const tpArray = [
	1 / 100,
	2 / 100,
	3 / 100,
	4 / 100,
	5 / 100,
	6 / 100,
	7 / 100,
	8 / 100,
	9 / 100,
	10 / 100,
];
const maxTradeLengthArray = [100, 200, 300];
const results = [];
const loopSize = slArray.length * tpArray.length * maxTradeLengthArray.length;
const progressBar = new cliProgress.SingleBar({}, cliProgress.Presets.rect);
progressBar.start(loopSize, 0);
let loop = 1;
for (const maxTradeLength of maxTradeLengthArray) {
	for (const tp of slArray) {
		for (const sl of tpArray) {
			InitialParams.defaultSL = sl;
			InitialParams.defaultTP = tp;
			InitialParams.maxTradeLength = maxTradeLength;
			const result = await accumulate({ updateData: false, log: false });
			results.push(result);
			loop++;
			progressBar.update(loop);
		}
	}
}
progressBar.update(loopSize);
progressBar.stop();

results
	.sort((a, b) => a.maxDrawdown - b.maxDrawdown)
	.sort((a, b) => b.winRate - a.winRate)
	.sort((a, b) => b.accPnl - a.accPnl);

console.table(
	results.map((r) => ({
		sl: formatPercent(r.sl),
		tp: formatPercent(r.tp),
		maxTradeLength: r.maxTradeLength,
		totalPositions: r.totalPositions,
		maxAccPnl: formatPercent(r.maxAccPnl),
		minAccPnl: formatPercent(r.minAccPnl),
		accPnl: formatPercent(r.accPnl),
		maxDrawdown: formatPercent(r.maxDrawdown),
		winRate: formatPercent(r.winRate),
	}))
);
