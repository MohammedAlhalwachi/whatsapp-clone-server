require('dotenv').config()

import express from 'express';
import {isAuthed} from "../middleware/isAuthed";
import auth from "./auth";
import Room from "../models/Room";
const { body, validationResult } = require('express-validator');
import User from "../models/User";
import Sequelize, {Op} from "sequelize";
import Message from "../models/Message";
import {parse} from "dotenv";
import {param} from "express-validator";
import {pusher} from '../services/pusher'

const rooms = express();

const existsInDb = (model, columnName) => {
	return (value, meta) => {
		const field = columnName ?? meta.path;
		const where = {};
		where[field] = value;

		return model.findOne({
			where: where,
		}).then(user => {
			if (user === null) {
				return Promise.reject(`${model.name} (${field}: ${value}): does not exist.`);
			}
		});
	}
}

const inRoom = async (req, res, next) => {
	try {
		const room = await Room.findByPk(req.params.id);

		if(room.user1Id === req.user.id || room.user2Id === req.user.id)
			return next()

		return res.status(403).json({
			error: 'user is not in this room'
		});
	}catch (err){
		next(err);
	}
}

rooms.use(isAuthed);

rooms.get('/', async (req, res, next) => {
	try{
		const user = await User.findByPk(req.user.id);

		const rooms = await user.getRooms();

		res.json(rooms);
	}catch (err){
		next(err)
	}
});

rooms.post('/',
	[
		body('id').exists().withMessage('ID is required').toInt().isInt().withMessage('ID should be a number').custom(async value => {
			if(isNaN(value))
				return Promise.resolve()

			const user = await User.findOne({
				where: {
					id: parseInt(value),
				}
			});

			if(user === null)
				return Promise.reject('No user with this ID')
		}).custom((value, { req }) => {
			return req.user.id !== value;
		}).withMessage('you cannot make a conversation with your self'),
	],
	async (req, res, next) => {
	try{
		const errors = validationResult(req);
		if (!errors.isEmpty()) {
			return res.status(422).json({ errors: errors.array() });
		}

		const currentUser = await User.findOne({
			where: {
				id: req.user.id,
			}
		});
		const user = await User.findOne({
			where: {
				id: parseInt(req.body.id),
			}
		});

		// const roomsIds = (await currentUser.getRooms()).map(room => room.id);

		let room = await Room.findOne({
			include: [
				{
					model: User,
					as: 'user1'
				},
				{
					model: User,
					as: 'user2'
				}
			],
			where: {
				[Op.or]: [
					{
						[Op.and]: [
							{
								'$user1.id$': currentUser.id,
							},
							{
								'$user2.id$': user.id,
							}
						],
					},
					{
						[Op.and]: [
							{
								'$user1.id$': user.id,
							},
							{
								'$user2.id$': currentUser.id,
							}
						],
					}
				]
			}
		});

		if(room === null) {
			room = await Room.create({
				user1Id: currentUser.id,
				user2Id: user.id,
			});
		}
		
		res.json(room);
	}catch (err){
		next(err)
	}
});

rooms.get('/:id/messages', [
	inRoom,
], async (req, res, next) => {
	try{
		const { id } = req.params;
		
		const room = await Room.findByPk(id, {
			include: Message,
			order: [
				[Message, 'createdAt', 'DESC']
			]
		});

		if(room){
			const messages = await room.messages;
			res.json(messages);
		} else
			res.json([]);
	}catch (err){
		next(err)
	}
});

rooms.post('/:id/messages', [
	param('id').custom(existsInDb(Room, 'id')),
], inRoom, async (req, res, next) => {
	try{
		const errors = validationResult(req);
		if (!errors.isEmpty()) {
			return res.status(422).json({ errors: errors.array() });
		}
		
		const { id } = req.params;
		const { body } = req.body;

		const room = await Room.findByPk(id);

		const message = await Message.create({
			body,
			userId: req.user.id,
			roomId: room.id,
		})

		pusher.trigger(`room-21`, 'update-messages', {
			'message': 'hello world'
		}, function (){
			res.json(message);
		});
	}catch (err){
		next(err)
	}
});

export default rooms;
