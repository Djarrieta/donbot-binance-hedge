import { OrderType } from "../sharedModels/Order";
import type { PositionSide } from "../sharedModels/Position";

export const ORDER_ID_DIV = "__";

type NewOrderId = {
	positionSide: PositionSide;
	price: string;
	orderType: OrderType;
};

export const orderIdNameGenerator = (props: NewOrderId | string) => {
	const response = {
		positionSide: "",
		price: "0",
		orderType: OrderType.UNKNOWN,
		fullIdName: "",
	};

	if (typeof props === "string") {
		const split = props.split(ORDER_ID_DIV);
		if (split.length !== 3) return response;

		response.positionSide = (split[0] as PositionSide) || "";
		response.orderType = (split[1] as OrderType) || OrderType.UNKNOWN;
		response.price = split[2] || "0";
		response.fullIdName = props;

		return response;
	}

	const { positionSide, orderType, price } = props;
	const fullIdName =
		positionSide + ORDER_ID_DIV + orderType + ORDER_ID_DIV + price;

	response.positionSide = positionSide;
	response.price = price;
	response.orderType = orderType;
	response.fullIdName = fullIdName;

	return response;
};
