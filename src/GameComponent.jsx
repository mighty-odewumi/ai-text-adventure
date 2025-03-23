import React, { useState, useEffect, useCallback } from 'react';

const GameComponent = () => {
    const [gameState, setGameState] = useState({
        scene: '',
        health: 100,
        score: 0,
        inventory: [],
        secrets: [],
        history: [],
    });
    const [prompt, setPrompt] = useState('');
    const [loading, setLoading] = useState(false);
    const [userId, setUserId] = useState(null);
    const backendURL = import.meta.env.MODE === "development" ? "https://zany-acorn-q4wg9q95rw7f69vx-3001.app.github.dev" : "https://ai-text-adventure.onrender.com";

    useEffect(() => {
        const storedUserId = localStorage.getItem('userId');
        const newUserId = storedUserId || Math.random().toString(36).substring(2, 15);
        localStorage.setItem('userId', newUserId);
        setUserId(newUserId);
    }, []);

    const fetchInitialScene = useCallback(async () => {
        if (!userId) return;

        setLoading(true);
        try {
            const response = await fetch(`${backendURL}/start?userId=${userId}`);
            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }
            const data = await response.json();
            setGameState(prevState => ({
                ...prevState,
                scene: data.scene,
                health: data.health,
                score: data.score,
                inventory: data.inventory,
                secrets: data.secrets,
                history: [data.scene],
            }));
        } catch (error) {
            console.error('Error fetching initial scene:', error);
            setGameState(prevState => ({ ...prevState, scene: `Failed to load initial scene: ${error.message}` }));
        } finally {
            setLoading(false);
        }
    }, [userId, backendURL]);

    useEffect(() => {
        fetchInitialScene();
    }, [fetchInitialScene]);

    const handleSubmit = async (event) => {
        event.preventDefault();
        setLoading(true);

        try {
            const response = await fetch(`${backendURL}/generate`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ prompt, userId }),
            });

            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }

            const data = await response.json();

            setGameState(prevState => {
                const newScene = data.scene;
                // **Check for duplicate before adding to history**
                if (!prevState.history.includes(newScene)) {
                    return {
                        ...prevState,
                        scene: newScene,
                        health: data.health,
                        score: data.score,
                        inventory: data.inventory,
                        secrets: data.secrets,
                        history: [...prevState.history, newScene], // Append only if not a duplicate
                    };
                } else {
                    // If scene is a duplicate, just update the other game state properties, not the history.
                     return {
                        ...prevState,
                        scene: newScene,
                        health: data.health,
                        score: data.score,
                        inventory: data.inventory,
                        secrets: data.secrets,
                    };
                }
            });

        } catch (error) {
            console.error('Error calling backend:', error);
            setGameState(prevState => ({ ...prevState, scene: `Error: ${error.message}` }));
        } finally {
            setLoading(false);
            setPrompt('');
        }
    };

    return (
        <div>
            <h1>The Sunken City of Aethelgard</h1>
            <div>
                Health: {gameState.health} | Score: {gameState.score} | Inventory: {gameState.inventory.join(', ') || 'Empty'} | Secrets: {gameState.secrets.length}
            </div>

            <h2>History:</h2>
            <div>
                {gameState.history.map((oldScene, index) => (
                    <p key={index}>{oldScene}</p>
                ))}
            </div>

            {loading ? (
                <p>Loading...</p>
            ) : (
                <p>{gameState.scene}</p>
            )}

            <form onSubmit={handleSubmit}>
                <label htmlFor="prompt">What do you do?</label>
                <input
                    type="text"
                    id="prompt"
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                />
                <button type="submit" disabled={loading}>
                    {loading ? 'Enter' : 'Enter'}
                </button>
            </form>
        </div>
    );
};

export default GameComponent;