import { Candle } from "../models/Candle";
import { PositionSide } from "../models/Position";
import { formatPercent } from "../utils/formatPercent";
import { getDate } from "../utils/getDate";

interface GetProfitStickAnalysisProps {
	pair: string;
	shouldTrade: PositionSide;
	profitStick: Candle[];
	sl: number;
	tp: number;
	fee: number;
	stgName: string;
}
export interface Stat {
	pair: string;
	debug: string;
	pnl: number;
	status: "WON" | "LOST" | "NEUTRAL";
	tradeLength: number;
}

export const getProfitStickAnalysis = ({
	pair,
	shouldTrade,
	profitStick,
	sl,
	tp,
	fee,
	stgName,
}: GetProfitStickAnalysisProps) => {
	let stat: Stat = {
		pair,
		debug: `${pair} NEUTRAL`,
		pnl: 0,
		status: "NEUTRAL",
		tradeLength: 0,
	};

	if (!profitStick.length) {
		return stat;
	}

	const entryPrice = profitStick[0].open;

	const stopLoss =
		shouldTrade === "LONG" ? entryPrice * (1 - sl) : entryPrice * (1 + sl);
	const takeProfit = tp
		? shouldTrade === "LONG"
			? entryPrice * (1 + tp)
			: entryPrice * (1 - tp)
		: 0;

	let pnl = 0;
	let tradeLength = 0;
	for (let stickIndex = 0; stickIndex <= profitStick.length - 1; stickIndex++) {
		const candle = profitStick[stickIndex];
		tradeLength++;
		if (
			(shouldTrade === "LONG" &&
				(candle.low <= stopLoss || candle.close <= stopLoss)) ||
			(shouldTrade === "SHORT" &&
				(candle.high >= stopLoss || candle.close >= stopLoss))
		) {
			pnl = -sl - fee;

			break;
		}

		if (
			(shouldTrade === "LONG" &&
				(candle.high >= takeProfit || candle.close >= takeProfit)) ||
			(shouldTrade === "SHORT" &&
				(candle.low <= takeProfit || candle.close <= takeProfit))
		) {
			pnl = tp - fee;

			break;
		}
	}
	if (pnl === 0) {
		const lastPrice = profitStick[profitStick.length - 1].close;
		pnl =
			(shouldTrade === "LONG"
				? lastPrice - entryPrice
				: entryPrice - lastPrice) / entryPrice;
	}
	const status = pnl > 0 ? "WON" : "LOST";
	stat = {
		pair,
		pnl,
		tradeLength,
		debug: `${pair} ${
			getDate(profitStick[0].openTime).dateString
		} ${shouldTrade} ${status} E:${entryPrice.toFixed(3)} SL:${stopLoss.toFixed(
			3
		)}-TP:${takeProfit.toFixed(3)}-PNL:${formatPercent(pnl)} ${stgName}`,
		status,
	};

	return stat;
};
