import { defineMongooseConnection } from "#nuxt/mongoose";

export default defineNitroPlugin(() => {
	const uri = process.env.DATABASE_URL;
	if (!useRuntimeConfig().mongoose.uri && uri) {
		void defineMongooseConnection({ uri });
	}
});
