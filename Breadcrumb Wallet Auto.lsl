// Breadcrumb Wallet Auto v0.1
// Drop into G-Coin kiosks, vendors, tip jars, payout boards, or rent/payment kiosks.
// Reports wallet activity to CDF Tracker.

integer CDF_TRACKER_CHANNEL = -73463301;
string CDF_TOKEN = "CDF_WORLD_V1";

// Configure per wallet object.
string WALLET_LABEL = "";
string WALLET_TYPE = "wallet"; // wallet, vendor, tip, payout, rent, kiosk
string TRANSACTION_KIND = "payment"; // payment, purchase, payout, tip, rent
integer GC_AMOUNT = 0;
integer HEARTBEAT_SECONDS = 300;

string safeLabel()
{
    if (WALLET_LABEL != "") return WALLET_LABEL;
    return llGetObjectName();
}

string moneyDetail()
{
    string amount = (string)GC_AMOUNT;
    if (GC_AMOUNT <= 0) amount = "pending";
    return TRANSACTION_KIND + " GC " + amount;
}

sendWalletEvent(string eventName, key avatar, string detail)
{
    vector pos = llGetPos();
    string payload = llList2Json(JSON_OBJECT, [
        "token", CDF_TOKEN,
        "source", "breadcrumb",
        "event", eventName,
        "type", WALLET_TYPE,
        "label", safeLabel(),
        "objectKey", (string)llGetKey(),
        "owner", (string)llGetOwner(),
        "avatar", (string)avatar,
        "detail", detail,
        "wallet.kind", TRANSACTION_KIND,
        "wallet.amount", (string)GC_AMOUNT,
        "wallet.currency", "GC",
        "region", llGetRegionName(),
        "pos", (string)((integer)pos.x) + "," + (string)((integer)pos.y) + "," + (string)((integer)pos.z),
        "time", (string)llGetUnixTime()
    ]);

    llRegionSay(CDF_TRACKER_CHANNEL, payload);
}

default
{
    state_entry()
    {
        sendWalletEvent("breadcrumb.register", NULL_KEY, WALLET_TYPE + " online");
        llSetTimerEvent((float)HEARTBEAT_SECONDS);
    }

    on_rez(integer start_param)
    {
        llResetScript();
    }

    touch_start(integer total_number)
    {
        integer i;
        for (i = 0; i < total_number; ++i)
        {
            sendWalletEvent("gcoin." + TRANSACTION_KIND, llDetectedKey(i), moneyDetail());
        }
    }

    money(key avatar, integer amount)
    {
        GC_AMOUNT = amount;
        sendWalletEvent("gcoin.payment", avatar, "L$ payment received; map to G-Coin if needed");
    }

    changed(integer change)
    {
        if (change & CHANGED_OWNER)
        {
            llResetScript();
        }
    }

    timer()
    {
        sendWalletEvent("breadcrumb.heartbeat", NULL_KEY, WALLET_TYPE + " alive");
    }
}

