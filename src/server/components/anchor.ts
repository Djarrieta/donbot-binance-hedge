type AnchorProps = {
  label: string;
  href: string;
  disabled?: boolean;
};
export const Anchor = ({ label, href, disabled }: AnchorProps) => {
  return `<a disabled=${disabled} style="display: block; margin-bottom: 5px; text-decoration: none; color: #0070f3;" href="${href}" onmouseover="this.style.textDecoration='underline'" onmouseout="this.style.textDecoration='none'">${label}</a>`;
};
