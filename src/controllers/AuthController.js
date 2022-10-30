const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const { validationResult, matchedData } = require('express-validator');

const User = require('../models/User');
const State = require('../models/State');

module.exports = {
    singin: async(req, res)=>{
        let errors = validationResult(req);
        if(!errors.isEmpty()){
            res.json({ error: errors.mapped()});
            return;
        }

       const data = matchedData(req);
        
        // Validando email
        const user = await User.findOne({ email: data.email });
        if(!user){
            res.json({error: {email: {msg: 'Email e/ou senha incorretos!'} }});
            return;
        }
        // Validando a senha
        const match = await bcrypt.compare(data.password, user.passwordHash);
        if(!match){
            res.json({error: {email: {msg: 'Email e/ou senha incorretos!'} }});
            return;
        }

        const payload = (Date.now() + Math.random()).toString();
        const token = await bcrypt.hash(payload, 10);

        user.token = token;
        await user.save();

        res.json({token, email: data.email});
    },


    singup: async(req, res)=>{
        let errors = validationResult(req);
        if(!errors.isEmpty()){
            res.json({ error: errors.mapped()});
            return;
        }

        const data = matchedData(req);
        
        // Verificando se o email já existe
        const user = await User.findOne({ email: data.email });
        if(user){
            res.json({error: {email: {msg: 'Email já cadastrado!'} }});
            return;
        }

        // Verificando se o estado é válido
        if(mongoose.Types.ObjectId.isValid(data.state)){
            const stateItem = await State.findById(data.state);
            if(!stateItem){
                res.json({error: {email: {msg: 'Estado não existe!'} }});
                return;
            }
        } else {
            res.json({error: {email: {msg: 'Código de estado inválido!'} }});
            return;
        }

        const passwordHash = await bcrypt.hash(data.password, 10);
        const payload = (Date.now() + Math.random()).toString();
        const token = await bcrypt.hash(payload, 10);

        const newUser = new User({
            name: data.name,
            email: data.email,
            state: data.state,
            passwordHash,
            token
        });

        await newUser.save();
        
        res.json({token});
    }
}