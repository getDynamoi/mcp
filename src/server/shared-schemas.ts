import * as z from "zod/v4";

export const ToolFormatSchema = z.enum(["json", "summary"]);

const IsoDateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);

export const UserIntentSummarySchema = z.string().trim().max(500).optional();

export const ClientRequestIdSchema = z.string().uuid().optional();

export const RequiredClientRequestIdSchema = z.string().uuid();

function isValidCalendarDate(value: string): boolean {
	const date = new Date(`${value}T00:00:00.000Z`);
	return (
		Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === value
	);
}

export const IsoCalendarDateSchema = IsoDateSchema.refine(isValidCalendarDate, {
	message: "must be a valid calendar date",
});

export const DateRangeSchema = z
	.object({
		end: IsoDateSchema,
		start: IsoDateSchema,
	})
	.strict()
	.superRefine((data, ctx) => {
		if (!isValidCalendarDate(data.start)) {
			ctx.addIssue({
				code: "custom",
				message: "start must be a valid calendar date",
				path: ["start"],
			});
		}
		if (!isValidCalendarDate(data.end)) {
			ctx.addIssue({
				code: "custom",
				message: "end must be a valid calendar date",
				path: ["end"],
			});
		}
		if (
			isValidCalendarDate(data.start) &&
			isValidCalendarDate(data.end) &&
			data.start > data.end
		) {
			ctx.addIssue({
				code: "custom",
				message: "start must be on or before end",
				path: ["start"],
			});
		}
	});
