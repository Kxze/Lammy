import { BaseEntity, Column, Entity, JoinTable, ManyToMany, PrimaryGeneratedColumn } from "typeorm";
import { Artist } from "./Artist";
import { Song } from "./Song";

@Entity()
export class Album extends BaseEntity {

	@PrimaryGeneratedColumn()
	id!: number;

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

	@ManyToMany(type => Artist, (artist) => artist.albums)
	artists!: Artist[];

	@ManyToMany(type => Song, (song) => song.albums)
	@JoinTable()
	songs!: Song[];

}
