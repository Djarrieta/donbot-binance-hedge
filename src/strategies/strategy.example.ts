import { rsi } from "technicalindicators";
import type { Strategy, StrategyResponse } from "../models/Strategy";
import { InitialParams } from "../InitialParams";
import { getVolatility } from "../utils/getVolatility";

const STG_NAME = "stg_name";
const ALLOWED_PAIRS: string[] = []; // Optionally add allowed pairs, if not set all pairs will be allowed
const stg: Strategy = {
	stgName: STG_NAME,
	lookBackLength: InitialParams.lookBackLength,
	interval: InitialParams.interval,
	validate: ({ candlestick, pair }) => {
		const response: StrategyResponse = {
			positionSide: null,
			sl: InitialParams.defaultSL,
			tp: InitialParams.defaultTP,
			stgName: STG_NAME,
		};

		if (candlestick.length < InitialParams.lookBackLength) return response;
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
