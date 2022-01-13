const {
    Message,
    User
} = require('../../models');

const {
    UserInputError,
    AuthenticationError
} = require('apollo-server-errors');

const {
    Op
} = require("sequelize");
const{PubSub} = require('apollo-server');
const pubsub = new PubSub();


module.exports = {

    Query: {

        getMessages: async (_,{from},{user}) => {    
        
            try {
               
                console.log("from",from);
                console.log(user);
               
                if (!user) {
                    throw new AuthenticationError('You must be logged in to view this data')
                }
                const otherUser = await User.findOne({
                    where: {
                        username: from
                    }
                });
               
                if (!otherUser) {
                    throw new UserInputError('User not found')
                }

                const usernames = [user.data, otherUser.username]
                
                const messages = await Message.findAll({
                    where: {
                        from: { [Op.in]: usernames },
                         to: { [Op.in]: usernames },
                    },
                    order: [
                        ['createdAt', 'DESC']
                    ],
                })


                return messages;

            } catch (error) {
                console.log(error);
                throw error;

            }

        }
    },



    Mutation: {

        sendMessage: async (_, {
            to,
            content
        }, {
            user
        }) => {
            try {
                console.log(user)
                console.log("to" + to);
                console.log("content" + content);

                if (!user) {
                    throw new AuthenticationError('You must be logged in to view this data')
                }
                const recipient = await User.findOne({
                    where: {
                        username: to
                    }
                });
                if (!recipient) {
                    throw new Error('User not found')
                }
                if (recipient.username === user.data) {
                    throw new Error('You cannot send a message to yourself')
                }
                if (content.trim() === '') {
                    throw new Error('Message cannot be empty')
                }

                const message = await Message.create({
                    from: user.data,
                    to: to,
                    content: content
                });

                pubsub.publish('NEW_MESSAGE', {
                    newMessage: message
                });
                return message;
            } catch (error) {
                console.log(error);
                throw error;
            }

        }

    },


    Subscription: {

        newMessage:{
            subscribe: () => pubsub.asyncIterator(['NEW_MESSAGE'])
        }
    },


};