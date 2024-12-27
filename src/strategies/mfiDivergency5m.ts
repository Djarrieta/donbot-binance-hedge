import { mfi } from "technicalindicators";
import { Interval } from "../domain/Interval";
import { Strategy, type StrategyResponse } from "../domain/Strategy";
import { getVolatility } from "../utils/getVolatility";

export const stg = new Strategy({
	stgName: "mfiDivergency5m",
	lookBackLength: 200,
	interval: Interval["5m"],
	allowedPairs: [
		"DYDXUSDT",
		"MANAUSDT",
		"RUNEUSDT",
		"C98USDT",
		"1INCHUSDT",
		"LISTAUSDT",
		"XMRUSDT",
		"ONEUSDT",
		"STGUSDT",
		"PERPUSDT",
		"ARPAUSDT",
		"SANDUSDT",
		"MAGICUSDT",
		"GRTUSDT",
		"IOTAUSDT",
		"APEUSDT",
		"MOVRUSDT",
		"BOMEUSDT",
		"CHZUSDT",
		"HFTUSDT",
		"BADGERUSDT",
		"ZILUSDT",
		"WUSDT",
		"EOSUSDT",
		"FTMUSDT",
		"BSVUSDT",
		"DOGEUSDT",
		"XTZUSDT",
		"CELRUSDT",
		"THETAUSDT",
		"PHBUSDT",
		"COTIUSDT",
		"TRUUSDT",
		"MINAUSDT",
		"XAIUSDT",
		"WAXPUSDT",
		"ZRXUSDT",
		"COMPUSDT",
		"TAOUSDT",
		"TLMUSDT",
		"COMBOUSDT",
		"WLDUSDT",
		"MTLUSDT",
		"ROSEUSDT",
		"SUSHIUSDT",
		"ALGOUSDT",
		"JTOUSDT",
		"OMGUSDT",
		"NEOUSDT",
		"BANDUSDT",
		"GMTUSDT",
		"CELOUSDT",
		"XVGUSDT",
		"DARUSDT",
		"DUSKUSDT",
		"TWTUSDT",
		"POWRUSDT",
		"1000XECUSDT",
		"KAVAUSDT",
		"FILUSDT",
		"NKNUSDT",
		"STORJUSDT",
		"STEEMUSDT",
		"REZUSDT",
		"NFPUSDT",
		"1000RATSUSDT",
		"GMXUSDT",
		"ARKMUSDT",
		"AIUSDT",
		"OXTUSDT",
		"ONTUSDT",
		"ETHFIUSDT",
		"PYTHUSDT",
		"RVNUSDT",
		"OPUSDT",
		"SSVUSDT",
		"JUPUSDT",
		"LITUSDT",
		"PORTALUSDT",
		"ARKUSDT",
		"SPELLUSDT",
		"MAVUSDT",
		"ZENUSDT",
		"LPTUSDT",
		"HOTUSDT",
		"ADAUSDT",
		"CTSIUSDT",
		"HOOKUSDT",
		"EDUUSDT",
		"ZETAUSDT",
		"PIXELUSDT",
		"RDNTUSDT",
		"OMNIUSDT",
		"LUNA2USDT",
		"TIAUSDT",
		"TURBOUSDT",
		"1000SHIBUSDT",
		"BELUSDT",
		"CFXUSDT",
		"LINAUSDT",
		"ILVUSDT",
		"ARUSDT",
		"IOTXUSDT",
		"ICXUSDT",
		"OMUSDT",
		"STXUSDT",
		"ORDIUSDT",
		"ALTUSDT",
		"FXSUSDT",
		"GTCUSDT",
		"TONUSDT",
		"BATUSDT",
		"LRCUSDT",
		"NOTUSDT",
		"SUIUSDT",
		"DEFIUSDT",
		"GLMUSDT",
		"IMXUSDT",
		"RLCUSDT",
		"KASUSDT",
		"STRKUSDT",
		"ACHUSDT",
		"1000FLOKIUSDT",
		"OGNUSDT",
		"ARBUSDT",
		"PENDLEUSDT",
		"TUSDT",
		"CAKEUSDT",
		"BEAMXUSDT",
		"FLMUSDT",
		"BIGTIMEUSDT",
		"JOEUSDT",
		"TOKENUSDT",
		"BAKEUSDT",
		"HIGHUSDT",
		"ASTRUSDT",
		"CKBUSDT",
		"BNTUSDT",
		"1000SATSUSDT",
		"WIFUSDT",
		"WOOUSDT",
		"BLURUSDT",
		"SNXUSDT",
		"AGLDUSDT",
		"API3USDT",
		"FLOWUSDT",
		"ATOMUSDT",
		"LSKUSDT",
		"AXLUSDT",
		"CHRUSDT",
		"SAGAUSDT",
		"DODOXUSDT",
		"TRBUSDT",
		"CRVUSDT",
		"VETUSDT",
		"DYMUSDT",
		"APTUSDT",
		"ETHWUSDT",
		"NEARUSDT",
		"MKRUSDT",
		"KSMUSDT",
		"ACEUSDT",
		"ENAUSDT",
		"USTCUSDT",
		"IDUSDT",
		"VANRYUSDT",
		"ANKRUSDT",
		"SXPUSDT",
		"SKLUSDT",
		"JASMYUSDT",
		"TNSRUSDT",
		"RSRUSDT",
		"ALICEUSDT",
		"STMXUSDT",
		"1000BONKUSDT",
		"XLMUSDT",
		"NMRUSDT",
		"ALPHAUSDT",
		"ENJUSDT",
		"DASHUSDT",
		"ONDOUSDT",
		"REEFUSDT",
		"IOUSDT",
		"MANTAUSDT",
		"FETUSDT",
		"KNCUSDT",
		"NTRNUSDT",
		"ATAUSDT",
		"SEIUSDT",
		"AUCTIONUSDT",
		"DENTUSDT",
		"GASUSDT",
		"1000LUNCUSDT",
		"SUPERUSDT",
		"AMBUSDT",
		"MYROUSDT",
		"AEVOUSDT",
		"GALAUSDT",
		"XVSUSDT",
		"MEWUSDT",
		"BLZUSDT",
		"UMAUSDT",
		"HIFIUSDT",
		"ZECUSDT",
		"ZROUSDT",
		"BALUSDT",
		"MEMEUSDT",
		"LQTYUSDT",
		"METISUSDT",
		"POLYXUSDT",
		"RIFUSDT",
		"1000PEPEUSDT",
		"XRPUSDT",
		"LDOUSDT",
		"ONGUSDT",
		"QTUMUSDT",
		"IOSTUSDT",
		"PEOPLEUSDT",
		"BNXUSDT",
		"ZKUSDT",
		"RONINUSDT",
		"ENSUSDT",
		"CYBERUSDT",
		"LEVERUSDT",
		"BBUSDT",
		"YGGUSDT",
		"INJUSDT",
		"BICOUSDT",
	],
	validate({ candlestick, pair }) {
		const response: StrategyResponse = {
			positionSide: null,
			stgName: this.stgName,
			pair,
		};

		if (candlestick.length < this.lookBackLength) return response;
		if (this.allowedPairs?.length && !this.allowedPairs.includes(pair))
			return response;

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
		const lastPrice = candlestickValues[candlestickValues.length - 1];

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
				const minPrevPrice = Math.min(
					...candlestick.slice(-CANDLESTICK_SIZE).map((candle) => candle.low)
				);
				let sl = (lastPrice - minPrevPrice) / lastPrice;

				response.positionSide = "LONG";
				response.sl = sl;
			}
		}

		if (
			volatility > MIN_VOL &&
			volatility < MAX_VOL &&
			mfiArray[mfiArray.length - 1] >= 80 &&
			mfiArray[mfiArray.length - 2] >= 80 &&
			mfiArray[mfiArray.length - 1] < mfiArray[mfiArray.length - 2]
		) {
			const firstZeroCrossingIndex = [...mfiArray]
				.reverse()
				.findIndex((arrayVal) => arrayVal < 80);

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
				const maxPrevPrice = Math.max(
					...candlestick.slice(-CANDLESTICK_SIZE).map((candle) => candle.high)
				);

				let sl = (maxPrevPrice - lastPrice) / lastPrice;

				response.sl = sl;
				response.positionSide = "SHORT";
			}
		}

		return response;
	},
});
