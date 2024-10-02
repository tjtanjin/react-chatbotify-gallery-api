import { Request, Response } from 'express';
import Plugin from '../databases/sql/models/Plugin';
import { Op } from 'sequelize';
import { sendErrorResponse, sendSuccessResponse } from '../utils/responseUtils';
import Logger from '../logger';
import { getFile, uploadBuffer, uploadFile } from '../services/minioService';
import * as crypto from 'crypto';

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

const deletePlugin = async(req: Request , res: Response) => {

}

const publishPlugin = async (req: Request, res: Response) => {
  const userData = req.userData;
  const { name, description, pluginId } = req.body;
  const imgFile = (req.files as { [fieldname: string]: Express.Multer.File[] })[
    'imgUrl'
  ][0];

  const [fileName, extension] = imgFile.originalname.split('.');
  const imgName = fileName + crypto.randomBytes(20).toString('hex') + '.' + extension;
  try {
    await uploadBuffer('plugins-images', imgName, imgFile.buffer);
    const uploadedFile = await getFile('plugins-images', imgName);
    let imageURL = '';
    if (uploadedFile) {
      imageURL = '/plugins-images/' + uploadedFile.name!;
    }

    const plugin = await Plugin.create({
      name: name,
      description: description,
      imageURL,
      userId: "79c302e1-033b-4567-b7b5-33470f87f88e",
      id:pluginId
    });

    sendSuccessResponse(res, 200, plugin, 'Successful');
  } catch (e) {
    sendErrorResponse(res, 500, 'Error', e as string[]);
  }
};
export { getPlugins, publishPlugin };
