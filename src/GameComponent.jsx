import React, { useState, useEffect } from 'react';

const GameComponent = () => {
    const [scene, setScene] = useState('');
    const [prompt, setPrompt] = useState('');
    const [health, setHealth] = useState(100);
    const [score, setScore] = useState(0);
    const [inventory, setInventory] = useState([]);
    const [secrets, setSecrets] = useState([]);
    const [loading, setLoading] = useState(false);
    const [userId, setUserId] = useState(null);  // Unique user ID
    const backendURL = "https://zany-acorn-q4wg9q95rw7f69vx-3001.app.github.dev";

    useEffect(() => {
        // Generate a unique user ID (e.g., using localStorage)
        const storedUserId = localStorage.getItem('userId');
        const newUserId = storedUserId || Math.random().toString(36).substring(2, 15); // Simple random ID
        localStorage.setItem('userId', newUserId);
        setUserId(newUserId);

    }, []);
    // Fetch initial scene on component mount
    useEffect(() => {
        if (userId) {
            setLoading(true);
            fetch(`${backendURL}/start?userId=${userId}`)
                .then(response => {
                    if (!response.ok) {
                        throw new Error(`HTTP error! Status: ${response.status}`);
                    }
                    return response.json();
                })
                .then(data => {
                    setScene(data.scene);
                    setHealth(data.health);
                    setScore(data.score);
                    setInventory(data.inventory);
                    setSecrets(data.secrets);
                })
                .catch(error => {
                    console.error('Error fetching initial scene:', error);
                    setScene(`Failed to load initial scene: ${error.message}`);
                })
                .finally(() => setLoading(false));
        }
    }, [userId, backendURL]);


    const handleSubmit = async (event) => {
        event.preventDefault();
        setLoading(true);

        try {
            const backendResponse = await fetch(`${backendURL}/generate`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ prompt: prompt, userId: userId }),
            });

            if (!backendResponse.ok) {
                throw new Error(`HTTP error! Status: ${backendResponse.status}`);
            }

            const data = await backendResponse.json();
            setScene(data.scene);
            setHealth(data.health);
            setScore(data.score);
            setInventory(data.inventory);
            setSecrets(data.secrets);
        } catch (error) {
            console.error('Error calling backend:', error);
            setScene(`Error: ${error.message}`);
        } finally {
            setLoading(false);
            setPrompt('');  // Clear the prompt input after submission
        }
    };

    return (
        <div>
            <h1>The Sunken City of Aethelgard</h1>
            <div>
                Health: {health} | Score: {score} | Inventory: {inventory.join(', ') || 'Empty'} | Secrets: {secrets.length}
            </div>

            {loading ? (
                <p>Loading...</p>
            ) : (
                <p>{scene}</p>
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