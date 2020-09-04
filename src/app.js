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

import auth from './routes/auth'
import rooms from "./routes/rooms";

import {User} from "./models/models";

const app = express();
const api = express.Router();
const port = process.env.PORT || 4000;

app.options('*', cors({
	origin: process.env.CLIENT_ORIGIN,
	credentials: true,
}));

app.use(cors({
	origin: process.env.CLIENT_ORIGIN,
	credentials: true,
}));

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(cookieParser(process.env.APP_KEY));
app.use(session({ 
	cookie: {
		sameSite: 'none',
		secure: true,
	},
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

passport.deserializeUser(async function(req, id, done) {
	try{
		const user = await User.findByPk(id);

		done(null, user.toJSON())
	}catch (err){
		req.session.destroy();
		done(err, null);
	}
});

passport.use(new LocalStrategy({ usernameField: 'email', passwordField: 'password' },
	async function(email, password, done) {
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
		next();
	} catch (e) {
		next(e);
	}
});

api.get('/sync', async (req, res, next) => {
	try {
		await sequelize.sync({ alter: true });
		res.send('synced');
	} catch (e){
		next(e);
	}
});

api.use('/auth', auth);
api.use('/rooms', rooms);

app.use('/api', api);

app.use(function (err, req, res, next) {
	console.error(err)

	res.status(500).json({
		error: 'Something went wrong please try again later.'
	});
})

app.listen(port, () => console.log(`Server listening at port: ${port}`));
