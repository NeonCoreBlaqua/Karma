// GC Neuro AtlasVault Breadcrumb Bridge v0.1
// Drop into the same linkset as:
//   GC_AtlasVault_Core_20403_part1
//   GC_AtlasVault_Core_20403_part2
//
// This avoids adding stack/heap pressure to the AtlasVault core scripts.
// It listens to existing LM_RSP messages and emits G-Coin wallet events
// to the CDF Tracker.

integer LM_RSP = 2000;
integer CDF_TRACKER_CHANNEL = -73463301;
string CDF_TOKEN = "CDF_WORLD_V1";

string LABEL = "G Coin AtlasVault";

integer startsWith(string value, string prefix)
{
    return llGetSubString(value, 0, llStringLength(prefix) - 1) == prefix;
}

string safeAmount(string amount)
{
    if (amount == "") return "0";
    return amount;
}

sendWalletEvent(string kind, key user, key target, string amount, string detail)
{
    vector pos = llGetPos();
    string payload = llList2Json(JSON_OBJECT, [
        "token", CDF_TOKEN,
        "source", "breadcrumb",
        "event", "gcoin." + kind,
        "type", "wallet",
        "label", LABEL,
        "objectKey", (string)llGetKey(),
        "owner", (string)llGetOwner(),
        "avatar", (string)user,
        "target", (string)target,
        "detail", detail,
        "wallet.kind", kind,
        "wallet.amount", safeAmount(amount),
        "wallet.currency", "GC",
        "region", llGetRegionName(),
        "pos", (string)((integer)pos.x) + "," + (string)((integer)pos.y) + "," + (string)((integer)pos.z),
        "time", (string)llGetUnixTime()
    ]);

    llRegionSay(CDF_TRACKER_CHANNEL, payload);
}

handleRsp(string msg, key user)
{
    list parts = llParseStringKeepNulls(msg, ["|"], []);
    if (llGetListLength(parts) < 5) return;
    if (llList2String(parts, 0) != "RSP") return;
    if (llList2String(parts, 1) != "OK") return;

    string payload = llList2String(parts, 4);
    key target = NULL_KEY;
    string amount = "";

    if (startsWith(payload, "SIGNUP|"))
    {
        amount = llList2String(llParseStringKeepNulls(payload, ["|"], []), 1);
        sendWalletEvent("signup", user, NULL_KEY, amount, "Signup bonus received");
        return;
    }

    if (startsWith(payload, "PAYROLL|"))
    {
        list p = llParseStringKeepNulls(payload, ["|"], []);
        amount = llList2String(p, 1);
        target = (key)llList2String(p, 2);
        sendWalletEvent("payroll", target, user, amount, "Payroll received");
        return;
    }

    if (startsWith(payload, "ADDFUNDS|"))
    {
        list a = llParseStringKeepNulls(payload, ["|"], []);
        amount = llList2String(a, 1);
        target = (key)llList2String(a, 2);
        sendWalletEvent("admin_add", target, user, amount, "Admin funds added");
        return;
    }

    if (startsWith(payload, "SEND|"))
    {
        list s = llParseStringKeepNulls(payload, ["|"], []);
        amount = llList2String(s, 1);
        target = (key)llList2String(s, 2);
        sendWalletEvent("send", user, target, amount, "G-Coin sent");
        return;
    }

    if (startsWith(payload, "XFER|C>U|"))
    {
        list x = llParseStringKeepNulls(payload, ["|"], []);
        amount = llList2String(x, 2);
        target = (key)llList2String(x, 3);
        sendWalletEvent("transfer", user, target, amount, "G-Coin transferred");
        return;
    }

    if (startsWith(payload, "ADMIN_SEND|"))
    {
        list ad = llParseStringKeepNulls(payload, ["|"], []);
        amount = llList2String(ad, 1);
        target = (key)llList2String(ad, 2);
        sendWalletEvent("admin_send", target, user, amount, "Admin G-Coin sent");
        return;
    }

    if (startsWith(payload, "DEPO|") || startsWith(payload, "WD|") || startsWith(payload, "XFER|"))
    {
        sendWalletEvent("account", user, NULL_KEY, "0", payload);
    }
}

default
{
    state_entry()
    {
        llOwnerSay("GC Neuro AtlasVault Breadcrumb Bridge online.");
    }

    link_message(integer sender_num, integer num, string str, key id)
    {
        if (num == LM_RSP)
        {
            handleRsp(str, id);
        }
    }
}

