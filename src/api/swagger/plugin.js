const pluginPaths = {
  '/api/v1/plugins/': {
    get: {
      tags: ['Plugins Module'],
      summary: 'Retrieves a list of plugins.',
      description:
        'Fetches a paginated list of plugins with an optional search query.',
      parameters: [
        {
          in: 'query',
          name: 'pageSize',
          schema: { type: 'integer', default: 30 },
          required: false,
          description: 'The number of plugins to retrieve per page.',
        },
        {
          in: 'query',
          name: 'pageNum',
          schema: { type: 'integer', default: 1 },
          required: false,
          description: 'The page number to retrieve.',
        },
        {
          in: 'query',
          name: 'searchQuery',
          schema: { type: 'string' },
          required: false,
          description:
            'A search query to filter plugins by name or description.',
        },
      ],
      responses: {
        200: {
          description: 'A list of plugins retrieved successfully.',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/ApiResult' },
              example: {
                success: true,
                message: 'Plugins fetched successfully.',
                data: [{}],
                errors: [],
              },
            },
          },
        },
        500: {
          description: 'Internal server error occurred while fetching plugins.',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/ApiResult' },
              example: {
                success: false,
                message: 'Failed to fetch plugins.',
                data: null,
                errors: [],
              },
            },
          },
        },
      },
    },
  },
};

export default pluginPaths;
