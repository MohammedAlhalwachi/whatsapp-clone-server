export const isAuthed = (req, res, next) => {
	if(req.isAuthenticated()){
		next();
	}else{
		return res.status(401).json({
			error: 'user is not logged in'
		})
	}
}
