const express = require('express')
const router = express.Router()
const auth = require('../../middleware/auth')
const config = require('config')
const { check, validationResult } = require('express-validator')
const jwt = require('jsonwebtoken')
const bcrypt = require('bcryptjs')

const User = require('../../models/User')

//@route get/ api
//@desc
//@acces
//Get the user data =>
router.get('/', auth, async (req, res) => {
	try {
		const user = await User.findById(req.user.id).select('-password')
		res.json(user)
	} catch (err) {
		console.log(err.message)
		res.status(500).send('Server Error')
	}
})

//@route
//@description register user
//@acces

router.post(
	'/',
	[check('email', 'Please include a valid email').isEmail(), check('password', 'Password is required').exists()],

	async (req, res) => {
		const errors = validationResult(req)
		if (!errors.isEmpty()) {
			return res.status(400).json({ errors: errors.array() })
		}

		const { email, password } = req.body
		try {
			// See if user exists
			let user = await User.findOne({ email })

			if (!user) {
				return res.status(400).json({ errors: [{ msg: '!Email is valid, developer' }] })
			}

			const isMatch = await bcrypt.compare(password, user.password)

			if (!isMatch) {
				return res.status(400).json({ errors: [{ msg: 'Invalid password' }] })
			}

			//Return jsonwebtoken
			const payload = {
				user: {
					id: user.id,
				},
			}
			jwt.sign(
				payload,
				config.get('jwtSecret'),
				//remove for deployment
				{ expiresIn: 360000 },
				(err, token) => {
					if (err) throw err
					res.json({ token })
				}
			)
		} catch (err) {
			console.error(err.message)
			res.status(500).send('Server error')
		}
	}
)

module.exports = router
