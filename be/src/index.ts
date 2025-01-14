// require("dotenv").config();
// import express from "express";
// import Anthropic from "@anthropic-ai/sdk";
// import { BASE_PROMPT, getSystemPrompt } from "./prompts";
// import { ContentBlock, TextBlock } from "@anthropic-ai/sdk/resources";
// import {basePrompt as nodeBasePrompt} from "./defaults/node";
// import {basePrompt as reactBasePrompt} from "./defaults/react";
// import cors from "cors";

// const anthropic = new Anthropic();
// const app = express();
// app.use(cors())
// app.use(express.json())

// app.post("/template", async (req, res) => {
//     const prompt = req.body.prompt;
    
//     const response = await anthropic.messages.create({
//         messages: [{
//             role: 'user', content: prompt
//         }],
//         model: 'claude-3-5-sonnet-20241022',
//         max_tokens: 200,
//         system: "Return either node or react based on what do you think this project should be. Only return a single word either 'node' or 'react'. Do not return anything extra"
//     })

//     const answer = (response.content[0] as TextBlock).text; // react or node
//     if (answer == "react") {
//         res.json({
//             prompts: [BASE_PROMPT, `Here is an artifact that contains all files of the project visible to you.\nConsider the contents of ALL files in the project.\n\n${reactBasePrompt}\n\nHere is a list of files that exist on the file system but are not being shown to you:\n\n  - .gitignore\n  - package-lock.json\n`],
//             uiPrompts: [reactBasePrompt]
//         })
//         return;
//     }

//     if (answer === "node") {
//         res.json({
//             prompts: [`Here is an artifact that contains all files of the project visible to you.\nConsider the contents of ALL files in the project.\n\n${reactBasePrompt}\n\nHere is a list of files that exist on the file system but are not being shown to you:\n\n  - .gitignore\n  - package-lock.json\n`],
//             uiPrompts: [nodeBasePrompt]
//         })
//         return;
//     }

//     res.status(403).json({message: "You cant access this"})
//     return;

// })

// app.post("/chat", async (req, res) => {
//     const messages = req.body.messages;
//     const response = await anthropic.messages.create({
//         messages: messages,
//         model: 'claude-3-5-sonnet-20241022',
//         max_tokens: 8000,
//         system: getSystemPrompt()
//     })

//     console.log(response);

//     res.json({
//         response: (response.content[0] as TextBlock)?.text
//     });
// })

// app.listen(3000,()=>{
//     console.log("Server is running on port 3000")
// });





require("dotenv").config();
import express from "express";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { BASE_PROMPT, getSystemPrompt } from "./prompts";
import { basePrompt as nodeBasePrompt } from "./defaults/node";
import { basePrompt as reactBasePrompt } from "./defaults/react";
import cors from "cors";

if (!process.env.API_KEY) {
    throw new Error("API_KEY is not defined in the environment variables");
}

const genAI = new GoogleGenerativeAI(process.env.API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
const app = express();
app.use(cors());
app.use(express.json());

// Utility function to sanitize the AI response
const sanitizeResponse = (response: string) => {
    return response.replace(/```[a-zA-Z]*\n?|```/g, '').trim();
};

app.post("/template", async (req, res) => {
    const prompt = req.body.prompt;

    try {
        console.log("INFO: Received /template request with prompt:", prompt);

        // Combine system prompt with user input
        const fullPrompt = `${getSystemPrompt()}\n\nUser: ${prompt}\n\nAssistant: Based on the project details, I will return either "node" or "react". My response will be a single word.`;
        console.debug("DEBUG: Full prompt sent to AI:", fullPrompt);

        const result = await model.generateContent(fullPrompt);
        const rawResponse = result.response.text();
        const answer = sanitizeResponse(rawResponse).toLowerCase();
        console.info("INFO: AI responded with answer:", answer);

        if (answer === "react") {
            res.json({
                prompts: [
                    BASE_PROMPT,
                    `Here is an artifact that contains all files of the project visible to you.\nConsider the contents of ALL files in the project.\n\n${reactBasePrompt}\n\nHere is a list of files that exist on the file system but are not being shown to you:\n\n  - .gitignore\n  - package-lock.json\n`,
                ],
                uiPrompts: [reactBasePrompt],
            });
        } else if (answer === "node") {
            res.json({
                prompts: [
                    `Here is an artifact that contains all files of the project visible to you.\nConsider the contents of ALL files in the project.\n\n${nodeBasePrompt}\n\nHere is a list of files that exist on the file system but are not being shown to you:\n\n  - .gitignore\n  - package-lock.json\n`,
                ],
                uiPrompts: [nodeBasePrompt],
            });
        } else {
            console.warn("WARNING: Invalid response from AI:", answer);
            res.status(403).json({ message: "Invalid response from the model" });
        }
    } catch (error) {
        console.error("ERROR: Exception in /template endpoint:", error);
        res.status(500).json({ message: "Internal server error" });
    }
});

app.post("/chat", async (req, res) => {
    const messages = req.body.messages;

    try {
        console.log("INFO: Received /chat request with messages:", messages);

        // Format the conversation for the AI model
        const formattedPrompt = messages.reduce((acc: string, msg: { role: string; content: string }) => {
            const role = msg.role === 'user' ? 'Human' : 'Assistant';
            return acc + `\n\n${role}: ${msg.content}`;
        }, getSystemPrompt());

        // Add the "Assistant:" prompt to indicate AI's response
        const finalPrompt = formattedPrompt + "\n\nAssistant:";
        console.debug("DEBUG: Final prompt sent to AI:", finalPrompt);

        const result = await model.generateContent(finalPrompt);
        const rawResponse = result.response.text();
        const responseText = sanitizeResponse(rawResponse);
        console.info("INFO: AI responded with text:", responseText);

        res.json({
            response: responseText,
            role: 'assistant',
        });
    } catch (error) {
        console.error("ERROR: Exception in /chat endpoint:", error);
        res.status(500).json({ message: "Internal server error" });
    }
});

app.listen(3000, () => {
    console.log("Server is running on port 3000");
});
