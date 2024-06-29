import { mfi } from "technicalindicators";
import type { Strategy, StrategyResponse } from "./Strategy";
import { params } from "../Params";
import { getVolatility } from "../utils/getVolatility";

const STG_NAME = "mfiDivergency5m";
const ALLOWED_PAIRS: string[] = [
	"EOSUSDT",
	"XLMUSDT",
	"ADAUSDT",
	"XMRUSDT",
	"ZECUSDT",
	"ATOMUSDT",
	"IOTAUSDT",
	"VETUSDT",
	"NEOUSDT",
	"THETAUSDT",
	"ALGOUSDT",
	"ZILUSDT",
	"ZRXUSDT",
	"COMPUSDT",
	"OMGUSDT",
	"DOGEUSDT",
	"SXPUSDT",
	"KAVAUSDT",
	"BANDUSDT",
	"RLCUSDT",
	"MKRUSDT",
	"RUNEUSDT",
	"SUSHIUSDT",
	"EGLDUSDT",
	"BLZUSDT",
	"FTMUSDT",
	"ENJUSDT",
	"FLMUSDT",
	"RENUSDT",
	"KSMUSDT",
	"NEARUSDT",
	"FILUSDT",
	"RSRUSDT",
	"LRCUSDT",
	"MATICUSDT",
	"ALPHAUSDT",
	"ZENUSDT",
	"GRTUSDT",
	"1INCHUSDT",
	"CHZUSDT",
	"SANDUSDT",
	"UNFIUSDT",
	"RVNUSDT",
	"XEMUSDT",
	"COTIUSDT",
	"CHRUSDT",
	"MANAUSDT",
	"ALICEUSDT",
	"ONEUSDT",
	"LINAUSDT",
	"CELRUSDT",
	"HOTUSDT",
	"MTLUSDT",
	"OGNUSDT",
	"NKNUSDT",
	"1000SHIBUSDT",
	"BAKEUSDT",
	"GTCUSDT",
	"BTCDOMUSDT",
	"C98USDT",
	"MASKUSDT",
	"ATAUSDT",
	"DYDXUSDT",
	"1000XECUSDT",
	"CELOUSDT",
	"ARUSDT",
	"ARPAUSDT",
	"CTSIUSDT",
	"ROSEUSDT",
	"DUSKUSDT",
	"FLOWUSDT",
	"IMXUSDT",
	"GMTUSDT",
	"JASMYUSDT",
	"DARUSDT",
	"GALUSDT",
	"OPUSDT",
	"STGUSDT",
	"SPELLUSDT",
	"1000LUNCUSDT",
	"LUNA2USDT",
	"HOOKUSDT",
	"TUSDT",
	"RNDRUSDT",
	"PHBUSDT",
	"GMXUSDT",
	"CFXUSDT",
	"ACHUSDT",
	"CKBUSDT",
	"PERPUSDT",
	"IDUSDT",
	"TLMUSDT",
	"HFTUSDT",
	"BLURUSDT",
	"1000PEPEUSDT",
	"1000FLOKIUSDT",
	"UMAUSDT",
	"KEYUSDT",
	"NMRUSDT",
	"MAVUSDT",
	"XVGUSDT",
	"WLDUSDT",
	"PENDLEUSDT",
	"ARKMUSDT",
	"AGLDUSDT",
	"DODOXUSDT",
	"BNTUSDT",
	"SEIUSDT",
	"ARKUSDT",
	"LOOMUSDT",
	"BONDUSDT",
	"WAXPUSDT",
	"BSVUSDT",
	"POWRUSDT",
	"TWTUSDT",
	"TOKENUSDT",
	"STEEMUSDT",
	"BADGERUSDT",
	"KASUSDT",
	"BEAMXUSDT",
	"PYTHUSDT",
	"USTCUSDT",
	"JTOUSDT",
	"1000SATSUSDT",
	"1000RATSUSDT",
	"MOVRUSDT",
	"NFPUSDT",
	"AIUSDT",
	"XAIUSDT",
	"ONDOUSDT",
	"LSKUSDT",
	"ALTUSDT",
	"JUPUSDT",
	"ZETAUSDT",
	"DYMUSDT",
	"OMUSDT",
	"PIXELUSDT",
	"STRKUSDT",
	"MAVIAUSDT",
	"PORTALUSDT",
	"TONUSDT",
	"MYROUSDT",
	"AEVOUSDT",
	"VANRYUSDT",
	"BOMEUSDT",
	"ETHFIUSDT",
	"WUSDT",
	"TNSRUSDT",
	"SAGAUSDT",
	"TAOUSDT",
	"TURBOUSDT",
];
const stg: Strategy = {
	stgName: STG_NAME,
	lookBackLength: params.lookBackLength,
	interval: params.interval,
	validate: ({ candlestick, pair }) => {
		const response: StrategyResponse = {
			positionSide: null,
			sl: 5 / 100,
			tp: 10 / 100,
			stgName: STG_NAME,
			pair,
		};

		if (candlestick.length < params.lookBackLength) return response;
		if (ALLOWED_PAIRS.length && !ALLOWED_PAIRS.includes(pair)) return response;

		const MIN_MFI = 20;
		const CANDLESTICK_SIZE = 50;
		const MIN_VOL = 10 / 100;
		const MAX_VOL = 25 / 100;

		const mfiArray = mfi({
			high: candlestick.map((item) => item.high),
			low: candlestick.map((item) => item.low),
			close: candlestick.map((item) => item.close),
			volume: candlestick.map((item) => item.volume),
			period: 14,
		});

		let candlestickValues: number[] = [];

		candlestick.forEach(({ close, high, low, open }) => {
			candlestickValues.push(close, high, low, open);
		});

		const volatility = getVolatility({ candlestick });

		if (
			volatility > MIN_VOL &&
			volatility < MAX_VOL &&
			mfiArray[mfiArray.length - 1] <= MIN_MFI &&
			mfiArray[mfiArray.length - 2] <= MIN_MFI &&
			mfiArray[mfiArray.length - 1] > mfiArray[mfiArray.length - 2]
		) {
			const firstZeroCrossingIndex = [...mfiArray]
				.reverse()
				.findIndex((arrayVal) => arrayVal > MIN_MFI);

			const firstRange = mfiArray.slice(-firstZeroCrossingIndex);
			const secondRange = mfiArray.slice(
				mfiArray.length - CANDLESTICK_SIZE,
				mfiArray.length - firstZeroCrossingIndex
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
			mfiArray[mfiArray.length - 1] >= 100 - MIN_MFI &&
			mfiArray[mfiArray.length - 2] >= 100 - MIN_MFI &&
			mfiArray[mfiArray.length - 1] < mfiArray[mfiArray.length - 2]
		) {
			const firstZeroCrossingIndex = [...mfiArray]
				.reverse()
				.findIndex((arrayVal) => arrayVal < 100 - MIN_MFI);

			const firstRange = mfiArray.slice(-firstZeroCrossingIndex);
			const secondRange = mfiArray.slice(
				mfiArray.length - CANDLESTICK_SIZE,
				mfiArray.length - firstZeroCrossingIndex
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
// │ 0 │ 10.00% │ 5.00% │ 100            │ 5030      │ 0.88% │ 56.58%  │
// └───┴────────┴───────┴────────────────┴───────────┴───────┴─────────┘
