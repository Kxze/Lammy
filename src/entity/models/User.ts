import * as bcrypt from "bcrypt";
import { BaseEntity, Column, Entity, ManyToMany, PrimaryGeneratedColumn } from "typeorm";

@Entity()
export class User extends BaseEntity {

	@PrimaryGeneratedColumn()
	id!: number;

	@Column({
		nullable: false,
		unique: true,
	})
	username!: string;

	@Column({
		nullable: false,
	})
	password!: string;

	@Column()
	lastLogin!: Date;

	async verifyPassword(password: string) {
		const isValid = await bcrypt.compare(password, this.password);
		return isValid;
	}
}
