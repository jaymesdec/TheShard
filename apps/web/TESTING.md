# How to Test the Web App

This project is a **React Router** application built with **Vite** and styled with **Tailwind CSS**. It appears to use **Bun** for package management, based on the presence of `bun.lock`.

## Prerequisites

You need to have **Node.js** or **Bun** installed on your computer.

### Option A: Using Bun (Recommended)
Since `bun.lock` exists, this project is optimized for [Bun](https://bun.sh/).

1. **Install Bun** (if not installed):
   ```bash
   curl -fsSL https://bun.sh/install | bash
   ```

2. **Verify Installation**:
   ```bash
   bun --version
   ```

### Option B: Using Node.js & npm
If you prefer Node.js:
1. Ensure you have Node.js installed (`node -v`).
2. You can use `npm`, `yarn`, or `pnpm`.

## Running the App Globally

The web application is located in the `apps/web` directory.

### 1. Navigate to the Directory
Open your terminal and navigate to the project folder:
```bash
cd apps/web
```

### 2. Install Dependencies
Run the install command to download all required libraries.

**Using Bun:**
```bash
bun install
```

**Using npm:**
```bash
npm install
```

### 3. Start the Development Server
This will start the app locally.

**Using Bun:**
```bash
bun run dev
```

**Using npm:**
```bash
npm run dev
```

### 4. Open in Browser
Once the server starts, you will see a URL in the terminal, usually:
- [http://localhost:4000](http://localhost:4000)

Click the link or copy-paste it into your browser to test the app.

## Troubleshooting

- **"Command not found"**: If running `bun` or `npm` fails, make sure they are installed and in your system PATH.
- **Port already in use**: If port 4000 is taken, Vite will usually try the next available port (e.g., 4001). Check the terminal output for the correct URL.
