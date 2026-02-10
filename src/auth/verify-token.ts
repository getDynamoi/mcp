import { createRemoteJWKSet, type JWTVerifyOptions, jwtVerify } from "jose";

export type VerifiedAccessToken = {
	sub: string;
	iss: string;
	aud: string | string[] | undefined;
	exp: number | undefined;
	clientId: string | null;
};

type VerifyAccessTokenOptions = {
	token: string;
	jwksUrl: string;
	issuer: string;
	audienceAllowlist: string[];
};

const jwksByUrl = new Map<string, ReturnType<typeof createRemoteJWKSet>>();

function getRemoteJwks(jwksUrl: string) {
	const existing = jwksByUrl.get(jwksUrl);
	if (existing) {
		return existing;
	}
	const created = createRemoteJWKSet(new URL(jwksUrl));
	jwksByUrl.set(jwksUrl, created);
	return created;
}

function extractClientId(payload: Record<string, unknown>): string | null {
	const direct = payload["client_id"];
	if (typeof direct === "string" && direct.trim().length > 0) {
		return direct;
	}
	const azp = payload["azp"];
	if (typeof azp === "string" && azp.trim().length > 0) {
		return azp;
	}
	return null;
}

export async function verifyAccessToken(
	options: VerifyAccessTokenOptions,
): Promise<VerifiedAccessToken> {
	const jwks = getRemoteJwks(options.jwksUrl);
	const verifyOptions: JWTVerifyOptions = {
		audience: options.audienceAllowlist,
		issuer: options.issuer,
	};

	const { payload } = await jwtVerify(options.token, jwks, verifyOptions);

	const sub = typeof payload.sub === "string" ? payload.sub : null;
	if (!sub) {
		throw new Error("JWT missing sub");
	}
	const iss = typeof payload.iss === "string" ? payload.iss : options.issuer;
	const exp = typeof payload.exp === "number" ? payload.exp : undefined;
	const aud = payload.aud as string | string[] | undefined;

	return {
		aud,
		clientId: extractClientId(payload as Record<string, unknown>),
		exp,
		iss,
		sub,
	};
}
