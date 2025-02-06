import { App } from "./server/app";
import { Stats, type TimeFrame } from "./server/stats";
import { Positions } from "./server/positions";

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

    if (url.pathname === "/positions") {
      const start = Number(url.searchParams.get("start")) || 0;
      const end = Number(url.searchParams.get("end")) || 0;
      const symbol = url.searchParams.get("symbol") || "";
      const startPrice = Number(url.searchParams.get("startPrice")) || 0;
      const endPrice = Number(url.searchParams.get("endPrice")) || 0;

      const { head, body } = Positions({
        start,
        end,
        symbol,
        startPrice,
        endPrice,
      });

      return App({ head, body });
    }

    return new Response("404 Not Found", { status: 404 });
  },
});
