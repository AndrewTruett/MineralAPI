const express = require('express');
const request = require('request-promise');
const cheerio = require('cheerio');
const axios = require('axios');
const _ = require('lodash');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(express.json());

app.get('/mineral/:mineralName', async (req, res) => {
    const { mineralName } = req.params;

    const BASE_URL = 'https://en.wikipedia.org/wiki/';

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











        /*
        const { data } = await axios.get(
			BASE_URL + `${mineralName}.shtml`
		);
		const $ = cheerio.load(data);

        const fieldsToGet = ['Chemical Classification', 'Color', 'Streak', 'Luster', 'Diaphaneity', 'Cleavage', 'Mohs Hardness', 'Specific Gravity', 'Diagnostic Properties', 'Chemical Composition', 'Crystal System', 'Uses']

        let mineralData = {};

        fieldsToGet.forEach( (field, i) => {
            $(`b:contains("${field}")`).parent().next().each((_idx, el) => {
                let camelCase = _.camelCase(field)
                mineralData[camelCase] = $(el).text();
            });
        })

        //description from first paragraph
        $('h2:contains("What is")').next().each((_idx, el) => {
            mineralData["description"] = $(el).text();
        });
        
        //images
        let images = []
        $('img[src*="photos/"]').each((_idx, el) => {
            images.push(BASE_URL + $(el).attr('src'));
        });

        mineralData["images"] = images
        console.log(mineralData)
        res.send(mineralData)
        */

	} catch (error) {
		throw error;
	}
})

app.listen(PORT, () => console.log(`Server running on ${PORT}`));