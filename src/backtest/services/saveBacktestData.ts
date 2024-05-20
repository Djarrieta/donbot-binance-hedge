import cliProgress from "cli-progress";
import { InitialParams } from "../../InitialParams";
import { db } from "../../db";
import { candlesticks, symbols } from "../../schema";
import { getCandlestick } from "../../services/getCandlestick";
import { getDate } from "../../utils/getDate";

type SaveBacktestDataProps = { pairList: string[] };

export const saveBacktestData = async ({ pairList }: SaveBacktestDataProps) => {
	console.log("Saving backtest data...");
	const progressBar = new cliProgress.SingleBar(
		{},
		cliProgress.Presets.shades_classic
	);
	progressBar.start(pairList.length, 0);
	await db.delete(candlesticks);
	await db.delete(symbols);

	for (let pairIndex = 0; pairIndex < pairList.length; pairIndex++) {
		const pair = pairList[pairIndex];

		const candlestick = await getCandlestick({
			pair,
			interval: InitialParams.interval,
			lookBackLength:
				InitialParams.lookBackLengthBacktest + InitialParams.lookBackLength,
			apiLimit: InitialParams.candlestickAPILimit,
		});
		const fixedDateCandlestick = candlestick.map((c) => {
			return {
				...c,
				openTime: getDate(c.openTime).dateString,
			};
		});
		progressBar.update(pairIndex + 1);
		if (!candlestick.length) continue;
		await db
			.insert(symbols)
			.values({ pair, candlestick: JSON.stringify(fixedDateCandlestick) });
	}
	progressBar.stop();
};
