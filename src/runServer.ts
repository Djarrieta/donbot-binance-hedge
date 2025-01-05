import { App } from "./server/app";
import { Stats, type TimeFrame } from "./server/stats";

Bun.serve({
	port: 3000,
	async fetch(req) {
		const url = new URL(req.url);

		if (url.pathname === "/stats") {
			const sl = Number(url.searchParams.get("sl")) || 0;
			const tpSlRatio = Number(url.searchParams.get("tpSlRatio")) || 0;
			const maxTradeLength =
				Number(url.searchParams.get("maxTradeLength")) || 0;
			const pair = url.searchParams.get("pair") || "All";
			const timeFrame: TimeFrame =
				(url.searchParams.get("timeFrame") as TimeFrame) || "Backtest";

			const { head, body } = Stats({
				sl: Number(sl),
				tpSlRatio: Number(tpSlRatio),
				maxTradeLength: Number(maxTradeLength),
				pair,
				timeFrame,
			});

			return App({ head, body });
		}

		return new Response("404 Not Found", { status: 404 });
	},
});
