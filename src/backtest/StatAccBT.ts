export type StatAccBT = {
	maxTradeLength: number;
	sl: number;
	tp: number;
	tradesQty: number;
	maxAccPnl: number;
	minAccPnl: number;
	accPnl: number;
	drawdown: number;
	drawdownMonteCarlo: number;
	badRunMonteCarlo: number;
	winRate: number;
	avPnl: number;
	avTradeLength: number;
	closedPositions: string;
};
