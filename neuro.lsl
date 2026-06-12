// Neuro care assistant v0.1
// Drop this script into the Neuro-Link HUD linkset.
// The HUD controller opens it with:
//   llMessageLinked(LINK_SET, 0, "NL_NEURO_OPEN", llGetOwner());
//
// Neuro owns Daily Check-In, My Pulse, Health, Care, Lifestyle, and Suggestions.
// Profile, Wallet, Messages, and Settings stay in their own scripts/apps.

integer MENU_TIMEOUT = 90;
integer COMMAND_CHANNEL = 77;

string MSG_OPEN = "NL_NEURO_OPEN";
string MSG_HOME = "NL_HUD_SHOW_HOME";

string K_PROFILE_DISPLAY = "NL_HUD_PROFILE_DISPLAY";
string K_ENERGY = "NL_NEURO_ENERGY";
string K_MOOD = "NL_NEURO_MOOD";
string K_HEALTH = "NL_NEURO_HEALTH";
string K_FOOD = "NL_NEURO_FOOD";
string K_WATER = "NL_NEURO_WATER";
string K_REST = "NL_NEURO_REST";
string K_RENT = "NL_NEURO_RENT";
string K_SOCIAL = "NL_NEURO_SOCIAL";
string K_STRESS = "NL_NEURO_STRESS";
string K_LAST_CHECKIN = "NL_NEURO_LAST_CHECKIN";

integer gMenuChannel;
integer gListen;
integer gCommandListen;
key gUser;
string gMode;
string gCheckInChoice;

integer privateChannel()
{
    integer a = (integer)("0x" + llGetSubString((string)llGetKey(), 0, 7));
    integer b = (integer)("0x" + llGetSubString((string)llGetOwner(), 0, 7));
    integer c = (a ^ b ^ 74111) & 0x3FFFFFFF;
    if (c == 0) c = 74111;
    return -c;
}

integer isOwner(key avatar)
{
    return avatar == llGetOwner();
}

string cleanValue(string value, string fallback)
{
    value = llStringTrim(value, STRING_TRIM);
    if (value == "") return fallback;
    return value;
}

string readData(string keyName, string fallback)
{
    return cleanValue(llLinksetDataRead(keyName), fallback);
}

saveData(string keyName, string value)
{
    llLinksetDataWrite(keyName, cleanValue(value, "Not set"));
}

integer containsText(string value, string needle)
{
    return llSubStringIndex(llToLower(value), llToLower(needle)) != -1;
}

string ownerFirstName()
{
    string name = llLinksetDataRead(K_PROFILE_DISPLAY);
    if (name == "") name = llGetDisplayName(llGetOwner());
    name = cleanValue(name, "there");

    list parts = llParseString2List(name, [" "], []);
    string first = llList2String(parts, 0);
    if (first != "") return first;
    return name;
}

string dayGreeting()
{
    integer seconds = (integer)llGetWallclock();
    if (seconds < 43200) return "Good morning";
    if (seconds < 64800) return "Good afternoon";
    return "Good evening";
}

resetMenuListen()
{
    if (gListen)
    {
        llListenRemove(gListen);
    }

    gMenuChannel = privateChannel();
    gListen = llListen(gMenuChannel, "", llGetOwner(), "");
    llSetTimerEvent((float)MENU_TIMEOUT);
}

closeNeuro()
{
    if (gListen)
    {
        llListenRemove(gListen);
    }

    gListen = 0;
    gMode = "";
    gCheckInChoice = "";
    llSetTimerEvent(0.0);
}

startCommandListen()
{
    if (gCommandListen)
    {
        llListenRemove(gCommandListen);
    }

    gCommandListen = llListen(COMMAND_CHANNEL, "", llGetOwner(), "");
}

showDialog(string title, list buttons)
{
    resetMenuListen();
    llDialog(llGetOwner(), title, buttons, gMenuChannel);
}

list withNav(list buttons)
{
    return buttons + ["Back", "Home", "Close"];
}

