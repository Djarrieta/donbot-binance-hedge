import cliProgress from "cli-progress";
import { InitialParams } from "../../InitialParams";
import { db } from "../../db";
import { accumulate } from ".";
import { statsAccBT } from "../../schema";

export const saveAccStats = async () => {
	await db.delete(statsAccBT);

	const {
		backtestSLArray: slArray,
		backtestTPArray: tpArray,
		backtestMaxTradeLengthArray: maxTradeLengthArray,
	} = InitialParams;

	const loopSize = slArray.length * tpArray.length * maxTradeLengthArray.length;
	const progressBar = new cliProgress.SingleBar(
		{},
		cliProgress.Presets.shades_classic
	);
	progressBar.start(loopSize, 0);

	let loop = 1;
	for (const maxTradeLength of maxTradeLengthArray) {
		for (const tp of slArray) {
			for (const sl of tpArray) {
				InitialParams.defaultSL = sl;
				InitialParams.defaultTP = tp;
				InitialParams.maxTradeLength = maxTradeLength;
				const result = await accumulate();

				await db.insert(statsAccBT).values(result);
				loop++;
				progressBar.update(loop);
			}
		}
	}
	progressBar.update(loopSize);
	progressBar.stop();
};

await saveAccStats();
