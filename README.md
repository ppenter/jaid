# 🚀 Jaid

Jaid is a powerful command-line interface (CLI) designed for server-side rendering (SSR) with React and TypeScript. Leveraging the speed of esbuild, Jaid provides an efficient development experience with file-based routing and a framework for building scalable web applications.

## 📦 Installation

To get started with Jaid, you'll need to install it globally using Yarn. Ensure you have Yarn installed on your machine before proceeding.

```bash
yarn global add jaid
```

## 🛠️ Getting Started

Follow these simple steps to create and run your first Jaid project:

1. **Create a New Project**

   Begin by creating a new project with Jaid:

   ```bash
   jaid mkproj
   ```

2. **Navigate to Your Project**

   Change into your newly created project directory:

   ```bash
   cd your-project-name
   ```

3. **Link Dependencies**

   Before creating your app, link the project's dependencies to Jaid:

   ```bash
   jaid setup
   ```

4. **Create a New App**

   Generate a new app within your project:

   ```bash
   jaid new-app <app-name>
   ```

5. **Start Development Server**

   Launch the development server to see your app in action:

   ```bash
   jaid dev
   ```

6. **Visit Your Application**

   Open your web browser and navigate to the website indicated in your terminal, typically `http://localhost:3000`.

## 🌟 Features

- **Fast Builds**: Utilizes esbuild for super-fast compilation and bundling.
- **TypeScript Support**: Full support for TypeScript out of the box.
- **Server-Side Rendering (SSR)**: Enhance SEO and improve load times with SSR.
- **File-Based Routing**: Easy to manage routes with file-based routing.

## 🔧 Commands

- `jaid mkproj`: Creates a new project.
- `jaid setup`: Links project dependencies to Jaid.
- `jaid new-app <app-name>`: Generates a new app within a project.
- `jaid dev`: Starts the development server.

## 📚 Documentation

For more detailed information on using Jaid and its features, visit [our documentation](#).

## 🤝 Contributing

We welcome contributions to Jaid! If you're interested in helping improve the project, check out our [contributing guidelines](#) to get started.

## 📝 License

Jaid is open-source software licensed under the MIT license.
