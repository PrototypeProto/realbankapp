/** Formats a number as currency. Amounts arrive from the API as plain numbers. */
interface MoneyProps {
	value: number;
	currency?: string;
}

export function Money({ value, currency = "USD" }: MoneyProps) {
	// TODO: pick your locale/currency. Intl handles the 2dp + grouping.
	const formatted = new Intl.NumberFormat(undefined, {
		style: "currency",
		currency,
	}).format(value);
	return <span className="money">{formatted}</span>;
}
