import type { ReactNode } from "react";

/** A labelled form control wrapper. Pass an input/select as children. */
interface FieldProps {
	label: string;
	htmlFor: string;
	error?: string;
	children: ReactNode;
}

export function Field({ label, htmlFor, error, children }: FieldProps) {
	return (
		<div className="field">
			<label htmlFor={htmlFor}>{label}</label>
			{children}
			{error ? <span className="field__error">{error}</span> : null}
		</div>
	);
}
