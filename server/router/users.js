const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const passport = require('passport');

// User model
const User = require('../models/User');
const Post = require('../models/Post');
const ForgetPassword = require('../models/ForgetPassword');

// View page
const usersLayout = '../views/layouts/users';

// Login Page
router.get('/login', async (req, res) => {
   try {
    const locals = {
        title: "Login",
        description: ""
    }

    res.render('users/login', {
        layout: usersLayout,
        locals
    })
   }
   catch (err) {
    console.log(err)
   }
});

// Register Page
router.get('/register', (req, res) => {
    try {
        const locals = {
            title: "Register",
            description: ""
        }
    
        res.render('users/register', {
            layout: usersLayout,
            locals
        })
    }
    catch (err) {
        console.log(err)
    }
});

// Register Handler
router.post('/register', (req, res) => {

    const { name, email, password, password2 } = req.body;
    let errors = [];

    // Check required fields
    if(!name || !email || !password || !password2) {
        errors.push({ msg: 'Please fill in all fields'});
    }

    // Check passwords match
    if(password !== password2) {
        errors.push({ msg: 'Passwords do not match' })
    }

    // Check pass length
    if(password.length < 6) {
        errors.push({ msg: 'Password should be at least 6 characters' });
    }

    if(errors.length > 0) {
        res.render('users/register', {
            errors,
            name,
            email,
            password,
            password2
        });
    } else {
        // Validation passed
        User.findOne({ email: email })
            .then(user => {
                if(user) {
                    // User exists
                    errors.push({ msg: 'Email is already registered' })
                    res.render('users/register', {
                        errors,
                        name,
                        email,
                        password,
                        password2
                    });
                } else {
                    const newUser = new User({
                        name,
                        email,
                        password
                    });

                    // Hash Password
                    bcrypt.genSalt(10, (err, salt) => 
                        bcrypt.hash(newUser.password, salt, (err, hash) => {
                            if(err) throw err;
                            // Set password to hashed
                            newUser.password = hash;
                            // Save user
                            newUser.save()
                                .then(user => {
                                    req.flash('success_msg', 'You are now registered and can login')
                                    res.redirect('/login')
                                })
                                .catch(err => console.log(err));
                        }))

                }
            })
    }
});

router.post('/login', async (req, res, next) => { 
    try { 
        await passport.authenticate('local', { 
            successRedirect: '/dashboard', 
            failureRedirect: '/login', 
            failureFlash: true 
        })(req, res, next); 
    } catch (error) { 
        next(error); 
    } 
});

// Forgot Password Request Form
router.get('/forget-password', (req, res) => {
    try {
        const locals = {
            title: "Forgot Password",
            description: ""
        }
    
        res.render('users/forget-password', {
            layout: usersLayout,
            locals
        })
    }
    catch (err) {
        console.log(err)
    }
});

// Forget Password Request Handler
router.post('/forget-password', async (req, res) => {
    const { email } = req.body;

    try {
        // Find user
        const user = await User.findOne({ email: email });
        if(!user) {
            req.flash('error_msg', 'No account with that email address exists');
            return res.redirect('/forget-password');
        }

        // Create token
        const resetToken = await bcrypt.hash(user.email, 10);

        // Create expire token
        const expireToken = Date.now() + 3600000;

        // Create password reset
        const forgetPassword = new ForgetPassword({
            email: user.email,
            userId: user._id,
            resetToken: resetToken,
            expireToken: expireToken
        });

        // Save password reset
        await forgetPassword.save();

        // Send email
        const nodemailer = require('nodemailer');
        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: ' ',
                pass: ' '
            }
        });

        const mailOptions = {
            from: ' ',
            to: user.email,
            subject: 'Password Reset',
            html: `
                <p>You requested for password reset</p>
                <h5>Click on this <a href="http://localhost:3000/reset-password/${resetToken}">link</a> to reset password</h5>
            `
        };

        transporter.sendMail(mailOptions, (err, info) => {
            if(err) {
                console.log(err);
            } else {
                console.log('Email sent: ' + info.response);
            }
        });

        req.flash('success_msg', 'Check your email for password reset link');
        res.redirect('/forget-password');

    } catch (err) {
        console.log(err);
    }
});

// Display reset password page
router.get('/reset-password/:resetToken', async (req, res) => {
    const resetToken = req.params.resetToken;

    try {
        const forgetPassword = await ForgetPassword.findOne({ resetToken: resetToken });

        if(!forgetPassword || Date.now() > forgetPassword.expireToken) {
            req.flash('error_msg', 'Password reset link is invalid or has expired');
            return res.redirect('/forget-password');
        }

        const locals = {
            title: "Reset Password",
            description: ""
        }

        res.render('users/reset-password', {
            layout: usersLayout,
            locals,
            resetToken
        });

    } catch (err) {
        console.log(err);
        res.redirect('/forget-password');
    }
});

// Handle reset password
router.post('/reset-password/:resetToken', async (req, res) => {
    const resetToken = req.params.resetToken;
    const { password, password2 } = req.body;

    try {
        const forgetPassword = await ForgetPassword.findOne({ resetToken: resetToken });

        if(!forgetPassword || Date.now() > forgetPassword.expireToken) {
            req.flash('error_msg', 'Password reset link is invalid or has expired');
            return res.redirect('/forget-password');
        }

        // Check passwords match
        if(password !== password2) {
            req.flash('error_msg', 'Passwords do not match');
            return res.redirect(`/reset-password/${resetToken}`);
        }

        // Check pass length
        if(password.length < 6) {
            req.flash('error_msg', 'Password should be at least 6 characters');
            return res.redirect(`/reset-password/${resetToken}`);
        }

        const user = await User.findOne({ email: forgetPassword.email });
        if(!user) {
            req.flash('error_msg', 'No account with that email address exists');
            return res.redirect('/forget-password');
        }

        // Hash Password
        bcrypt.genSalt(10, (err, salt) => 
            bcrypt.hash(password, salt, async (err, hash) => {
                if(err) throw err;
                // Set password to hashed
                user.password = hash;
                // Save user
                await user.save();
                await forgetPassword.remove();
                req.flash('success_msg', 'Password reset successful');
                res.redirect('/login');
            })
        );

        // Update password
        User.findOneAndUpdate({ email: forgetPassword.email }, {
            password: password
        });

        // Delete password reset
        await forgetPassword.remove();

    } catch (err) {
        console.log(err);
    }
});

module.exports = router;