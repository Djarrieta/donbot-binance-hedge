import { App } from "./server/app";
import { Pairs } from "./server/pairs";

Bun.serve({
	port: 3000,
	async fetch(req) {
		const url = new URL(req.url);

		if (url.pathname.startsWith("/pairs/") && url.pathname.split("/")[2]) {
			const pair = url.pathname.split("/")[2];
			const sl = Number(url.searchParams.get("sl")) || 0;
			const tpSlRatio = Number(url.searchParams.get("tpSlRatio")) || 0;
			const maxTradeLength =
				Number(url.searchParams.get("maxTradeLength")) || 0;
			const { head, body } = Pairs({
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
