import cliProgress from "cli-progress";
import { params } from "../../Params";
import { db } from "../../db/db";
import { accumulate } from ".";
import { statsAccBT } from "../../db/schema";
import { withRetry } from "../../utils/withRetry";

export const saveAccStats = async () => {
	await withRetry(async () => await db.delete(statsAccBT));

	const {
		backtestSLArray: slArray,
		backtestTPArray: tpArray,
		backtestMaxTradeLengthArray: maxTradeLengthArray,
	} = params;

	const loopSize = slArray.length * tpArray.length * maxTradeLengthArray.length;
	const progressBar = new cliProgress.SingleBar(
		{},
		cliProgress.Presets.shades_classic
	);
	progressBar.start(loopSize, 0);

	let loop = 1;
	for (const maxTradeLength of maxTradeLengthArray) {
		for (const tp of tpArray) {
			for (const sl of slArray) {
				params.defaultSL = sl;
				params.defaultTP = tp;
				params.maxTradeLength = maxTradeLength;
				const result = await accumulate({ log: false });

				if (!result) continue;
				await withRetry(async () => await db.insert(statsAccBT).values(result));

				loop++;
				progressBar.update(loop);
			}
		}
	}
	progressBar.update(loopSize);
	progressBar.stop();
};

await saveAccStats();
