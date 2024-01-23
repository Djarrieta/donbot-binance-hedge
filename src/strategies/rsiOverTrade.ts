import { rsi } from "technicalindicators";
import { Interval } from "../models/Interval";
import {
	Strategy,
	StrategyResponse,
	StrategyQuitCriteria,
} from "../models/Strategy";
import { Context } from "../models/Context";

const strategyQuitCriteria: StrategyQuitCriteria = ({ candlestick }) => {
	let response: boolean = false;
	if (candlestick.length) {
		response = true;
	}
	return response;
};
const STG_NAME = "rsiOverTrade";

const stg: Strategy = {
	name: STG_NAME,
	lookBackLength: Interval["1d"] / Interval["5m"],
	interval: Interval["5m"],
	validate: ({ candlestick, pair, volatility }) => {
		const response: StrategyResponse = {
			shouldTrade: null,
			name: STG_NAME,
			sl: { val: 0.5 / 100 },
			tp: { val: 0.5 / 100 },
		};

		const prices = candlestick.map((candle) => candle.close);

		const rsi8 = rsi({ period: 8, values: prices });
		const rsi200 = rsi({ period: 200, values: prices });

		const overboughtRsi = 70;
		const middleRsi = 50;
		const areRsiOverbought =
			rsi8[rsi8.length - 2] <= overboughtRsi &&
			rsi8[rsi8.length - 1] > overboughtRsi &&
			rsi200[rsi200.length - 1] < middleRsi;

		if (Number(volatility) > Context.minVolatility && areRsiOverbought) {
			response.shouldTrade = "LONG";
		}

		const oversoldRsi = 30;
		const areRsiOversold =
			rsi8[rsi8.length - 2] >= oversoldRsi &&
			rsi8[rsi8.length - 1] < oversoldRsi &&
			rsi200[rsi200.length - 1] > middleRsi;

		if (Number(volatility) > Context.minVolatility && areRsiOversold) {
			response.shouldTrade = "SHORT";
		}

		return response;
	},
};

export default stg;
