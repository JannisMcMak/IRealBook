import { DataSource } from 'typeorm';

export const AppDataSource = new DataSource({
	type: 'sqlite',
	database: './data/data.db',
	synchronize: true,
	logging: false,
	entities: ['dist/model/index.js'],
	migrations: ['dist/migrations/*.js'],
	migrationsRun: false
});
