import { backtestConfig } from "./config";
import { getDate } from "./utils/getDate";

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

const suggestedCandleCount = 1000;
const suggestedBacktestEndPercent = 0.75;

const forwardTestEnd = getDate(yesterdayMidNight).dateMs;
const backtestStart =
	forwardTestEnd - (suggestedCandleCount - 1) * backtestConfig.interval;

const backtestEnd =
	backtestStart +
	(forwardTestEnd - backtestStart) * suggestedBacktestEndPercent;

const forwardCandleCount =
	(forwardTestEnd - backtestEnd) / backtestConfig.interval;

const backtestCandleCount =
	(backtestEnd - backtestStart) / backtestConfig.interval;

console.log(
	`
    Backtest start: ${getDate(backtestStart).dateString}
    Backtest end: ${getDate(backtestEnd).dateString}
    Forward test end: ${getDate(forwardTestEnd).dateString}
    
    Backtest candle count: ${backtestCandleCount}
    Forward test candle count: ${forwardCandleCount}
    `
);
