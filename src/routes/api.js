import express from 'express';
const passport = require('passport')
const LocalStrategy = require('passport-local').Strategy;

const { body, validationResult } = require('express-validator');
import hash from "../services/hash";
import {User} from "../models/models";
import {isAuthed} from "../middleware/isAuthed";

const unique = (model) => {
	return (value, meta) => {
		const field = meta.path;
		const where = {};
		where[field] = value;

		return model.findOne({
			where: where,
		}).then(user => {
			if (user) {
				return Promise.reject(`${field} already in use.`);
			}
		});
	}
}

const api = express();

api.post('/register', [
	body('username').exists().withMessage('Username is required.').isLength({ min: 4, max: 30 }).withMessage('Username should be at least 4 characters and less than 30 characters.').escape(),
	body('email').isEmail().withMessage('Email is not correct.').normalizeEmail(),
	body('password').exists().withMessage('Password is required.').isLength({ min: 6, max: 60 }).withMessage('Password should be at least 6 characters.'),
	body('username').custom(unique(User)),
	body('email').custom(unique(User)),
], async (req, res, next) => {
	
	const { username, email, password } = req.body;

	const errors = validationResult(req);
	if (!errors.isEmpty()) {
		return res.status(422).json({ errors: errors.array() });
	}

	try {
		const hashedPassword = await hash.make(password);
		
		const newUser = await User.create({
			username: username,
			email: email,
			password: hashedPassword,
		});

		res.json({
			username: newUser.username,
			email: newUser.email,
		});
	} catch (e){
		console.error('Could not creat a user: ', e.stack);
		next(new Error('Could not create a user'));
	}
});

api.post('/login',
	body('email').isEmail().withMessage('Email is not correct.').normalizeEmail(),
	body('password').exists().withMessage('Password is required.').isLength({ min: 6, max: 60 }).withMessage('Password should be at least 6 characters.'),
	passport.authenticate('local'),
	(req, res) => {
		res.json(req.user);
	}
);

api.get('/user',
	isAuthed,
	(req, res) => {
		res.json(req.user);
	}
);

api.post('/logout', function(req, res){
	req.logout();
	res.json({
		msg: 'logged out'
	});
});

export default api;
