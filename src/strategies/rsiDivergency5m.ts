import { rsi } from "technicalindicators";
import type { Strategy, StrategyResponse } from "./Strategy";
import { params } from "../Params";
import { getVolatility } from "../utils/getVolatility";

const STG_NAME = "rsiDivergency5m";
const ALLOWED_PAIRS: string[] = [
	"XRPUSDT",
	"EOSUSDT",
	"XMRUSDT",
	"DASHUSDT",
	"XTZUSDT",
	"ATOMUSDT",
	"IOTAUSDT",
	"VETUSDT",
	"IOSTUSDT",
	"THETAUSDT",
	"COMPUSDT",
	"DOGEUSDT",
	"SXPUSDT",
	"KAVAUSDT",
	"BANDUSDT",
	"SNXUSDT",
	"DOTUSDT",
	"DEFIUSDT",
	"SUSHIUSDT",
	"EGLDUSDT",
	"ICXUSDT",
	"ENJUSDT",
	"RSRUSDT",
	"LRCUSDT",
	"MATICUSDT",
	"AXSUSDT",
	"SKLUSDT",
	"GRTUSDT",
	"1INCHUSDT",
	"CHZUSDT",
	"SANDUSDT",
	"UNFIUSDT",
	"XEMUSDT",
	"COTIUSDT",
	"MANAUSDT",
	"ONEUSDT",
	"LINAUSDT",
	"DENTUSDT",
	"CELRUSDT",
	"MTLUSDT",
	"NKNUSDT",
	"1000SHIBUSDT",
	"ATAUSDT",
	"DYDXUSDT",
	"ARUSDT",
	"KLAYUSDT",
	"LPTUSDT",
	"ENSUSDT",
	"PEOPLEUSDT",
	"ROSEUSDT",
	"DUSKUSDT",
	"FLOWUSDT",
	"IMXUSDT",
	"API3USDT",
	"GMTUSDT",
	"APEUSDT",
	"JASMYUSDT",
	"DARUSDT",
	"OPUSDT",
	"STGUSDT",
	"1000LUNCUSDT",
	"LDOUSDT",
	"APTUSDT",
	"FETUSDT",
	"TUSDT",
	"HIGHUSDT",
	"MINAUSDT",
	"ASTRUSDT",
	"CFXUSDT",
	"STXUSDT",
	"SSVUSDT",
	"CKBUSDT",
	"PERPUSDT",
	"TRUUSDT",
	"IDUSDT",
	"ARBUSDT",
	"JOEUSDT",
	"AMBUSDT",
	"LEVERUSDT",
	"RDNTUSDT",
	"HFTUSDT",
	"SUIUSDT",
	"UMAUSDT",
	"MAVUSDT",
	"WLDUSDT",
	"PENDLEUSDT",
	"AGLDUSDT",
	"DODOXUSDT",
	"BNTUSDT",
	"OXTUSDT",
	"SEIUSDT",
	"HIFIUSDT",
	"FRONTUSDT",
	"BICOUSDT",
	"BONDUSDT",
	"RIFUSDT",
	"POLYXUSDT",
	"POWRUSDT",
	"CAKEUSDT",
	"TWTUSDT",
	"BADGERUSDT",
	"NTRNUSDT",
	"BEAMXUSDT",
	"1000BONKUSDT",
	"SUPERUSDT",
	"ONGUSDT",
	"ETHWUSDT",
	"JTOUSDT",
	"ACEUSDT",
	"NFPUSDT",
	"XAIUSDT",
	"MANTAUSDT",
	"ONDOUSDT",
	"LSKUSDT",
	"ALTUSDT",
	"ZETAUSDT",
	"PIXELUSDT",
	"PORTALUSDT",
	"TONUSDT",
	"MYROUSDT",
	"BOMEUSDT",
	"ENAUSDT",
	"TAOUSDT",
	"OMNIUSDT",
	"IOUSDT",
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
			sl: 7 / 100,
			tp: 7 / 100,
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

// ┌───┬───────┬───────┬────────────────┬───────────┬───────────┬───────────┬────────┬─────────────┬─────────┬───────────────┐
// │   │ sl    │ tp    │ maxTradeLength │ tradesQty │ maxAccPnl │ minAccPnl │ accPnl │ minDrawdown │ winRate │ avTradeLength │
// ├───┼───────┼───────┼────────────────┼───────────┼───────────┼───────────┼────────┼─────────────┼─────────┼───────────────┤
// │ 0 │ 7.00% │ 7.00% │ 100            │ 313       │ 169.16%   │ -27.12%   │ 97.74% │ -71.42%     │ 55.91%  │ 81.42         │
// └───┴───────┴───────┴────────────────┴───────────┴───────────┴───────────┴────────┴─────────────┴─────────┴───────────────┘
// ┌───┬───────┬───────┬────────────────┬───────────┬───────┬─────────┐
// │   │ sl    │ tp    │ maxTradeLength │ tradesQty │ avPnl │ winRate │
// ├───┼───────┼───────┼────────────────┼───────────┼───────┼─────────┤
// │ 0 │ 7.00% │ 7.00% │ 100            │ 3362      │ 0.88% │ 61.72%  │
// └───┴───────┴───────┴────────────────┴───────────┴───────┴─────────┘
