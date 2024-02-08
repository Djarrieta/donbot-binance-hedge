# donbot-hedge

## Overview
`donbot-hedge` is a versatile trading bot designed for futures trading on [Binance](https://www.binance.com/en/futures/BTCUSDT) in Hedge mode, enabling multiple positions to be open simultaneously. The bot utilizes the [Xata](https://app.xata.io/) database service, requiring a specific table structure named "user" with essential columns.

## Installation
To install dependencies, execute the following command in your terminal:

```bash
bun install
```

This project was initialized using `bun init` with bun v1.0.18. [Bun](https://bun.sh) serves as a fast all-in-one JavaScript runtime, streamlining the development process.

## Xata Database Setup
Ensure the "user" table is configured with the following columns:

- `id`
- `key`
- `secret`
- `isActive`
- `name`
- `authorized`
- `branch`
- `startTime`

These columns are crucial for storing Binance API key, secret, and other user-related information.

## Binance API Integration
`donbot-hedge` interacts with the Binance API to execute trades. Make sure to include your API key and secret in the "user" table to enable the bot to open positions seamlessly.

## Configuration
Fine-tune the trading parameters, including Stop Loss, Take Profit, the number of candles used for analysis, and more in the `models/Context.ts` file. Adjust these settings according to your trading strategy and risk tolerance.

## Usage
Run the trading script using:

```bash
bun trade
```

The trade script loads data and scans for potential trades based on the configurations defined in `models/Context.ts`.

For backtesting your strategies, use:

```bash
bun backtest
```

The backtest script evaluates chosen strategies outlined in `strategies/index.ts`. It provides insightful statistics such as win ratio, profits, and more to help you assess the effectiveness of your trading strategies.

Feel free to customize and optimize the bot based on your preferences and market conditions. Happy trading!