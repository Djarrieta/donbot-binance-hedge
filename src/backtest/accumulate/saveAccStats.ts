import cliProgress from "cli-progress";
import { params } from "../../Params";
import { accumulate } from ".";
import { withRetry } from "../../utils/withRetry";
import { deleteTableService, insertAccStatsBTService } from "../../db/db";

export const saveAccStats = async () => {
	deleteTableService("statsAccBT");

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
				insertAccStatsBTService(result);

				loop++;
				progressBar.update(loop);
			}
		}
	}
	progressBar.update(loopSize);
	progressBar.stop();
};

await saveAccStats();
