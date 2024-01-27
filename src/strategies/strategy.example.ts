import { rsi } from "technicalindicators";
import { Strategy, StrategyResponse } from "../models/Strategy";
import { Context } from "../models/Context";

const stg: Strategy = {
	lookBackLength: Context.lookBackLength,
	interval: Context.interval,
	validate: ({ candlestick, pair }) => {
		const response: StrategyResponse = {
			shouldTrade: null,
			sl: Context.defaultSL,
			tp: Context.defaultTP, // undefined to have dynamic tp with quitCriteria
			stgName: "stg_name",
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
