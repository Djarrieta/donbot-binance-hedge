import { mfi } from "technicalindicators";
import type { Strategy, StrategyResponse } from "../models/Strategy";
import { params } from "../Params";
import { getVolatility } from "../utils/getVolatility";

const STG_NAME = "mfiDivergency5m";
const ALLOWED_PAIRS: string[] = [
	"EOSUSDT",
	"XLMUSDT",
	"ADAUSDT",
	"XMRUSDT",
	"ATOMUSDT",
	"IOTAUSDT",
	"BATUSDT",
	"THETAUSDT",
	"ZILUSDT",
	"KNCUSDT",
	"ZRXUSDT",
	"COMPUSDT",
	"DOGEUSDT",
	"BANDUSDT",
	"RLCUSDT",
	"SNXUSDT",
	"CRVUSDT",
	"SUSHIUSDT",
	"EGLDUSDT",
	"ICXUSDT",
	"STORJUSDT",
	"ENJUSDT",
	"FLMUSDT",
	"RENUSDT",
	"KSMUSDT",
	"LRCUSDT",
	"OCEANUSDT",
	"BELUSDT",
	"SKLUSDT",
	"GRTUSDT",
	"1INCHUSDT",
	"CHZUSDT",
	"SANDUSDT",
	"ANKRUSDT",
	"LITUSDT",
	"UNFIUSDT",
	"COTIUSDT",
	"CHRUSDT",
	"MANAUSDT",
	"HBARUSDT",
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
	"BTCDOMUSDT",
	"IOTXUSDT",
	"C98USDT",
	"MASKUSDT",
	"ATAUSDT",
	"DYDXUSDT",
	"1000XECUSDT",
	"CELOUSDT",
	"KLAYUSDT",
	"ARPAUSDT",
	"CTSIUSDT",
	"ENSUSDT",
	"ROSEUSDT",
	"IMXUSDT",
	"API3USDT",
	"GMTUSDT",
	"APEUSDT",
	"DARUSDT",
	"GALUSDT",
	"OPUSDT",
	"INJUSDT",
	"STGUSDT",
	"1000LUNCUSDT",
	"LUNA2USDT",
	"FXSUSDT",
	"MAGICUSDT",
	"RNDRUSDT",
	"HIGHUSDT",
	"MINAUSDT",
	"PHBUSDT",
	"CFXUSDT",
	"STXUSDT",
	"ACHUSDT",
	"PERPUSDT",
	"LQTYUSDT",
	"JOEUSDT",
	"TLMUSDT",
	"HFTUSDT",
	"XVSUSDT",
	"BLURUSDT",
	"1000FLOKIUSDT",
	"UMAUSDT",
	"KEYUSDT",
	"COMBOUSDT",
	"NMRUSDT",
	"MAVUSDT",
	"XVGUSDT",
	"ARKMUSDT",
	"AGLDUSDT",
	"SEIUSDT",
	"HIFIUSDT",
	"ARKUSDT",
	"LOOMUSDT",
	"BONDUSDT",
	"WAXPUSDT",
	"POWRUSDT",
	"CAKEUSDT",
	"TWTUSDT",
	"TOKENUSDT",
	"STEEMUSDT",
	"BADGERUSDT",
	"KASUSDT",
	"BEAMXUSDT",
	"1000BONKUSDT",
	"PYTHUSDT",
	"USTCUSDT",
	"JTOUSDT",
	"AUCTIONUSDT",
	"1000RATSUSDT",
	"ACEUSDT",
	"MOVRUSDT",
	"NFPUSDT",
	"AIUSDT",
	"WIFUSDT",
	"MANTAUSDT",
	"LSKUSDT",
	"ALTUSDT",
	"ZETAUSDT",
	"DYMUSDT",
	"STRKUSDT",
	"PORTALUSDT",
	"AXLUSDT",
	"METISUSDT",
	"AEVOUSDT",
	"VANRYUSDT",
	"BOMEUSDT",
	"WUSDT",
	"SAGAUSDT",
	"OMNIUSDT",
	"REZUSDT",
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
