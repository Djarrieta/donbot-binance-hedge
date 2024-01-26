import { rsi } from "technicalindicators";
import { Interval } from "../models/Interval";
import { Strategy, StrategyResponse } from "../models/Strategy";
import { Context } from "../models/Context";

const STG_NAME = "stg_name";
const stg: Strategy = {
	name: STG_NAME,
	lookBackLength: Context.lookBackLength,
	interval: Context.interval,
	validate: ({ candlestick, pair }) => {
		const response: StrategyResponse = {
			shouldTrade: null,
			sl: Context.defaultSL,
			tp: Context.defaultTP, // undefined to have dynamic tp with quitCriteria
			name: STG_NAME,
		};

		if (candlestick.length < Context.lookBackLength) return response;

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
