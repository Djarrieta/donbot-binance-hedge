import { Context } from "./models/Context";
import { Interval } from "./models/Interval";
import { Stat } from "./models/Stat";
import { Strategy, StrategyStat } from "./models/Strategy";
import { getCandlestick } from "./services/getCandlestick";
import { getProfitStickAnalysis } from "./services/getProfitStickAnalysis";
import { getCompletePairList } from "./services/getSymbolList";
import { chosenStrategies } from "./strategies";
import { fixPrecision } from "./utils/fixPrecision";
import { formatPercent } from "./utils/formatPercent";
import { getDate } from "./utils/getDate";

export const backtest = async ({
	strategy,
	log,
}: {
	strategy: Strategy;
	log?: boolean;
}) => {
	const startTime =
		getDate().dateMs - Context.lookBackLengthBacktest * strategy.interval;

	const { sl, tp } = strategy.validate({
		candlestick: [
			{ open: 0, close: 0, high: 0, low: 0, openTime: new Date(), volume: 0 },
		],
	});

	log &&
		console.table({
			stgName: strategy.stgName,
			sl: formatPercent(sl),
			tp: formatPercent(Number(tp)),
			startTime: getDate(startTime).dateString,
			endTime: getDate().dateString,
			lookBack: Context.lookBackLengthBacktest,
			interval: Interval[strategy.interval],
			maxTradeLength: Context.maxTradeLength,
			fee: formatPercent(Context.fee),
		});

	const completePairList = await getCompletePairList(false);

	const maxPairLen = [...completePairList].sort(
		(a, b) => b.pair.length - a.pair.length
	)[0].pair.length;

	let stats: Stat[] = [];

	for (
		let symbolIndex = 0;
		symbolIndex < completePairList.length;
		symbolIndex++
	) {
		const { pair } = completePairList[symbolIndex];

		const completeCandlestick = await getCandlestick({
			pair,
			interval: strategy.interval,
			lookBackLength: Context.lookBackLengthBacktest,
		});

		let candleIndex = 0;
		do {
			const endIndex = candleIndex + strategy.lookBackLength;
			const candlestick = completeCandlestick.slice(candleIndex, endIndex);
			const profitStick = completeCandlestick.slice(
				endIndex,
				Math.min(completeCandlestick.length, endIndex + Context.maxTradeLength)
			);

			const { shouldTrade, sl, tp, stgName } = strategy.validate({
				candlestick,
				pair,
			});

			if (shouldTrade) {
				const stat: Stat = getProfitStickAnalysis({
					pair,
					shouldTrade,
					profitStick,
					sl,
					tp,
					fee: Context.fee,
					stgName,
					maxPairLen,
				});

				stats.push(stat);
				log &&
					console.log(
						formatPercent((symbolIndex + 1) / completePairList.length) +
							" " +
							stat.debug
					);
			}

			candleIndex++;
		} while (
			candleIndex <
			completeCandlestick.length + strategy.lookBackLength
		);
	}

	const tradesQty = stats.length;
	const totalPnl = stats.reduce((acc, a) => acc + a.pnl, 0);
	const avPnl = totalPnl / tradesQty || 0;
	const winningPos = stats.filter((stat) => stat.status === "WON").length;
	const avWinRate = winningPos / tradesQty || 0;
	const avTradeLength =
		stats.reduce((acc, a) => acc + a.tradeLength, 0) / tradesQty || 0;

	const result = {
		stgName: strategy.stgName,
		sl: formatPercent(sl),
		tp: formatPercent(Number(tp)),
		startTime: getDate(startTime).dateString,
		endTime: getDate().dateString,
		lookBack: Context.lookBackLengthBacktest,
		interval: Interval[strategy.interval],
		maxTradeLength: Context.maxTradeLength,
		fee: formatPercent(Context.fee),
		avWinRate: formatPercent(avWinRate),
		avPnl,
		totalPnl: formatPercent(totalPnl),
		tradesQty,
		avTradeLength: Number(fixPrecision({ value: avTradeLength, precision: 0 })),
	};

	return result;
};

export const backtestAllAtOne = async () => {
	for (const strategy of chosenStrategies) {
		const startTime = getDate().dateMs;
		if (!strategy) continue;
		if (Context.interval !== strategy.interval) continue;

		const backtestResult = await backtest({ strategy, log: true });
		console.table({
			...backtestResult,
			avPnl: formatPercent(backtestResult.avPnl),
		});
		const endTime = getDate().dateMs;
		console.log(
			((endTime - startTime) / Interval["1m"]).toFixed() + " minutes"
		);
	}
};

export const updateStrategyStat = async () => {
	const context = await Context.getInstance();

	for (const strategy of chosenStrategies) {
		if (Context.interval !== strategy.interval) continue;

		const backtestResult = await backtest({ strategy, log: false });

		context.strategyStats = [
			...context.strategyStats.filter((s) => s.stgName !== strategy.stgName),
			{
				stgName: strategy.stgName,
				status: backtestResult.avPnl >= 0,
				trades: backtestResult.tradesQty,
				avPnl: backtestResult.avPnl,
			},
		];
		let log = getDate().dateString + " Stats updated: ";
		context.strategyStats.forEach((s) => {
			log += `\n ${s.stgName} ${formatPercent(s.avPnl)} ${
				s.status ? "Active" : "Inactive"
			}; ${s.trades} trades`;
		});

		console.log("");
		console.log(log);
	}
};
