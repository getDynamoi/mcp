import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import * as z from "zod/v4";
import type { ResultEnvelope } from "../types";
import { AnyOutputEnvelopeSchema } from "./output-schemas";

export const SMART_LINK_THEME_PREVIEW_RESOURCE_URI =
	"ui://dynamoi/smart-link-theme-preview-v1.html";

const SampleTextSchema = z.string().trim().min(1).max(80);

const DynamoiPreviewSmartLinkThemesInputSchema = z
	.object({
		artistName: SampleTextSchema.optional(),
		releaseTitle: SampleTextSchema.optional(),
	})
	.strict();

export type SmartLinkThemePreviewData = {
	artistName: string;
	releaseTitle: string;
	summary: string;
	themes: Array<{
		accentColor: string;
		backgroundColor: string;
		description: string;
		id: "classic" | "brutalist" | "aurora" | "cinematic";
		name: string;
		textColor: string;
	}>;
	widgetResourceUri: typeof SMART_LINK_THEME_PREVIEW_RESOURCE_URI;
};

export const SMART_LINK_THEME_PREVIEW_TOOL_DEFINITION = {
	description:
		"Use this when the user asks what Dynamoi Smart Link pages can look like, wants to compare Smart Link themes, or asks to preview the available themes before creating or updating a free Smart Link. This is a read-only visual preview and does not create, publish, update, or promote a Smart Link.",
	destructiveHint: false,
	name: "dynamoi_preview_smart_link_themes",
	openWorldHint: false,
	outputSchema: AnyOutputEnvelopeSchema,
	readOnlyHint: true,
	schema: DynamoiPreviewSmartLinkThemesInputSchema,
	title: "Preview Smart Link Themes",
} as const;

export function previewSmartLinkThemes(
	rawInput: unknown,
): ResultEnvelope<SmartLinkThemePreviewData> {
	const input = DynamoiPreviewSmartLinkThemesInputSchema.parse(rawInput ?? {});
	const artistName = input.artistName ?? "Dynamoi Artist";
	const releaseTitle = input.releaseTitle ?? "New Single";
	const themes: SmartLinkThemePreviewData["themes"] = [
		{
			accentColor: "#2ef2a2",
			backgroundColor: "#f8f6ef",
			description:
				"Clean editorial layout for release pages that should feel calm and polished.",
			id: "classic",
			name: "Classic",
			textColor: "#171717",
		},
		{
			accentColor: "#ffe45c",
			backgroundColor: "#111111",
			description:
				"Bold, poster-like treatment for artists who want sharp contrast and direct calls to action.",
			id: "brutalist",
			name: "Brutalist",
			textColor: "#f5f5f5",
		},
		{
			accentColor: "#73f7ff",
			backgroundColor: "#12172f",
			description:
				"Color-rich gradient atmosphere for pop, electronic, and high-energy releases.",
			id: "aurora",
			name: "Aurora",
			textColor: "#f8fbff",
		},
		{
			accentColor: "#ffb36b",
			backgroundColor: "#191512",
			description:
				"Moody cover-forward layout for cinematic, intimate, or premium release moments.",
			id: "cinematic",
			name: "Cinematic",
			textColor: "#fff6eb",
		},
	];

	return {
		data: {
			artistName,
			releaseTitle,
			summary:
				"Dynamoi Smart Links support four visual themes: Classic, Brutalist, Aurora, and Cinematic.",
			themes,
			widgetResourceUri: SMART_LINK_THEME_PREVIEW_RESOURCE_URI,
		},
		status: "success",
	};
}