string suggestion()
{
    string energy = readData(K_ENERGY, "");
    string mood = readData(K_MOOD, "");
    string health = readData(K_HEALTH, "");
    string food = readData(K_FOOD, "");
    string water = readData(K_WATER, "");
    string rest = readData(K_REST, "");
    string rent = readData(K_RENT, "");
    string social = readData(K_SOCIAL, "");
    string stress = readData(K_STRESS, "");

    if (containsText(health, "sick") || containsText(health, "meds"))
    {
        return "Take it gentle. Check meds or care support before pushing the day.";
    }

    if (containsText(stress, "high") || containsText(mood, "stressed"))
    {
        return "Lower the pressure first. Breathe, drink water, and choose one small next step.";
    }

    if (containsText(food, "hungry") || containsText(food, "breakfast") || containsText(food, "food"))
    {
        return "Start with food or water before big plans. A steady body makes the day easier.";
    }

    if (containsText(water, "need") || containsText(water, "water"))
    {
        return "Water first. Then check if you still need food, rest, or a slower pace.";
    }

    if (containsText(rest, "need") || containsText(rest, "slow") || containsText(energy, "low") || containsText(mood, "tired"))
    {
        return "Move slower for a bit. Rest, stretch, or pick one simple task.";
    }

    if (containsText(rent, "due"))
    {
        return "Handle rent or set a reminder before it becomes background stress.";
    }

    if (containsText(social, "chat") || containsText(social, "friends") || containsText(mood, "social"))
    {
        return "Reach out if it feels good. Keep it light and leave room to recharge.";
    }

    if (containsText(energy, "focused"))
    {
        return "You have momentum. Pick one priority and protect the quiet around it.";
    }

    return "Check in softly. Food, water, rest, and one clear intention are enough.";
}

string pulseSummary()
{
    return "Neuro: My Pulse"
        + "\nEnergy: " + readData(K_ENERGY, "Not checked")
        + "\nMood: " + readData(K_MOOD, "Not checked")
        + "\nHealth: " + readData(K_HEALTH, "Not checked")
        + "\nFood/Water: " + readData(K_FOOD, "Not checked") + " / " + readData(K_WATER, "Not checked")
        + "\nRest/Stress: " + readData(K_REST, "Not checked") + " / " + readData(K_STRESS, "Not checked")
        + "\nRent/Social: " + readData(K_RENT, "Not checked") + " / " + readData(K_SOCIAL, "Not checked")
        + "\nLast: " + readData(K_LAST_CHECKIN, "Never")
        + "\n\nSuggestion: " + suggestion();
}

showNeuroHome()
{
    gMode = "HOME";
    showDialog(
        "Neuro\n\nDaily care assistant.\n\nChoose a section.",
        withNav(["Daily Check-In", "My Pulse", "Health", "Care", "Lifestyle", "Suggestions"])
    );
}

showDailyCheckIn()
{
    gMode = "CHECKIN";
    showDialog(
        "Neuro: " + dayGreeting() + ", " + ownerFirstName() + ". How are we moving today?",
        withNav(["Focused", "Tired", "Hungry", "Stressed", "Social", "Skip"])
    );
}

showFollowUp(string prompt, list choices)
{
    gMode = "FOLLOWUP";
    showDialog("Neuro: " + prompt, withNav(choices));
}

showPulse()
{
    gMode = "PULSE";
    showDialog(
        pulseSummary(),
        withNav(["Daily Check-In", "Health", "Care", "Lifestyle", "Suggestions"])
    );
}

showHealth()
{
    gMode = "HEALTH";
    showDialog(
        "Neuro: Health\n\nHow does your body feel right now?",
        withNav(["Good", "Sore", "Sick", "Need Meds"])
    );
}

showCare()
{
    gMode = "CARE";
    showDialog(
        "Neuro: Care\n\nWhat kind of care would help first?",
        withNav(["Food", "Water", "Rest", "Freshen", "Rent"])
    );
}

showLifestyle()
{
    gMode = "LIFESTYLE";
    showDialog(
        "Neuro: Lifestyle\n\nWhat is shaping the day?",
        withNav(["Social", "Solo", "Work", "Rent OK", "Rent Due", "Low Stress", "High Stress"])
    );
}

showSuggestions()
{
    gMode = "SUGGESTIONS";
    showDialog(
        "Neuro: Suggestion\n\n" + suggestion(),
        withNav(["Daily Check-In", "My Pulse"])
    );
}

openNeuro()
{
    gUser = llGetOwner();
    showNeuroHome();
}

integer isNeuroTouchLink(string linkName)
{
    linkName = llToUpper(llStringTrim(linkName, STRING_TRIM));

    if (linkName == "NL_ICON_NEURO") return TRUE;
    if (linkName == "NL_ICON_HEALTH") return TRUE;
    if (linkName == "NL_CLICK_HEALTH") return TRUE;
    if (linkName == "NL_HEALTH_ORB") return TRUE;
    if (linkName == "NEURO") return TRUE;
    if (linkName == "HEALTH") return TRUE;

    return FALSE;
}

