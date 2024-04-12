import { rsi } from "technicalindicators";
import { Strategy, StrategyResponse } from "../models/Strategy";
import { Context } from "../models/Context";
import { getVolatility } from "../services/getSymbolList";

const STG_NAME = "stg_name";
const stg: Strategy = {
	stgName: STG_NAME,
	lookBackLength: Context.lookBackLength,
	interval: Context.interval,
	validate: ({ candlestick, pair }) => {
		const response: StrategyResponse = {
			shouldTrade: null,
			sl: Context.defaultSL,
			tp: Context.defaultTP,
			tr: Context.defaultTR,
			cb: Context.defaultCB,
			stgName: STG_NAME,
		};

		if (candlestick.length < Context.lookBackLength) return response;

		const MIN_VOL = 10 / 100;
		const volatility = getVolatility({ candlestick });

		//Add your trading strategy here modifying shouldTrade, sl, tp,
		let condition = false;

		if (volatility >= MIN_VOL && condition) {
			response.shouldTrade = "LONG";
		}
		if (volatility >= MIN_VOL && condition) {
			response.shouldTrade = "SHORT";
		}

		return response;
	},
};

export default stg;
