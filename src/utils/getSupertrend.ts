import { ATR } from "technicalindicators";
import type { Candle } from "../domain/Candle";
interface GetSuperTrendProps {
	candlestick: Candle[];
	period: number;
	multiplier: number;
}
export const getSuperTrend = ({
	candlestick,
	period,
	multiplier,
}: GetSuperTrendProps) => {
	const v = {
		high: candlestick.map((c) => c.high),
		low: candlestick.map((c) => c.low),
		close: candlestick.map((c) => c.close),
		period,
	};

	const atr = ATR.calculate(v);
	const r = [...candlestick];
	for (let i = 0; i < period; i++) {
		r.shift();
	}
	const basicUpperBand = [];
	const basicLowerBand = [];
	for (let i = 0; i < r.length; i++) {
		basicUpperBand.push((r[i].high + r[i].low) / 2 + multiplier * atr[i]);
		basicLowerBand.push((r[i].high + r[i].low) / 2 - multiplier * atr[i]);
	}
	const finalUpperBand = [];
	const finalLowerBand = [];
	let previousFinalUpperBand = 0;
	let previousFinalLowerBand = 0;
	for (let i = 0; i < r.length; i++) {
		if (
			basicUpperBand[i] < previousFinalUpperBand ||
			(r[i - 1] && r[i - 1].close > previousFinalUpperBand)
		) {
			finalUpperBand.push(basicUpperBand[i]);
		} else {
			finalUpperBand.push(previousFinalUpperBand);
		}
		if (
			basicLowerBand[i] > previousFinalLowerBand ||
			(r[i - 1] && r[i - 1].close < previousFinalLowerBand)
		) {
			finalLowerBand.push(basicLowerBand[i]);
		} else {
			finalLowerBand.push(previousFinalLowerBand);
		}
		previousFinalUpperBand = finalUpperBand[i];
		previousFinalLowerBand = finalLowerBand[i];
	}
	const superTrend = [];
	let previousSuperTrend = 0;
	for (let i = 0; i < r.length; i++) {
		let nowSuperTrend = 0;
		if (
			previousSuperTrend == finalUpperBand[i - 1] &&
			r[i].close <= finalUpperBand[i]
		) {
			nowSuperTrend = finalUpperBand[i];
		} else if (
			previousSuperTrend == finalUpperBand[i - 1] &&
			r[i].close > finalUpperBand[i]
		) {
			nowSuperTrend = finalLowerBand[i];
		} else if (
			previousSuperTrend == finalLowerBand[i - 1] &&
			r[i].close >= finalLowerBand[i]
		) {
			nowSuperTrend = finalLowerBand[i];
		} else if (
			previousSuperTrend == finalLowerBand[i - 1] &&
			r[i].close < finalLowerBand[i]
		) {
			nowSuperTrend = finalUpperBand[i];
		}
		superTrend.push(nowSuperTrend);
		previousSuperTrend = superTrend[i];
	}
	return superTrend;
};
