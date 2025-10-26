# Smart Prompt Optimizer

A powerful web application designed to help users craft, optimize, and generate stunning images using AI. This tool provides a user-friendly interface to build complex prompts, leverage reference images, and manage a gallery of your creations.

## Features

- **Prompt Optimization**: Start with a simple idea and let the AI optimize it into a detailed, high-performing prompt.
- **Advanced Controls**: Fine-tune your creations with controls for subject type, style presets, lighting, camera angles, and more.
- **Reference Image Support**:
    - **Use as Subject**: Extract a subject from an image and place it in a new scene.
    - **Use as Style**: Apply the artistic style of a reference image to your prompt.
    - **Edit with Prompt**: Directly edit a reference image using text instructions.
    - **Get Idea from Image**: Generate a descriptive prompt by analyzing an uploaded image.
- **Image Generation**: Generate multiple image variations from your prompt.
- **Gallery**: Save your favorite creations to a personal gallery for later use.
- **Quick Tools**: Use "Surprise Me" for random ideas and "Quick Chips" for pre-configured settings.

## Getting Started

### Prerequisites

- A modern web browser.
- A local development server.
- A Google Gemini API Key. You can get one from [Google AI Studio](https://aistudio.google.com/).

### Setup

The application requires a Google Gemini API key to communicate with the AI model. The code is set up to read this key from an environment variable `process.env.API_KEY`.

Since this is a client-side application, `process.env.API_KEY` needs to be replaced with your actual API key during a build step or by your development server.

**For Development:**

1.  **If using a development server like Vite or Create React App:**
    - Create a file named `.env` in the root of your project directory.
    - Add your API key to the `.env` file. The variable name might need a specific prefix (e.g., `VITE_API_KEY` for Vite).
    - You may need to adjust the code in `index.tsx` to use `import.meta.env.VITE_API_KEY` or configure your dev server to expose `process.env.API_KEY`.

2.  **For a simple static server (temporary solution):**
    - You would need to temporarily replace `process.env.API_KEY` in `index.tsx` with your actual API key string.
    - **Note:** This is **not recommended for production** as it exposes your API key in the client-side code.

### Running the Dev Server

This project is set up with modern ES modules and can be run with any local development server that can serve static files.

If you have Node.js installed, you can use a simple server like `serve`:

1.  Install `serve` globally (if you haven't already):
    ```bash
    npm install -g serve
    ```

2.  Run the server from the project's root directory:
    ```bash
    serve .
    ```

3.  Open your browser and navigate to the local address provided by the server (e.g., `http://localhost:3000`).

**Note on API Key:** With this method, you will need to handle the `process.env.API_KEY` replacement manually as described in the Setup section. For a better development experience that handles environment variables securely, setting up a project with a tool like [Vite](https://vitejs.dev/) is recommended.

### Running Tests

Currently, there are no automated tests for this project. This section can be updated once a testing framework (like Jest or Vitest) is integrated.
