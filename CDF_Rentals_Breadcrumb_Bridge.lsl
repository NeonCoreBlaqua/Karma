// CDF Rentals Breadcrumb Bridge v0.1
// Drop into the same rental kiosk linkset as Camden Falls Rentals scripts.
// Watches rental linkset data and reports housing/rent events to CDF Tracker.

integer CDF_TRACKER_CHANNEL = -73463301;
string CDF_TOKEN = "CDF_WORLD_V1";
integer HEARTBEAT_SECONDS = 300;
integer CHECK_SECONDS = 30;

string K_NAME = "CFR_PROPERTY_NAME";
string K_AVAIL = "CFR_AVAILABLE";
string K_PRICE = "CFR_RENT_PRICE";
string K_LABEL = "CFR_RENT_LABEL";
string K_TENANT = "CFR_TENANT";
string K_TENANT_NAME = "CFR_TENANT_NAME";
string K_EXPIRE = "CFR_EXPIRE";
string K_PAID = "CFR_AMOUNT_PAID";
string K_FINAL = "CFR_FINALIZED";
string K_HOLD_DUE = "CFR_HOLD_DUE";
string K_LATE_DUE = "CFR_LATE_DUE";
string K_DUE_SENT = "CFR_DUE_SENT";

string lastState;
key lastTenant;
integer lastPaid;
integer lastDueSent;
integer nextHeartbeat;

integer ri(string name, integer fallback)
{
    string value = llLinksetDataRead(name);
    if (value == "") return fallback;
    return (integer)value;
}

string rs(string name, string fallback)
{
    string value = llStringTrim(llLinksetDataRead(name), STRING_TRIM);
    if (value == "") return fallback;
    return value;
}

key rk(string name)
{
    string value = llStringTrim(llLinksetDataRead(name), STRING_TRIM);
    if (value == "") return NULL_KEY;
    return (key)value;
}

string prop()
{
    return rs(K_NAME, llGetObjectName());
}

string currentState()
{
    key tenant = rk(K_TENANT);
    integer expire = ri(K_EXPIRE, 0);
    integer holdDue = ri(K_HOLD_DUE, 0);
    integer now = llGetUnixTime();

    if (!ri(K_FINAL, 0)) return "setup";
    if (tenant != NULL_KEY && holdDue > 0 && expire > now) return "reserved";
    if (tenant != NULL_KEY && holdDue <= 0 && expire > now) return "occupied";
    if (tenant != NULL_KEY && holdDue <= 0 && expire > 0 && expire <= now) return "past_due";
    if (ri(K_AVAIL, TRUE)) return "available";
    return "unavailable";
}

sendRentEvent(string eventName, key avatar, string detail)
{
    vector pos = llGetPos();
    string payload = llList2Json(JSON_OBJECT, [
        "token", CDF_TOKEN,
        "source", "breadcrumb",
        "event", eventName,
        "type", "housing",
        "label", prop(),
        "objectKey", (string)llGetKey(),
        "owner", (string)llGetOwner(),
        "avatar", (string)avatar,
        "detail", detail,
        "housing.property", prop(),
        "housing.state", currentState(),
        "housing.tenant", rs(K_TENANT_NAME, ""),
        "housing.price", (string)ri(K_PRICE, 0),
        "housing.label", rs(K_LABEL, ""),
        "housing.paid", (string)ri(K_PAID, 0),
        "housing.lateDue", (string)ri(K_LATE_DUE, 0),
        "region", llGetRegionName(),
        "pos", (string)((integer)pos.x) + "," + (string)((integer)pos.y) + "," + (string)((integer)pos.z),
        "time", (string)llGetUnixTime()
    ]);

    llRegionSay(CDF_TRACKER_CHANNEL, payload);
}

checkRental()
{
    string rentState = currentState();
    key tenant = rk(K_TENANT);
    integer paid = ri(K_PAID, 0);
    integer dueSent = ri(K_DUE_SENT, 0);

    if (rentState != lastState)
    {
        sendRentEvent("housing." + rentState, tenant, "Rental state changed to " + rentState);
        lastState = rentState;
    }

    if (tenant != lastTenant)
    {
        if (tenant != NULL_KEY) sendRentEvent("housing.tenant.set", tenant, "Tenant set");
        else sendRentEvent("housing.tenant.clear", lastTenant, "Tenant cleared");
        lastTenant = tenant;
    }

    if (paid != lastPaid)
    {
        if (paid > lastPaid) sendRentEvent("housing.payment", tenant, "Rental payment total changed");
        lastPaid = paid;
    }

    if (dueSent > 0 && dueSent != lastDueSent)
    {
        sendRentEvent("housing.rent_due", tenant, "Rent due notice sent");
        lastDueSent = dueSent;
    }

    if (llGetUnixTime() >= nextHeartbeat)
    {
        sendRentEvent("breadcrumb.heartbeat", tenant, "rental alive");
        nextHeartbeat = llGetUnixTime() + HEARTBEAT_SECONDS;
    }
}

default
{
    state_entry()
    {
        lastState = "";
        lastTenant = NULL_KEY;
        lastPaid = -1;
        lastDueSent = 0;
        nextHeartbeat = 0;
        sendRentEvent("breadcrumb.register", NULL_KEY, "rental bridge online");
        checkRental();
        llSetTimerEvent((float)CHECK_SECONDS);
    }

    on_rez(integer start_param)
    {
        llResetScript();
    }

    changed(integer change)
    {
        if (change & CHANGED_OWNER) llResetScript();
    }

    link_message(integer sender, integer num, string str, key id)
    {
        checkRental();
    }

    touch_start(integer total_number)
    {
        integer i;
        for (i = 0; i < total_number; ++i)
        {
            sendRentEvent("housing.viewed", llDetectedKey(i), "Rental kiosk touched");
        }
    }

    timer()
    {
        checkRental();
    }
}
