import Binance, { FuturesUserTradeResult } from "binance-api-node";
import { User } from "../models/User";
import { getDate } from "../utils/getDate";
import { Interval } from "../models/Interval";

interface GetHistoricalPnlProps {
	user: User;
}
interface HistoricalPnl {
	time: string;
	value: number;
	acc: number;
}

export const getHistoricalPnl = async ({ user }: GetHistoricalPnlProps) => {
	const historicalPnl: HistoricalPnl[] = [];

	const API_LIMIT = 7;
	const authExchange = Binance({
		apiKey: user.key,
		apiSecret: user.secret || "",
	});

	const trades: FuturesUserTradeResult[] = [];
	const daysAgo = Math.ceil(
		(getDate().dateMs - getDate(user.startTime).dateMs) / Interval["1d"]
	);

	let n = daysAgo;
	if (n > 0) {
		do {
			const startTime =
				getDate(new Date().setHours(0, 0, 0)).dateMs - (n - 1) * Interval["1d"];

			const endTime = Math.min(
				getDate().dateMs,
				getDate(new Date().setHours(0, 0, 0)).dateMs -
					(n - API_LIMIT - 1) * Interval["1d"]
			);

			const newTrades = await authExchange.futuresUserTrades({
				startTime,
				endTime,
			});

			trades.push(...newTrades);

			n -= API_LIMIT;
		} while (n > 0);
	}

	let acc = 0;

	for (const trade of trades) {
		const { realizedPnl, commission, time: tradeTime } = trade;
		const pnl = Number(realizedPnl) - Number(commission);
		acc += pnl;

		const existingDayPnl = historicalPnl.find(
			({ time }) => time === getDate(tradeTime).shortDateString
		);

		if (existingDayPnl) {
			existingDayPnl.value += pnl;
			existingDayPnl.acc += pnl;
		} else {
			historicalPnl.push({
				time: getDate(tradeTime).shortDateString,
				value: pnl,
				acc,
			});
		}
	}

	return { historicalPnl };
};
