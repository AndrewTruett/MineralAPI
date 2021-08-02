const express = require('express');
//const request = require('request-promise');
const redis = require("redis");
const cheerio = require('cheerio');
const axios = require('axios');
const _ = require('lodash');
const schedule = require('node-schedule');

const app = express();
const PORT = process.env.PORT || 5000;

//Redis config
/*
const redisPort = 6379
const client = redis.createClient(redisPort);
const CACHE_EXP = 60 * 60 * 24

client.flushdb( function (err, succeeded) {
    console.log(succeeded); // will be true if successfull
});

client.on("error", (err) => {
    console.log(err);
})
*/

let minerals = {};

async function readMinerals() {
    console.log("Lets dig up some minerals");
    let mineralsXpath = "//*[@id='A']//parent::h2/following-sibling::*[@class='div-col'][1]//a";
    let qMineralsXpath = "//*[@id='Q']//parent::h2/following-sibling::ul[1]//a";

    const MINERAL_LIST_URL = 'https://en.wikipedia.org/wiki/List_of_minerals';

    const { data } = await axios.get(MINERAL_LIST_URL);
	const $ = cheerio.load(data);

    const alphabet = 'ABCDEFGHIJKLMNOPRSTUVWXYZ'; //is missing Q because Wikipedia displays the Q minerals differently

    for(let i = 0; i < alphabet.length; i++) {
        let id = '#' + alphabet[i];
        console.log(id);

        $('#A').parent().nextAll('.div-col:first-of-type, ul:first-of-type').find('li a').each((_idx, el) => {
            console.log($(el).text())
        });

    }
}

const job = schedule.scheduleJob('* * * * *', readMinerals);

app.use(express.json());

app.get('/mineral/:mineralName', async (req, res) => {
    const { mineralName } = req.params;

    const BASE_URL = 'https://en.wikipedia.org/wiki/';

    //** */
    try {
        client.get(mineralName, async (err, mineralData) => {
            if (err) throw err;
    
            if (mineralData) {
                res.status(200).send(JSON.parse(mineralData));
            }
            else {
                console.log("Cache miss on", mineralName);
                const { data } = await axios.get(BASE_URL + `${mineralName}`);
		        const $ = cheerio.load(data);

                let mineralData = {};

                $('.infobox tbody .infobox-label').parent().each((_idx, el) => {
                    let key = _.camelCase($(el).find('.infobox-label').text())
                    let value = $(el).find('.infobox-data').text()

                    if(key.toLowerCase().includes('references')) 
                        return;
            
                    mineralData[key] = value
                });

                mineralData['imageUrl'] = $('.infobox-image img').attr('src')


                client.setex(mineralName, String(CACHE_EXP), JSON.stringify(mineralData));
                res.status(200).send(mineralData);
            }
        });
    } catch(err) {
        res.status(500).send({message: err.message});
    }
    /*

    try {
        const { data } = await axios.get(BASE_URL + `${mineralName}`);
		const $ = cheerio.load(data);

        let mineralData = {};

        $('.infobox tbody .infobox-label').parent().each((_idx, el) => {
            let key = _.camelCase($(el).find('.infobox-label').text())
            let value = $(el).find('.infobox-data').text()

            if(key.toLowerCase().includes('references')) 
                return;
            
            mineralData[key] = value
        });

        mineralData['imageUrl'] = $('.infobox-image img').attr('src')

        console.log(mineralData)
        res.send(mineralData)

	} catch (error) {
        // res.status(500).send({message: error.message});
		throw error;
	}
    */
})

app.listen(PORT, () => console.log(`Server running on ${PORT}`));