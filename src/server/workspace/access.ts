import { envelope, errorMessage } from "./boundary";
import { object } from "./data";
import type { WorkspaceBridge } from "./view";

const READ_TOOLS = [
	"dynamoi_list_artists",
	"dynamoi_list_campaigns",
	"dynamoi_get_campaign",
	"dynamoi_list_smart_links",
	"dynamoi_get_smart_link",
] as const;
type ReadTool = (typeof READ_TOOLS)[number];
type AccessState = {
	disposed: boolean;
	connected: boolean;
	canRead: boolean;
	detailEpoch: number;
	targetEpoch: number;
	artistId: string | undefined;
};
/** A tenant denial applies to the artist generation, not an unrelated detail request. */
export function createWorkspaceReader(
	bridge: WorkspaceBridge,
	state: () => AccessState,
	revokeOAuth: (message: string) => void,
	revokeArtist: (artistId: string, message: string) => void,
) {
	async function read(
		name: ReadTool,
		args: Record<string, unknown>,
	): Promise<Record<string, unknown>> {
		const before = state();
		if (
			before.disposed ||
			!before.connected ||
			!before.canRead ||
			!READ_TOOLS.includes(name)
		) {
			throw new Error(
				"Dynamoi access is unavailable. Reconnect in your host, then retry.",
			);
		}
		const target =
			typeof args["artistId"] === "string" ? args["artistId"] : before.artistId;
		const result = await bridge.callServerTool({ arguments: args, name });
		try {
			return envelope(result);
		} catch (error) {
			const now = state();
			if (now.disposed) {
				throw error;
			}
			const body = object(result.structuredContent);
			// OAuth revocation is account-wide; selecting another record does not restore access.
			if (
				object(result._meta)["mcp/www_authenticate"] ||
				body["code"] === "INSUFFICIENT_SCOPE"
			) {
				revokeOAuth(errorMessage(error));
				throw error;
			}
			if (before.targetEpoch !== now.targetEpoch) {
				throw error;
			}
			if (body["code"] === "TENANT_ACCESS_DENIED" && target) {
				if (
					name === "dynamoi_get_campaign" ||
					name === "dynamoi_get_smart_link"
				) {
					// Record IDs identify their own owner, not necessarily the selected artist.
					// chooseRecord already cleared the denied detail and own attachment before this read.
					try {
						const verified = await read("dynamoi_list_artists", {
							artistId: target,
							format: "json",
						});
						if (
							state().targetEpoch !== before.targetEpoch ||
							verified["id"] !== target
						) {
							throw new Error("Artist verification did not complete.", {
								cause: error,
							});
						}
					} catch (verificationError) {
						throw new Error(
							"This record could not be accessed. Artist verification did not complete; retry this read.",
							{ cause: verificationError },
						);
					}
					throw new Error(
						"This record could not be accessed. Choose an authorized record.",
						{ cause: error },
					);
				}
				if (typeof args["artistId"] === "string") {
					revokeArtist(
						target,
						"Artist access is unavailable. Choose another artist.",
					);
				}
			}
			throw error;
		}
	}
	return read;
}
