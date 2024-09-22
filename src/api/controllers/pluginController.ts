import { Request, Response } from 'express';
import Plugin from '../databases/sql/models/Plugin';
import { Op } from 'sequelize';
import { sendErrorResponse, sendSuccessResponse } from '../utils/responseUtils';
import Logger from '../logger';

/**
 * Handles fetching of plugins.
 *
 * @param req request from call
 * @param res response to call
 *
 * @returns list of plugins on success, 500 error otherwise
 */
const getPlugins = async (req: Request, res: Response) => {
  const { pageSize = 30, pageNum = 1, searchQuery = '' } = req.query;
  const limit = parseInt(pageSize as string, 30);
  const offset = (parseInt(pageNum as string, 30) - 1) * limit;
  const whereClause = searchQuery
    ? {
        [Op.or]: [
          { name: { [Op.like]: `%${searchQuery}%` } },
          { description: { [Op.like]: `%${searchQuery}%` } },
        ],
      }
    : {};

  try {
    const plugins = await Plugin.findAll({
      where: whereClause,
      offset,
      limit,
    });

    return sendSuccessResponse(
      res,
      200,
      plugins,
      'Plugins fetched successfully!',
    );
  } catch (error) {
    Logger.error('Error fetching plugins:', error);
    return sendErrorResponse(res, 500, 'Failed to fetch plugins.');
  }
};

export { getPlugins };
