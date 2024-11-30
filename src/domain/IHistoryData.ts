import type { CandleBt } from "./Candle";

export type IHistoryData = {
	saveCandlestick: (candlesticks: CandleBt[]) => void;
	getPairList: () => string[];
	getCandlestick: (props: GetCandlestickHistoryDataProps) => CandleBt[];
	showSavedCandlestick: () => void;
	deleteRows: () => void;
};

export type GetCandlestickHistoryDataProps = {
	start: number;
	end: number;
	pair?: string;
};