integer isNeuroTouch(integer link, string linkName)
{
    return isNeuroTouchLink(linkName);
}

goHome()
{
    closeNeuro();
    llMessageLinked(LINK_SET, 0, MSG_HOME, llGetOwner());
}

saveCheckInStart(string choice)
{
    gCheckInChoice = choice;
    saveData(K_LAST_CHECKIN, llGetTimestamp());

    if (choice == "Focused")
    {
        saveData(K_ENERGY, "Focused");
        saveData(K_MOOD, "Focused");
        saveData(K_STRESS, "Low");
        showFollowUp("Want to anchor focus with work, care, or quiet?", ["Work", "Care", "Quiet", "Not now"]);
        return;
    }

    if (choice == "Tired")
    {
        saveData(K_ENERGY, "Low");
        saveData(K_MOOD, "Tired");
        saveData(K_REST, "Needed");
        showFollowUp("Do you need rest, water, or a slower pace?", ["Rest", "Water", "Slow Pace", "Not now"]);
        return;
    }

    if (choice == "Hungry")
    {
        saveData(K_ENERGY, "Low");
        saveData(K_MOOD, "Hungry");
        saveData(K_FOOD, "Hungry");
        showFollowUp("Need breakfast, coffee, or water first?", ["Breakfast", "Coffee", "Water", "Not now"]);
        return;
    }

    if (choice == "Stressed")
    {
        saveData(K_MOOD, "Stressed");
        saveData(K_STRESS, "High");
        showFollowUp("What would help first?", ["Breathe", "Quiet", "Ask Help", "Not now"]);
        return;
    }

    if (choice == "Social")
    {
        saveData(K_MOOD, "Social");
        saveData(K_SOCIAL, "Open");
        showFollowUp("Social energy for chat, friends, or a solo reset?", ["Chat", "Friends", "Solo", "Not now"]);
        return;
    }

    saveData(K_MOOD, "Skipped");
    showPulse();
}

handleFollowUp(string choice)
{
    if (gCheckInChoice == "Focused")
    {
        if (choice == "Work") saveData(K_ENERGY, "Focused on work");
        else if (choice == "Care") saveData(K_REST, "Care break planned");
        else if (choice == "Quiet")
        {
            saveData(K_SOCIAL, "Solo focus");
            saveData(K_STRESS, "Low");
        }
        else saveData(K_MOOD, "Focused");
    }
    else if (gCheckInChoice == "Tired")
    {
        if (choice == "Rest") saveData(K_REST, "Needed");
        else if (choice == "Water") saveData(K_WATER, "Needed");
        else if (choice == "Slow Pace") saveData(K_REST, "Slow pace");
        else saveData(K_REST, "Not now");
    }
    else if (gCheckInChoice == "Hungry")
    {
        if (choice == "Breakfast") saveData(K_FOOD, "Breakfast first");
        else if (choice == "Coffee")
        {
            saveData(K_ENERGY, "Needs coffee");
            saveData(K_FOOD, "Light food later");
        }
        else if (choice == "Water") saveData(K_WATER, "Needed");
        else saveData(K_FOOD, "Not now");
    }
    else if (gCheckInChoice == "Stressed")
    {
        if (choice == "Breathe") saveData(K_STRESS, "High - breathing");
        else if (choice == "Quiet") saveData(K_SOCIAL, "Solo reset");
        else if (choice == "Ask Help") saveData(K_SOCIAL, "Support needed");
        else saveData(K_STRESS, "High");
    }
    else if (gCheckInChoice == "Social")
    {
        if (choice == "Chat") saveData(K_SOCIAL, "Chat");
        else if (choice == "Friends") saveData(K_SOCIAL, "Friends");
        else if (choice == "Solo") saveData(K_SOCIAL, "Solo reset");
        else saveData(K_SOCIAL, "Not now");
    }

    showPulse();
}

handleHealth(string choice)
{
    saveData(K_HEALTH, choice);
    if (choice == "Good") saveData(K_ENERGY, "Stable");
    if (choice == "Sore") saveData(K_REST, "Gentle movement");
    if (choice == "Sick") saveData(K_REST, "Recovery");
    if (choice == "Need Meds") saveData(K_HEALTH, "Need meds");
    showPulse();
}

