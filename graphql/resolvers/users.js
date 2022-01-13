const {
    User,Message
} = require('../../models');
const bcrypt = require('bcrypt');
const {
    UserInputError,
    AuthenticationError
} = require('apollo-server-errors');
var jwt = require('jsonwebtoken');
const {
    JWT_TOKEN
} = require('../../config/env.json');
const {
    Op
} = require("sequelize");



module.exports = {

    Query: {

        getUsers: async (_, __, {
            user
        }) => {
            try {

                if (!user) {
                    throw new AuthenticationError('You must be logged in to view this data')
                }

                let users = await User.findAll({
                    attributes: ['username', 'createdAt', 'imageUrl'],
                    where: {
                        username: {
                            [Op.ne]: user.data
                        }
                    },
                })
            
                console.log(user.data)
                const allUserMessages = await Message.findAll({
                    where: {[Op.or]: [{from: user.data}, {to: user.data}]},
                    order: [['createdAt', 'DESC']],
                })
               
                users = users.map((otherUser) => {
                    
                    const latestMessage = allUserMessages.find(
                      (m) => m.from === otherUser.username || m.to === otherUser.username
                    )
                  
                    otherUser.latestMessage = latestMessage
                    console.log(otherUser.latestMessage)
                    return otherUser
                  })
          
                return users
            } catch (error) {
                console.log(error);
                throw error;

            }
        },

        login: async (_, args) => {
            const {
                username,
                password
            } = args

            try {

                const user = await User.findOne({
                    where: {
                        username
                    }
                });
                // check if username and password are valid
                if (username === '' || password === '') {
                    throw new UserInputError('Please fill in all fields');
                }

                if (!user) {
                    throw new UserInputError('User not found');
                }
                const valid = await bcrypt.compare(password, user.password);
                if (!valid) {
                    throw new AuthenticationError('Invalid password');
                }
                // generate token
                const token = jwt.sign({
                    data: username
                }, JWT_TOKEN, {
                    expiresIn: '1h'
                });


                return {
                    ...user.toJSON(),
                    createdAt: user.createdAt.toISOString(),
                    token
                }
            } catch (error) {
                console.log(error);
                throw error;

            }
        }


    },


    Mutation: {
        register: async (_, {
            username,
            email,
            password,
            confirmPassword
        }) => {
            // Validate input
            try {
                //check if user already exists
                const userByUserName = await User.findOne({
                    where: {
                        username
                    }
                });

                //check if user email alreadt exists
                const userByEmail = await User.findOne({
                    where: {
                        email
                    }
                });

                if (userByUserName) {
                    throw new Error('User already exists');
                }

                if (userByEmail) {
                    throw new Error('Email already exists');
                }

                // Check if user is not empty
                if (username.trim() === '' || email.trim() === '' || password.trim() === '' || confirmPassword.trim() === '') {
                    throw new Error('All fields are required');
                }
                // Check if password and confirm password match
                if (password !== confirmPassword) {
                    throw new Error('Password and Confirm Password do not match');
                }
                password = await bcrypt.hash(password, 6);
                const user = await User.create({
                    username,
                    email,
                    password,
                    confirmPassword
                });
                return user;
            } catch (error) {
                console.log(error);
                throw new Error(error);
            }
        },


    }
};