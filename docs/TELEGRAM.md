# Telegram Bot Integration

This feature allows you to add transactions to Cost Keeper directly through a Telegram bot using natural language.

## Setup

### 1. Create a Telegram Bot

1. Open Telegram and search for [@BotFather](https://t.me/botfather)
2. Send `/newbot` command
3. Follow the instructions to create a new bot
4. Copy the **bot token** provided by BotFather

### 2. Get a Gemini API Key

1. Go to [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Create a new API key
3. Copy the API key

### 3. Configure Environment Variables

Add these to your `.env.local` file:

```env
TELEGRAM_BOT_TOKEN=your_telegram_bot_token_here
GEMINI_API_KEY=your_gemini_api_key_here
```

### 4. Run Database Migration

Generate and run the migration for the new `telegram_users` table:

```bash
bun run db:generate
bun run db:migrate
```

### 5. Set Up Webhook

After deploying your app, call the setup endpoint to configure the Telegram webhook:

```bash
curl -X POST https://your-app-url.com/api/telegram/setup
```

Or in development, use ngrok to expose your local server and then call:

```bash
curl -X POST http://localhost:3000/api/telegram/setup
```

## Usage

### Linking Your Account

1. Go to **Settings** in the Cost Keeper app
2. Scroll down to **Telegram Integration**
3. Click **Generate Link Code**
4. Copy the `/link <code>` command
5. Open your Telegram bot and paste the command
6. Send the command to link your account

### Setting Defaults

Before adding transactions, set your default account and category:

1. Use `/accounts` to see your accounts
2. Use `/categories` to see your categories
3. Use `/setdefaults` to set your default account and category

### Adding Transactions

Simply send a natural language message to the bot:

-   **Expenses:**

    -   "Spent $50 on groceries"
    -   "Coffee at Starbucks $5.50"
    -   "Paid $200 for electricity bill"
    -   "Uber ride $15 today"

-   **Income:**
    -   "Received $1000 salary"
    -   "Got $50 from freelance work"
    -   "Birthday gift $100"

The bot uses Gemini AI to parse your messages and automatically:

-   Extract the amount (negative for expenses, positive for income)
-   Identify the payee/merchant
-   Match or suggest a category
-   Parse the date (defaults to today if not specified)

### Bot Commands

| Command        | Description                    |
| -------------- | ------------------------------ |
| `/start`       | Get started with the bot       |
| `/help`        | Show help message              |
| `/link <code>` | Link your Cost Keeper account  |
| `/status`      | Check your account link status |
| `/accounts`    | List your accounts             |
| `/categories`  | List your categories           |
| `/setdefaults` | Set default account/category   |

## Architecture

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│  Telegram   │────▶│   Webhook   │────▶│   Gemini    │
│    User     │     │   Handler   │     │     AI      │
└─────────────┘     └─────────────┘     └─────────────┘
                           │
                           ▼
                    ┌─────────────┐
                    │  Database   │
                    │ Transaction │
                    └─────────────┘
```

## Troubleshooting

### Bot not responding

-   Check if the webhook is properly set up
-   Verify your `TELEGRAM_BOT_TOKEN` is correct
-   Check server logs for errors

### "Account not linked" error

-   Generate a new link code from Settings
-   Make sure you're sending the `/link` command correctly
-   Link codes expire after 10 minutes

### Transactions not parsing correctly

-   Check if your `GEMINI_API_KEY` is valid
-   Try using clearer transaction descriptions
-   Make sure to include an amount in your message

### No default account/category

-   Use `/setdefaults` to configure defaults
-   Make sure you have at least one account and category in Cost Keeper
