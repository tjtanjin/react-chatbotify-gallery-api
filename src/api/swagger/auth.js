const authPaths = {
	"/api/v1/auth/callback": {
		"get": {
			"tags": ["Authentication Module"],
			"summary": "Handles the callback from OAuth provider.",
			"description": "Processes the callback from the OAuth provider, handling authorization and redirection.",
			"parameters": [
				{
					"in": "query",
					"name": "code",
					"schema": { "type": "string" },
					"required": false,
					"description": "The authorization code returned by the OAuth provider."
				},
				{
					"in": "query",
					"name": "error",
					"schema": { "type": "string" },
					"required": false,
					"description": "Error message returned by the OAuth provider if the authorization fails."
				}
			],
			"responses": {
				"302": {
					"description": "Redirects user to either the login process page or an error page.",
					"headers": {
						"Location": {
							"description": "The URL to which the user is redirected.",
							"schema": { "type": "string" }
						}
					}
				}
			}
		}
	},
	"/api/v1/auth/login/process": {
		"get": {
			"tags": ["Authentication Module"],
			"summary": "Handles the login process after OAuth callback.",
			"description": "Uses the authorization code to fetch tokens, retrieve user data, and store them in a cache.",
			"parameters": [
				{
					"in": "query",
					"name": "provider",
					"schema": { "type": "string" },
					"required": true,
					"description": "The OAuth provider (e.g., GitHub)."
				},
				{
					"in": "query",
					"name": "key",
					"schema": { "type": "string" },
					"required": true,
					"description": "The encrypted key generated from the authorization code."
				}
			],
			"responses": {
				"200": {
					"description": "Returns user data on successful login.",
					"content": {
						"application/json": {
							"schema": { "$ref": "#/components/schemas/ApiResult" },
							"example": {
								"success": true,
								"message": "Login successful.",
								"data": {
									"id": "user123",
									"role": "user",
									"name": "Jane Doe",
									"email": "jane@example.com",
									"handle": "janedoe",
									"avatarUrl": "http://example.com/avatar.jpg",
									"status": "active",
									"location": "Canada",
									"profileUrl": "http://example.com/profile/janedoe",
									"provider": "github",
									"providerUserId": "github123"
								}
							}
						}
					}
				},
				"401": {
					"description": "Unauthorized due to invalid login credentials or missing provider.",
					"content": {
						"application/json": {
							"schema": { "$ref": "#/components/schemas/ApiResult" },
							"example": {
								"success": false,
								"message": "Login failed, please try again.",
								"data": null,
								"errors": []
							}
						}
					}
				}
			}
		}
	}
};

export default authPaths;
