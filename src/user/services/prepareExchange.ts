import cliProgress from "cli-progress";

import { params } from "../../Params";
import { getPairList } from "../../symbol/services/getPairList";
import { userSeedList } from "../../userSeed";
import Binance from "binance-api-node";

export const prepareExchange = async () => {
	const progressBar = new cliProgress.SingleBar(
		{},
		cliProgress.Presets.shades_classic
	);
	console.log(
		"Setting leverage and market type for all users and all symbols."
	);

	const pairList = await getPairList();
	const totalLoop = pairList.length * userSeedList.length;
	progressBar.start(totalLoop, 0);
	let loop = 0;

	for (let index = 0; index < userSeedList.length; index++) {
		const user = userSeedList[index];
		const authExchange = Binance({
			apiKey: user.binanceApiKey,
			apiSecret: user.binanceApiSecret || "",
		});
		for (const pair of pairList) {
			try {
				await authExchange.futuresLeverage({
					symbol: pair,
					leverage: params.leverage,
				});
				await authExchange.futuresMarginType({
					symbol: pair,
					marginType: "CROSSED",
				});
			} catch (e: any) {
				if (e.code != "-4046") {
					console.log(
						"There were a problem setting leverage for " +
							user.name +
							" in " +
							pair
					);
				}
			}

			progressBar.update(++loop);
		}
	}

	progressBar.update(totalLoop);
	progressBar.stop();
};
prepareExchange();
