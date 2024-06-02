import { getUsersData } from "./user/services/getUsersData";

const trade = async () => {
	const userList = await getUsersData();
	console.log(userList);
};
trade();
