const redis = require('redis');
const axios = require('axios');
const { MongoClient } = require('mongodb');
const { Base64 } = require('js-base64');


const URL_ENDPOINT = 'https://taller-node-http-dbs.herokuapp.com/taller-mir';

// Decodify secret code from mongodb cluster collection
const decode = (code) => {
    const decoded = Base64.decode(code);
    console.log('Secret Code: ', decoded);
}

// Retrieve data from collection
const mongoRetriever = async ({ username, password, host }) => {

    const mongoURI =[
    'mongodb+srv://',
     username, 
     ':', 
     password,
     '@',
     host
    ].join('');
    console.log('mongoURI: ', mongoURI);
    
    const mongoClient = new MongoClient(mongoURI);
    try {
        await mongoClient.connect();
        console.log("Connected successfully to server");
        const database = mongoClient.db('taller-mir');
        const projection = { _id: 0, code: 1 };
        const cursor = await database.collection("instructions").find({})
                            .project(projection).toArray();
                            
        const { code } = cursor[0];
        decode(code);
     
    } catch (err) {
        console.error('Error: ', err);
    }

}


// Retrieve credentials for starting process

const retrieverInitData = async () => {

    const response = await axios.post(URL_ENDPOINT);

    const{ data: { credentials } } = response;
    const {host, port, user, password } = credentials;
    return {
        host, 
        port, 
        user,
        password
    }
} 


const runApplication = async () => {

    const { host, port, user, password } = await retrieverInitData();

    const socketObj ={
        host,
        port
    }

    const redisClient = {
        socket: socketObj,
        username: user,
        password
    }
 
    const client = redis.createClient(redisClient);

    client.on("error", (error) => console.error(`Error : ${error}`));
    await client.connect();


    let mongodb = {
        host: '',
        username: '',
        password: '',

    }

    mongodb.host = await client.get("host");
    mongodb.username = await client.get("username");
    mongodb.password = await client.get("password");
    console.log(mongodb);

    await mongoRetriever(mongodb);
    
};


runApplication();
