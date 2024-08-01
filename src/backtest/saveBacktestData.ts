import cliProgress from "cli-progress";
import { params } from "../Params";
import type { Candle } from "../sharedModels/Candle";
import { Interval } from "../sharedModels/Interval";
import { getCandlestick } from "../symbol/services/getCandlestick";
import { getPairList } from "../symbol/services/getPairList";
import { getDate, type DateString } from "../utils/getDate";
import { withRetry } from "../utils/withRetry";
import {
	deleteTableService,
	getSymbolsBTService,
	insertSymbolBTService,
} from "./services";

type SaveBacktestDataProps = { pairList: string[] };

export const saveBacktestData = async ({ pairList }: SaveBacktestDataProps) => {
	console.log(
		"Saving backtest data for " +
			(
				(params.lookBackLengthBacktest * params.interval) /
				Interval["1d"]
			).toFixed(1) +
			" days"
	);
	const progressBar = new cliProgress.SingleBar(
		{},
		cliProgress.Presets.shades_classic
	);
	progressBar.start(pairList.length, 0);

	const lookBackLength = params.lookBackLengthBacktest + params.lookBackLength;

	const initialTimeDate = getDate(
		getDate().dateMs - lookBackLength * params.interval
	).date;
	initialTimeDate.setSeconds(0);
	const minutes = initialTimeDate.getMinutes();
	const adjustedMinutes =
		Math.floor(minutes / (params.interval / Interval["1m"])) *
		(params.interval / Interval["1m"]);
	initialTimeDate.setMinutes(adjustedMinutes);

	const initialTime = getDate(initialTimeDate).date;

	const finalTime = getDate(
		getDate(initialTimeDate).dateMs + (lookBackLength - 1) * params.interval
	).date;

	type BTCandle = Omit<Candle, "openTime"> & { openTime: DateString };
	deleteTableService("symbolsBT");

	for (let pairIndex = 0; pairIndex < pairList.length; pairIndex++) {
		const pair = pairList[pairIndex];

		const incompleteCandlestick = await getCandlestick({
			pair,
			interval: params.interval,
			lookBackLength,
			apiLimit: params.candlestickAPILimit,
		});
		if (!incompleteCandlestick.length) continue;

		let defaultCandle: BTCandle = {
			open: NaN,
			high: NaN,
			low: NaN,
			close: NaN,
			volume: NaN,
			openTime: getDate(initialTimeDate).dateString,
		};

		let candlestick: BTCandle[] = [];
		let time = initialTime;
		do {
			const candle = incompleteCandlestick.find(
				(c) => getDate(c.openTime).dateString === getDate(time).dateString
			);
			if (candle) {
				const formattedCandle: BTCandle = {
					...candle,
					openTime: getDate(candle.openTime).dateString,
				};
				candlestick.push(formattedCandle);
				defaultCandle = { ...formattedCandle };
			} else {
				defaultCandle.openTime = getDate(time).dateString;
				candlestick.push({ ...defaultCandle });
			}
			time = getDate(getDate(time).dateMs + params.interval).date;
		} while (time <= finalTime);

		if (!candlestick.length) continue;
		withRetry(() =>
			insertSymbolBTService({
				pair,
				candlestickBT: JSON.stringify(candlestick),
			})
		);

		progressBar.update(pairIndex + 1);
	}
	progressBar.stop();

	const results = getSymbolsBTService();
	console.log(
		"Backtest data saved for " +
			results
				.slice(0, 3)
				.map((r) => r.pair)
				.join(", ") +
			" and " +
			(results.length - 3) +
			" other pairs."
	);
};

const pairList = await getPairList();
await saveBacktestData({ pairList });
