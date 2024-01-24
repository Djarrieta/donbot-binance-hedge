import { rsi } from "technicalindicators";
import { Interval } from "../models/Interval";
import { Strategy, StrategyResponse } from "../models/Strategy";
import { Context } from "../models/Context";

const STG_NAME = "stg_name";
const stg: Strategy = {
	name: STG_NAME,
	lookBackLength: Interval["1d"] / Interval["5m"],
	interval: Interval["5m"],
	validate: ({ candlestick, pair }) => {
		const response: StrategyResponse = {
			shouldTrade: null,
			sl: Context.defaultTP,
			tp: Context.defaultTP,
			tr: 0,
			callback: 0,
			stg: STG_NAME,
		};

		if (candlestick.length < Interval["1d"] / Interval["5m"]) return response;

		//Add your trading strategy here modifying shouldTrade, sl, tp, tr, callback
		let condition = false;

		if (condition) {
			response.shouldTrade = "LONG";
		}
		if (condition) {
			response.shouldTrade = "SHORT";
		}

		// add tr for adding trailing order to your position. Remove it if trailing order is not required
		return response;
	},
};

export default stg;