const SMART_LINK_THEME_PREVIEW_HTML = `
<div class="shell">
	<header>
		<p class="eyebrow">Smart Link themes</p>
		<h1 id="title">New Single</h1>
		<p id="artist">Dynamoi Artist</p>
	</header>
	<section id="themes" class="themes" aria-label="Smart Link theme previews"></section>
</div>
<script>
const fallback = {
	artistName: "Dynamoi Artist",
	releaseTitle: "New Single",
	themes: [
		{ id: "classic", name: "Classic", description: "Clean editorial layout for release pages that should feel calm and polished.", backgroundColor: "#f8f6ef", textColor: "#171717", accentColor: "#2ef2a2" },
		{ id: "brutalist", name: "Brutalist", description: "Bold, poster-like treatment for artists who want sharp contrast and direct calls to action.", backgroundColor: "#111111", textColor: "#f5f5f5", accentColor: "#ffe45c" },
		{ id: "aurora", name: "Aurora", description: "Color-rich gradient atmosphere for pop, electronic, and high-energy releases.", backgroundColor: "#12172f", textColor: "#f8fbff", accentColor: "#73f7ff" },
		{ id: "cinematic", name: "Cinematic", description: "Moody cover-forward layout for cinematic, intimate, or premium release moments.", backgroundColor: "#191512", textColor: "#fff6eb", accentColor: "#ffb36b" }
	]
};
function normalize(output) {
	const candidate = output?.data ?? output?.structuredContent?.data ?? output?.structuredContent ?? output;
	return candidate?.themes ? candidate : fallback;
}
function render(output) {
	const data = normalize(output);
	document.getElementById("title").textContent = data.releaseTitle ?? fallback.releaseTitle;
	document.getElementById("artist").textContent = data.artistName ?? fallback.artistName;
	document.getElementById("themes").innerHTML = data.themes.map((theme) => {
		const style = "background:" + theme.backgroundColor + ";color:" + theme.textColor + ";";
		return '<article class="theme theme-' + theme.id + '" style="' + style + '">' +
			'<div class="cover" style="background:' + theme.accentColor + '"><span></span></div>' +
			'<div class="theme-copy"><h2>' + theme.name + '</h2><p>' + theme.description + '</p></div>' +
			'<span class="preview-cta" style="border-color:' + theme.accentColor + ';color:' + theme.textColor + '">Listen on Spotify</span>' +
		'</article>';
	}).join("");
}
render(window.openai?.toolOutput);
window.addEventListener("openai:set_globals", (event) => {
	render(event.detail?.globals?.toolOutput ?? window.openai?.toolOutput);
}, { passive: true });
</script>
<style>
:root {
	color-scheme: light dark;
	font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
}
* { box-sizing: border-box; }
body { margin: 0; }
.shell {
	background: #f4f1e8;
	color: #151515;
	min-height: 100vh;
	padding: 18px;
}
header {
	display: grid;
	gap: 3px;
	margin: 0 0 14px;
}
.eyebrow {
	color: #5f675f;
	font-size: 12px;
	font-weight: 700;
	letter-spacing: 0;
	margin: 0;
	text-transform: uppercase;
}
h1 {
	font-size: 28px;
	line-height: 1;
	margin: 0;
}
header p:last-child {
	color: #59605a;
	font-size: 14px;
	margin: 0;
}
.themes {
	display: grid;
	gap: 12px;
	grid-template-columns: repeat(2, minmax(0, 1fr));
}
.theme {
	border-radius: 8px;
	display: grid;
	gap: 10px;
	min-height: 232px;
	overflow: hidden;
	padding: 12px;
}
.cover {
	aspect-ratio: 1;
	border-radius: 6px;
	display: grid;
	overflow: hidden;
	place-items: center;
}
.cover span {
	background: rgba(255, 255, 255, 0.62);
	border: 1px solid rgba(0, 0, 0, 0.08);
	border-radius: 999px;
	display: block;
	height: 54%;
	width: 54%;
}
.theme-aurora .cover {
	background: linear-gradient(135deg, #73f7ff, #ff6bd6 58%, #f6ff87) !important;
}
.theme-cinematic .cover {
	background: radial-gradient(circle at 48% 32%, #ffb36b, #7b3f2b 52%, #191512 76%) !important;
}
.theme h2 {
	font-size: 18px;
	line-height: 1.1;
	margin: 0 0 4px;
}
.theme p {
	font-size: 12px;
	line-height: 1.35;
	margin: 0;
	opacity: 0.78;
}
.preview-cta {
	background: transparent;
	border: 1px solid currentColor;
	border-radius: 999px;
	font: inherit;
	font-size: 12px;
	font-weight: 700;
	min-height: 34px;
	padding: 6px 10px;
	width: 100%;
}
@media (max-width: 520px) {
	.shell { padding: 14px; }
	.themes { grid-template-columns: 1fr; }
	h1 { font-size: 24px; }
	.theme {
		grid-template-columns: 82px minmax(0, 1fr);
		min-height: 0;
	}
	.cover { grid-row: span 2; }
	.preview-cta { grid-column: 2; }
}
</style>
`.trim();

export function registerSmartLinkThemePreviewResource(server: McpServer) {
	server.registerResource(
		"smart-link-theme-preview",
		SMART_LINK_THEME_PREVIEW_RESOURCE_URI,
		{
			description:
				"Visual preview for the four Dynamoi Smart Link page themes.",
			mimeType: "text/html;profile=mcp-app",
			title: "Smart Link Theme Preview",
		},
		async () => ({
			contents: [
				{
					_meta: {
						ui: {
							csp: {
								connectDomains: [],
								resourceDomains: [],
							},
							domain: "https://dynamoi.com",
							prefersBorder: true,
						},
					},
					mimeType: "text/html;profile=mcp-app",
					text: SMART_LINK_THEME_PREVIEW_HTML,
					uri: SMART_LINK_THEME_PREVIEW_RESOURCE_URI,
				},
			],
		}),
	);
}
