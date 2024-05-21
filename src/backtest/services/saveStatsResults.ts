import cliProgress from "cli-progress";
import { InitialParams } from "../../InitialParams";
import { db } from "../../db";
import { statsBT } from "../../schema";
import { accumulate } from "../accumulate";

type SaveStatsResultsProps = {
	slArray: number[];
	tpArray: number[];
	maxTradeLengthArray: number[];
};

export const saveStatsResults = async ({
	slArray,
	tpArray,
	maxTradeLengthArray,
}: SaveStatsResultsProps) => {
	await db.delete(statsBT);

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

				await db.insert(statsBT).values(result);
				loop++;
				progressBar.update(loop);
			}
		}
	}
	progressBar.update(loopSize);
	progressBar.stop();
};

await saveStatsResults({
	slArray: [15 / 100, 10 / 100],
	tpArray: [15 / 100, 10 / 100],
	maxTradeLengthArray: [50, 100],
});
