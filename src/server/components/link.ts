import type { TimeFrame } from "../stats";

type LinkProps = {
	sl: number;
	tpSlRatio: number;
	maxTradeLength: number;
	timeFrame: TimeFrame;
	pair: string;
};

export const Link = ({
	sl,
	tpSlRatio,
	maxTradeLength,
	timeFrame,
	pair,
}: LinkProps) =>
	`http://localhost:3000/stats?sl=${sl}&tpSlRatio=${tpSlRatio}&maxTradeLength=${maxTradeLength}&timeFrame=${timeFrame}&pair=${pair}`;
