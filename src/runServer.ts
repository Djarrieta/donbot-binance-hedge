import { App } from "./server/app";
import { Stats } from "./server/stats";
import { Positions } from "./server/positions";
import type { TimeFrame } from "./server/utils";
import { backtestConfig } from "./config";

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
        maxProtectedPositions: backtestConfig.maxProtectedPositions,
      });

      return App({ head, body });
    }

    if (url.pathname === "/positions") {
      const sl = Number(url.searchParams.get("sl")) || 0;
      const tpSlRatio = Number(url.searchParams.get("tpSlRatio")) || 0;
      const maxTradeLength =
        Number(url.searchParams.get("maxTradeLength")) || 0;
      const pair = url.searchParams.get("pair") || "All";
      const timeFrame: TimeFrame =
        (url.searchParams.get("timeFrame") as TimeFrame) || "Backtest";

      const positionsIndex =
        Number(url.searchParams.get("positionsIndex")) || 0;

      const { head, body } = await Positions({
        sl: Number(sl),
        tpSlRatio: Number(tpSlRatio),
        maxTradeLength: Number(maxTradeLength),
        pair,
        timeFrame,
        positionsIndex,
        maxProtectedPositions: backtestConfig.maxProtectedPositions,
      });

      return App({ head, body });
    }

    return new Response("404 Not Found", { status: 404 });
  },
});
