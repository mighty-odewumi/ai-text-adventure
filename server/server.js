const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');

dotenv.config();

const app = express();
const port = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// **GAME STATE MANAGEMENT**
const gameStates = new Map(); // User ID -> Game State

function createInitialGameState() {
    return {
        health: 100,
        score: 0,
        inventory: [],
        secrets: [],
        currentScene: "",
        sceneHistory: []
    };
}

function updateGameStateFromAI(gameState, aiResponse) {
    // Regex parsing (similar to Python example) - Adapt to the specific cues you use
    const healthMatch = aiResponse.match(/\[([+-]\d+) Health\]/);
    if (healthMatch) {
        gameState.health = Math.max(0, Math.min(100, gameState.health + parseInt(healthMatch[1])));
    }

    const scoreMatch = aiResponse.match(/\[([+-]\d+) Score\]/);
    if (scoreMatch) {
        gameState.score += parseInt(scoreMatch[1]);
    }

    const itemMatch = aiResponse.match(/\[Item: (.+?)\]/);
    if (itemMatch) {
        const item = itemMatch[1].trim();
        if (!gameState.inventory.includes(item)) {
            gameState.inventory.push(item);
        }
    }

    const secretMatch = aiResponse.match(/\[Secret: (.+?)\]/);
    if (secretMatch) {
        const secret = secretMatch[1].trim();
        if (!gameState.secrets.includes(secret)) {
            gameState.secrets.push(secret);
        }
    }
}

async function generateScene(prompt, ai21, gameState) {
    try {
        const ai21Response = await ai21.chat.completions.create({
            model: 'jamba-large',
            messages: [{ role: 'user', content: prompt }],
        });
        return ai21Response.choices[0].message.content;
    } catch (error) {
        console.error('AI21 API Error:', error);
        return `A mysterious force blocks your path. (AI21 Error: ${error.message})`;
    }
}

app.post('/generate', async (req, res) => {
    const { prompt, userId } = req.body;
    const { AI21 } = await import('ai21');

    //Get or Create game state.
    let gameState = gameStates.get(userId);
    if (!gameState) {
        gameState = createInitialGameState();
        gameStates.set(userId, gameState);
    }
    const ai21 = new AI21({ apiKey: process.env.AI21_API_KEY });
    const gameTitle = "The Sunken City of Aethelgard";
    const gameDescription = `You are a daring diver exploring the ruins of the Sunken City of Aethelgard. It is said to hold forgotten treasures and dangerous secrets.`;

    const fullPrompt = `You are the narrator of a text adventure game called '${gameTitle}'. ${gameDescription}
        The player's current status is: Health: ${gameState.health}, Score: ${gameState.score}, Inventory: ${gameState.inventory.join(", ") || 'Empty'}, Secrets: ${gameState.secrets.length}.
        The previous scene description was: ${gameState.currentScene || "None"}.
        The player's action was: ${prompt || "None"}.

        Based on the player's action, advance the story. Instead of writing the entire scene, write a conversational message.
        Acknowledge the player's action and its immediate consequences.
        Incorporate opportunities to find items ([Item: item name]), lose or gain health ([+10 Health] or [-5 Health]), earn score ([+5 Score]), and uncover secrets ([Secret: secret text]), *BUT ONLY IF IT NATURALLY FOLLOWS FROM THE PLAYER'S ACTION*.
        Offer the player clear choices for what to do next. Instead of giving the player the options in a numbered list, weave the choices into your dialogue.
        Don't immediately reveal all the information of the area, it may seem robotic and not an interesting game.
        Make each scene unique and interesting.
        `;

    try {
        const newScene = await generateScene(fullPrompt, ai21, gameState);
        gameState.currentScene = newScene;
        gameState.sceneHistory.push(newScene);

        updateGameStateFromAI(gameState, newScene); // Update game state based on AI's response
        gameStates.set(userId, gameState);

        res.json({
            scene: newScene,
            health: gameState.health,
            score: gameState.score,
            inventory: gameState.inventory,
            secrets: gameState.secrets,
            history: gameState.sceneHistory // Send back the entire history
        });

    } catch (error) {
        console.error('Error generating scene:', error);
        res.status(500).json({ error: error.message });
    }
});


// **Initial Scene Endpoint**
app.get('/start', async (req, res) => {
    const { userId } = req.query;
    const { AI21 } = await import('ai21');

    let gameState = gameStates.get(userId);
    if (!gameState) {
        gameState = createInitialGameState();
        gameStates.set(userId, gameState);
    }

    const ai21 = new AI21({ apiKey: process.env.AI21_API_KEY });
    const gameTitle = "The Sunken City of Aethelgard";
    const gameDescription = `You are a daring diver exploring the ruins of the Sunken City of Aethelgard. It is said to hold forgotten treasures and dangerous secrets.`;

    const initialPrompt = `You are the narrator of a text adventure game called '${gameTitle}'. ${gameDescription}
        Describe the very first scene the player encounters, in the style of a conversational text adventure. Provide some clear options for how the player can act in the scene, but don't list them. Try to make it exciting and enticing for the user to want to play!
        Incorporate opportunities to find items ([Item: item name]), lose or gain health ([+10 Health] or [-5 Health]), earn score ([+5 Score]), and uncover secrets ([Secret: secret text]).
        `;
    try {
        const initialScene = await generateScene(initialPrompt, ai21, gameState);
        gameState.currentScene = initialScene;
        gameState.sceneHistory.push(initialScene);

        updateGameStateFromAI(gameState, initialScene);
        gameStates.set(userId, gameState);

        res.json({
            scene: initialScene,
            health: gameState.health,
            score: gameState.score,
            inventory: gameState.inventory,
            secrets: gameState.secrets,
            history: gameState.sceneHistory // Send back the entire history
        });
    } catch (error) {
        console.error('Error generating initial scene:', error);
        res.status(500).json({ error: error.message });
    }
});

app.listen(port, () => {
    console.log(`Server listening on port ${port}`);
});