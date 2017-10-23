# Purpose

The purpose behind the Steam Trashbot is to automate Steam Trades.
The script logs into a Steam account (provided the proper credentials have been provided) and waits for a trade offer.
Once a trade offer is received it will accept the trade no matter the contents. It will log to console if items were received.
It's important to note that the script CANNOT handle live trades. The bot will ignore Trade Invited.


# Installation

- Clone the repository to a computer that has (or will have) nodejs and npm installed.
- Enter the directory of the cloned repository and run `npm install` to install all the required dependencies.
- Fill in the `config.json` file with your account specific details
- Run `trashbot.js`

# Notes

The Bot only responds to trade requests so the Steam account MUST be setup to accept trade offers via a tradelink
if you do not intend for the bot to be friend with anyone who wants to trade it.
