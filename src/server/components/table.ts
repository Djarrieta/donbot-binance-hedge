type TableProps = {
	title?: string;
	headers?: string[];
	rows: string[][];
	width?: string;
};
export const Table = ({ title, headers, rows, width = "100%" }: TableProps) => {
	return `
    ${title ? `<h2>${title}</h2>` : ""}
    <table style="width: ${width}; border-collapse: collapse; margin-top: 20px;">
       ${
					headers?.length
						? `
            <thead>
                <tr style="background-color: rgba(75, 192, 192, 0.2); text-align: left;">
                    ${headers
											.map(
												(h) =>
													`<th style="padding: 8px; border-bottom: 1px solid #ddd;">${h}</th>`
											)
											.join("")}
                
                </tr>
            </thead>
        `
						: ""
				}
        <tbody>
            ${rows
							.map(
								(row, i) =>
									`<tr style="background-color: ${
										i % 2 === 0 ? "white" : "#f2f2f2"
									};">${row
										.map(
											(val) =>
												`<td style="padding: 8px; border-bottom: 1px solid #ddd;">${val}</td>`
										)
										.join("")}</tr>`
							)
							.join("")}
        </tbody>
    </table>
    `;
};
