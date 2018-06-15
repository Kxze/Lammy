import chai from "chai";
import { expect } from "chai";
import chaiHttp from "chai-http";
import { Song } from "../../entity";

chai.use(chaiHttp);

process.env.NODE_ENV = "test";

describe("Library routes", () => {
	
	before(async () => {
		
	});

	describe("GET /library/song", () => {
		it("should return an array of two songs", (done) => {
			chai.request("http://localhost:3000")
				.get("/library/songs")
				.end((err, res) => {
					expect(res).to.have.status(200);
					done();
				});
		});
	});
});
