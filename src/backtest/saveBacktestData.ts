import cliProgress from "cli-progress";
import { params } from "../Params";
import { db } from "../db/db";
import { getCandlestick } from "../symbol/services/getCandlestick";
import { getDate } from "../utils/getDate";
import { symbolsBT } from "../db/schema";
import { getPairList } from "../symbol/services/getPairList";
import { Interval } from "../sharedModels/Interval";
import { withRetry } from "../utils/withRetry";

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
	await withRetry(async () => await db.delete(symbolsBT));

	for (let pairIndex = 0; pairIndex < pairList.length; pairIndex++) {
		const pair = pairList[pairIndex];

		const candlestick = await getCandlestick({
			pair,
			interval: params.interval,
			lookBackLength: params.lookBackLengthBacktest + params.lookBackLength,
			apiLimit: params.candlestickAPILimit,
		});
		const fixedDateCandlestick = candlestick.map((c) => {
			return {
				...c,
				openTime: getDate(c.openTime).dateString,
			};
		});
		if (!fixedDateCandlestick.length) continue;
		await withRetry(
			async () =>
				await db
					.insert(symbolsBT)
					.values({ pair, candlestickBT: JSON.stringify(fixedDateCandlestick) })
		);

		progressBar.update(pairIndex + 1);
	}
	progressBar.stop();

	const results = await db.select().from(symbolsBT);
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
