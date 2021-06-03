"use strict";
import { Context, Service, ServiceBroker, ServiceSchema } from "moleculer";
import Sequelize from "sequelize";

import DbConnection from "../mixins/db.mixin";

export default class ProductsService extends Service {
	private DbMixin = new DbConnection("products").start();

	// @ts-ignore
	public constructor(broker: ServiceBroker, schema: ServiceSchema<{}> = {}) {
		super(broker);
		this.parseServiceSchema(
			Service.mergeSchemas(
				{
					name: "products",
					mixins: [this.DbMixin],
					model: {
						// name: "products",
						// define: {
						// 	name: Sequelize.STRING,
						// 	quantity: Sequelize.INTEGER,
						// 	price: Sequelize.INTEGER,
						// },
						// options: {
						// 	// Options from http://docs.sequelizejs.com/manual/tutorial/models-definition.html
						// },
					},
					settings: {
						// // Available fields in the responses
						// fields: ["_id", "name", "quantity", "price"],
						// // Validator for the `create` & `insert` actions.
						// entityValidator: {
						// 	name: "string|min:3",
						// 	price: "number|positive",
						// },
					},
					hooks: {
						before: {
							/**
							 * Register a before hook for the `create` action.
							 * It sets a default value for the quantity field.
							 *
							 * @param {Context} ctx
							 */
							// create: (ctx: Context<{ quantity: number }>) => {
							// 	ctx.params.quantity = 0;
							// },
						},
					},
					actions: {
						/**
						 * The "moleculer-db" mixin registers the following actions:
						 *  - list
						 *  - find
						 *  - count
						 *  - create
						 *  - insert
						 *  - update
						 *  - remove
						 */

						find: false,
						count: false,
						insert: false,
						// --- ADDITIONAL ACTIONS ---
						list: {
							rest: {
								method: "GET",
								path: "/",
							},
							params: {},
							handler(ctx: Context<any>): Promise<any> {
								return this.adapter.db
									.query(`SELECT * FROM products`)
									.then((res: any) => res);
							},
						},
						create: {
							rest: {
								method: "POST",
								path: "/",
							},
							params: {
								name: "string",
								quantity: "number",
								price: "number",
							},
							handler(
								ctx: Context<{
									name: string;
									quantity: number;
									price: number;
								}>
							): string {
								return this.adapter.db
									.query(
										`INSERT INTO products(id, name, price, quantity) ` +
											`VALUES(DEFAULT, '${ctx.params.name}', '${ctx.params.price}', '${ctx.params.quantity}');`
									)
									.then((res: any) => res);
							},
						},
						update: {
							rest: {
								method: "PUT",
								path: "/:id",
							},
							params: {
								id: "string",
								name: "string",
							},
							handler(
								ctx: Context<{ id: number; name: string }>
							): string {
								return this.adapter.db
									.query(
										`UPDATE products SET name='${ctx.params.name}' WHERE id=${ctx.params.id};`
									)
									.then((res: any) => res);
							},
						},
						remove: {
							rest: {
								method: "DELETE",
								path: "/:id",
							},
							params: {
								id: "string",
							},
							handler(ctx: Context<{ id: number }>): string {
								return this.adapter.db
									.query(
										`DELETE FROM products WHERE id=${ctx.params.id};`
									)
									.then((res: any) => res);
							},
						},
						get: {
							rest: {
								method: "GET",
								path: "/:id",
							},
							params: {
								id: "string",
							},
							handler(ctx: Context<{ id: number }>): string {
								return this.adapter.db
									.query(
										`SELECT * FROM products WHERE id=${ctx.params.id};`
									)
									.then((res: any) => res);
							},
						},
					},
					methods: {
						/**
						 * Loading sample data to the collection.
						 * It is called in the DB.mixin after the database
						 * connection establishing & the collection is empty.
						 */
						async seedDB() {
							await this.adapter.insertMany([
								{
									name: "Samsung Galaxy S10 Plus",
									quantity: 10,
									price: 704,
								},
								{
									name: "iPhone 11 Pro",
									quantity: 25,
									price: 999,
								},
								{
									name: "Huawei P30 Pro",
									quantity: 15,
									price: 679,
								},
							]);
						},
					},
					/**
					 * Loading sample data to the collection.
					 */
					async afterConnected() {
						await this.adapter.db.query(
							"CREATE TABLE IF NOT EXISTS `products` (" +
								"`id` INTEGER NOT NULL auto_increment ," +
								"`name` VARCHAR(255), " +
								"`quantity` INTEGER, " +
								"`price` INTEGER, " +
								"`createdAt` DATETIME DEFAULT CURRENT_TIMESTAMP," +
								"`updatedAt` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP," +
								"PRIMARY KEY (`id`)" +
								") ENGINE=InnoDB;"
						);
					},
				},
				schema
			)
		);
	}
}
