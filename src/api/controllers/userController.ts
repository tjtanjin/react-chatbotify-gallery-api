import { Request, Response } from "express";
import FavoriteTheme from "../databases/sql/models/FavoriteTheme";
import Theme from "../databases/sql/models/Theme";
import { sequelize } from "../databases/sql/sql";
import { checkIsAdminUser } from "../services/authorization";
import { sendErrorResponse, sendSuccessResponse } from "../utils/responseUtils";

/**
 * Retrieves the user profile information (i.e. user data).
 *
 * @param req request from call
 * @param res response to call
 *
 * @returns user data if successful, 403 otherwise
 */
const getUserProfile = async (req: Request, res: Response) => {
	const userData = req.userData;
	const queryUserId = req.query.userId as string;
	const sessionUserId = req.session.userId;

	// if user id matches or user is admin, can retrieve user data
	if (!queryUserId || queryUserId === sessionUserId || checkIsAdminUser(userData)) {
		return sendSuccessResponse(res, 200, userData, "User data fetched successfully.");
	}

	// all other cases unauthorized
	sendErrorResponse(res, 403, "Unauthorized access.");
};

/**
 * Retrieves themes belonging to the user.
 *
 * @param req request from call
 * @param res response to call
 *
 * @returns list of user's themes if successful, 403 otherwise
 */
const getUserThemes = async (req: Request, res: Response) => {
	const userData = req.userData;
	const queryUserId = req.query.userId as string;
	const sessionUserId = req.session.userId;

	// if user id matches or user is admin, can retrieve user themes
	if (!queryUserId || queryUserId === sessionUserId || checkIsAdminUser(userData)) {
		try {
			const themes = await Theme.findAll({
				where: {
					user_id: userData.id
				}
			});
			return sendSuccessResponse(res, 200, themes, "Fetched user themes successfully.");
		} catch {
		}
	}

	// all other cases unauthorized
	sendErrorResponse(res, 403, "Unauthorized access.");
};

/**
 * Retrieves themes that user favorited.
 *
 * @param req request from call
 * @param res response to call
 *
 * @returns list of user's favorited themes if successful, 403 otherwise
 */
const getUserFavoriteThemes = async (req: Request, res: Response) => {
	const userData = req.userData;
	const queryUserId = req.query.userId as string;
	const sessionUserId = req.session.userId;

	// if user id matches or user is admin, can retrieve user favorited themes
	if (!queryUserId || queryUserId === sessionUserId || checkIsAdminUser(userData)) {
		try {
			const userFavoriteThemes = await FavoriteTheme.findAll({
				where: {
					user_id: userData.id
				},
				include: [Theme]
			});
			return sendSuccessResponse(res, 200, userFavoriteThemes, "Fetched user favorite themes successfully.");
		} catch {
		}
	}

	// all other cases unauthorized
	sendErrorResponse(res, 403, "Unauthorized access.");
};

/**
 * Adds a theme to user favorite.
 *
 * @param req request from call
 * @param res response to call
 *
 * @returns 201 if successful, 404 if theme not found, 400 if already favorited, 500 otherwise
 */
const addUserFavoriteTheme = async (req: Request, res: Response) => {
	const userData = req.userData;
	const { theme_id } = req.body;

	try {
		await sequelize.transaction(async (transaction) => {
			// check if the theme exists
			const theme = await Theme.findByPk(theme_id, { transaction });
			if (!theme) {
				return sendErrorResponse(res, 400, "Theme not found.");
			}

			// check if theme already favorited
			const existingFavorite = await FavoriteTheme.findOne({
				where: {
					user_id: userData.id,
					id: theme_id
				},
				transaction
			});

			if (existingFavorite) {
				return sendErrorResponse(res, 400, "Theme already favorited.");
			}

			// add favorite theme
			await FavoriteTheme.create({
				user_id: userData.id,
				id: theme_id
			}, { transaction });

			// increment the favorites count in the theme table
			await theme.increment("favorites_count", { by: 1, transaction });
		});

		sendSuccessResponse(res, 201, {}, "Added theme to favorites successfully.");
	} catch (error) {
		console.error("Error adding favorite theme:", error);
		sendErrorResponse(res, 500, "Failed to add favorite theme.");
	}
};

/**
 * Removes a theme from user favorite.
 *
 * @param req request from call
 * @param res response to call
 *
 * @returns 200 if successful, 404 if theme not found, 500 otherwise
 */
const removeUserFavoriteTheme = async (req: Request, res: Response) => {
	const userData = req.userData;
	const { theme_id } = req.params;

	try {
		await sequelize.transaction(async (transaction) => {
			// check if theme is favorited
			const existingFavorite = await FavoriteTheme.findOne({
				where: {
					user_id: userData.id,
					id: theme_id
				},
				transaction
			});

			if (!existingFavorite) {
				return sendErrorResponse(res, 404, "Favorite theme not found");
			}

			// remove favorite theme
			await existingFavorite.destroy({ transaction });

			// decrement the favorites count in the theme table
			const theme = await Theme.findByPk(theme_id, { transaction });
			if (theme) {
				await theme.decrement("favorites_count", { by: 1, transaction });
			}
		});

		sendSuccessResponse(res, 200, {}, "Removed theme from favorites successfully.");
	} catch (error) {
		console.error("Error removing favorite theme:", error);
		sendErrorResponse(res, 500, "Failed to remove favorite theme");
	}
};

export {
	addUserFavoriteTheme, getUserFavoriteThemes, getUserProfile,
	getUserThemes, removeUserFavoriteTheme
};
