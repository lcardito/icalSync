import axios from 'axios';
import ical from 'ical.js';

import fs from 'fs-extra';
import {google} from 'googleapis';
import authorize from './calendarAuthenticator';

const toGoogleEvent = (e) => ({
    'summary': e.summary,
    'location': e.location,
    'description': e.description,
    'end': {
        'dateTime': e.endDate.toString(),
    },
    'start': {
        'dateTime': e.startDate.toString()
    },
    'reminders': {
        'useDefault': true
    }
});

const searchEvents = (auth, searchQuery) => (
    new Promise((resolve, reject) => {
        google.calendar('v3').events.list(searchQuery, (err, response) => {
            (err) ? reject(err) : resolve(response.data.items);
        });
    })
);

const insertEvent = (auth, event) => {
    return new Promise((resolve, reject) => {
        google.calendar('v3')
            .events
            .insert({auth: auth, calendarId: 'primary', resource: event},
                (err, response) => {
                    (err) ? reject(err) : resolve(response.data);
                })
    });
};

let sync = async () => {
    let content;
    try {
        content = await fs.readFile('.credentials/client_secret.json');
    } catch (err) {
        console.log('Error loading client secret file: ' + err);
    }

    let auth = await authorize(JSON.parse(content));
    let response = await axios.get('https://groups.place/calendar/ical/8af3afaa-87a6-4a15-84d3-f515acc0616a');
    new ical
        .Component(ical.parse(response.data))
        .getAllSubcomponents('vevent')
        .map(e => new ical.Event(e))
        .filter(e => e.startDate.toUnixTime() > Math.round(new Date().getTime() / 1000))
        .forEach(async e => {
            let timeMax = e.startDate.clone();
            timeMax.addDuration(new ICAL.Duration({hours: 1}));

            let items = await searchEvents(auth, {
                auth: auth,
                calendarId: 'primary',
                q: e.summary,
                timeMax: timeMax.toString()
            });

            if (items.length === 0) {
                let googleEvent = toGoogleEvent(e);
                // let createdEvent = await insertEvent(auth, googleEvent);
                console.log("done");
            }
        });
};

if (require.main === module) {
    sync();
}