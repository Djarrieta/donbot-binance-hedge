export type DateString = "YYYY MM DD HH:mm:ss";
export type ShortDateString = "YYYY-MM-DD";

export const getDate = (
	date?: Date | DateString | ShortDateString | number | null
) => {
	let finalDate: Date | null = null;

	if (typeof date === "number") {
		finalDate = new Date(date);
	}
	if (typeof date === "object" && date instanceof Date) {
		finalDate = new Date(date);
	}

	if (typeof date === "string" && date.length === 19) {
		const timeParts = date.split(" ");

		const year = parseInt(timeParts[0], 10);
		const month = parseInt(timeParts[1], 10);
		const day = parseInt(timeParts[2], 10);
		const hour = parseInt(timeParts[3].split(":")[0], 10);
		const min = parseInt(timeParts[3].split(":")[1], 10);
		const sec = parseInt(timeParts[3].split(":")[2], 10);

		finalDate = new Date(year, month - 1, day, hour, min, sec);
	}

	if (typeof date === "string" && date.length === 10) {
		const timeParts = date.split("-");

		const year = parseInt(timeParts[0], 10);
		const month = parseInt(timeParts[1], 10) - 1;
		const day = parseInt(timeParts[2], 10);

		finalDate = new Date(year, month, day);
	}
	if (!finalDate) {
		finalDate = new Date();
	}

	const year = finalDate.getFullYear().toString().slice(0, 4);
	const month = (finalDate.getMonth() + 1).toString().padStart(2, "0");
	const day = finalDate.getDate().toString().padStart(2, "0");
	const hour = finalDate.getHours().toString().padStart(2, "0");
	const minute = finalDate.getMinutes().toString().padStart(2, "0");
	const second = finalDate.getSeconds().toString().padStart(2, "0");

	return {
		date: finalDate,
		dateMs: finalDate.getTime(),
		dateString:
			`${year} ${month} ${day} ${hour}:${minute}:${second}` as DateString,
		shortDateString: `${year}-${month}-${day}` as ShortDateString,
	};
};
