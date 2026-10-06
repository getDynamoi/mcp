import { createWorkspaceReader } from "./access";
import {
	clearDeniedInitialContext,
	envelope,
	errorMessage,
	openLinkMessage,
	type WorkspaceBridge,
} from "./boundary";
import {
	artists,
	cursor,
	initialArtist,
	parseDeepLink,
	projectRecord,
	publicLink,
	selectedContext,
	text,
	UUID,
	type WorkspaceArtist,
	type WorkspaceRecord,
} from "./data";
import { createWorkspaceRenderer, type Page } from "./render";

export type { WorkspaceBridge } from "./boundary";
/** Selection generations prevent old responses crossing artist, route and record boundaries. */
export function createWorkspaceView(
	root: HTMLElement,
	bridge: WorkspaceBridge,
) {
	const doc = root.ownerDocument;
	const connectionStatus = doc.getElementById("connection");
	if (!connectionStatus) {
		throw new Error("Workspace connection status is missing.");
	}
	const status: HTMLElement = connectionStatus;
	let roster: WorkspaceArtist[] = [];
	let rosterCursor: string | undefined;
	let rosterError: string | undefined;
	let artist: WorkspaceArtist | undefined;
	let tab: "campaign" | "smartlink" = "campaign";
	let page: Page = { loading: false, rows: [] };
	let detail: WorkspaceRecord | undefined;
	let selectedId: string | undefined;
	let detailLoading = false;
	let detailError: string | undefined;
	let shareMessage = "";
	let canRead = false;
	let canShare = false;
	let canOpen = false;
	let connected = false;
	let disposed = false;
	let initialized = false;
	let pageEpoch = 0;
	let detailEpoch = 0;
	let rosterEpoch = 0;
	let routeEpoch = 0;
	let targetEpoch = 0;
	let revoked = false;
	let contextQueue: Promise<null> = Promise.resolve(null);
	let shared = false;
	let incomingPath: unknown;
	const { node, button, renderList, renderDetail, renderArtistSelector } =
		createWorkspaceRenderer(doc);
	function clearShared() {
		shareMessage = "";
		if (!shared) {
			return;
		}
		contextQueue = contextQueue.then(async () => {
			try {
				await bridge.updateModelContext({ content: [] });
				shared = false;
			} catch {
				if (!disposed) {
					shareMessage =
						"The host could not clear conversation context. Clear it in your host before continuing.";
					status.textContent = shareMessage;
					render();
				}
			}
			return null;
		});
	}
	function invalidate(clearContext = true) {
		pageEpoch += 1;
		detailEpoch += 1;
		page = { loading: false, rows: [] };
		detail = undefined;
		selectedId = undefined;
		detailLoading = false;
		detailError = undefined;
		if (clearContext) {
			clearShared();
		}
	}
	const read = createWorkspaceReader(
		bridge,
		() => ({
			artistId: artist?.id,
			canRead,
			connected,
			detailEpoch,
			disposed,
			targetEpoch,
		}),
		(message) => {
			targetEpoch += 1;
			invalidate();
			canRead = false;
			canShare = false;
			roster = [];
			rosterCursor = undefined;
			artist = undefined;
			initialized = false;
			revoked = true;
			status.textContent = message;
			render();
		},
		(target, message) => {
			targetEpoch += 1;
			routeEpoch += 1;
			invalidate();
			roster = roster.filter((row) => row.id !== target);
			artist = undefined;
			incomingPath = undefined;
			status.textContent = message;
			render();
		},
	);
	async function loadRoster() {
		rosterEpoch += 1;
		const epoch = rosterEpoch;
		try {
			const data = await read("dynamoi_list_artists", {
				format: "json",
				limit: 50,
				...(rosterCursor ? { cursor: rosterCursor } : {}),
			});
			if (disposed || epoch !== rosterEpoch) {
				return;
			}
			const ids = new Set(roster.map((row) => row.id));
			if (
				!Array.isArray(data.artists) ||
				artists(data.artists).length !== data.artists.length
			) {
				throw new Error(
					"This read returned an incomplete artist roster. Retry before treating it as complete.",
				);
			}
			roster = [
				...roster,
				...artists(data.artists).filter((row) => !ids.has(row.id)),
			];
			rosterCursor = cursor(data.nextCursor);
			rosterError = undefined;
		} catch (error) {
			if (!disposed && epoch === rosterEpoch) {
				rosterError = errorMessage(error);
			}
		}
		render();
	}
	async function loadPage(append = false) {
		if (!artist) {
			return;
		}
		pageEpoch += 1;
		const epoch = pageEpoch;
		const artistId = artist.id;
		const kind = tab;
		const previous = append ? page.rows : [];
		const next = append ? page.next : undefined;
		page = { loading: true, rows: previous };
		render();
		try {
			const data = await read(
				kind === "campaign"
					? "dynamoi_list_campaigns"
					: "dynamoi_list_smart_links",
				{
					artistId,
					format: "json",
					limit: 20,
					...(next ? { cursor: next } : {}),
				},
			);
			if (disposed || epoch !== pageEpoch) {
				return;
			}
			const items = kind === "campaign" ? data.campaigns : data.smartLinks;
			const rows = (Array.isArray(items) ? items : [])
				.slice(0, 50)
				.flatMap((item) => {
					try {
						return [projectRecord(kind, item, artistId)];
					} catch {
						return [];
					}
				});
			const skipped = Array.isArray(items) ? items.length - rows.length : 1;
			const ids = new Set(previous.map((row) => row.id));
			page = {
				loading: false,
				next: cursor(data.nextCursor),
				...(skipped > 0
					? {
							warning:
								"Some records could not be displayed. Retry this read before treating this list as complete.",
						}
					: {}),
				rows: [...previous, ...rows.filter((row) => !ids.has(row.id))],
			};
		} catch (error) {
			if (!disposed && epoch === pageEpoch) {
				page = {
					error: errorMessage(error),
					loading: false,
					next,
					rows: previous,
				};
			}
		}
		render();
	}
	async function chooseInitialArtist(preserveContext = true) {
		const selected =
			preserveContext && shared ? undefined : initialArtist(roster);
		if (selected) {
			await chooseArtist(selected, !preserveContext);
		}
	}
	async function chooseArtist(value: WorkspaceArtist, clearContext = true) {
		targetEpoch += 1;
		invalidate(clearContext);
		status.textContent = "Read-only workspace";
		artist = value;
		detail = {
			artistId: value.id,
			id: value.id,
			kind: "artist",
			name: value.name,
		};
		render();
		await loadPage();
	}
	async function chooseRecord(kind: "campaign" | "smartlink", id: string) {
		if (!(artist && UUID.test(id))) {
			return;
		}
		const artistId = artist.id;
		detailEpoch += 1;
		const epoch = detailEpoch;
		clearShared();
		detail = undefined;
		selectedId = id;
		detailLoading = true;
		detailError = undefined;
		render();
		try {
			const knownType = page.rows.find((row) => row.id === id)?.campaignType;
			let data = await read(
				kind === "campaign" ? "dynamoi_get_campaign" : "dynamoi_get_smart_link",
				kind === "campaign"
					? {
							campaignId: id,
							format: "json",
							includeAnalytics: true,
							includeChannelResults: knownType === "YOUTUBE",
						}
					: { format: "json", includeAnalytics: true, playLinkId: id },
			);
			if (disposed || epoch !== detailEpoch) {
				return;
			}
			if (data.artistId !== artistId || data.id !== id) {
				throw new Error(
					"This record is outside the selected artist. Choose it from an authorized artist.",
				);
			}
			if (
				kind === "campaign" &&
				knownType !== "YOUTUBE" &&
				data.campaignType === "YOUTUBE"
			) {
				const channelData = await read("dynamoi_get_campaign", {
					campaignId: id,
					format: "json",
					includeAnalytics: false,
					includeChannelResults: true,
				});
				if (disposed || epoch !== detailEpoch) {
					return;
				}
				if (channelData.artistId !== artistId || channelData.id !== id) {
					throw new Error(
						"This record is outside the selected artist. Choose it from an authorized artist.",
					);
				}
				data = { ...data, channelResults: channelData.channelResults };
			}
			detail = projectRecord(kind, data, artistId, "detail");
		} catch (error) {
			if (!disposed && epoch === detailEpoch) {
				detailError = errorMessage(error);
			}
		}
		if (!disposed && epoch === detailEpoch) {
			detailLoading = false;
			render();
		}
	}
	async function useInConversation() {
		if (!(detail && canShare) || disposed) {
			return;
		}
		const record = detail;
		const epoch = detailEpoch;
		shareMessage = "Sharing selected record…";
		render();
		contextQueue = contextQueue.then(async () => {
			if (disposed || epoch !== detailEpoch) {
				return null;
			}
			shared = true;
			try {
				await bridge.updateModelContext({
					content: [{ text: selectedContext(record), type: "text" }],
				});
				if (!disposed && epoch === detailEpoch) {
					shareMessage =
						"Selected record is available for your next conversation turn.";
				}
			} catch {
				if (!disposed && epoch === detailEpoch) {
					shareMessage =
						"This host could not share the selection. Use the individual read tools in your conversation.";
				}
			}
			render();
			return null;
		});
		await contextQueue;
	}
	async function route(value: unknown, clearContext = true) {
		targetEpoch += 1;
		incomingPath = value;
		routeEpoch += 1;
		const epoch = routeEpoch;
		invalidate(clearContext);
		artist = undefined;
		render();
		try {
			const parsed = parseDeepLink(value);
			if (!(initialized && connected && canRead)) {
				return;
			}
			if (!parsed) {
				await chooseInitialArtist(!clearContext);
				return;
			}
			// Reauthorize incoming artist even when present in an earlier roster.
			const data = await read("dynamoi_list_artists", {
				artistId: parsed.artistId,
				format: "json",
			});
			if (disposed || epoch !== routeEpoch) {
				return;
			}
			if (data.id !== parsed.artistId || !text(data.name)) {
				throw new Error("This record could not be loaded.");
			}
			const selected = { id: parsed.artistId, name: text(data.name) };
			if (!roster.some((row) => row.id === selected.id)) {
				roster = [...roster, selected];
			}
			tab = parsed.kind ?? "campaign";
			await chooseArtist(selected, clearContext);
			if (!disposed && epoch === routeEpoch && parsed.kind && parsed.id) {
				await chooseRecord(parsed.kind, parsed.id);
			}
		} catch (error) {
			if (!disposed && epoch === routeEpoch) {
				detailError = errorMessage(error);
				render();
			}
		}
	}
	async function openPublicLink() {
		const url = publicLink(detail?.url);
		const epoch = detailEpoch;
		if (!(url && canOpen && detail?.isPublic === true) || disposed) {
			return;
		}
		const message = await openLinkMessage(bridge, url);
		if (!disposed && epoch === detailEpoch) {
			shareMessage = message;
		}
		render();
	}
	function selectTab(kind: "campaign" | "smartlink") {
		routeEpoch += 1;
		incomingPath = undefined;
		invalidate();
		tab = kind;
		void loadPage();
	}
	function render() {
		if (disposed) {
			return;
		}
		const focus = (doc.activeElement as HTMLElement | null)?.dataset.focus;
		root.replaceChildren();
		if (!initialized) {
			root.append(
				node(
					"p",
					revoked
						? "Reconnect Dynamoi in your host, then reopen the workspace or use individual read tools."
						: connected
							? "Waiting for your initial workspace result…"
							: "Use Dynamoi’s individual read tools if your host does not support interactive apps.",
				),
			);
			return;
		}
		if (!(roster.length > 0 || rosterCursor)) {
			root.append(
				node("h2", "No artists available"),
				node(
					"p",
					"This account has no accessible artist yet. An artist must be available in your Dynamoi account before campaigns or Smart Links can appear here.",
				),
			);
			return;
		}
		const { label, select } = renderArtistSelector(roster, artist?.id, canRead);
		select.onchange = () => {
			routeEpoch += 1;
			incomingPath = undefined;
			const selected = roster.find((row) => row.id === select.value);
			if (selected) {
				void chooseArtist(selected);
			}
		};
		root.append(label, select);
		if (rosterCursor) {
			root.append(
				button("More artists", () => void loadRoster(), "artists-more"),
			);
		}
		if (rosterError) {
			root.append(
				node("p", rosterError),
				button("Retry artists", () => void loadRoster()),
			);
		}
		if (!canRead) {
			root.append(
				node(
					"p",
					"This host cannot request further records. Use Dynamoi’s individual read tools in your conversation.",
				),
			);
			return;
		}
		const nav = node("nav");
		nav.setAttribute("aria-label", "Artist records");
		for (const [kind, title] of [
			["campaign", "Campaigns"],
			["smartlink", "Smart Links"],
		] as const) {
			const control = button(title, () => selectTab(kind), kind);
			control.setAttribute("aria-pressed", String(tab === kind));
			nav.append(control);
		}
		root.append(nav);
		const columns = node("div");
		columns.className = "columns";
		const list = renderList({ chooseRecord, loadPage, page, selectedId, tab });
		const panel = renderDetail({
			canOpen,
			canShare,
			chooseRecord,
			detail,
			detailError,
			detailLoading,
			openPublicLink,
			selectedId,
			shareMessage,
			tab,
			useInConversation,
		});
		columns.append(list, panel);
		root.append(columns);
		if (focus) {
			Array.from(root.querySelectorAll<HTMLElement>("[data-focus]"))
				.find((element) => element.dataset.focus === focus)
				?.focus();
		}
	}
	return {
		// Pure teardown leaves the deliberate attachment with the host; target/auth changes clear it.
		dispose() {
			targetEpoch += 1;
			routeEpoch += 1;
			rosterEpoch += 1;
			pageEpoch += 1;
			detailEpoch += 1;
			disposed = true;
			root.replaceChildren();
		},
		hostContext(context: Record<string, unknown>, hydration = false) {
			if (context.theme === "dark" || context.theme === "light") {
				doc.documentElement.style.colorScheme = context.theme;
			}
			if (Object.hasOwn(context, "openai/modelContext")) {
				const attachment = context["openai/modelContext"];
				shared = attachment !== null && attachment !== undefined;
			}
			if (revoked) {
				clearShared();
			}
			if ((hydration || !connected) && shared) {
				incomingPath = undefined;
			} else if (Object.hasOwn(context, "openai/deepLink")) {
				void route(context["openai/deepLink"], !(hydration || !connected));
			}
		},
		initial(result: unknown) {
			targetEpoch += 1;
			rosterEpoch += 1;
			routeEpoch += 1;
			invalidate(false);
			artist = undefined;
			try {
				const data = envelope(result);
				if (
					!Array.isArray(data.artists) ||
					data.artists.length > 50 ||
					artists(data.artists).length !== data.artists.length
				) {
					throw new Error(
						"This read returned an incomplete artist roster. Retry before treating this account as empty.",
					);
				}
				roster = artists(data.artists);
				rosterCursor = cursor(data.nextCursor);
				initialized = true;
				revoked = false;
				if (connected && canRead) {
					if (incomingPath === undefined) {
						void chooseInitialArtist();
					} else {
						void route(incomingPath);
					}
				}
			} catch (error) {
				revoked = clearDeniedInitialContext(result, clearShared);
				initialized = false;
				roster = [];
				connected = false;
				canRead = false;
				canShare = false;
				status.textContent = errorMessage(error);
			}
			render();
		},
		setConnected(
			readSupported: boolean,
			contextSupported: boolean,
			linksSupported: boolean,
		) {
			connected = true;
			canRead = readSupported;
			canShare = contextSupported;
			canOpen = linksSupported;
			if (!revoked) {
				status.textContent = shareMessage || "Read-only workspace";
			}
			render();
			if (initialized && !artist && canRead) {
				if (incomingPath === undefined) {
					void chooseInitialArtist();
				} else {
					void route(incomingPath);
				}
			}
		},
		unsupported() {
			connected = false;
			canRead = false;
			canShare = false;
			invalidate(false);
			status.textContent =
				"Interactive apps are unavailable in this host. Use Dynamoi’s individual read tools.";
			render();
		},
	};
}
