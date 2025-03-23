import React, { useState } from 'react';

const GameComponent = () => {
    const [prompt, setPrompt] = useState('');
    const [response, setResponse] = useState('');
    const [loading, setLoading] = useState(false);
    const backendURL = "https://zany-acorn-q4wg9q95rw7f69vx-3001.app.github.dev";

    const handleSubmit = async (event) => {
        event.preventDefault();
        setLoading(true);
        setResponse(''); // Clear previous response

        try {
            const apiURL = import.meta.env.MODE === 'development' ? `${backendURL}/generate` : '/generate' // Adjust for production deployment
            const backendResponse = await fetch(apiURL, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({ prompt }),
            });
      
            if (!backendResponse.ok) {
              throw new Error(`HTTP error! Status: ${backendResponse.status}`);
            }
      
            const data = await backendResponse.json();
            setResponse(data.response);
          } catch (error) {
            console.error('Error calling backend:', error);
            setResponse(`Error: ${error.message}`);
          } finally {
            setLoading(false);
          }
    };

    return (
        <div>
            <h1>AI21 Interaction</h1>
            <form onSubmit={handleSubmit}>
                <label htmlFor="prompt">Enter your prompt:</label>
                <input
                    type="text"
                    id="prompt"
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                />
                <button type="submit" disabled={loading}>
                    {loading ? 'Loading...' : 'Get Response'}
                </button>
            </form>

            {response && (
                <div>
                    <h2>Response:</h2>
                    <p>{response}</p>
                </div>
            )}
        </div>
    );
};

export default GameComponent;