import { App } from "./server/app";
import { Stats } from "./server/stats";
import { StatsByPair } from "./server/statsByPair";

Bun.serve({
	port: 3000,
	async fetch(req) {
		const url = new URL(req.url);

		if (url.pathname.startsWith("/stats/") && url.pathname.split("/")[2]) {
			const pair = url.pathname.split("/")[2];
			const sl = Number(url.searchParams.get("sl")) || 0;
			const tpSlRatio = Number(url.searchParams.get("tpSlRatio")) || 0;
			const maxTradeLength =
				Number(url.searchParams.get("maxTradeLength")) || 0;
			const { head, body } = StatsByPair({
				pair,
				sl: Number(sl),
				tpSlRatio: Number(tpSlRatio),
				maxTradeLength: Number(maxTradeLength),
			});

			return App({ head, body });
		}

		if (url.pathname === "/stats") {
			const sl = Number(url.searchParams.get("sl")) || 0;
			const tpSlRatio = Number(url.searchParams.get("tpSlRatio")) || 0;
			const recommendedPairs =
				url.searchParams.get("recommendedPairs") === "true";
			const maxTradeLength =
				Number(url.searchParams.get("maxTradeLength")) || 0;
			const { head, body } = Stats({
				sl: Number(sl),
				tpSlRatio: Number(tpSlRatio),
				maxTradeLength: Number(maxTradeLength),
				recommendedPairs,
			});

			return App({ head, body });
		}

		return new Response("404 Not Found", { status: 404 });
	},
});
