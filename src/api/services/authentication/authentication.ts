import { decrypt, encrypt } from "../cryptoService";

import { Op } from "sequelize";
import { redisClient } from "../../databases/redis";
import LinkedAuthProvider from "../../databases/sql/models/LinkedAuthProvider";
import User from "../../databases/sql/models/User";
import UserRefreshToken from "../../databases/sql/models/UserRefreshToken";
import { TokenResponse } from "../../interfaces/TokenResponse";
import { UserData } from "../../interfaces/UserData";
import { UserProviderData } from "../../interfaces/UserProviderData";
import { getGitHubUserData, getGitHubUserTokensWithCode, getGitHubUserTokensWithRefresh } from "./providers/github";

/**
 * Handles fetching of user tokens with code for the current session.
 *
 * @param sessionId id of the session
 * @param key key (encrypted code) for fetching tokens
 * @param provider provider that this session was created (logged in) with
 *
 * @returns token response if successful, null otherwise
 */
const fetchTokensWithCode = async (sessionId: string, key: string, provider: string): Promise<TokenResponse | null> => {
	let tokenResponse = null;
	if (provider === process.env.GITHUB_LOGIN_PROVIDER) {
		tokenResponse = await getGitHubUserTokensWithCode(key);
	}

	// if unable to get valid token response, return null
	if (!tokenResponse) {
		return null;
	}

	try {
		// save access token to Redis
		await redisClient.set(
			`${process.env.USER_TOKEN_PREFIX as string}:${sessionId}`,
			encrypt(tokenResponse.access_token),
			{ EX: 27900 }
		);
	} catch (error) {
	}

	return tokenResponse;
}

/**
 * Retrieves user session data with given session id, user id and provider.
 * 
 * @param sessionId id of the session
 * @param userId id of the user, can be null if first time logging in
 * @param provider provider that this session was created (logged in) with
 *
 * @returns session data of user if successfully retrieved, null otherwise
 */
const getUserData = async (sessionId: string, userId: string | null, provider: string): Promise<UserData | null> => {
	// if user data is still in cache, parse and return
	try {
		const cachedUserData = await redisClient.get(`${process.env.USER_DATA_PREFIX}:${sessionId}`);
		if (cachedUserData) {
			return JSON.parse(cachedUserData as string);
		}
	} catch {
		// if cannot get from cache, then below we try to get user data from provider again
	}

	// should not be empty but if for whatever reason there is no provider found, then user has to relogin
	if (!provider) {
		return null;
	}

	// if user data not in cache, then try to fetch data from the provider with access token
	try {
		const encryptedToken = await redisClient.get(`${process.env.USER_TOKEN_PREFIX as string}:${sessionId}`);
		if (encryptedToken) {
			const accessToken = decrypt(encryptedToken);
			const userProviderData = await getUserProviderDataFromProvider(sessionId, userId, accessToken, provider);
			if (userProviderData) {
				// get user data, will create user if user does not exist
				const user = await getOrCreateUser(userProviderData);
				if (!user) {
					return null;
				}

				const userData: UserData = {
					id: user.dataValues.id,
					role: user.dataValues.role,
					...userProviderData
				}

				// save user data to cache, expires every 15mins to update
				await redisClient.set(
					`${process.env.USER_DATA_PREFIX as string}:${sessionId}`,
					JSON.stringify(userProviderData),
					{ EX: 900 }
				);

				return userData;
			}
			return null;
		}
		return null;
	} catch {
		return null;
	}
}

/**
 * Retrieves a user and creates a new user if not exist.
 * 
 * @param userProviderData user data belonging to the current session
 * 
 * @returns existing or newly created user
 */
const getOrCreateUser = async (userProviderData: UserProviderData): Promise<User | null> => {
	try {
		// check if the email exists in the User table
		const existingUser = await User.findOne({
			where: {
				email: userProviderData.email
			}
		});

		if (existingUser) {
			// if user exist, check if the provider is newly linked
			const linkedAuthProvider = await LinkedAuthProvider.findOne({
				where: {
					user_id: existingUser.dataValues.id,
					provider: userProviderData.provider
				}
			});

			// if the provider with user doesn"t exist, add a new entry in LinkedAuthProvider
			if (!linkedAuthProvider) {
				await LinkedAuthProvider.create({
					provider_user_id: userProviderData.provider_user_id,
					user_id: existingUser.dataValues.id,
					provider: userProviderData.provider,
				});
			}

			return existingUser;
		}

		// if user does not exist, create a new user entry
		const newUser = await User.create({
			email: userProviderData.email
		});

		// Add mapping in the LinkedAuthProvider table
		await LinkedAuthProvider.create({
			provider_user_id: userProviderData.provider_user_id,
			user_id: newUser.dataValues.id,
			provider: userProviderData.provider
		});

		return newUser;
	} catch (error) {
		return null;
	}
}

