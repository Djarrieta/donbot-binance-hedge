import { rsi } from "technicalindicators";
import type { Strategy, StrategyResponse } from "./Strategy";
import { params } from "../Params";
import { getVolatility } from "../utils/getVolatility";

const STG_NAME = "rsiDivergency5m";
const ALLOWED_PAIRS: string[] = [
	"XRPUSDT",
	"XMRUSDT",
	"ATOMUSDT",
	"BATUSDT",
	"VETUSDT",
	"THETAUSDT",
	"COMPUSDT",
	"DOGEUSDT",
	"MKRUSDT",
	"DOTUSDT",
	"YFIUSDT",
	"CRVUSDT",
	"EGLDUSDT",
	"ICXUSDT",
	"STORJUSDT",
	"BLZUSDT",
	"ENJUSDT",
	"FLMUSDT",
	"KSMUSDT",
	"NEARUSDT",
	"FILUSDT",
	"RSRUSDT",
	"LRCUSDT",
	"MATICUSDT",
	"ZENUSDT",
	"1INCHUSDT",
	"UNFIUSDT",
	"XEMUSDT",
	"COTIUSDT",
	"MANAUSDT",
	"ONEUSDT",
	"STMXUSDT",
	"CELRUSDT",
	"NKNUSDT",
	"1000SHIBUSDT",
	"IOTXUSDT",
	"DYDXUSDT",
	"1000XECUSDT",
	"KLAYUSDT",
	"CTSIUSDT",
	"LPTUSDT",
	"ENSUSDT",
	"PEOPLEUSDT",
	"API3USDT",
	"JASMYUSDT",
	"INJUSDT",
	"LDOUSDT",
	"FETUSDT",
	"MAGICUSDT",
	"TUSDT",
	"HIGHUSDT",
	"ASTRUSDT",
	"SSVUSDT",
	"CKBUSDT",
	"PERPUSDT",
	"TRUUSDT",
	"IDUSDT",
	"JOEUSDT",
	"AMBUSDT",
	"HFTUSDT",
	"XVSUSDT",
	"1000PEPEUSDT",
	"UMAUSDT",
	"MAVUSDT",
	"XVGUSDT",
	"ARKMUSDT",
	"AGLDUSDT",
	"DODOXUSDT",
	"HIFIUSDT",
	"LOOMUSDT",
	"BONDUSDT",
	"RIFUSDT",
	"POLYXUSDT",
	"POWRUSDT",
	"CAKEUSDT",
	"KASUSDT",
	"BEAMXUSDT",
	"1000BONKUSDT",
	"ETHWUSDT",
	"WIFUSDT",
	"MANTAUSDT",
	"ONDOUSDT",
	"ALTUSDT",
	"JUPUSDT",
	"ZETAUSDT",
	"RONINUSDT",
	"PIXELUSDT",
	"TONUSDT",
	"MYROUSDT",
	"VANRYUSDT",
	"ENAUSDT",
	"TAOUSDT",
	"TURBOUSDT",
	"ZKUSDT",
	"LISTAUSDT",
	"ZROUSDT",
];
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
			pair,
		};

		if (candlestick.length < params.lookBackLength) return response;
		if (ALLOWED_PAIRS.length && !ALLOWED_PAIRS.includes(pair)) return response;

		const MIN_RSI = 30;
		const CANDLESTICK_SIZE = 50;
		const MIN_VOL = 10 / 100;
		const MAX_VOL = 25 / 100;

		const closePrices = candlestick.map((candle) => candle.close);
		const rsiArray = rsi({ period: 14, values: closePrices });

		let candlestickValues: number[] = [];

		candlestick.forEach(({ close, high, low, open }) => {
			candlestickValues.push(close, high, low, open);
		});

		const volatility = getVolatility({ candlestick });

		if (
			volatility > MIN_VOL &&
			volatility < MAX_VOL &&
			rsiArray[rsiArray.length - 1] <= MIN_RSI &&
			rsiArray[rsiArray.length - 2] <= MIN_RSI &&
			rsiArray[rsiArray.length - 1] > rsiArray[rsiArray.length - 2]
		) {
			const firstZeroCrossingIndex = [...rsiArray]
				.reverse()
				.findIndex((arrayVal) => arrayVal > MIN_RSI);

			const firstRange = rsiArray.slice(-firstZeroCrossingIndex);
			const secondRange = rsiArray.slice(
				rsiArray.length - CANDLESTICK_SIZE,
				rsiArray.length - firstZeroCrossingIndex
			);

			const firstMin = Math.min(
				...firstRange.map((value) => Number(value) || 0)
			);
			const secondMin = Math.min(
				...secondRange.map((value) => Number(value) || 0)
			);

			if (firstMin !== 0 && secondMin !== 0 && firstMin > secondMin) {
				response.positionSide = "LONG";
			}
		}

		if (
			volatility > MIN_VOL &&
			volatility < MAX_VOL &&
			rsiArray[rsiArray.length - 1] >= 100 - MIN_RSI &&
			rsiArray[rsiArray.length - 2] >= 100 - MIN_RSI &&
			rsiArray[rsiArray.length - 1] < rsiArray[rsiArray.length - 2]
		) {
			const firstZeroCrossingIndex = [...rsiArray]
				.reverse()
				.findIndex((arrayVal) => arrayVal < 100 - MIN_RSI);

			const firstRange = rsiArray.slice(-firstZeroCrossingIndex);
			const secondRange = rsiArray.slice(
				rsiArray.length - CANDLESTICK_SIZE,
				rsiArray.length - firstZeroCrossingIndex
			);

			const firstMax = Math.max(
				...firstRange.map((value) => Number(value) || 0)
			);
			const secondMax = Math.max(
				...secondRange.map((value) => Number(value) || 0)
			);

			if (firstMax !== 0 && secondMax !== 0 && firstMax < secondMax) {
				response.positionSide = "SHORT";
			}
		}

		return response;
	},
};

export default stg;
