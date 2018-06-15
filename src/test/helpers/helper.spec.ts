import main from "../..";
import * as entities from "../../entity";

before((done) => {
	main()
		.then(done)
		.catch(console.error);
});

const wipeModels = async () => {
	await Promise.all(Object.values(entities).map(async entity => {
		const entries = await entity.find();
		await Promise.all(entries.map(entry => entry.remove()));
	}));
};

beforeEach(wipeModels);
afterEach(wipeModels);
