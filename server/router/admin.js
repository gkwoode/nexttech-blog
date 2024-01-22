const express = require('express');
const router = express.Router();
const Post = require('../models/Post');
const multer = require('multer');
const path = require('path');
const { ensureAuthenticated } = require('../config/auth')

const adminLayout = '../views/layouts/admin';


// Image upload
const storage = multer.diskStorage({
    destination: './uploads',
    filename: function(req, file, cb){
        cb(null, file.fieldname + '-' + Date.now() +
        path.extname(file.originalname));
    }
});

// Init Upload
const upload = multer({
    storage: storage,
    limits: {fileSize: 1000000},
    fileFilter: function(req, file, cb){
        checkFileType(file, cb);
    }
}).single('image');

// Check File Type
function checkFileType(file, cb){
    
    // allowed extension
    const filetypes = /jpeg|jpg|png|gif/;

    // Check extension
    const extname = filetypes.test(path.extname
        (file.originalname).toLowerCase());

    // Check mime
    const mimetype = filetypes.test(file.mimetype);

    if(mimetype && extname) {
        return cb(null, true);
    } else {
        cb('Error: Images Only! ')
    }
}

/**
 * Get /
 * Admin dashboard
 */
router.get('/dashboard', upload, ensureAuthenticated, async (req, res) => {
    try {
        const locals = {
            title: 'Dashboard',
            description: ''
        }

        const userId = req.user._id;
        const data = await Post.find({ createdBy: userId});

        res.render('admin/dashboard', {
            name: req.user.name,
            locals,
            data,
            layout: adminLayout
        });
    } catch (err) {
        console.log(err);
    }
});

/**
 * GET /
 * Admin - Create New Post
 */
router.get('/add-post', upload, ensureAuthenticated, async (req, res) => {
    try {
        const locals = {
            title: 'Add Post',
            description: ""
        }

        const data = await Post.find();
        res.render('admin/add-post', {
            name: req.user.name,
            data,
            locals,
            layout: adminLayout
        })  
    } catch (err) {
        console.log(err);
    }

});

/**
 * Post /
 * Admin - Create New Post
 */
router.post('/add-post', upload, ensureAuthenticated, async (req, res) => {
    try {
        const userId = req.user._id;

        const newPost = new Post({
            title: req.body.title,
            body: req.body.body,
            createdBy: userId,
            image: req.body.image
        });

        try {
            const data = await Post.upload(req, res);
            if (req.file == undefined) {
                res.render('admin/dashboard', {
                    data,
                    name: req.user.name,
                    msg: 'Error: No File Selected!'
                });
            } else {
                res.render('admin/dashboard', {
                    data,
                    name: req.user.name,
                    msg: 'File Uploaded!',
                    file: `uploads/${req.file.filename}`
                });
            }
        } catch (err) {
            res.render('admin/dashboard', {
                data,
                name: req.user.name,
                msg: err
            });
        }

        await Post.create(newPost);
        res.redirect('/dashboard');

    } catch (err) {
        res.render('admin/dashboard', {
            name: req.user.name,
            msg: err
        })
    }
});

/**
 * GET /
 * Admin - Update old Blog
 */
router.get('/edit-post/:id', upload, ensureAuthenticated, async (req, res) => {
    try {
        let par = req.params.id
        const data = await Post.findOne({ _id: par });

        const locals = {
            title: "Edit Blog",
            description: "",
        };
        
        res.render('admin/edit-post', {
            data,
            locals,
            layout: adminLayout,
        })

    } catch (err) {
        console.log(err);
    }

});

/**
 * PUT /
 * Admin - Update old Blog
 */
router.put('/edit-post/:id', ensureAuthenticated, async (req, res) => {
    try {
        await Post.findByIdAndUpdate(req.params.id, {
            title: req.body.title,
            body: req.body.body,
            updatedAt: Date.now()
        });

        res.redirect(`/edit-post/${req.params.id}`)
    } catch (err) {
        console.log(err);
    }
});

/**
 * DELETE /
 * Delete -> Blog
 */
router.delete('/delete-post/:id', ensureAuthenticated, async (req, res) => {
    try {
        await Post.deleteOne( { _id: req.params.id } );
        res.redirect('/dashboard');
    } catch (err) {
        console.log(err)
    }
});

/**
 * GET /
 * Admin -> LOGOUT
 */
router.get('/logout', ensureAuthenticated, (req, res) => {
    req.logout();
    req.flash('success_msg', 'You are logged out');
    res.redirect('/login');
});

// performSearch function
router.get('/search', ensureAuthenticated, async (req, res) => {
    try {
        const regex = new RegExp(escapeRegex(req.query.search), 'gi');

        const searchResult = await Post.find({ 
            $or: [
                { title: regex },
                { body: regex }
            ]
        });

        const locals = {
            title: 'Search',
            description: ''
        };

        res.render('main/search', {
            name: req.user.name,
            searchResult,
            locals,
            layout: adminLayout
        });
    } catch (err) {
        console.log(err);
    }
});

module.exports = router;