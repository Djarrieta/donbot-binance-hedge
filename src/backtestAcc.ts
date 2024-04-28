import cliProgress from "cli-progress";
import { Context } from "./models/Context";
import { Interval } from "./models/Interval";
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
	const completeSymbolList = await getCompletePairList(false);
	console.log("Getting symbol candlesticks...");
	Context.lookBackLengthBacktest = (30 * Interval["1d"]) / Interval["5m"];

	const progressBar = new cliProgress.SingleBar(
		{},
		cliProgress.Presets.shades_classic
	);
	progressBar.start(completeSymbolList.length, 0);
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
		progressBar.update(symbolIndex + 1);
	}
	progressBar.stop();

	const slArray = [10 / 100, 9 / 100, 8 / 100];
	const tpArray = [1 / 100, 2 / 100, 3 / 100];
	const maxTradeLengthArray = [50, 100, 150, 200, 250, 300, 350];

	const startTime =
		getDate().dateMs - Context.lookBackLengthBacktest * Context.interval;

	console.table({
		stgName: strategies.map((s) => s.stgName).join(", "),
		startTime: getDate(startTime).dateString,
		endTime: getDate().dateString,
		lookBack: Context.lookBackLengthBacktest,
		interval: Context.interval,
		maxTradeLength: Context.maxTradeLength,
		fee: formatPercent(Context.fee),
	});

	const result = [];
	const totalProgressBar =
		maxTradeLengthArray.length *
		slArray.length *
		tpArray.length *
		(Context.lookBackLengthBacktest - Context.lookBackLength);
	let progressBarCounter = 0;
	progressBar.start(totalProgressBar, 0);
	for (const maxTradeLength of maxTradeLengthArray) {
		for (const tp of slArray) {
			for (const sl of tpArray) {
				Context.defaultTP = tp;
				Context.defaultSL = sl;
				Context.maxTradeLength = maxTradeLength;

				let openPosition: Position | null = null;
				const closedPositions: Position[] = [];

				let candleIndex = 0;
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
									candleIndex,
									candleIndex + Context.lookBackLength
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
										)}-PNL:${formatPercent(
											openPosition.pnl
										)}-ACC:${formatPercent(accPnl)}`
								);

							closedPositions.push(openPosition);
							openPosition = null;
							candleIndex++;

							continue;
						}

						if (
							(openPosition.positionSide === "LONG" &&
								(lastCandle.high >= takeProfit ||
									lastCandle.close >= takeProfit)) ||
							(openPosition.positionSide === "SHORT" &&
								(lastCandle.low <= takeProfit ||
									lastCandle.close <= takeProfit))
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
										)}-PNL:${formatPercent(
											openPosition.pnl
										)}-ACC:${formatPercent(accPnl)}`
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
										)}-PNL:${formatPercent(
											openPosition.pnl
										)}-ACC:${formatPercent(accPnl)}`
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
					progressBarCounter++;
					progressBar.update(progressBarCounter);
				} while (
					candleIndex <
					Context.lookBackLengthBacktest - Context.lookBackLength
				);
				const totalPositions = closedPositions.length;
				const winningPositions = closedPositions.filter((p) => p.pnl > 0);
				const winRate = winningPositions.length / totalPositions;

				result.push({
					maxTradeLength: Context.maxTradeLength,
					sl: Context.defaultSL,
					tp: Context.defaultTP,
					totalPositions,
					maxAccPnl,
					minAccPnl,
					accPnl,
					winRate,
				});
			}
		}
	}
	progressBar.update(1);
	progressBar.stop();

	result
		.sort((a, b) => b.maxAccPnl - a.maxAccPnl)
		.sort((a, b) => b.minAccPnl - a.minAccPnl)
		.sort((a, b) => b.accPnl - a.accPnl);

	console.table(
		result.map((r) => ({
			maxTradeLengthArray: r.maxTradeLength,
			sl: formatPercent(r.sl),
			tp: formatPercent(r.tp),
			totalPositions: r.totalPositions,
			maxAccPnl: formatPercent(r.maxAccPnl),
			minAccPnl: formatPercent(r.minAccPnl),
			accPnl: formatPercent(r.accPnl),
			winRate: formatPercent(r.winRate),
		}))
	);
};

await backtestAcc({
	strategies: chosenStrategies,
	log: false,
});

// ┌────┬─────────────────────┬───────┬────────┬────────────────┬───────────┬───────────┬──────────┬─────────┐
// │    │ maxTradeLengthArray │ sl    │ tp     │ totalPositions │ maxAccPnl │ minAccPnl │ accPnl   │ winRate │
// ├────┼─────────────────────┼───────┼────────┼────────────────┼───────────┼───────────┼──────────┼─────────┤
// │  0 │ 50                  │ 1.00% │ 10.00% │ 982            │ 4785.30%  │ 0.00%     │ 4776.90% │ 53.77%  │
// │  1 │ 100                 │ 1.00% │ 10.00% │ 982            │ 4785.30%  │ 0.00%     │ 4776.90% │ 53.77%  │
// │  2 │ 150                 │ 1.00% │ 10.00% │ 982            │ 4785.30%  │ 0.00%     │ 4776.90% │ 53.77%  │
// │  3 │ 200                 │ 1.00% │ 10.00% │ 982            │ 4785.30%  │ 0.00%     │ 4776.90% │ 53.77%  │
// │  4 │ 250                 │ 1.00% │ 10.00% │ 982            │ 4785.30%  │ 0.00%     │ 4776.90% │ 53.77%  │
// │  5 │ 300                 │ 1.00% │ 10.00% │ 982            │ 4785.30%  │ 0.00%     │ 4776.90% │ 53.77%  │
// │  6 │ 350                 │ 1.00% │ 10.00% │ 982            │ 4785.30%  │ 0.00%     │ 4776.90% │ 53.77%  │
// │  7 │ 50                  │ 2.00% │ 10.00% │ 982            │ 4339.30%  │ 0.00%     │ 4322.90% │ 53.77%  │
// │  8 │ 100                 │ 2.00% │ 10.00% │ 982            │ 4339.30%  │ 0.00%     │ 4322.90% │ 53.77%  │
// │  9 │ 150                 │ 2.00% │ 10.00% │ 982            │ 4339.30%  │ 0.00%     │ 4322.90% │ 53.77%  │
// │ 10 │ 200                 │ 2.00% │ 10.00% │ 982            │ 4339.30%  │ 0.00%     │ 4322.90% │ 53.77%  │
