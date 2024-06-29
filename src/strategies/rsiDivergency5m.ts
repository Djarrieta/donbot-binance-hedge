import { rsi } from "technicalindicators";
import type { Strategy, StrategyResponse } from "./Strategy";
import { params } from "../Params";
import { getVolatility } from "../utils/getVolatility";

const STG_NAME = "rsiDivergency5m";
const ALLOWED_PAIRS: string[] = [
	"XRPUSDT",
	"EOSUSDT",
	"DASHUSDT",
	"IOTAUSDT",
	"VETUSDT",
	"ALGOUSDT",
	"ZILUSDT",
	"KNCUSDT",
	"ZRXUSDT",
	"COMPUSDT",
	"DOGEUSDT",
	"SXPUSDT",
	"KAVAUSDT",
	"BANDUSDT",
	"MKRUSDT",
	"SNXUSDT",
	"DOTUSDT",
	"DEFIUSDT",
	"CRVUSDT",
	"ICXUSDT",
	"FLMUSDT",
	"RENUSDT",
	"FILUSDT",
	"RSRUSDT",
	"LRCUSDT",
	"MATICUSDT",
	"1INCHUSDT",
	"SANDUSDT",
	"UNFIUSDT",
	"REEFUSDT",
	"SFPUSDT",
	"XEMUSDT",
	"COTIUSDT",
	"MANAUSDT",
	"ALICEUSDT",
	"HBARUSDT",
	"ONEUSDT",
	"LINAUSDT",
	"DENTUSDT",
	"CELRUSDT",
	"HOTUSDT",
	"MTLUSDT",
	"OGNUSDT",
	"1000SHIBUSDT",
	"GTCUSDT",
	"C98USDT",
	"MASKUSDT",
	"ATAUSDT",
	"DYDXUSDT",
	"ARUSDT",
	"KLAYUSDT",
	"ARPAUSDT",
	"ENSUSDT",
	"DUSKUSDT",
	"GMTUSDT",
	"APEUSDT",
	"DARUSDT",
	"STGUSDT",
	"1000LUNCUSDT",
	"LDOUSDT",
	"FXSUSDT",
	"HOOKUSDT",
	"TUSDT",
	"RNDRUSDT",
	"HIGHUSDT",
	"MINAUSDT",
	"PHBUSDT",
	"CFXUSDT",
	"STXUSDT",
	"SSVUSDT",
	"CKBUSDT",
	"IDUSDT",
	"ARBUSDT",
	"JOEUSDT",
	"TLMUSDT",
	"AMBUSDT",
	"RDNTUSDT",
	"HFTUSDT",
	"UMAUSDT",
	"NMRUSDT",
	"MAVUSDT",
	"XVGUSDT",
	"PENDLEUSDT",
	"ARKMUSDT",
	"DODOXUSDT",
	"OXTUSDT",
	"SEIUSDT",
	"HIFIUSDT",
	"BONDUSDT",
	"RIFUSDT",
	"POLYXUSDT",
	"POWRUSDT",
	"TWTUSDT",
	"TOKENUSDT",
	"BADGERUSDT",
	"NTRNUSDT",
	"BEAMXUSDT",
	"1000BONKUSDT",
	"SUPERUSDT",
	"USTCUSDT",
	"ETHWUSDT",
	"1000SATSUSDT",
	"1000RATSUSDT",
	"ACEUSDT",
	"MOVRUSDT",
	"XAIUSDT",
	"MANTAUSDT",
	"LSKUSDT",
	"ALTUSDT",
	"ZETAUSDT",
	"STRKUSDT",
	"GLMUSDT",
	"PORTALUSDT",
	"VANRYUSDT",
	"BOMEUSDT",
	"ENAUSDT",
	"WUSDT",
	"SAGAUSDT",
	"TAOUSDT",
	"IOUSDT",
];
const stg: Strategy = {
	stgName: STG_NAME,
	lookBackLength: params.lookBackLength,
	interval: params.interval,
	validate: ({ candlestick, pair }) => {
		const response: StrategyResponse = {
			positionSide: null,
			sl: 1 / 100,
			tp: 5 / 100,
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

// ┌───┬────────┬───────┬────────────────┬───────────┬───────┬─────────┐
// │   │ sl     │ tp    │ maxTradeLength │ tradesQty │ avPnl │ winRate │
// ├───┼────────┼───────┼────────────────┼───────────┼───────┼─────────┤
// │ 0 │ 1.00%  │ 5.00% │ 100            │ 3106      │ 0.41% │ 28.75%  │
// └───┴────────┴───────┴────────────────┴───────────┴───────┴─────────┘
