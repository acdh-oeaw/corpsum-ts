import { defineEventHandler, getHeaders, getQuery, readBody } from "h3";

export default defineEventHandler(async (event) => {
	const { username } = await requireAuth(event);
	const requestedEngine = event.context.params?.engine?.split("/")[0];
	let user: UserDocument | null = null;
	let noske: NoskeDocument | null = null;
	let authheader = "";


	try {
		user = await UserModel
			.findOne({ username });
	} catch {
		setResponseStatus(event, 401, "user not found - faulty token");
		return `the user ${username} was not found in the database`;
	}

	try {
		noske = await NoskeModel
			.findOne({ name: requestedEngine });
	} catch {
		setResponseStatus(event, 404, "engine not found - faulty request");
		return event.context.params?.engine ? `the engine ${event.context.params.engine} was not found in the database`: "no engine was specified";
	}


	const method = event.method;
	const params = getQuery(event);


	const headers = getHeaders(event);
	const url = event.node.req.url!;

	// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
	const body = method === "GET" ? undefined : await readBody(event);

	if(noske!.authentication === "basic" && user) {
		const credentials = user.credentials?.find(cred => cred.noskeinstance.toString() === noske!._id?.toString());
		if(!credentials) {
			setResponseStatus(event, 401, "user not authorized for this engine");
			return `the user ${username} has no credentials set up for engine ${noske!.name}`;
		}
		authheader = `Basic ${btoa(`${credentials.username}:${credentials.password}`)}`;
	}


	return await $fetch(url.split(noske!.name)[1]!, {
		headers: {
			"Content-Type": headers["content-type"]!,
			Authorization: authheader,
		},
		baseURL: noske!.base,
		method,
		params,
		// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
		body,
	});
});
