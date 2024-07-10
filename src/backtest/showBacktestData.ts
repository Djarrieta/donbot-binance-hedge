import { getSymbolsBTService } from "./services";
import type { Candle } from "../sharedModels/Candle";
import { Interval } from "../sharedModels/Interval";
import { getDate } from "../utils/getDate";

export const showBacktestData = async () => {
	const results = getSymbolsBTService();

	if (!results.length) return console.log("No backtest data found.");
	const startDate = (
		JSON.parse(results[0].candlestickBT as string)[0] as Candle
	).openTime;

	const endDate = (
		JSON.parse(results[results.length - 1].candlestickBT as string)[
			JSON.parse(results[results.length - 1].candlestickBT as string).length - 1
		] as Candle
	).openTime;

	const days = (
		(getDate(endDate).dateMs - getDate(startDate).dateMs) /
		Interval["1d"]
	).toFixed(1);

	console.log(
		"Backtest data available for " +
			results
				.slice(0, 3)
				.map((r) => r.pair)
				.join(", ") +
			" and " +
			(results.length - 3) +
			" other pairs."
	);
	console.log(
		"Data for " +
			days +
			" days from " +
			getDate(startDate).dateString +
			" to " +
			getDate(endDate).dateString
	);
};

await showBacktestData();
