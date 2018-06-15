import main from "../..";

before((done) => {
	main()
		.then(done)
		.catch(console.error);
});
