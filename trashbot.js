var SteamUser = require("steam-user"); //handles everything related to trade
var TradeOfferManager = require("steam-tradeoffer-manager"); //used to generate 2FA codes
var SteamTotp = require('steam-totp'); //takes care of mobile confirmations
var SteamCommunity = require('steamcommunity'); //community access?

var client = new SteamUser({"promptSteamGuardCode": false}); // We don't want the module to ask for the steam guard code, we will give it with a bit of code.
var manager = new TradeOfferManager({"steam": client, "language": 'en', "pollInterval": 2000}); // Check new trades every 2 seconds
var community = new SteamCommunity();

const config = require('./config.json');

// We'll first get the time offset between us and the server, this is used to generate a 2FA code like on your mobile.
// The code depends on what time it is, that's why we need it.
SteamTotp.getTimeOffset(function(err, offset, latency)
{
    if (err)
    {
        console.log('An error occurred while trying to get the time offset: ' + err.message);
        process.exit(1);
        return;
    }

    var logOnOptions = {"accountName": config.account_name, "password":  config.account_password, "twoFactorCode": SteamTotp.getAuthCode(config.shared_secret, offset)};

    // We will now sign onto steam with the logon details we made above.
    client.logOn(logOnOptions);
});

// This is a event, the function you give it will be emitted when we have logged on, as the name says.
client.on('loggedOn', function()
{
    // Everything in here will be emitted when you have connected and logged onto Steam.
    console.log("Logged onto steam as " + client.steamID.getSteamID64() + " (" + config.account_name + ")");
});

// Emitted when the bot has signed onto Steam through the browser. We will use the cookies for two of our modules.
client.on('webSession', function(sessionID, cookies)
{
    // Set the cookies to the tradeoffer manager instance. Once it is set, it will start polling.
    manager.setCookies(cookies, function(err)
    {
        if (err)
        {
            // If an error occurres, that means that this account is limited and can't trade.
            console.log("This account appears to be limited, add $5 to the account in order to use it as a bot.");
            process.exit(1);
            return;
        }
    });

    community.setCookies(cookies);
});

manager.on('newOffer', function(offer)
{
    console.log("Incoming offer from " + offer.partner.getSteamID64());
    acceptOffer(offer);
});

manager.on('receivedOfferChanged', function(offer, oldState)
{
    console.log("Offer #" + offer.id + " changed: " + TradeOfferManager.ETradeOfferState[oldState] + " (" + oldState + ") -> " +
    TradeOfferManager.ETradeOfferState[offer.state] + " (" + offer.state + ")");
});

community.on('sessionExpired', function(err)
{
    // The session expired, we have to relog to get a fresh session and cookies.
    client.webLogOn();
});

community.on('confKeyNeeded', function(tag, callback)
{
    var time = Math.floor(Date.now() / 1000);
    callback(null, time, SteamTotp.getConfirmationKey(config.identity_secret, time, tag));
});

// Call this function when you want to accept an offer.
function acceptOffer(offer)
{
    offer.accept(true, function(err, status)
    {
        if (err)
        {
            if (err.message === 'Not Logged In')
            {
                client.webLogOn();
            }

            console.log('An error occurred while trying to accept the offer: ' + err.message + '.');
            return;
        }

        // If the offer is pending, that means that we have to accept a mobile confirmation for the offer.
        if (status === 'pending')
        {
            // Accepts the mobile confirmation.
            community.acceptConfirmationForObject(config.identity_secret, offer.id, function(err)
            {
                if (err)
                {
                    if (err.message == 'Not Logged In')
                    {
                        self.client.webLogOn();
                    }
                    console.log('An error occurred while trying to accept the mobile confirmation: ' + err.message + '.');
                    return;
                }
            });
        }
    });
}
