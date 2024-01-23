import { rsi } from "technicalindicators";
import { Interval } from "../models/Interval";
import {
	Strategy,
	StrategyResponse,
	StrategyQuitCriteria,
} from "../models/Strategy";

const strategyQuitCriteria: StrategyQuitCriteria = ({ candlestick }) => {
	let response: boolean = false;
	if (candlestick.length) {
		response = true;
	}
	return response;
};
const STG_NAME = "strategyNameHere";

const stg: Strategy = {
	name: STG_NAME,
	lookBackLength: Interval["1d"] / Interval["5m"],
	interval: Interval["5m"],
	validate: ({ candlestick, pair }) => {
		const response: StrategyResponse = {
			shouldTrade: null,
			name: STG_NAME,
			sl: { val: 1 / 100 }, // Can be a static value or quit criteria function
			tp: { quitCriteria: strategyQuitCriteria }, // Can be a static value or quit criteria function
			tr: { val: 1 / 100, callback: 1 / 100 }, // add optionals tr and callback rate for adding trailing order to your position
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

		return response;
	},
};

export default stg;
