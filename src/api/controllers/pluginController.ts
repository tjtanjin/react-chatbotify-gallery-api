import { Request, Response } from 'express';
import Plugin from '../databases/sql/models/Plugin';
import { Op } from 'sequelize';
import { sendErrorResponse, sendSuccessResponse } from '../utils/responseUtils';
import Logger from '../logger';
import {
  createPresignedURL,
  getFile,
  uploadBuffer,
  uploadFile,
} from '../services/minioService';
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
    const foundPlugins = await Plugin.findAll({
      where: whereClause,
      offset,
      limit,
      raw: true,
    });

    const plugins = await Promise.all(
      foundPlugins.map(async (plugin) => {
        const imageURL = (plugin as any).imageURL as string;
        if (imageURL.includes('/plugins-images/')) {
          const imageName = imageURL.split('/plugins-images/')[1];
          const url = await createPresignedURL('plugins-images', imageName);
          return {
            ...plugin,
            imageURL: url,
          };
        } else {
          return plugin;
        }
      }),
    );

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

//TODO: implement delete plugin
const deletePlugin = async (req: Request, res: Response) => {};

//TODO: implement edit plugin
const editPlugin = async (req: Request, res: Response) => {
  const userData = req.userData;
  const { name, description, id } = req.body;
  try {
    const plugin = await Plugin.findOne({
      where: {
        id: id,
      },
    });

    sendSuccessResponse(res, 200, plugin || {}, 'Successful');
  } catch (e) {
    sendErrorResponse(res, 500, 'Error', e as string[]);
  }
};

//TODO: implement publishing a plugin
const publishPlugin = async (req: Request, res: Response) => {
  const userData = req.userData;
  const { name, description, id } = req.body;
  const imgFile = (req.files as { [fieldname: string]: Express.Multer.File[] })[
    'imgUrl'
  ][0];

  const [fileName, extension] = imgFile.originalname.split('.');
  const imgName =
    fileName + crypto.randomBytes(20).toString('hex') + '.' + extension;
  try {
    await uploadBuffer('plugins-images', imgName, imgFile.buffer);
    const uploadedFile = await getFile('plugins-images', imgName);
    let imageURL = '';
    if (uploadedFile) {
      imageURL = 'localhost:9000' + '/plugins-images/' + uploadedFile.name!;
    }

    const plugin = await Plugin.create({
      name: name,
      description: description,
      imageURL,
      userId: '79c302e1-033b-4567-b7b5-33470f87f88e',
      id: id,
    });

    sendSuccessResponse(res, 200, plugin, 'Successful');
  } catch (e) {
    sendErrorResponse(res, 500, 'Error', e as string[]);
  }
};
export { getPlugins, publishPlugin, editPlugin };
