import type { Interval } from "../domain/Interval";
import { getDate } from "./getDate";

export const getSuggestedDates = ({
	candleCount,
	interval,
	backtestPercent,
}: {
	candleCount: number;
	interval: Interval;
	backtestPercent: number;
}) => {
	const today = new Date();
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
