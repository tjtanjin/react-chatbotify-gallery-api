const themePaths = {
	"/api/v1/themes/": {
		"get": {
			"tags": ["Themes Module"],
			"summary": "Retrieves a list of themes.",
			"description": "Fetches a paginated list of themes with an optional search query.",
			"parameters": [
				{
					"in": "query",
					"name": "pageSize",
					"schema": { "type": "integer", "default": 30 },
					"required": false,
					"description": "The number of themes to retrieve per page."
				},
				{
					"in": "query",
					"name": "pageNum",
					"schema": { "type": "integer", "default": 1 },
					"required": false,
					"description": "The page number to retrieve."
				},
				{
					"in": "query",
					"name": "searchQuery",
					"schema": { "type": "string" },
					"required": false,
					"description": "A search query to filter themes by name or description."
				}
			],
			"responses": {
				"200": {
					"description": "A list of themes retrieved successfully.",
					"content": {
						"application/json": {
							"schema": { "$ref": "#/components/schemas/ApiResult" },
							"example": {
								"success": true,
								"message": "Themes retrieved successfully.",
								"data": [
									{
										"id": "dark_theme",
										"name": "Dark Theme",
										"description": "A sleek, dark theme.",
										"favoritesCount": "10",
										"createdAt": "2024-08-07T18:43:21.000Z",
										"updatedAt": "2024-08-07T18:43:21.000Z",
										"user_id": null
									}
								],
								"errors": []
							}
						}
					}
				},
				"500": {
					"description": "Internal server error occurred while fetching themes.",
					"content": {
						"application/json": {
							"schema": { "$ref": "#/components/schemas/ApiResult" },
							"example": {
								"success": false,
								"message": "Failed to fetch themes.",
								"data": null,
								"errors": []
							}
						}
					}
				}
			}
		}
	},
	"/api/v1/themes/versions": {
		"get": {
			"tags": ["Themes Module"],
			"summary": "Retrieves theme versions.",
			"description": "Fetches all published versions for a specific theme.",
			"parameters": [
				{
					"in": "query",
					"name": "themeId",
					"schema": { "type": "string" },
					"required": true,
					"description": "The ID of the theme for which versions are to be retrieved."
				}
			],
			"responses": {
				"200": {
					"description": "A list of theme versions retrieved successfully.",
					"content": {
						"application/json": {
							"schema": { "$ref": "#/components/schemas/ApiResult" },
							"example": {
								"success": true,
								"message": "Theme versions retrieved successfully.",
								"data": [
									{
										"id": "version1",
										"themeId": "theme123",
										"version": "1.0.0",
										"createdAt": "2023-01-01T00:00:00Z"
									}
								],
								"errors": []
							}
						}
					}
				},
				"500": {
					"description": "Internal server error occurred while fetching theme versions.",
					"content": {
						"application/json": {
							"schema": { "$ref": "#/components/schemas/ApiResult" },
							"example": {
								"success": false,
								"message": "Internal server error.",
								"data": null,
								"errors": ["An error occurred while retrieving theme versions."]
							}
						}
					}
				}
			}
		}
	},
	"/api/v1/themes/publish": {
		"post": {
			"tags": ["Themes Module"],
			"summary": "Publishes a new theme.",
			"description": "Publishes a new theme or updates an existing one. Handles versioning and validation.",
			"requestBody": {
				"required": true,
				"content": {
					"multipart/form-data": {
						"schema": {
							"type": "object",
							"properties": {
								"styles": {
									"type": "string",
									"format": "binary",
									"description": "CSS file for the theme."
								},
								"options": {
									"type": "string",
									"format": "binary",
									"description": "JSON file containing theme options."
								},
								"display": {
									"type": "string",
									"format": "binary",
									"description": "PNG file for the theme display image."
								}
							}
						},
						"application/json": {
							"schema": {
								"type": "object",
								"properties": {
									"themeId": {
										"type": "string",
										"description": "The ID of the theme being published."
									},
									"name": {
										"type": "string",
										"description": "The name of the theme."
									},
									"description": {
										"type": "string",
										"description": "A brief description of the theme."
									},
									"version": {
										"type": "string",
										"description": "The version of the theme being published."
									}
								}
							}
						}
					}
				}
			},
			"responses": {
				"201": {
					"description": "Theme published successfully.",
					"content": {
						"application/json": {
							"schema": { "$ref": "#/components/schemas/ApiResult" },
							"example": {
								"success": true,
								"message": "Theme published successfully.",
								"data": {
									"id": "theme123",
									"name": "Dark Theme",
									"description": "A sleek, dark theme.",
									"version": "1.0.0"
								},
								"errors": []
							}
						}
					}
				},
				"400": {
					"description": "Bad request due to validation failure.",
					"content": {
						"application/json": {
							"schema": { "$ref": "#/components/schemas/ApiResult" },
							"example": {
								"success": false,
								"message": "Validation failed.",
								"data": null,
								"errors": ["The theme name is required."]
							}
						}
					}
				},
				"500": {
					"description": "Internal server error occurred while publishing the theme.",
					"content": {
						"application/json": {
							"schema": { "$ref": "#/components/schemas/ApiResult" },
							"example": {
								"success": false,
								"message": "Internal server error.",
								"data": null,
								"errors": ["An error occurred while publishing the theme."]
							}
						}
					}
				}
			}
		}
	},
	"/api/v1/themes/unpublish": {
		"delete": {
			"tags": ["Themes Module"],
			"summary": "Unpublishes an existing theme.",
			"description": "Removes a theme from publication.",
			"parameters": [
				{
					"in": "query",
					"name": "themeId",
					"schema": { "type": "string" },
					"required": true,
					"description": "The ID of the theme to unpublish."
				}
			],
			"responses": {
				"200": {
					"description": "Theme unpublished successfully.",
					"content": {
						"application/json": {
							"schema": { "$ref": "#/components/schemas/ApiResult" },
							"example": {
								"success": true,
								"message": "Theme unpublished successfully.",
								"data": {
									"id": "theme123",
									"name": "Dark Theme",
									"description": "A sleek, dark theme.",
									"version": "1.0.0"
								},
								"errors": []
							}
						}
					}
				},
				"400": {
					"description": "Feature not allowed or bad request.",
					"content": {
						"application/json": {
							"schema": { "$ref": "#/components/schemas/ApiResult" },
							"example": {
								"success": false,
								"message": "Unpublish feature not allowed.",
								"data": null,
								"errors": ["Unpublishing is not allowed for this theme."]
							}
						}
					}
				},
				"500": {
					"description": "Internal server error occurred while unpublishing the theme.",
					"content": {
						"application/json": {
							"schema": { "$ref": "#/components/schemas/ApiResult" },
							"example": {
								"success": false,
								"message": "Internal server error.",
								"data": null,
								"errors": ["An error occurred while unpublishing the theme."]
							}
						}
					}
				}
			}
		}
	}
};

export default themePaths;
