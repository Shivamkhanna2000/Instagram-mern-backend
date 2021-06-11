import express from "express";
import cors from "cors";
import mongoose from "mongoose";
import Pusher from "pusher";
import dbModel from "./dbModel.js";

//app config
const app = express();
const port = process.env.PORT || 8080; 

 const pusher = new Pusher({
   appId: "1216706",
   key: "c55287732740c393a2c8",
   secret: "ec557f161d835c285bd1",
   cluster: "ap2",
   useTLS: true
 });

//middlewares
app.use(express.json());
app.use(cors());

//DB config
const connection_url = `mongodb+srv://admin:q9Z4tuA9QEQt0xfY@cluster0.6mwex.mongodb.net/instaDB?retryWrites=true&w=majority`
mongoose.connect(connection_url, {
    useCreateIndex: true,
    useNewUrlParser: true,
    useUnifiedTopology: true
})

mongoose.connection.once("open", () => {
    console.log("DB connected")

    const changeStream = mongoose.connection.collection("posts").watch()

    changeStream.on("change", (change) =>{
        console.log("change triggered...")
        console.log(change)
        console.log("end of change")

        if(change.operationType === "insert"){
            console.log("triggering pusher img upload")

            const postDetails = change.fullDocument;
            pusher.trigger("posts", "inserted", {
                user: postDetails.user,
                caption: postDetails.caption,
                image: postDetails.image
            })
        }
        else{
            console.log("unknown trigger from pusher")
        }
    })
})

//api routes
app.get("/", (req, res) => res.status(200).send("hello world"));

app.post("/upload", (req, res) => {
    const body = req.body;

    dbModel.create(body, (err, data) =>{
        if(err) {
            res.status(500).send(err);
        }
        else{
            res.status(201).send(data);
        }
    })
})

app.get("/sync", (req, res) => {
    dbModel.find((err, data) => {
        if(err) {
            res.status(500).send(err);
        }
        else{
            res.status(200).send(data);
        }
    })
})

//listener
app.listen(port, () => console.log(`listening on localhost:${port}`));