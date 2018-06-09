import { Column, Entity, JoinTable, ManyToMany, PrimaryGeneratedColumn } from "typeorm";
import { Album } from "./Album";
import { Song } from "./Song";

@Entity()
export class Artist {

	@PrimaryGeneratedColumn()
	id!: number;

	@Column({
		nullable: true,
	})
	mbid!: string;

	@Column({
		nullable: true,
	})
	sortName!: string;

	@Column()
	name!: string;

	@Column({
		nullable: true,
		type: "text",
	})
	description!: string;

	@ManyToMany(type => Song, (song) => song.artists)
	@JoinTable()
	songs!: Song[];

	@ManyToMany(type => Album, (album) => album.artists)
	@JoinTable()
	albums!: Album[];

}
