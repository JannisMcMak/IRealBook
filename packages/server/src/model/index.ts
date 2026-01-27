import {
	Column,
	CreateDateColumn,
	Entity,
	Index,
	ManyToOne,
	OneToMany,
	PrimaryGeneratedColumn,
	UpdateDateColumn
} from 'typeorm';
export * from './mappings.js';

@Entity()
@Index(['name', 'key'], { unique: true })
@Index(['shortName', 'key'], { unique: true })
export class Source {
	@PrimaryGeneratedColumn('uuid')
	id: string;

	@Column()
	name: string;

	@Column()
	shortName: string;

	@Column({ default: 'C' })
	key: string;

	@Column({ type: 'text', nullable: true })
	publisher: string | null;

	@Column({ type: 'date', nullable: true })
	publishDate: Date | null;
}

@Entity()
export class Tune {
	@PrimaryGeneratedColumn('uuid')
	id: string;

	@Column({ unique: true })
	title: string;

	@Column({ type: 'text', nullable: true })
	artist: string | null;

	@Column({ type: 'text', nullable: true })
	key: string | null;

	@Column({ type: 'text', nullable: true })
	timeSignature: string | null;

	@Column('simple-array', { nullable: true })
	tags: string[] | null;

	@Column({ type: 'text', nullable: true })
	changes: string | null;

	@OneToMany(() => TuneVersion, (version) => version.tune, { cascade: true, eager: true })
	versions: TuneVersion[];

	@CreateDateColumn()
	createdAt: Date;

	@UpdateDateColumn()
	updatedAt: Date;
}

@Entity()
export class TuneVersion {
	@PrimaryGeneratedColumn('uuid')
	id: string;

	@ManyToOne(() => Tune, (tune) => tune.versions)
	tune: Promise<Tune>;

	@ManyToOne(() => Source, { cascade: true, eager: true })
	source: Source;

	@Column({ type: 'int' })
	pageFrom: number;

	@Column({ type: 'int' })
	pageTo: number;

	@CreateDateColumn()
	createdAt: Date;

	@UpdateDateColumn()
	updatedAt: Date;
}
