import { mfi } from "technicalindicators";
import type { Strategy, StrategyResponse } from "./Strategy";
import { params } from "../Params";
import { getVolatility } from "../utils/getVolatility";

const STG_NAME = "mfiDivergency5m";
const ALLOWED_PAIRS: string[] = [
	"ZECUSDT",
	"ATOMUSDT",
	"VETUSDT",
	"NEOUSDT",
	"ZILUSDT",
	"KNCUSDT",
	"OMGUSDT",
	"DEFIUSDT",
	"RUNEUSDT",
	"EGLDUSDT",
	"FLMUSDT",
	"RENUSDT",
	"NEARUSDT",
	"BELUSDT",
	"AXSUSDT",
	"ZENUSDT",
	"GRTUSDT",
	"CHZUSDT",
	"LITUSDT",
	"UNFIUSDT",
	"CHRUSDT",
	"MANAUSDT",
	"CELRUSDT",
	"HOTUSDT",
	"MTLUSDT",
	"BAKEUSDT",
	"GTCUSDT",
	"KLAYUSDT",
	"ARPAUSDT",
	"ENSUSDT",
	"PEOPLEUSDT",
	"ROSEUSDT",
	"DUSKUSDT",
	"IMXUSDT",
	"JASMYUSDT",
	"GALUSDT",
	"STGUSDT",
	"LDOUSDT",
	"FETUSDT",
	"FXSUSDT",
	"RNDRUSDT",
	"MINAUSDT",
	"STXUSDT",
	"BNXUSDT",
	"ACHUSDT",
	"SSVUSDT",
	"CKBUSDT",
	"PERPUSDT",
	"TRUUSDT",
	"ARBUSDT",
	"JOEUSDT",
	"TLMUSDT",
	"RDNTUSDT",
	"EDUUSDT",
	"SUIUSDT",
	"1000FLOKIUSDT",
	"KEYUSDT",
	"COMBOUSDT",
	"XVGUSDT",
	"PENDLEUSDT",
	"ARKMUSDT",
	"AGLDUSDT",
	"DODOXUSDT",
	"BNTUSDT",
	"CYBERUSDT",
	"LOOMUSDT",
	"BIGTIMEUSDT",
	"BONDUSDT",
	"POWRUSDT",
	"TOKENUSDT",
	"BADGERUSDT",
	"KASUSDT",
	"BEAMXUSDT",
	"ONGUSDT",
	"JTOUSDT",
	"1000SATSUSDT",
	"1000RATSUSDT",
	"ACEUSDT",
	"MOVRUSDT",
	"XAIUSDT",
	"WIFUSDT",
	"JUPUSDT",
	"STRKUSDT",
	"MAVIAUSDT",
	"TONUSDT",
	"AXLUSDT",
	"VANRYUSDT",
	"BOMEUSDT",
	"WUSDT",
	"BBUSDT",
	"NOTUSDT",
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
