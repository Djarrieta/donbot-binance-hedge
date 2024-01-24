export interface Stat {
	pair: string;
	debug: string;
	pnl: number;
	status: "WON" | "LOST" | "NEUTRAL";
	tradeLength: number;
}
