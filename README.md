# Decrypto Online

This is the web-based online version of the deduction board game **Decrypto**. 
The user interface is built with plain HTML, CSS, and JavaScript, while **Cloudflare Workers** (via `partyserver`) is used to handle real-time multiplayer state management.

## Play Online
You can play the game online at: **[https://decrypto-online.pnk.workers.dev](https://decrypto-online.pnk.workers.dev)**

## Game Rules
Decrypto is a game of secret communication between two teams. Each team is assigned 4 secret keywords. In each round, one player from each team receives a 3-digit code (e.g., `2-4-1`) and must provide 3 clues. The goal is to ensure their own teammates can guess the 3-digit code correctly, without giving away enough information for the opposing team to "intercept" the code.
For the complete ruleset, please refer to the `decrypto rules.md` file in this repository.

## Installation and Local Development

This project requires **Node.js** to be installed on your machine.

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Build the frontend:**
   ```bash
   npm run build
   ```
   *(The frontend code in `src/` will be bundled by Vite into the `dist/` directory)*

3. **Run the local game server:**
   ```bash
   npm run serve
   ```
   *(Note: Due to a Windows path bug, if your folder name contains `&`, you may need to run `node "node_modules\wrangler\bin\wrangler.js" dev` instead)*

## Deployment
To deploy the latest version directly to your Cloudflare account, run the following command:
```bash
npm run deploy
```
*(If your folder name contains `&`, run `node "node_modules\wrangler\bin\wrangler.js" deploy` instead)*

*(The system will prompt you to authenticate with your Cloudflare account)*