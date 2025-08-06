const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');

const app = express();
const port = 3000;

app.use(bodyParser.json());

const Silat12 = require('./models/silat_1.2');
const Silat13 = require('./models/silat_1.3');
const Silat14 = require('./models/silat_1.4');
const Silnat = require('./models/silnat');
const Tcmats = require('./models/tcmats');
const Lori = require('./models/lori');
const Voices = require('./models/voices');

app.post('/api/silat_1.2', async (req, res) => {
    try {
        const newSurvey = new Silat12(req.body);
        await newSurvey.save();
        res.status(201).send({ message: 'Survey submitted successfully!' });
    } catch (error) {
        res.status(400).send({ message: 'Error submitting survey', error });
    }
});

app.post('/api/silat_1.3', async (req, res) => {
    try {
        const newSurvey = new Silat13(req.body);
        await newSurvey.save();
        res.status(201).send({ message: 'Survey submitted successfully!' });
    } catch (error) {
        res.status(400).send({ message: 'Error submitting survey', error });
    }
});

app.post('/api/silat_1.4', async (req, res) => {
    try {
        const newSurvey = new Silat14(req.body);
        await newSurvey.save();
        res.status(201).send({ message: 'Survey submitted successfully!' });
    } catch (error) {
        res.status(400).send({ message: 'Error submitting survey', error });
    }
});

app.post('/api/silnat', async (req, res) => {
    try {
        const newSurvey = new Silnat(req.body);
        await newSurvey.save();
        res.status(201).send({ message: 'Survey submitted successfully!' });
    } catch (error) {
        res.status(400).send({ message: 'Error submitting survey', error });
    }
});

app.post('/api/tcmats', async (req, res) => {
    try {
        const newSurvey = new Tcmats(req.body);
        await newSurvey.save();
        res.status(201).send({ message: 'Survey submitted successfully!' });
    } catch (error) {
        res.status(400).send({ message: 'Error submitting survey', error });
    }
});

app.post('/api/lori', async (req, res) => {
    try {
        const newSurvey = new Lori(req.body);
        await newSurvey.save();
        res.status(201).send({ message: 'Survey submitted successfully!' });
    } catch (error) {
        res.status(400).send({ message: 'Error submitting survey', error });
    }
});

app.post('/api/voices', async (req, res) => {
    try {
        const newSurvey = new Voices(req.body);
        await newSurvey.save();
        res.status(201).send({ message: 'Survey submitted successfully!' });
    } catch (error) {
        res.status(400).send({ message: 'Error submitting survey', error });
    }
});

app.get('/api/reports', async (req, res) => {
    try {
        const silat12Data = await Silat12.find();
        const silat13Data = await Silat13.find();
        const silat14Data = await Silat14.find();
        const silnatData = await Silnat.find();
        const tcmatsData = await Tcmats.find();
        const loriData = await Lori.find();
        const voicesData = await Voices.find();

        res.status(200).send({
            silat12Data,
            silat13Data,
            silat14Data,
            silnatData,
            tcmatsData,
            loriData,
            voicesData
        });
    } catch (error) {
        res.status(500).send({ message: 'Error fetching reports', error });
    }
});

app.get('/', (req, res) => {
    res.send('Backend is running!');
});

mongoose.connect('mongodb://localhost:27017/survey-db', { useNewUrlParser: true, useUnifiedTopology: true })
    .then(() => console.log('MongoDB connected...'))
    .catch(err => console.log(err));

app.listen(port, () => {
    console.log(`Server is listening on port ${port}`);
});
