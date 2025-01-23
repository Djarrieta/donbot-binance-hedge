import type { CandleBt } from "./Candle";

export type IHistoryData = {
	saveCandlestick: (candlesticks: CandleBt[]) => void;
	getPairList: () => string[];
	getCandlestick: (props: GetCandlestickHistoryDataProps) => CandleBt[];
	getSavedData: () => DataInfo;
	showSavedData: () => void;
	deleteRows: () => void;
};

export type GetCandlestickHistoryDataProps = {
	start: number;
	end: number;
	pair?: string;
};

export type DataInfo = {
	pairsCount: number;
	startTime: number;
	endTime: number;
	count: number;
};
