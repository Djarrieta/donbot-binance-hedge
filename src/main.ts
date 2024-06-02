import { getSymbolsData } from "./symbol/services/getSymbolsData";
import { getUsersData } from "./user/services/getUsersData";

const trade = async () => {
	const symbolList = await getSymbolsData();
	const userList = await getUsersData();
	console.log(userList);
};
trade();