handleCare(string choice)
{
    if (choice == "Food") saveData(K_FOOD, "Food needed");
    else if (choice == "Water") saveData(K_WATER, "Water needed");
    else if (choice == "Rest") saveData(K_REST, "Rest needed");
    else if (choice == "Freshen") saveData(K_MOOD, "Freshen up");
    else if (choice == "Rent") saveData(K_RENT, "Check rent");
    showPulse();
}

handleLifestyle(string choice)
{
    if (choice == "Social") saveData(K_SOCIAL, "Open");
    else if (choice == "Solo") saveData(K_SOCIAL, "Solo");
    else if (choice == "Work") saveData(K_ENERGY, "Work mode");
    else if (choice == "Rent OK") saveData(K_RENT, "OK");
    else if (choice == "Rent Due") saveData(K_RENT, "Due");
    else if (choice == "Low Stress") saveData(K_STRESS, "Low");
    else if (choice == "High Stress") saveData(K_STRESS, "High");
    showPulse();
}

routeChoice(string choice)
{
    if (choice == "Close")
    {
        closeNeuro();
        return;
    }

    if (choice == "Home")
    {
        goHome();
        return;
    }

    if (choice == "Back")
    {
        if (gMode == "HOME") goHome();
        else showNeuroHome();
        return;
    }

    if (choice == "Daily Check-In")
    {
        showDailyCheckIn();
        return;
    }

    if (choice == "My Pulse")
    {
        showPulse();
        return;
    }

    if (choice == "Health")
    {
        showHealth();
        return;
    }

    if (choice == "Care")
    {
        showCare();
        return;
    }

    if (choice == "Lifestyle")
    {
        showLifestyle();
        return;
    }

    if (choice == "Suggestions")
    {
        showSuggestions();
        return;
    }

    if (gMode == "CHECKIN")
    {
        saveCheckInStart(choice);
        return;
    }

    if (gMode == "FOLLOWUP")
    {
        handleFollowUp(choice);
        return;
    }

    if (gMode == "HEALTH")
    {
        handleHealth(choice);
        return;
    }

    if (gMode == "CARE")
    {
        handleCare(choice);
        return;
    }

    if (gMode == "LIFESTYLE")
    {
        handleLifestyle(choice);
        return;
    }

    showNeuroHome();
}

default
{
    state_entry()
    {
        closeNeuro();
        startCommandListen();
        llOwnerSay("[Neuro] Ready. Media Health button opens Neuro through the bridge. Type /77 neuro to test.");
    }

    link_message(integer sender, integer number, string message, key id)
    {
        if (message == MSG_OPEN || message == "NL_NEURO_MENU" || message == "NL_SCREEN_HEALTH")
        {
            if (id == NULL_KEY || isOwner(id))
            {
                openNeuro();
            }
            return;
        }

        if (!(id == NULL_KEY || isOwner(id))) return;

        if (message == "NL_NEURO_DAILY")
        {
            showDailyCheckIn();
            return;
        }

        if (message == "NL_NEURO_PULSE")
        {
            showPulse();
            return;
        }

        if (message == "NL_NEURO_HEALTH")
        {
            showHealth();
            return;
        }

        if (message == "NL_NEURO_CARE")
        {
            showCare();
            return;
        }

        if (message == "NL_SCREEN_CARE")
        {
            showCare();
            return;
        }

        if (message == "NL_NEURO_LIFESTYLE")
        {
            showLifestyle();
            return;
        }

        if (message == "NL_NEURO_SUGGESTIONS")
        {
            showSuggestions();
        }
    }

    touch_start(integer total)
    {
        key avatar = llDetectedKey(0);
        if (!isOwner(avatar)) return;

        integer link = llDetectedLinkNumber(0);
        string linkName = llGetLinkName(link);

        if (isNeuroTouch(link, linkName))
        {
            openNeuro();
        }
    }

    listen(integer channel, string name, key id, string message)
    {
        if (!isOwner(id)) return;

        if (channel == COMMAND_CHANNEL)
        {
            message = llToLower(llStringTrim(message, STRING_TRIM));
            if (message == "neuro" || message == "open" || message == "menu")
            {
                openNeuro();
            }
            return;
        }

        if (channel != gMenuChannel) return;
        routeChoice(message);
    }

    timer()
    {
        closeNeuro();
    }

    changed(integer change)
    {
        if (change & CHANGED_OWNER) llResetScript();
    }
}
