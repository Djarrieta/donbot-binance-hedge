import { rsi } from "technicalindicators";
import type { Strategy, StrategyResponse } from "./Strategy";
import { params } from "../Params";
import { getVolatility } from "../utils/getVolatility";

const STG_NAME = "stg_name";
const ALLOWED_PAIRS: string[] = []; // Optionally add allowed pairs, if not set all pairs will be allowed
const stg: Strategy = {
	stgName: STG_NAME,
	lookBackLength: params.lookBackLength,
	interval: params.interval,
	validate: ({ candlestick, pair }) => {
		const response: StrategyResponse = {
			positionSide: null,
			sl: params.defaultSL,
			tp: params.defaultTP,
			stgName: STG_NAME,
		};

		if (candlestick.length < params.lookBackLength) return response;
		if (ALLOWED_PAIRS.length && !ALLOWED_PAIRS.includes(pair)) return response;

		const MIN_VOL = 10 / 100;
		const volatility = getVolatility({ candlestick });

		//Add your trading strategy here modifying positionSide, sl, tp,
		let condition = false;

		if (volatility >= MIN_VOL && condition) {
			response.positionSide = "LONG";
		}
		if (volatility >= MIN_VOL && condition) {
			response.positionSide = "SHORT";
		}

		return response;
	},
};

export default stg;
