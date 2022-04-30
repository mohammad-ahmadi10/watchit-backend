// validation
const emailMatch = /(?:[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*|"(?:[\x01-\x08\x0b\x0c\x0e-\x1f\x21\x23-\x5b\x5d-\x7f]|\\[\x01-\x09\x0b\x0c\x0e-\x7f])*")@(?:(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?|\[(?:(?:(2(5[0-5]|[0-4][0-9])|1[0-9][0-9]|[1-9]?[0-9]))\.){3}(?:(2(5[0-5]|[0-4][0-9])|1[0-9][0-9]|[1-9]?[0-9])|[a-z0-9-]*[a-z0-9]:(?:[\x01-\x08\x0b\x0c\x0e-\x1f\x21-\x5a\x53-\x7f]|\\[\x01-\x09\x0b\x0c\x0e-\x7f])+)\])/
const passMatch = /^(?=.*?[A-Z])(?=.*?[a-z])(?=.*?[0-9])(?=.*?[#?!@$%^&*-]).{8,}$/;

const { Joi } = require('express-validation');


const registerValidate =  {
    body: Joi.object({
        username:
            Joi.string().min(3).required(),
        email:
            Joi.string().email().regex(emailMatch)
            .min(3).max(255).required(),

        password:
            Joi.string().min(8).max(1024).regex(passMatch)
            .required()      
    })

}
const loginValidate = {
    body: Joi.object({
/*     email:
        Joi.string().email().regex(emailMatch)
        .min(3).max(255).required(), */

    password:
        Joi.string().min(8).max(1024).regex(passMatch)
        .required()

    })
}

module.exports = {
    registerValidate ,
    loginValidate
}