// =====================================================
// G Coin System
// Module: Update Server
// Build: 20407 + Neuro Breadcrumb Bridge
// Purpose: In-world update checks for G Coin products
// Emits update server activity to CDF Tracker.
// =====================================================

string PRODUCT_NAME     = "G Coin System";
string MODULE_NAME      = "Update Server";
string SERVER_NAME      = "G Coin Update Server";
key    ADMIN_UUID       = "0f6de87a-d007-46bb-85e5-fceccf6974ae";

integer UPDATE_CH       = -9869870;
integer BUILD_NUMBER    = 20407;
integer OWNER_ONLY      = FALSE;
integer GIVE_UPDATES    = TRUE;

integer CDF_TRACKER_CHANNEL = -73463301;
string CDF_TOKEN = "CDF_WORLD_V1";

string HUD_PRODUCT_ID   = "GCOIN_WALLET_HUD";
integer HUD_BUILD       = 20407;
string HUD_OBJECT_NAME  = "G Coin Wallet";
string HUD_NOTES        = "Emergency G Coin Wallet 20407 fixes live balance display, safe user picker, and transfer recipient names.";

string ATM_PRODUCT_ID   = "GCOIN_ATM";
integer ATM_BUILD       = 20400;
string ATM_OBJECT_NAME  = "G Coin ATM";
string ATM_NOTES        = "G Coin ATM 20400 uses GC whole-number currency display.";

string CORE_PRODUCT_ID  = "GCOIN_ATLASVAULT_CORE";
integer CORE_BUILD      = 20403;
string CORE_OBJECT_NAME = "G Coin AtlasVault Node";
string CORE_NOTES       = "AtlasVault Core 20403 splits the server into part 1 and part 2 to prevent Stack-Heap Collision.";

string WORKFORCE_PRODUCT_ID   = "GCOIN_WORKFORCE_KIOSK";
integer WORKFORCE_BUILD       = 20411;
string WORKFORCE_OBJECT_NAME  = "Work force System Kiosk";
string WORKFORCE_NOTES        = "Workforce Kiosk 20411 fixes clock-gate fallback and shared shift schedule status.";

integer isAdmin(key id)
{
    return (id == llGetOwner() || id == ADMIN_UUID);
}

integer productBuild(string productId)
{
    if (productId == HUD_PRODUCT_ID) return HUD_BUILD;
    if (productId == ATM_PRODUCT_ID) return ATM_BUILD;
    if (productId == CORE_PRODUCT_ID) return CORE_BUILD;
    if (productId == WORKFORCE_PRODUCT_ID) return WORKFORCE_BUILD;
    return 0;
}

string productObject(string productId)
{
    if (productId == HUD_PRODUCT_ID) return HUD_OBJECT_NAME;
    if (productId == ATM_PRODUCT_ID) return ATM_OBJECT_NAME;
    if (productId == CORE_PRODUCT_ID) return CORE_OBJECT_NAME;
    if (productId == WORKFORCE_PRODUCT_ID) return WORKFORCE_OBJECT_NAME;
    return "";
}

string productNotes(string productId)
{
    if (productId == HUD_PRODUCT_ID) return HUD_NOTES;
    if (productId == ATM_PRODUCT_ID) return ATM_NOTES;
    if (productId == CORE_PRODUCT_ID) return CORE_NOTES;
    if (productId == WORKFORCE_PRODUCT_ID) return WORKFORCE_NOTES;
    return "";
}

sendUpdateEvent(string eventName, key requester, string productId, string detail)
{
    vector pos = llGetPos();
    string payload = llList2Json(JSON_OBJECT, [
        "token", CDF_TOKEN,
        "source", "breadcrumb",
        "event", eventName,
        "type", "gcoin.update",
        "label", SERVER_NAME,
        "objectKey", (string)llGetKey(),
        "owner", (string)llGetOwner(),
        "avatar", (string)requester,
        "detail", detail,
        "update.productId", productId,
        "region", llGetRegionName(),
        "pos", (string)((integer)pos.x) + "," + (string)((integer)pos.y) + "," + (string)((integer)pos.z),
        "time", (string)llGetUnixTime()
    ]);

    llRegionSay(CDF_TRACKER_CHANNEL, payload);
}

