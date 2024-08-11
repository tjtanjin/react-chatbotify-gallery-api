import RedisStore from "connect-redis"
import { createClient } from "redis"

// initialize redis client
const redisClient = createClient({
	socket: {
		host: "redis",
		port: 6379,
		// todo: protect with passphrase?
		// passphrase: process.env.REDIS_PASSWORD
	}
})
redisClient.connect().catch(console.error)

// initislize redis store
const redisStore = new RedisStore({
	client: redisClient,
	prefix: "redis:",
})

export {
	redisClient,
	redisStore
}
