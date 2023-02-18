<div align="center">  
    <img height="50"src="./src/assets/codux.svg">  
    <h1><img height="40"src="./src/assets/stylable.svg"> Stylable App template for Codux</h1>
</div>

### A Visual IDE for React Projects

Codux is an all-in-one visual development environment. Whether you’re starting a new app, creating components, or editing an existing project, every visual change you make reflects instantly in the code and vice versa. To learn more about Codux, visit our website - [https://www.codux.com/](https://www.codux.com/)

This project was bootstrapped with [`create-stylable-app`](https://www.npmjs.com/package/create-stylable-app).

It includes a single React component to start your project with, a sample [`codux.config.json`](codux.config.json) with preconfigured keys, a `package.json` file to describe the project's packages and dependencies, and a folder and component structure to put everything neatly in its place.

- Edit, render and compose apps that make use of **`React`**-based components.
- Create components with **`TypeScript`** and **[`Stylable`](https://github.com/wix/stylable)** support.
- Visually edit in real-time and in an isolated environment.

### Development

The following scripts are available:

`npm run build` - Build the application in production mode into a folder named `dist`. This folder can be served using any HTTP server. Uses [webpack](https://github.com/webpack/webpack).

`npm run serve` - Statically serve the `dist` folder. Uses [serve](https://github.com/zeit/serve).

`npm start` - Start the application in **development** mode (and open the web browser). Uses [webpack-dev-server](https://github.com/webpack/webpack-dev-server).

`npm run clean` - Delete the `dist` folder. Uses [rimraf](https://github.com/isaacs/rimraf).

`npm run typecheck` - Verify syntactic/semantic correctness. Uses [typescript](https://github.com/microsoft/TypeScript). To read more about Stylable integration with typescript check out [our documentation](https://stylable.io/docs/getting-started/typescript-integration).

`npm run lint` - Verify best practices and find common issues. Uses [eslint](https://github.com/eslint/eslint).

`npm test` - Execute `typecheck` and `lint` scripts.
