// =====================================================
// G Coin Workforce Time Server
// Build 20400 + Neuro Breadcrumb Bridge
//
// All workforce kiosks sync their Camden clock from this server.
// Emits time sync activity to CDF Tracker.
// =====================================================

string DISPLAY_TITLE = "G Coin Workforce Time Server";
integer BUILD_NUMBER = 20400;

integer WF_TIME_CH = -9869872;
integer REAL_SECONDS_PER_CAMDEN_MINUTE = 20;
integer START_CAMDEN_HOUR = 6;
integer START_CAMDEN_MINUTE = 0;

integer CDF_TRACKER_CHANNEL = -73463301;
string CDF_TOKEN = "CDF_WORLD_V1";

string K_EPOCH = "GWF_TIME_EPOCH";

integer epoch()
{
    string r = llLinksetDataRead(K_EPOCH);
    if (r != "") return (integer)r;

    integer now = llGetUnixTime();
    llLinksetDataWrite(K_EPOCH, (string)now);
    return now;
}

integer cminPassed()
{
    integer e = llGetUnixTime() - epoch();
    if (e < 0) e = 0;
    return e / REAL_SECONDS_PER_CAMDEN_MINUTE;
}

integer cminute()
{
    return (((START_CAMDEN_HOUR * 60) + START_CAMDEN_MINUTE) + cminPassed()) % 1440;
}

string pad(integer n)
{
    if (n < 10) return "0" + (string)n;
    return (string)n;
}

string ctime()
{
    integer m = cminute();
    integer h = m / 60;
    integer mm = m % 60;
    string ap = "AM";
    if (h >= 12) ap = "PM";
    if (h == 0) h = 12;
    else if (h > 12) h -= 12;
    return (string)h + ":" + pad(mm) + " " + ap;
}

sendTimeEvent(key requester)
{
    vector pos = llGetPos();
    string payload = llList2Json(JSON_OBJECT, [
        "token", CDF_TOKEN,
        "source", "breadcrumb",
        "event", "workforce.time.sync",
        "type", "work",
        "label", DISPLAY_TITLE,
        "objectKey", (string)llGetKey(),
        "owner", (string)llGetOwner(),
        "avatar", (string)requester,
        "detail", ctime(),
        "workforce.time", ctime(),
        "workforce.minute", (string)cminute(),
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
        llListen(WF_TIME_CH, "", NULL_KEY, "");
        llOwnerSay(DISPLAY_TITLE + " online | Build " + (string)BUILD_NUMBER + " | Camden Time " + ctime() + " | Neuro breadcrumbs active");
    }

    listen(integer ch, string name, key sender, string msg)
    {
        if (ch != WF_TIME_CH) return;

        list p = llParseStringKeepNulls(msg, ["|"], []);
        if (llList2String(p, 0) != "TIME_REQ") return;
        if (llGetListLength(p) < 2) return;

        key requester = (key)llList2String(p, 1);
        llRegionSay(WF_TIME_CH, "TIME_RSP|" + (string)requester + "|" + (string)epoch() + "|" + ctime() + "|" + (string)cminute());
        sendTimeEvent(requester);
    }
}

