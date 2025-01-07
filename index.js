const express = require("express");
const app = express();
const ejs = require('ejs');
const path = require("path");
const admin = require("firebase-admin");
require('dotenv').config();

// Initialize Firebase Admin SDK with the service account credentials
const serviceAccount = JSON.parse(process.env.FIREBASE_CREDENTIALS); // Read from .env
admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
});

// Initialize Firestore
const db = admin.firestore();
const notesCollection = db.collection("notes");  // Firestore collection for notes

app.set("view engine", "ejs");
app.use(express.static(path.join(__dirname, "public")));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Home Route - Display Notes List
app.get("/", async (req, res) => {
    try {
        const snapshot = await notesCollection.get(); // Get all notes from Firestore
        const files = snapshot.docs.map(doc => doc.id); // Extract document IDs (titles)
        res.render('index', { files }); // Pass titles to EJS view
    } catch (error) {
        console.error("Error fetching notes:", error);
        res.status(500).send("Error fetching notes");
    }
});

// Create Note Route - Save new note to Firestore
app.post("/create", async (req, res) => {
    try {
        const title = req.body.title.split(" ").join("");  // Clean title for Firestore document name
        await notesCollection.doc(title).set({ details: req.body.details });  // Save note in Firestore
        res.redirect("/"); // Redirect to home after saving
    } catch (error) {
        console.error("Error creating note:", error);
        res.status(500).send("Error creating note");
    }
});

// Delete Note Route - Remove a note from Firestore
app.get("/delete/:filename", async (req, res) => {
    try {
        await notesCollection.doc(req.params.filename).delete(); // Delete note from Firestore
        res.redirect("/"); // Redirect to home after deletion
    } catch (error) {
        console.error("Error deleting note:", error);
        res.status(500).send("Error deleting note");
    }
});

// Edit Note Route - Display the edit page
app.get('/edit/:filename', (req, res) => {
    res.render("edit", { fileName: req.params.filename });
});

// Update Note Route - Rename note in Firestore
app.post("/edit", async (req, res) => {
    try {
        const previousTitle = req.body.previous;
        const newTitle = req.body.new.split(" ").join("");  // Clean new title
        const noteRef = notesCollection.doc(previousTitle);
        const noteData = (await noteRef.get()).data();
        
        if (noteData) {
            await noteRef.delete(); // Delete the old document
            await notesCollection.doc(newTitle).set({ details: noteData.details }); // Create new note with updated title
        }

        res.redirect("/"); // Redirect to home after renaming
    } catch (error) {
        console.error("Error editing note:", error);
        res.status(500).send("Error editing note");
    }
});

// Show Note Route - Display the full note
app.get("/file/:filename", async (req, res) => {
    try {
        const doc = await notesCollection.doc(req.params.filename).get();
        if (doc.exists) {
            res.render('show', { fileName: req.params.filename, fileData: doc.data().details });
        } else {
            res.status(404).send("Note not found");
        }
    } catch (error) {
        console.error("Error fetching note:", error);
        res.status(500).send("Error fetching note");
    }
});

// Start the server
app.listen(process.env.PORT, (err) => {
    if (err) {
        console.error(err);
    } else {
        console.log('Server is running...');
    }
});
