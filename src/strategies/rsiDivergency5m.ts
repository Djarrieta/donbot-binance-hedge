import { rsi } from "technicalindicators";
import type { Strategy, StrategyResponse } from "../models/Strategy";
import { params } from "../Params";
import { getVolatility } from "../utils/getVolatility";

const STG_NAME = "rsiDivergency5m";
const ALLOWED_PAIRS: string[] = [
	"XRPUSDT",
	"EOSUSDT",
	"ADAUSDT",
	"XMRUSDT",
	"ATOMUSDT",
	"ONTUSDT",
	"IOTAUSDT",
	"BATUSDT",
	"QTUMUSDT",
	"THETAUSDT",
	"ZILUSDT",
	"COMPUSDT",
	"BANDUSDT",
	"WAVESUSDT",
	"SNXUSDT",
	"DOTUSDT",
	"CRVUSDT",
	"SUSHIUSDT",
	"EGLDUSDT",
	"ICXUSDT",
	"STORJUSDT",
	"FTMUSDT",
	"RSRUSDT",
	"LRCUSDT",
	"MATICUSDT",
	"OCEANUSDT",
	"ZENUSDT",
	"GRTUSDT",
	"1INCHUSDT",
	"CHZUSDT",
	"SANDUSDT",
	"LITUSDT",
	"UNFIUSDT",
	"REEFUSDT",
	"XEMUSDT",
	"COTIUSDT",
	"MANAUSDT",
	"ONEUSDT",
	"LINAUSDT",
	"STMXUSDT",
	"CELRUSDT",
	"HOTUSDT",
	"MTLUSDT",
	"OGNUSDT",
	"NKNUSDT",
	"1000SHIBUSDT",
	"BAKEUSDT",
	"C98USDT",
	"DYDXUSDT",
	"1000XECUSDT",
	"KLAYUSDT",
	"LPTUSDT",
	"PEOPLEUSDT",
	"FLOWUSDT",
	"API3USDT",
	"APEUSDT",
	"DARUSDT",
	"INJUSDT",
	"1000LUNCUSDT",
	"LUNA2USDT",
	"FETUSDT",
	"MAGICUSDT",
	"TUSDT",
	"RNDRUSDT",
	"HIGHUSDT",
	"MINAUSDT",
	"PHBUSDT",
	"GMXUSDT",
	"CFXUSDT",
	"BNXUSDT",
	"SSVUSDT",
	"CKBUSDT",
	"TRUUSDT",
	"JOEUSDT",
	"TLMUSDT",
	"AMBUSDT",
	"LEVERUSDT",
	"RDNTUSDT",
	"HFTUSDT",
	"BLURUSDT",
	"SUIUSDT",
	"1000PEPEUSDT",
	"UMAUSDT",
	"NMRUSDT",
	"MAVUSDT",
	"XVGUSDT",
	"WLDUSDT",
	"AGLDUSDT",
	"BNTUSDT",
	"SEIUSDT",
	"HIFIUSDT",
	"FRONTUSDT",
	"BIGTIMEUSDT",
	"BONDUSDT",
	"RIFUSDT",
	"POLYXUSDT",
	"POWRUSDT",
	"CAKEUSDT",
	"MEMEUSDT",
	"TWTUSDT",
	"TOKENUSDT",
	"BADGERUSDT",
	"KASUSDT",
	"BEAMXUSDT",
	"1000BONKUSDT",
	"USTCUSDT",
	"ETHWUSDT",
	"JTOUSDT",
	"1000SATSUSDT",
	"1000RATSUSDT",
	"AIUSDT",
	"XAIUSDT",
	"WIFUSDT",
	"MANTAUSDT",
	"LSKUSDT",
	"ZETAUSDT",
	"PIXELUSDT",
	"PORTALUSDT",
	"VANRYUSDT",
	"BOMEUSDT",
	"ENAUSDT",
	"WUSDT",
	"TNSRUSDT",
	"TAOUSDT",
	"OMNIUSDT",
	"BBUSDT",
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
