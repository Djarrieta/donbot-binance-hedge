import { rsi } from "technicalindicators";
import { Interval } from "../models/Interval";
import { Strategy, StrategyResponse } from "../models/Strategy";

const stg: Strategy = {
	name: "stg_name",
	lookBackLength: Interval["1d"] / Interval["5m"],
	interval: Interval["5m"],
	validate: ({ candlestick, pair }) => {
		const response: StrategyResponse = {
			shouldTrade: null,
			sl: 0, // 0 / 100,
			tp: 0,
			tr: 0,
			callback: 0,
			stg: "stg_name",
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
