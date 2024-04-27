import { Context } from "./models/Context";
import { Position } from "./models/Position";
import { Strategy, StrategyStat } from "./models/Strategy";
import { Symbol } from "./models/Symbol";
import { checkForTrades } from "./services/checkForTrades";
import { getCandlestick } from "./services/getCandlestick";
import { getCompletePairList } from "./services/getSymbolList";
import { chosenStrategies } from "./strategies";
import { formatPercent } from "./utils/formatPercent";
import { getDate } from "./utils/getDate";

export const backtestAcc = async ({
	strategies,
	log,
}: {
	strategies: Strategy[];
	log?: boolean;
}) => {
	const startTime =
		getDate().dateMs - Context.lookBackLengthBacktest * Context.interval;

	log &&
		console.table({
			stgName: strategies.map((s) => s.stgName).join(", "),
			startTime: getDate(startTime).dateString,
			endTime: getDate().dateString,
			lookBack: Context.lookBackLengthBacktest,
			interval: Context.interval,
			maxTradeLength: Context.maxTradeLength,
			fee: formatPercent(Context.fee),
		});

	const completeSymbolList = await getCompletePairList(false);
	console.log("Getting symbol candlesticks...");

	for (
		let symbolIndex = 0;
		symbolIndex < completeSymbolList.length;
		symbolIndex++
	) {
		const symbol = completeSymbolList[symbolIndex];

		const candlestick = await getCandlestick({
			pair: symbol.pair,
			interval: Context.interval,
			lookBackLength: Context.lookBackLengthBacktest + Context.lookBackLength,
			apiLimit: Context.candlestickAPILimit,
		});
		completeSymbolList[symbolIndex].candlestick = candlestick;
		log &&
			console.log(
				formatPercent(symbolIndex / completeSymbolList.length) +
					" " +
					symbol.pair
			);
	}
	let openPosition: Position | null = null;
	const closedPositions: Position[] = [];

	let candleIndex = Context.lookBackLength;
	let maxAccPnl = 0;
	let minAccPnl = 0;
	let accPnl = 0;

	do {
		const readySymbols: Symbol[] = completeSymbolList.map((s) => {
			return {
				...s,
				isReady: true,
				isLoading: false,
				candlestick: [
					...s.candlestick.slice(
						candleIndex - Context.lookBackLength,
						candleIndex
					),
				],
				pricePrecision: 0,
				quantityPrecision: 0,
			};
		});

		const strategyStats: StrategyStat[] = [
			...chosenStrategies.map((s) => {
				return {
					stgName: s.stgName,
					status: true,
					trades: 10,
					avPnl: 1,
					winRate: "100%",
				};
			}),
		];

		const { tradeArray } = await checkForTrades({
			readySymbols,
			interval: Context.interval,
			strategyStats,
			chosenStrategies,
			logs: false,
		});

		if (openPosition !== null) {
			const symbolOpened = readySymbols.find(
				(s) => s.pair === openPosition?.pair
			);

			if (!symbolOpened) continue;
			const lastCandle =
				symbolOpened.candlestick[symbolOpened.candlestick.length - 1];

			const stopLoss =
				openPosition.positionSide === "LONG"
					? openPosition.entryPriceUSDT * (1 - Context.defaultSL)
					: openPosition.entryPriceUSDT * (1 + Context.defaultSL);
			const takeProfit =
				openPosition.positionSide === "LONG"
					? openPosition.entryPriceUSDT * (1 + Context.defaultTP)
					: openPosition.entryPriceUSDT * (1 - Context.defaultTP);

			if (
				(openPosition.positionSide === "LONG" &&
					(lastCandle.low <= stopLoss || lastCandle.close <= stopLoss)) ||
				(openPosition.positionSide === "SHORT" &&
					(lastCandle.high >= stopLoss || lastCandle.close >= stopLoss))
			) {
				openPosition.pnl = -Context.defaultSL - Context.fee;
				openPosition.len++;
				accPnl += openPosition.pnl;
				if (accPnl > maxAccPnl) maxAccPnl = accPnl;
				if (accPnl < minAccPnl) minAccPnl = accPnl;
				log &&
					console.log(
						formatPercent(
							(candleIndex + 1) /
								(Context.lookBackLengthBacktest + Context.lookBackLength)
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

				closedPositions.push(openPosition);
				openPosition = null;
				candleIndex++;

				continue;
			}

			if (
				(openPosition.positionSide === "LONG" &&
					(lastCandle.high >= takeProfit || lastCandle.close >= takeProfit)) ||
				(openPosition.positionSide === "SHORT" &&
					(lastCandle.low <= takeProfit || lastCandle.close <= takeProfit))
			) {
				openPosition.pnl = Context.defaultTP - Context.fee;
				openPosition.len++;
				accPnl += openPosition.pnl;
				if (accPnl > maxAccPnl) maxAccPnl = accPnl;
				if (accPnl < minAccPnl) minAccPnl = accPnl;
				log &&
					console.log(
						formatPercent(
							(candleIndex + 1) /
								(Context.lookBackLengthBacktest + Context.lookBackLength)
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
				closedPositions.push(openPosition);
				openPosition = null;
				candleIndex++;

				continue;
			}
			if (openPosition.len >= Context.maxTradeLength) {
				const pnlWithoutFee =
					openPosition.positionSide === "LONG"
						? (lastCandle.close - openPosition.entryPriceUSDT) /
						  openPosition.entryPriceUSDT
						: (openPosition.entryPriceUSDT - lastCandle.close) /
						  openPosition.entryPriceUSDT;
				openPosition.len++;
				openPosition.pnl = pnlWithoutFee - Context.fee;
				accPnl += openPosition.pnl;
				if (accPnl > maxAccPnl) maxAccPnl = accPnl;
				if (accPnl < minAccPnl) minAccPnl = accPnl;
				log &&
					console.log(
						formatPercent(
							(candleIndex + 1) /
								(Context.lookBackLengthBacktest + Context.lookBackLength)
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
				closedPositions.push(openPosition);
				openPosition = null;
				candleIndex++;

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
			openPosition = {
				pair: symbolOpened.pair,
				coinQuantity: "0",
				status: "PROTECTED",
				startTime:
					symbolOpened.candlestick[symbolOpened.candlestick.length - 1]
						.openTime,
				positionSide: tradeArray[0].stgResponse.shouldTrade || "LONG",
				pnl: 0,
				len: 0,
				isHedgeUnbalance: false,
				entryPriceUSDT: symbolOpened.currentPrice,
			};
			candleIndex++;
			continue;
		}

		candleIndex++;
	} while (
		candleIndex <
		Context.lookBackLengthBacktest + Context.lookBackLength
	);
	const totalPositions = closedPositions.length;
	const winningPositions = closedPositions.filter((p) => p.pnl > 0);
	const winRate = winningPositions.length / totalPositions;

	log &&
		console.table({
			totalPositions,
			maxAccPnl: formatPercent(maxAccPnl),
			minAccPnl: formatPercent(minAccPnl),
			accPnl: formatPercent(accPnl),
			winRate: formatPercent(winRate),
		});
};

await backtestAcc({
	strategies: chosenStrategies,
	log: true,
});
