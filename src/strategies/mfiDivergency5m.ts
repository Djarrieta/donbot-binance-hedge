import { mfi } from "technicalindicators";
import { Strategy, StrategyResponse } from "../models/Strategy";
import { Context } from "../models/Context";
import { getVolatility } from "../services/getSymbolList";

const STG_NAME = "mfiDivergency5m";
const ALLOWED_PAIRS: string[] = [
	"XLMUSDT",
	"XMRUSDT",
	"XTZUSDT",
	"ATOMUSDT",
	"ONTUSDT",
	"IOTAUSDT",
	"BATUSDT",
	"VETUSDT",
	"THETAUSDT",
	"ALGOUSDT",
	"KNCUSDT",
	"COMPUSDT",
	"DOGEUSDT",
	"KAVAUSDT",
	"BANDUSDT",
	"RLCUSDT",
	"WAVESUSDT",
	"RUNEUSDT",
	"SUSHIUSDT",
	"EGLDUSDT",
	"SOLUSDT",
	"ICXUSDT",
	"STORJUSDT",
	"BLZUSDT",
	"UNIUSDT",
	"ENJUSDT",
	"FLMUSDT",
	"NEARUSDT",
	"AAVEUSDT",
	"FILUSDT",
	"LRCUSDT",
	"OCEANUSDT",
	"AXSUSDT",
	"SKLUSDT",
	"GRTUSDT",
	"CHZUSDT",
	"SANDUSDT",
	"ANKRUSDT",
	"LITUSDT",
	"RVNUSDT",
	"SFPUSDT",
	"COTIUSDT",
	"CHRUSDT",
	"MANAUSDT",
	"ONEUSDT",
	"LINAUSDT",
	"STMXUSDT",
	"DENTUSDT",
	"CELRUSDT",
	"HOTUSDT",
	"MTLUSDT",
	"OGNUSDT",
	"NKNUSDT",
	"1000SHIBUSDT",
	"BTCDOMUSDT",
	"IOTXUSDT",
	"AUDIOUSDT",
	"C98USDT",
	"DYDXUSDT",
	"GALAUSDT",
	"CELOUSDT",
	"KLAYUSDT",
	"CTSIUSDT",
	"LPTUSDT",
	"PEOPLEUSDT",
	"ROSEUSDT",
	"FLOWUSDT",
	"IMXUSDT",
	"GMTUSDT",
	"DARUSDT",
	"OPUSDT",
	"STGUSDT",
	"1000LUNCUSDT",
	"LDOUSDT",
	"QNTUSDT",
	"FXSUSDT",
	"MAGICUSDT",
	"RNDRUSDT",
	"MINAUSDT",
	"AGIXUSDT",
	"PHBUSDT",
	"CFXUSDT",
	"STXUSDT",
	"ACHUSDT",
	"SSVUSDT",
	"LQTYUSDT",
	"IDUSDT",
	"AMBUSDT",
	"LEVERUSDT",
	"RDNTUSDT",
	"HFTUSDT",
	"EDUUSDT",
	"SUIUSDT",
	"1000FLOKIUSDT",
	"UMAUSDT",
	"RADUSDT",
	"KEYUSDT",
	"MDTUSDT",
	"XVGUSDT",
	"WLDUSDT",
	"PENDLEUSDT",
	"ARKMUSDT",
	"AGLDUSDT",
	"DODOXUSDT",
	"BNTUSDT",
	"SEIUSDT",
	"ARKUSDT",
	"FRONTUSDT",
	"GLMRUSDT",
	"BICOUSDT",
	"LOOMUSDT",
	"BONDUSDT",
	"ORBSUSDT",
	"WAXPUSDT",
	"BSVUSDT",
	"RIFUSDT",
	"POLYXUSDT",
	"POWRUSDT",
	"TIAUSDT",
	"SNTUSDT",
	"CAKEUSDT",
	"MEMEUSDT",
	"TWTUSDT",
	"ORDIUSDT",
	"BADGERUSDT",
	"ILVUSDT",
	"BEAMXUSDT",
	"SUPERUSDT",
	"USTCUSDT",
	"ETHWUSDT",
	"JTOUSDT",
	"1000SATSUSDT",
	"AUCTIONUSDT",
	"1000RATSUSDT",
	"MOVRUSDT",
	"MANTAUSDT",
	"ALTUSDT",
	"JUPUSDT",
	"ZETAUSDT",
	"PIXELUSDT",
	"STRKUSDT",
	"GLMUSDT",
	"TONUSDT",
	"AEVOUSDT",
	"VANRYUSDT",
	"BOMEUSDT",
	"ETHFIUSDT",
	"ENAUSDT",
	"TAOUSDT",
	"OMNIUSDT",
];
const stg: Strategy = {
	stgName: STG_NAME,
	lookBackLength: Context.lookBackLength,
	interval: Context.interval,
	validate: ({ candlestick, pair }) => {
		const response: StrategyResponse = {
			shouldTrade: null,
			sl: Context.defaultSL,
			tp: Context.defaultTP,
			stgName: STG_NAME,
		};

		if (candlestick.length < Context.lookBackLength) return response;
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
				response.shouldTrade = "LONG";
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
				response.shouldTrade = "SHORT";
			}
		}

		return response;
	},
};

export default stg;

// ┌────────────────┬─────────────────────┐
// │                │ Values              │
// ├────────────────┼─────────────────────┤
// │        stgName │ mfiDivergency5m     │
// │             sl │ 10.00%              │
// │             tp │ 1.00%               │
// │      startTime │ 2024 03 21 08:54:31 │
// │        endTime │ 2024 04 20 09:17:02 │
// │       lookBack │ 8640                │
// │       interval │ 5m                  │
// │ maxTradeLength │ 300                 │
// │            fee │ 0.05%               │
// │      avWinRate │ 93.78%              │
// │          avPnl │ 0.52%               │
// │       totalPnl │ 563.91%             │
// │      tradesQty │ 1094                │
// │  avTradeLength │ 36                  │
// └────────────────┴─────────────────────┘
