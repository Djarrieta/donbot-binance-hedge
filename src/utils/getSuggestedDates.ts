import type { Interval } from "../domain/Interval";
import { getDate } from "./getDate";

export const getSuggestedDates = ({
	candleCount,
	interval,
	backtestPercent,
	lastDate,
}: {
	candleCount: number;
	interval: Interval;
	backtestPercent: number;
	lastDate?: number;
}) => {
	const today = lastDate ? new Date(lastDate) : new Date();
	const yesterdayMidNight = new Date(
		today.getFullYear(),
		today.getMonth(),
		today.getDate(),
		0,
		0,
		0,
		0
	);

	const forwardTestEnd = getDate(yesterdayMidNight).dateMs;
	const backtestStart = forwardTestEnd - (candleCount - 1) * interval;

	const backtestEnd =
		backtestStart + (forwardTestEnd - backtestStart) * backtestPercent;

	return {
		backtestStart,
		backtestEnd,
		forwardTestEnd,
	};
};
