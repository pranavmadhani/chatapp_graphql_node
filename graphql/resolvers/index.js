const userResolvers = require('./users')
const messageResolvers = require('./messages')


module.exports = {

    Message:{

        createdAt: (_) => {
            return _.createdAt.toISOString();
        }
    },
    
    User:{

        // createdAt: (_) => {
        //     return _.createdAt.toISOString();
        // }
    },
    Query: {
        
        ...userResolvers.Query,
        ...messageResolvers.Query
    },

    Mutation:{

        ...userResolvers.Mutation,
        ...messageResolvers.Mutation
    },

    Subscription:{
    
        ...messageResolvers.Subscription
    
    }

}