reply(key objectKey, string msg)
{
    llRegionSayTo(objectKey, UPDATE_CH, msg);
}

handleUpdateMessage(key sender, string msg)
{
    if (OWNER_ONLY && llGetOwnerKey(sender) != llGetOwner()) return;

    list p = llParseString2List(msg, ["|"], []);
    if (llGetListLength(p) < 4) return;

    string cmd = llList2String(p, 0);
    string productId = llList2String(p, 1);
    integer clientBuild = (integer)llList2String(p, 2);
    key requester = (key)llList2String(p, 3);

    integer latest = productBuild(productId);
    if (!latest)
    {
        reply(sender, "UPDATE_UNKNOWN|" + productId);
        sendUpdateEvent("gcoin.update.unknown", requester, productId, "Unknown product");
        return;
    }

    string objectName = productObject(productId);
    string notes = productNotes(productId);

    if (cmd == "UPDATE_CHECK")
    {
        if (clientBuild < latest)
        {
            reply(sender, "UPDATE_AVAILABLE|" + productId + "|" + (string)latest + "|" + objectName + "|" + notes);
            sendUpdateEvent("gcoin.update.available", requester, productId, "Update available " + (string)latest);
            return;
        }

        reply(sender, "UPDATE_CURRENT|" + productId + "|" + (string)latest + "|" + notes);
        sendUpdateEvent("gcoin.update.current", requester, productId, "Current build");
        return;
    }

    if (cmd == "UPDATE_GET")
    {
        key senderOwner = llGetOwnerKey(sender);
        if (!isAdmin(senderOwner) && requester != senderOwner)
        {
            reply(sender, "UPDATE_DENIED|" + productId + "|Owner mismatch");
            sendUpdateEvent("gcoin.update.denied", requester, productId, "Owner mismatch");
            return;
        }

        if (!GIVE_UPDATES)
        {
            reply(sender, "UPDATE_MANUAL|" + productId + "|" + (string)latest + "|" + objectName + "|Visit the update room or contact the owner.");
            sendUpdateEvent("gcoin.update.manual", requester, productId, "Manual update required");
            return;
        }

        if (llGetInventoryType(objectName) == INVENTORY_OBJECT)
        {
            llGiveInventory(requester, objectName);
            reply(sender, "UPDATE_SENT|" + productId + "|" + (string)latest + "|" + objectName);
            sendUpdateEvent("gcoin.update.sent", requester, productId, "Update sent");
            return;
        }

        reply(sender, "UPDATE_MISSING|" + productId + "|" + (string)latest + "|" + objectName);
        sendUpdateEvent("gcoin.update.missing", requester, productId, "Update object missing");
    }
}

default
{
    state_entry()
    {
        llListen(UPDATE_CH, "", NULL_KEY, "");
        llOwnerSay(SERVER_NAME + " online | Build " + (string)BUILD_NUMBER + " | Neuro breadcrumbs active");
    }

    touch_start(integer total)
    {
        key toucher = llDetectedKey(0);
        if (!isAdmin(toucher)) return;

        llRegionSayTo(toucher, 0,
            SERVER_NAME + "\n"
            + "HUD: " + (string)HUD_BUILD + " - " + HUD_OBJECT_NAME + "\n"
            + "ATM: " + (string)ATM_BUILD + " - " + ATM_OBJECT_NAME + "\n"
            + "Core: " + (string)CORE_BUILD + " - " + CORE_OBJECT_NAME + "\n"
            + "Workforce: " + (string)WORKFORCE_BUILD + " - " + WORKFORCE_OBJECT_NAME
        );
    }

    listen(integer channel, string name, key id, string msg)
    {
        if (channel == UPDATE_CH) handleUpdateMessage(id, msg);
    }
}

