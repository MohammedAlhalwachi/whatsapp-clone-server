require('dotenv').config()
import { Sequelize } from 'sequelize'

const options = {
	database: process.env.DATABASE_NAME,
	username: process.env.DATABASE_USER,
	password: process.env.DATABASE_PASSWORD,
	host: process.env.DATABASE_HOST,
	dialect: process.env.DATABASE_DIALECT,
	logging: false,
}

export default new Sequelize(process.env.DATABASE_URL ? process.env.DATABASE_URL : options)
