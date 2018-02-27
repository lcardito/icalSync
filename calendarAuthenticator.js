import fs from 'fs-extra';
import readline from 'readline';

const {OAuth2Client} = require('google-auth-library');

const SCOPES = ['https://www.googleapis.com/auth/calendar'];
const TOKEN_DIR =  __dirname + '/.credentials/';
const TOKEN_PATH = TOKEN_DIR + 'token.json';

const authorize = (credentials) => (
    new Promise(async (resolve) => {
        let clientSecret = credentials.installed.client_secret;
        let clientId = credentials.installed.client_id;
        let redirectUrl = credentials.installed.redirect_uris[0];
        let oauth2Client = new OAuth2Client(clientId, clientSecret, redirectUrl);

        let token;
        try {
            token = await fs.readFile(TOKEN_PATH);
        } catch (e) {
            token = await getNewToken(oauth2Client);
        }
        oauth2Client.credentials = JSON.parse(token);
        resolve(oauth2Client);
    })
);

const getNewToken = (oauth2Client) => (
    new Promise((resolve, reject) => {
        let authUrl = oauth2Client.generateAuthUrl({
            access_type: 'offline',
            scope: SCOPES
        });
        console.log('Authorize this app by visiting this url: ', authUrl);
        let rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout
        });
        rl.question('Enter the code from that page here: ', (code) => {
            rl.close();
            oauth2Client.getToken(code, (err, token) => {
                if (err) {
                    console.log('Error while trying to retrieve access token', err);
                    reject(err);
                }
                storeToken(token);
                resolve(JSON.stringify(token));
            });
        });

    })
);

const storeToken = (token) => {
    try {
        fs.mkdirSync(TOKEN_DIR);
    } catch (err) {
        if (err.code !== 'EEXIST') {
            throw err;
        }
    }
    fs.writeFile(TOKEN_PATH, JSON.stringify(token));
    console.log('Token stored to ' + TOKEN_PATH);
};

export default authorize;
