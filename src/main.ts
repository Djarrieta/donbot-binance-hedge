import { Context } from "./Context";
import { params } from "./Params";
import { getSymbolsData } from "./symbol/services/getSymbolsData";
import { getUsersData } from "./user/services/getUsersData";

const trade = async () => {
	const symbolList = await getSymbolsData();
	const userList = await getUsersData();
	const context = await Context.getInstance({
		symbolList,
		userList,
	});

	if (!context) return;

	console.log(context);
};
trade();
