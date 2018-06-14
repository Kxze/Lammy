import { BaseEntity, Column, Entity, JoinTable, ManyToMany, PrimaryGeneratedColumn } from "typeorm";
import { Album } from "./Album";
import { Artist } from "./Artist";

@Entity()
export class Song extends BaseEntity {

	@PrimaryGeneratedColumn()
	id!: number;

	@Column()
	location!: string;

	@Column({
		nullable: true,
	})
	sortName!: string;

	@Column()
	name!: string;

	@Column({
		nullable: true,
	})
	trackNo!: number;

	@ManyToMany(type => Artist, (artist) => artist.songs)
	artists!: Artist[];

	@ManyToMany(type => Album, (album) => album.songs)
	albums!: Album[];

}
