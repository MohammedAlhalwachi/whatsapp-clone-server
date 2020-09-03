require('dotenv').config();

import sequelize from './models/sequelize';
import express from 'express';
import bodyParser from 'body-parser';
import cookieParser from "cookie-parser";
import session from 'express-session'
import cors from 'cors';

const FileStore = require('session-file-store')(session);

const passport = require("passport");
const LocalStrategy = require('passport-local').Strategy;

import api from './routes/api'
import {User} from "./models/models";

const app = express();
const port = process.env.PORT || 4000;

app.options('*', cors({
	origin: 'http://localhost:3000',
	credentials: true,
}));

app.use(cors({
	origin: 'http://localhost:3000',
	credentials: true,
}));

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(cookieParser(process.env.APP_KEY));
app.use(session({ 
	store: new FileStore({}),
	secret: process.env.APP_KEY,
	resave: false,
	saveUninitialized: false,
}));
app.use(passport.initialize());
app.use(passport.session());

passport.serializeUser(function(user, done) {
	done(null, user.id);
});

passport.deserializeUser(async function(id, done) {
	try{
		const user = await User.findByPk(id);
		console.log('user uid:', id)
		console.log('user:', user.toJSON())

		done(null, user.toJSON())
	}catch (err){
		done(err, null);
	}
});

passport.use(new LocalStrategy({ usernameField: 'email', passwordField: 'password' }, async function(email, password, done) {
		try {
			const user = await User.findOne({
				where: {
					email: email,
				}
			});

			if (!user) {
				return done(null, false, { message: 'Incorrect username.' });
			}
			
			const isPasswordValid = await user.validPassword(password);
			console.log(isPasswordValid)

			if (!isPasswordValid) {
				return done(null, false, { message: 'Incorrect password.' });
			}

			return done(null, user);
		}catch (err){
			return done(err);
		}

		// User.findOne({ username: email }, function (err, user) {
		// 	if (err) { return done(err); }
		// 	if (!user) {
		// 		return done(null, false, { message: 'Incorrect username.' });
		// 	}
		// 	if (!user.validPassword(password)) {
		// 		return done(null, false, { message: 'Incorrect password.' });
		// 	}
		// 	return done(null, user);
		// });
	}
));



app.use((req, res, next) => {
	try {
		// console.log('Test middleware');
		next();
	} catch (e) {
		next(e);
	}
});

app.get('/sync', async (req, res, next) => {
	try {
		await sequelize.sync({force: true });
		res.send('synced');
	} catch (e){
		next(e);
	}
});

app.use('/api', api);

app.use(function (err, req, res, next) {
	res.status(500).json({
		error: err.message
	});
})

app.listen(port, () => console.log(`Server listening at port: ${port}`));
