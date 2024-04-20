import { rsi } from "technicalindicators";
import { Strategy, StrategyResponse } from "../models/Strategy";
import { Context } from "../models/Context";
import { getVolatility } from "../services/getSymbolList";

const STG_NAME = "rsiDivergency5m";
const ALLOWED_PAIRS: string[] = [
	"XMRUSDT",
	"IOTAUSDT",
	"BATUSDT",
	"VETUSDT",
	"ZILUSDT",
	"KAVAUSDT",
	"MKRUSDT",
	"SNXUSDT",
	"YFIUSDT",
	"RUNEUSDT",
	"SUSHIUSDT",
	"EGLDUSDT",
	"ICXUSDT",
	"STORJUSDT",
	"BLZUSDT",
	"FTMUSDT",
	"ENJUSDT",
	"KSMUSDT",
	"NEARUSDT",
	"FILUSDT",
	"LRCUSDT",
	"OCEANUSDT",
	"AXSUSDT",
	"ZENUSDT",
	"GRTUSDT",
	"1INCHUSDT",
	"CHZUSDT",
	"SANDUSDT",
	"UNFIUSDT",
	"REEFUSDT",
	"XEMUSDT",
	"COTIUSDT",
	"MANAUSDT",
	"ONEUSDT",
	"STMXUSDT",
	"CELRUSDT",
	"HOTUSDT",
	"MTLUSDT",
	"NKNUSDT",
	"1000SHIBUSDT",
	"IOTXUSDT",
	"AUDIOUSDT",
	"C98USDT",
	"MASKUSDT",
	"ARUSDT",
	"KLAYUSDT",
	"ARPAUSDT",
	"CTSIUSDT",
	"LPTUSDT",
	"ENSUSDT",
	"API3USDT",
	"APEUSDT",
	"JASMYUSDT",
	"DARUSDT",
	"INJUSDT",
	"1000LUNCUSDT",
	"LDOUSDT",
	"ICPUSDT",
	"FETUSDT",
	"FXSUSDT",
	"MAGICUSDT",
	"TUSDT",
	"RNDRUSDT",
	"HIGHUSDT",
	"ASTRUSDT",
	"AGIXUSDT",
	"PHBUSDT",
	"BNXUSDT",
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
	"XVSUSDT",
	"BLURUSDT",
	"IDEXUSDT",
	"1000PEPEUSDT",
	"1000FLOKIUSDT",
	"UMAUSDT",
	"KEYUSDT",
	"NMRUSDT",
	"MAVUSDT",
	"XVGUSDT",
	"ARKMUSDT",
	"AGLDUSDT",
	"DODOXUSDT",
	"BNTUSDT",
	"SEIUSDT",
	"HIFIUSDT",
	"ARKUSDT",
	"FRONTUSDT",
	"GLMRUSDT",
	"BONDUSDT",
	"STPTUSDT",
	"BSVUSDT",
	"RIFUSDT",
	"POLYXUSDT",
	"POWRUSDT",
	"SLPUSDT",
	"TIAUSDT",
	"SNTUSDT",
	"CAKEUSDT",
	"MEMEUSDT",
	"TWTUSDT",
	"TOKENUSDT",
	"ORDIUSDT",
	"KASUSDT",
	"BEAMXUSDT",
	"1000BONKUSDT",
	"USTCUSDT",
	"ETHWUSDT",
	"JTOUSDT",
	"AUCTIONUSDT",
	"1000RATSUSDT",
	"AIUSDT",
	"MANTAUSDT",
	"ONDOUSDT",
	"ALTUSDT",
	"JUPUSDT",
	"ZETAUSDT",
	"DYMUSDT",
	"PIXELUSDT",
	"MAVIAUSDT",
	"MYROUSDT",
	"VANRYUSDT",
	"BOMEUSDT",
	"ENAUSDT",
	"WUSDT",
	"TNSRUSDT",
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
				response.shouldTrade = "LONG";
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
// │        stgName │ rsiDivergency5m     │
// │             sl │ 10.00%              │
// │             tp │ 1.00%               │
// │      startTime │ 2024 03 21 13:06:39 │
// │        endTime │ 2024 04 20 13:31:36 │
// │       lookBack │ 8640                │
// │       interval │ 5m                  │
// │ maxTradeLength │ 300                 │
// │            fee │ 0.05%               │
// │      avWinRate │ 94.84%              │
// │          avPnl │ 0.71%               │
// │       totalPnl │ 632.34%             │
// │      tradesQty │ 892                 │
// │  avTradeLength │ 24                  │
// └────────────────┴─────────────────────┘
