type AnchorProps = {
	label: string;
	href: string;
};
export const Anchor = ({ label, href }: AnchorProps) => {
	return `<a style="display: block; margin-bottom: 5px; text-decoration: none; color: #0070f3;" href="${href}" onmouseover="this.style.textDecoration='underline'" onmouseout="this.style.textDecoration='none'">${label}</a>`;
};
