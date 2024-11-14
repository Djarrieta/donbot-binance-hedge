import type { Trade } from "./Trade";

export type ITradeRepository = {
	getTrades: () => Promise<Trade[]>;
	addTrades: (trades: Trade[]) => Promise<void>;
};
