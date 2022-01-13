const jwt = require('jsonwebtoken');
const {
    JWT_TOKEN
  } = require('../config/env.json');

module.exports = (ctx,event) => {
    if (ctx.req.headers.authorization) {
      
        const token = ctx.req.headers.authorization.split('Bearer ')[1];
        jwt.verify(token, JWT_TOKEN, (err, decoded) => {
          if (err) {
            throw new Error('Invalid token');
          }
         
          ctx.user = decoded;
        });
    }
     return ctx;
}