/**
 * Saves user access token into cache and refresh token into mysql (both are encrypted).
 * 
 * @param sessionId id of the session
 * @param userId id of the user
 * @param tokenResponse token response to retrieve token information from
 *
 * @returns true if successfully saved, false otherwise
 */
const saveUserTokens = async (sessionId: string, userId: string, tokenResponse: TokenResponse): Promise<boolean> => {
	try {
		// save access token to Redis
		await redisClient.set(
			`${process.env.USER_TOKEN_PREFIX as string}:${sessionId}`,
			encrypt(tokenResponse.access_token),
			{ EX: 27900 }
		);

		// store refresh token into MySQL (upsert to overwrite if user_id exists)
		await UserRefreshToken.upsert({
			user_id: userId,
			refresh_token: encrypt(tokenResponse.refresh_token),
			expiry_date: tokenResponse.refresh_token_expiry
		});

		return true;
	} catch (error) {
		console.error("Error saving user tokens:", error);
		return false;
	}
};

// 
// Functions below are used internally to call the auth providers (currently only github)
//

/**
 * Retrieves user provider data from the provider.
 * 
 * @param sessionId id of the session
 * @param userId id of the user, can be null if first time logging in
 * @param accessToken access token for the user
 * @param provider provider that this session was created (logged in) with
 *
 * @returns session data of user if successfully retrieved, null otherwise
 */
const getUserProviderDataFromProvider = async (
	sessionId: string,
	userId: string | null,
	accessToken: string | null,
	provider: string
) => {
	if (!accessToken) {
		const tokenResponse = await refreshProviderTokens(sessionId, userId, provider);
		accessToken = tokenResponse ? tokenResponse.access_token : null;
	}

	// if access token is null even after trying to refresh access token, get user to relogin
	if (!accessToken) {
		return null;
	}

	let userProviderData = null;
	if (provider === process.env.GITHUB_LOGIN_PROVIDER) {
		userProviderData = await getGitHubUserData(accessToken);
	}

	return userProviderData;
}

/**
 * Refreshes the tokens from the provider.
 *
 * @param sessionId id of the session
 * @param userId id of the user
 * @param provider provider that this session was created (logged in) with
 * @returns 
 */
const refreshProviderTokens = async (sessionId: string, userId: string | null, provider: string) => {
	// if no user id provided, cannot refresh
	if (!userId) {
		return;
	}

	try {
		// get refresh token from database
		const refreshTokenRecord = await UserRefreshToken.findOne({
			where: {
				user_id: userId,
				expiry_date: {
					[Op.gt]: new Date()  // Ensure the token has not expired
				}
			}
		});

		// if no valid refresh token is found, return null
		if (!refreshTokenRecord) {
			return null;
		}

		// check token expiry and if expired, return null
		const refreshTokenExpired = new Date(refreshTokenRecord.dataValues.expiry_date) <= new Date();
		if (refreshTokenExpired) {
			return null;
		}

		// decrypt and get refresh token
		const refreshToken = decrypt(refreshTokenRecord.dataValues.refresh_token);

		// get new access token
		let tokenResponse = null;
		if (provider === process.env.GITHUB_LOGIN_PROVIDER) {
			// Assuming you have a function that uses the refresh token to get new tokens from GitHub
			tokenResponse = await getGitHubUserTokensWithRefresh(refreshToken);
		}

		// save user tokens if response is valid
		if (tokenResponse) {
			if (await saveUserTokens(sessionId, userId, tokenResponse)) {
				return tokenResponse;
			}
		}

		// if unable to save a valid token response, return null
		return null;
	} catch (error) {
		console.error("Error during token refresh:", error);
		return null;
	}
};

export {
	fetchTokensWithCode,
	getUserData,
	saveUserTokens
};

