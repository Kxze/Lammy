import * as bcrypt from "bcrypt";
import { expect } from "chai";
import { User } from "../../entity";

describe("User entity", () => {
	let user: User;

	beforeEach(() => {
		user = new User();
	});

	it("should return false as the user's password is incorrect", async () => {
		const password = "12345";
		user.password = await bcrypt.hash(password, 10);
		
		expect(await user.verifyPassword(password + password)).to.be.false;
	});

	it("should verify the user's password correctly", async () => {
		const password = "12345";
		user.password = await bcrypt.hash(password, 10);
		
		expect(await user.verifyPassword(password)).to.be.true;
	});
});
