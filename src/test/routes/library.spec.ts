import chai from "chai";
import { expect } from "chai";
import chaiHttp from "chai-http";
import { Album, Artist, Song } from "../../entity";

chai.use(chaiHttp);

process.env.NODE_ENV = "test";

describe("Library routes", () => {

	describe("GET /library/song", () => {
		it("should return an empty array", (done) => {
			chai.request("http://localhost:3000")
				.get("/library/songs")
				.end((err, res) => {
					expect(res).to.have.status(200);
					expect(res.body).to.be.an("array").of.length(0);
					done();
				});
		});

		it("should return an array with one song", async () => {
			const artist = new Artist();
			artist.name = "Test artist";
			await artist.save();

			const album = new Album();
			album.name = "Test album";
			await album.save();

			const song = new Song();
			song.name = "Test song";
			song.location = "";
			song.artists = [artist];
			song.albums = [album];
			await song.save();

			const res = await chai.request("http://localhost:3000")
				.get("/library/songs");

			expect(res).to.have.status(200);
			expect(res.body).to.be.an("array").of.length(1);
			expect(res.body[0]).to.have.keys(["id", "location", "sortName", "name", "artists", "albums", "trackNo"]);
			expect(res.body[0].artists).to.be.an("array").of.length(1);
			expect(res.body[0].albums).to.be.an("array").of.length(1);
		});
	});
});
