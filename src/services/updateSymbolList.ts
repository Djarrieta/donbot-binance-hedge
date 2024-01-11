import Binance from "binance-api-node";

export const updateSymbolList = async () => {
	const exchange = Binance();
	const r=exchange.ws.customSubStream("!markPrice@arr@1s", console.log);
};
