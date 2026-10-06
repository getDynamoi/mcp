import { expect, test } from "bun:test";
import { createWorkspaceReader } from "./access";
import type { WorkspaceBridge } from "./view";

const A = "11111111-1111-4111-8111-111111111111";
test("record owner denial verifies selected artist before revoking it", async () => {
	const calls: string[] = [];
	const revoked: string[] = [];
	const bridge: WorkspaceBridge = {
		callServerTool: async ({ name }) => {
			calls.push(name);
			return name === "dynamoi_list_artists"
				? {
						content: [],
						structuredContent: {
							data: { id: A, name: "Artist" },
							status: "success",
						},
					}
				: {
						content: [],
						isError: true,
						structuredContent: {
							code: "TENANT_ACCESS_DENIED",
							status: "error",
						},
					};
		},
		openLink: async () => ({}),
		updateModelContext: async () => ({}),
	};
	const read = createWorkspaceReader(
		bridge,
		() => ({
			artistId: A,
			canRead: true,
			connected: true,
			detailEpoch: 1,
			disposed: false,
			targetEpoch: 1,
		}),
		() => undefined,
		(id) => revoked.push(id),
	);
	await expect(read("dynamoi_get_campaign", { campaignId: A })).rejects.toThrow(
		"This record",
	);
	expect(revoked).toEqual([]);
	expect(calls).toEqual(["dynamoi_get_campaign", "dynamoi_list_artists"]);
});
test("OAuth challenge cannot be ignored after same-artist detail selection changes", async () => {
	let detailEpoch = 1;
	let resolve: (
		value: Awaited<ReturnType<WorkspaceBridge["callServerTool"]>>,
	) => void = () => undefined;
	const result = new Promise<
		Awaited<ReturnType<WorkspaceBridge["callServerTool"]>>
	>((done) => {
		resolve = done;
	});
	let revoked = 0;
	const read = createWorkspaceReader(
		{
			callServerTool: async () => result,
			openLink: async () => ({}),
			updateModelContext: async () => ({}),
		},
		() => ({
			artistId: A,
			canRead: true,
			connected: true,
			detailEpoch,
			disposed: false,
			targetEpoch: 1,
		}),
		() => {
			revoked += 1;
		},
		() => undefined,
	);
	const pending = read("dynamoi_list_campaigns", { artistId: A });
	detailEpoch += 1;
	resolve({
		_meta: { "mcp/www_authenticate": ["Bearer invalid_token"] },
		content: [],
		isError: true,
	});
	await expect(pending).rejects.toThrow();
	expect(revoked).toBe(1);
});

test("delayed artist verification denial is ignored after selecting another target", async () => {
	let targetEpoch = 1;
	let release: (
		value: Awaited<ReturnType<WorkspaceBridge["callServerTool"]>>,
	) => void = () => undefined;
	let started: () => void = () => undefined;
	const verificationStarted = new Promise<void>((resolve) => {
		started = resolve;
	});
	const verification = new Promise<
		Awaited<ReturnType<WorkspaceBridge["callServerTool"]>>
	>((resolve) => {
		release = resolve;
	});
	const revoked: string[] = [];
	const read = createWorkspaceReader(
		{
			callServerTool: async ({ name }) => {
				if (name === "dynamoi_list_artists") {
					started();
					return verification;
				}
				return {
					content: [],
					isError: true,
					structuredContent: { code: "TENANT_ACCESS_DENIED", status: "error" },
				};
			},
			openLink: async () => ({}),
			updateModelContext: async () => ({}),
		},
		() => ({
			artistId: A,
			canRead: true,
			connected: true,
			detailEpoch: 1,
			disposed: false,
			targetEpoch,
		}),
		() => undefined,
		(id) => revoked.push(id),
	);
	const pending = read("dynamoi_get_campaign", { campaignId: A });
	await verificationStarted;
	targetEpoch += 1;
	release({
		content: [],
		isError: true,
		structuredContent: { code: "TENANT_ACCESS_DENIED", status: "error" },
	});
	await expect(pending).rejects.toThrow();
	expect(revoked).toEqual([]);
});
