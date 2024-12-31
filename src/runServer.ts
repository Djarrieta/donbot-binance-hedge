import { App } from "./server/app";
import { Stats } from "./server/stats";

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
			const { head, body } = Stats({
				pair,
				sl: Number(sl),
				tpSlRatio: Number(tpSlRatio),
				maxTradeLength: Number(maxTradeLength),
			});

			return App({ head, body });
		}

		return new Response("404 Not Found", { status: 404 });
	},
});
