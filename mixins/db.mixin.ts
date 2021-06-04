"use strict";

import { existsSync } from "fs";
import { sync } from "mkdirp";
import { Context, Service, ServiceSchema } from "moleculer";
import DbService from "moleculer-db";

export default class Connection
	implements Partial<ServiceSchema>, ThisType<Service>
{
	private cacheCleanEventName: string;
	private collection: string;
	private schema: Partial<ServiceSchema> & ThisType<Service>;

	public constructor(public collectionName: string) {
		this.collection = collectionName;
		this.cacheCleanEventName = `cache.clean.${this.collection}`;
		this.schema = {
			mixins: [DbService],
			events: {
				/**
				 * Subscribe to the cache clean event. If it's triggered
				 * clean the cache entries for this service.
				 *
				 */
				async [this.cacheCleanEventName]() {
					if (this.broker.cacher) {
						await this.broker.cacher.clean(`${this.fullName}.*`);
					}
				},
			},
			methods: {
				/**
				 * Send a cache clearing event when an entity changed.
				 *
				 * @param {String} type
				 * @param {any} json
				 * @param {Context} ctx
				 */
				entityChanged: async (
					type: string,
					json: any,
					ctx: Context
				) => {
					await ctx.broadcast(this.cacheCleanEventName);
				},
			},
			async started() {
				// Check the count of items in the DB. If it's empty,
				// Call the `seedDB` method of the service.
				if (this.seedDB) {
					const count = await this.adapter.count();
					if (count === 0) {
						this.logger.info(
							`The '${this.collection}' collection is empty. Seeding the collection...`
						);
						await this.seedDB();
						this.logger.info(
							"Seeding is done. Number of records:",
							await this.adapter.count()
						);
					}
				}
			},
		};
	}

	public start() {
		// eslint-disable-next-line @typescript-eslint/no-var-requires
		const SqlAdapter = require("moleculer-db-adapter-sequelize");
		this.schema.adapter = new SqlAdapter(
			process.env.DB_NAME,
			process.env.DB_USER,
			process.env.DB_PWD,
			{
				host: process.env.DB_HOST,
				dialect: process.env.DB_TYPE,
			}
		);
		this.schema.collection = this.collection;

		return this.schema;
	}

	public get _collection(): string {
		return this.collection;
	}

	public set _collection(value: string) {
		this.collection = value;
	}
}
