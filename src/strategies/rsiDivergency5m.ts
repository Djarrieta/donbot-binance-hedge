import { rsi } from "technicalindicators";
import { Strategy, StrategyResponse } from "../models/Strategy";
import { Context } from "../models/Context";
import { getVolatility } from "../services/getSymbolList";

const STG_NAME = "rsiDivergency5m";
const ALLOWED_PAIRS: string[] = [
	"XRPUSDT",
	"XMRUSDT",
	"DASHUSDT",
	"XTZUSDT",
	"IOTAUSDT",
	"BATUSDT",
	"VETUSDT",
	"IOSTUSDT",
	"COMPUSDT",
	"SXPUSDT",
	"KAVAUSDT",
	"BANDUSDT",
	"MKRUSDT",
	"SNXUSDT",
	"DOTUSDT",
	"YFIUSDT",
	"BALUSDT",
	"SUSHIUSDT",
	"EGLDUSDT",
	"ICXUSDT",
	"STORJUSDT",
	"BLZUSDT",
	"FTMUSDT",
	"ENJUSDT",
	"FLMUSDT",
	"KSMUSDT",
	"NEARUSDT",
	"FILUSDT",
	"LRCUSDT",
	"MATICUSDT",
	"OCEANUSDT",
	"1INCHUSDT",
	"CHZUSDT",
	"SANDUSDT",
	"ANKRUSDT",
	"UNFIUSDT",
	"REEFUSDT",
	"SFPUSDT",
	"COTIUSDT",
	"MANAUSDT",
	"ONEUSDT",
	"LINAUSDT",
	"CELRUSDT",
	"HOTUSDT",
	"MTLUSDT",
	"NKNUSDT",
	"1000SHIBUSDT",
	"IOTXUSDT",
	"AUDIOUSDT",
	"C98USDT",
	"MASKUSDT",
	"ATAUSDT",
	"DYDXUSDT",
	"KLAYUSDT",
	"ARPAUSDT",
	"CTSIUSDT",
	"ENSUSDT",
	"ROSEUSDT",
	"FLOWUSDT",
	"API3USDT",
	"APEUSDT",
	"WOOUSDT",
	"DARUSDT",
	"INJUSDT",
	"SPELLUSDT",
	"1000LUNCUSDT",
	"LDOUSDT",
	"CVXUSDT",
	"ICPUSDT",
	"APTUSDT",
	"QNTUSDT",
	"MAGICUSDT",
	"TUSDT",
	"RNDRUSDT",
	"HIGHUSDT",
	"MINAUSDT",
	"ASTRUSDT",
	"AGIXUSDT",
	"PHBUSDT",
	"CFXUSDT",
	"STXUSDT",
	"BNXUSDT",
	"SSVUSDT",
	"CKBUSDT",
	"PERPUSDT",
	"TRUUSDT",
	"IDUSDT",
	"ARBUSDT",
	"AMBUSDT",
	"RDNTUSDT",
	"HFTUSDT",
	"XVSUSDT",
	"BLURUSDT",
	"IDEXUSDT",
	"UMAUSDT",
	"RADUSDT",
	"KEYUSDT",
	"NMRUSDT",
	"MAVUSDT",
	"MDTUSDT",
	"XVGUSDT",
	"WLDUSDT",
	"PENDLEUSDT",
	"DODOXUSDT",
	"BNTUSDT",
	"SEIUSDT",
	"ARKUSDT",
	"BONDUSDT",
	"RIFUSDT",
	"POWRUSDT",
	"SLPUSDT",
	"TIAUSDT",
	"SNTUSDT",
	"CAKEUSDT",
	"MEMEUSDT",
	"TWTUSDT",
	"BADGERUSDT",
	"KASUSDT",
	"BEAMXUSDT",
	"1000BONKUSDT",
	"USTCUSDT",
	"ETHWUSDT",
	"JTOUSDT",
	"1000SATSUSDT",
	"AUCTIONUSDT",
	"1000RATSUSDT",
	"AIUSDT",
	"XAIUSDT",
	"MANTAUSDT",
	"ONDOUSDT",
	"LSKUSDT",
	"ALTUSDT",
	"JUPUSDT",
	"ZETAUSDT",
	"DYMUSDT",
	"PIXELUSDT",
	"MAVIAUSDT",
	"TONUSDT",
	"MYROUSDT",
	"BOMEUSDT",
	"ETHFIUSDT",
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
// │      startTime │ 2024 03 21 08:32:07 │
// │        endTime │ 2024 04 20 08:54:31 │
// │       lookBack │ 8640                │
// │       interval │ 5m                  │
// │ maxTradeLength │ 300                 │
// │            fee │ 0.05%               │
// │      avWinRate │ 95.03%              │
// │          avPnl │ 0.50%               │
// │       totalPnl │ 436.19%             │
// │      tradesQty │ 865                 │
// │  avTradeLength │ 24                  │
// └────────────────┴─────────────────────┘
