const express = require('express')
const router = express.Router()
const { check, validationResult } = require('express-validator')
const auth = require('../../middleware/auth')

const Post = require('../../models/Post')
const Profile = require('../../models/Profile')
const User = require('../../models/User')

//@route  POST api/posts
//@desc   Create a post
//@acces  Private

router.post('/', [auth, [check('text', 'Text is required').not().isEmpty()]], async (req, res) => {
	const errors = validationResult(req)
	if (!errors.isEmpty()) {
		return res.status(400).json({ errors: errors.array() })
	}

	try {
		const user = await User.findById(req.user.id).select('-password')

		const newPost = new Post({
			text: req.body.text,
			name: user.name,
			avatar: user.avatar,
			user: req.user.id,
		})
		const post = await newPost.save()

		res.json(post)
	} catch (err) {
		console.error(err.message)
		res.status(500).send('Server error post')
	}
})

//@route  GET api/posts
//@desc   Create a post
//@acces  Private
router.get('/', auth, async (req, res) => {
	try {
		const posts = await Post.find().sort({ date: -1 })
		res.json(posts)
	} catch (err) {
		console.error(err.message)
		res.status(500).send('Server Error get posts')
	}
})

//@route  GET api/posts/:id
//@desc   Get posts by ID
//@acces  Private
router.get('/:id', auth, async (req, res) => {
	try {
		const post = await Post.findById(req.params.id)

		if (!post) {
			return res.status(404).json({ msg: 'Post not found' })
		}

		res.json(post)
	} catch (err) {
		console.error(err.message)
		if (err.kind === 'ObjectId') {
			return res.status(404).json({ msg: 'Post not found' })
		}
		res.status(500).send('Server Error get post by id')
	}
})

//@route  Delete api/posts/:id
//@desc   Delete a post
//@acces  Private
router.delete('/:id', auth, async (req, res) => {
	try {
		const post = await Post.findById(req.params.id)

		if (!post) {
			return res.status(404).json({ msg: 'Post not found' })
		}
		//Check if is the post owner
		if (post.user.toString() !== req.user.id) {
			return res.status(401).json({ msg: 'User not authorized' })
		}

		await post.remove()

		res.json({ msg: 'Post removed' })
	} catch (err) {
		console.error(err.message)
		if (err.kind === 'ObjectId') {
			return res.status(404).json({ msg: 'Post not found' })
		}
		res.status(500).send('Server Error delete post')
	}
})

//@route  PUT api/posts/like:id
//@desc   Like a post
//@acces  Private
router.put('/like/:id', auth, async (req, res) => {
	try {
		const post = await Post.findById(req.params.id)

		//Check if the post has already been liked
		if (post.likes.filter(like => like.user.toString() === req.user.id).length > 0) {
			return res.status(400).json({ msg: 'Hmm!! seems like you want to raise your own likes..!' })
		}
		post.likes.unshift({ user: req.user.id })

		await post.save()

		res.json(post.likes)
	} catch (err) {
		console.error(err.message)
		res.status(500).send('Server error likes')
	}
})
//@route  PUT api/posts/unlike:id
//@desc   Unlike a post
//@acces  Private
router.put('/unlike/:id', auth, async (req, res) => {
	try {
		const post = await Post.findById(req.params.id)

		//Check if the post has already been liked
		if (post.likes.filter(like => like.user.toString() === req.user.id).length === 0) {
			return res.status(400).json({ msg: "Hmm!! seems like you haven't liked it" })
		}
		//Get the remove index
		const removeIndex = post.likes.map(like => like.user.toString()).indexOf(req.user.id)

		post.likes.splice(removeIndex, 1)

		await post.save()

		res.json(post.likes)
	} catch (err) {
		console.error(err.message)
		res.status(500).send('Server error unlikes')
	}
})
//@route  PUT api/posts/dislike:id
//@desc   Dislike a post
//@acces  Private
router.put('/dislike/:id', auth, async (req, res) => {
	try {
		const post = await Post.findById(req.params.id)

		//Check if the post has already been liked
		if (post.dislikes.filter(dislike => dislike.user.toString() === req.user.id).length > 0) {
			return res.status(400).json({ msg: 'Hmm!! seems like you want to raise your own dislikes..!' })
		}
		post.dislikes.unshift({ user: req.user.id })

		await post.save()

		res.json(post.dislikes)
	} catch (err) {
		console.error(err.message)
		res.status(500).send('Server error dislikes')
	}
})
//@route  PUT api/posts/undislike:id
//@desc   Undislike a post
//@acces  Private
router.put('/undislike/:id', auth, async (req, res) => {
	try {
		const post = await Post.findById(req.params.id)

		//Check if the post has already been liked
		if (post.dislikes.filter(dislike => dislike.user.toString() === req.user.id).length === 0) {
			return res.status(400).json({ msg: 'Hmm!! seems like you have undisliked it already' })
		}
		//Get the remove index
		const removeIndex = post.dislikes.map(dislike => dislike.user.toString()).indexOf(req.user.id)

		post.dislikes.splice(removeIndex, 1)

		await post.save()

		res.json(post.dislikes)
	} catch (err) {
		console.error(err.message)
		res.status(500).send('Server error undislikes')
	}
})
//@route  POST api/posts/comment?:id
//@desc   Comment on a post
//@acces  Private

router.post('/comment/:id', [auth, [check('text', 'Text is required').not().isEmpty()]], async (req, res) => {
	const errors = validationResult(req)
	if (!errors.isEmpty()) {
		return res.status(400).json({ errors: errors.array() })
	}

	try {
		const user = await User.findById(req.user.id).select('-password')
		const post = await Post.findById(req.params.id)

		const newComment = {
			text: req.body.text,
			name: user.name,
			avatar: user.avatar,
			user: req.user.id,
		}

		post.comments.unshift(newComment)

		await post.save()

		res.json(post.comments)
	} catch (err) {
		console.error(err.message)
		res.status(500).send('Server error comments')
	}
})
//@route  DELETE api/posts/comment/:id/:comment_id
//@desc   Delete comment
//@acces  Private

router.delete(
	'/comment/:id/:comment_id',
	[auth, [check('text', 'Text is required').not().isEmpty()]],
	async (req, res) => {
		try {
			const post = await Post.findById(req.params.id)

			//pull comment

			const comment = post.comments.find(comment => comment.id === req.params.comment_id)

			// Make sure comment exist
			if (!comment) {
				return res.status(404).json({ msg: '!Comment exist developer' })
			}

			//Check user
			if (comment.user.toString() !== req.user.id) {
				return res.status(401).json({ msg: 'You are not authorize to do this, Buddy!' })
			}

			//Get the remove index
			const removeIndex = post.comments.map(comment => comment.user.toString()).indexOf(req.user.id)

			post.comments.splice(removeIndex, 1)

			await post.save()

			res.json(post.comments)
		} catch (err) {
			console.error(err.message)
			res.status(500).send('Server error delete comment')
		}
	}
)
module.exports = router
