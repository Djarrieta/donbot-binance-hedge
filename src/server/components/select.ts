type SelectProps = {
	selected: string;
	options: { value: string; label: string }[];
};
export const Select = ({
	options,
	selected,
}: SelectProps) => `<div style="margin-top: 20px;">
    <select onchange="location = this.value;" style="width: 200px; font-size: 16px; padding: 5px;">
        ${options
					.map(
						(o) => `
                <option value=${o.value}
                    ${selected === o.value ? "selected" : ""}>
                    ${o.label}
                </option>
            `
					)
					.join("")}
    </select>
</div>`;
