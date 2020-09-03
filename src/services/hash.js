import bcrypt from 'bcrypt';

const saltRounds = 10;

const make = (value) => bcrypt.hash(value, saltRounds);
const compare = (password, hash) => bcrypt.compare(password, hash);

export default {
	make,
	compare
}
