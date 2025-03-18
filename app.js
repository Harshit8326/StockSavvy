const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');zzz
const path = require('path');
const nodemailer = require('nodemailer');
const axios = require('axios');

const app = express();
const port = 3000;

// Connect to MongoDB
mongoose.connect('mongodb://localhost:27017/Project', {})
    .then(() => console.log('Connected to MongoDB'))
    .catch((error) => console.error('Error connecting to MongoDB:', error));

app.use(express.static('public'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

const userSchema = new mongoose.Schema({
    fullName: String,
    email: String,
    password: String,
    profilePicture: String,
    age: Number,
    referrer: String,
});

const User = mongoose.model('User', userSchema);

// Google Gemini API Key
const GEMINI_API_KEY = 'AIzaSyDJy_-INfx6JGhBKrqUTTChbHZps-uYnJE';

/**
 * Generates email content using Google Gemini API.
 */
async function generateEmailContent(prompt) {
    try {
        const response = await axios.post(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateText?key=${GEMINI_API_KEY}`,
            {
                contents: [{ role: "user", parts: [{ text: prompt }] }]
            }
        );

        return response.data.candidates[0].content;
    } catch (error) {
        console.error("Error generating email content:", error.response ? error.response.data : error.message);
        return null; // Return null so fallback can be used
    }
}

/**
 * Sends an email using Nodemailer.
 */
async function sendEmail(to, subject, text) {
    let transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: 'ihspvt@gmail.com',  // Replace with your Gmail
            pass: 'hzmc mnqy gyhz dupt'  // Use Google App Password
        }
    });

    let mailOptions = {
        from: 'ihspvt@gmail.com',
        to: to,
        subject: subject,
        text: text
    };

    transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
            console.error('Error sending email:', error);
        } else {
            console.log('Email sent:', info.response);
        }
    });
}

app.post('/signup', async (req, res) => {
    try {
        const { fullName, email, password, age, referrer } = req.body;

        const user = new User({ fullName, email, password, age, referrer });
        await user.save();

        // Generate Welcome Email Content
        const welcomePrompt = `Write a compelling welcome email for a new user named ${fullName} who just signed up for our platform. 
        - Start with an enthusiastic welcome.  
        - Highlight the unique benefits of our platform.  
        - Create a sense of urgency (limited-time offer, exclusive bonus).  
        - Include a strong call-to-action.  
        - Make it personal and engaging.  
        - End with a friendly closing.`;

        let welcomeEmailContent = await generateEmailContent(welcomePrompt);

        // Fallback if AI fails
        if (!welcomeEmailContent) {
            welcomeEmailContent = `Hello ${fullName},\n\nWelcome to our platform! We're thrilled to have you onboard. Explore our amazing features and make the most of your experience. If you have any questions, feel free to reach out!\n\nBest Regards,\nYour Team`;
        }

        sendEmail(email, 'Welcome to Our Platform!', welcomeEmailContent);

        console.log(`Follow-up email scheduled for ${fullName} in 20 seconds...`);

        // Schedule Follow-up Email (After 20 seconds for testing)
        setTimeout(async () => {
            const followUpPrompt = `Write a follow-up email for ${fullName}, who signed up yesterday.  
            - Ask how their experience has been so far.  
            - Encourage them to provide feedback or ask for help.  
            - Include a friendly and engaging tone.  
            - Offer support if they need any help using the platform.  
            - End with a warm closing.`;

            let followUpEmailContent = await generateEmailContent(followUpPrompt);

            // Fallback if AI fails
            if (!followUpEmailContent) {
                followUpEmailContent = `Hello ${fullName},\n\nWe hope you're enjoying our platform! We'd love to hear about your experience so far. Do you have any feedback or questions? We're here to help!\n\nBest Regards,\nYour Team`;
            }

            sendEmail(email, 'How’s your experience so far?', followUpEmailContent);
            console.log(`Follow-up email sent to ${fullName}`);
        }, 10000); // 10 seconds (Change to 86400000 for 1-day delay)

        res.redirect('/Thanks.html');
    } catch (error) {
        console.error('Error saving user:', error);
        res.status(500).send('Internal server error');
    }
});

// Define routes
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '/index.html'));
});

// Start the server
app.listen(port, () => {
    console.log(`Server is listening at http://localhost:${port}`);
});
