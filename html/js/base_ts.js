var SERVER = new Object();
var BULK_EDIT = false;
var COLUMN_TO_SORT;
var INACTIVE_COLUMN_TO_SORT;
var SEARCH_MAPPING = new Object();
var UNDO = new Object();
var SERVER_CONNECTION = false;
var WS_AVAILABLE = false;
const tooltipTriggerList = document.querySelectorAll('[data-bs-toggle="tooltip"]');
const tooltipList = [...tooltipTriggerList].map(tooltipTriggerEl => new bootstrap.Tooltip(tooltipTriggerEl));
// new ClipboardJS('.copy-btn');
var clipboard = new ClipboardJS('.copy-btn');
clipboard.on('success', function (e) {
    const tooltip = bootstrap.Tooltip.getInstance(e.trigger);
    tooltip.setContent({ '.tooltip-inner': 'Copied!' });
});
clipboard.on('error', function (e) {
    console.log(e);
});
var popupModal = new bootstrap.Modal(document.getElementById("popup"), {
    keyboard: true,
    focus: true
});
var loadingModal = new bootstrap.Modal(document.getElementById("loading"), {
    keyboard: true,
    focus: true
});
// Menü
var menuItems = new Array();
menuItems.push(new MainMenuItem("playlist", "{{.mainMenu.item.playlist}}", "m3u.png", "{{.mainMenu.headline.playlist}}"));
menuItems.push(new MainMenuItem("xmltv", "{{.mainMenu.item.xmltv}}", "xmltv.png", "{{.mainMenu.headline.xmltv}}"));
menuItems.push(new MainMenuItem("filter", "{{.mainMenu.item.filter}}", "filter.png", "{{.mainMenu.headline.filter}}"));
menuItems.push(new MainMenuItem("mapping", "{{.mainMenu.item.mapping}}", "mapping.png", "{{.mainMenu.headline.mapping}}"));
menuItems.push(new MainMenuItem("users", "{{.mainMenu.item.users}}", "users.png", "{{.mainMenu.headline.users}}"));
menuItems.push(new MainMenuItem("settings", "{{.mainMenu.item.settings}}", "settings.png", "{{.mainMenu.headline.settings}}"));
menuItems.push(new MainMenuItem("log", "{{.mainMenu.item.log}}", "log.png", "{{.mainMenu.headline.log}}"));
menuItems.push(new MainMenuItem("logout", "{{.mainMenu.item.logout}}", "logout.png", "{{.mainMenu.headline.logout}}"));
// Kategorien für die Einstellungen
var settingsCategory = new Array();
settingsCategory.push(new SettingsCategoryItem("{{.settings.category.general}}", "ThreadfinAutoUpdate,ssdp,tuner,epgSource,epgCategories,epgCategoriesColors,dummy,dummyChannel,ignoreFilters,api"));
settingsCategory.push(new SettingsCategoryItem("{{.settings.category.files}}", "update,files.update,temp.path,cache.images,bindIpAddress,httpThreadfinDomain,forceHttps,httpsPort,httpsThreadfinDomain,xepg.replace.missing.images,xepg.replace.channel.title,enableNonAscii"));
settingsCategory.push(new SettingsCategoryItem("{{.settings.category.streaming}}", "buffer,udpxy,buffer.size.kb,storeBufferInRAM,buffer.timeout,user.agent,ffmpeg.path,ffmpeg.options,vlc.path,vlc.options"));
settingsCategory.push(new SettingsCategoryItem("{{.settings.category.backup}}", "backup.path,backup.keep"));
settingsCategory.push(new SettingsCategoryItem("{{.settings.category.authentication}}", "authentication.web,authentication.pms,authentication.m3u,authentication.xml,authentication.api"));
function showPopUpElement(elm) {
    showElement(elm, true);
    // setTimeout(function () {
    //   showElement("popup", true);
    // }, 10);
    return;
}
function showElement(elmID, type) {
    if (elmID == "popup-custom" || elmID == "popup") {
        switch (type) {
            case true:
                popupModal.show();
                break;
            case false:
                popupModal.hide();
                break;
        }
    }
    if (elmID == "loading") {
        switch (type) {
            case true:
                loadingModal.show();
                break;
            case false:
                loadingModal.hide();
                break;
        }
    }
}
function changeButtonAction(element, buttonID, attribute) {
    var value = element.options[element.selectedIndex].value;
    document.getElementById(buttonID).setAttribute(attribute, value);
}
function getLocalData(dataType, id) {
    var data = new Object();
    switch (dataType) {
        case "m3u":
            data = SERVER["settings"]["files"][dataType][id];
            break;
        case "hdhr":
            data = SERVER["settings"]["files"][dataType][id];
            break;
        case "filter":
        case "custom-filter":
        case "group-title":
            if (id == -1) {
                data["active"] = true;
                data["caseSensitive"] = false;
                data["description"] = "";
                data["exclude"] = "";
                data["filter"] = "";
                data["include"] = "";
                data["name"] = "";
                data["type"] = "group-title";
                data["x-category"] = "";
                SERVER["settings"]["filter"][id] = data;
            }
            data = SERVER["settings"]["filter"][id];
            break;
        case "xmltv":
            data = SERVER["settings"]["files"][dataType][id];
            break;
        case "users":
            data = SERVER["users"][id]["data"];
            break;
        case "mapping":
            data = SERVER["xepg"]["epgMapping"][id];
            break;
        case "m3uGroups":
            data = SERVER["data"]["playlist"]["m3u"]["groups"];
            break;
    }
    return data;
}
function getObjKeys(obj) {
    var keys = new Array();
    for (var i in obj) {
        if (obj.hasOwnProperty(i)) {
            keys.push(i);
        }
    }
    return keys;
}
function getOwnObjProps(object) {
    return object ? Object.getOwnPropertyNames(object) : [];
}
function getAllSelectedChannels() {
    var channels = new Array();
    if (BULK_EDIT == false) {
        return channels;
    }
    var trs = document.getElementById("content_table").getElementsByTagName("TR");
    for (var i = 1; i < trs.length; i++) {
        if (trs[i].style.display != "none") {
            if (trs[i].firstChild.firstChild.checked == true) {
                channels.push(trs[i].id);
            }
        }
    }
    return channels;
}
function selectAllChannels(table_name = "content_table") {
    var bulk = false;
    var trs = document.getElementById(table_name).getElementsByTagName("TR");
    if (trs[0].firstChild.firstChild.checked == true) {
        bulk = true;
    }
    for (var i = 1; i < trs.length; i++) {
        if (trs[i].style.display != "none") {
            switch (bulk) {
                case true:
                    trs[i].firstChild.firstChild.checked = true;
                    break;
                case false:
                    trs[i].firstChild.firstChild.checked = false;
                    break;
            }
        }
    }
    return;
}
function bulkEdit() {
    BULK_EDIT = !BULK_EDIT;
    var className;
    var rows = document.getElementsByClassName("bulk");
    switch (BULK_EDIT) {
        case true:
            className = "bulk showBulk";
            break;
        case false:
            className = "bulk hideBulk";
            break;
    }
    for (var i = 0; i < rows.length; i++) {
        rows[i].className = className;
        rows[i].checked = false;
    }
    return;
}
function sortTable(column, table_name = "content_table") {
    // console.log("COLUMN: " + column);
    if ((column == COLUMN_TO_SORT && table_name == "content_table") || (column == INACTIVE_COLUMN_TO_SORT && table_name == "inactive_content_table")) {
        return;
    }
    var table = document.getElementById(table_name);
    var tableHead = table.getElementsByTagName("TR")[0];
    var tableItems = tableHead.getElementsByTagName("TD");
    var sortObj = new Object();
    var x, xValue;
    var tableHeader;
    var sortByString = false;
    if (column > 0 && COLUMN_TO_SORT > 0 && table_name == "content_table") {
        tableItems[COLUMN_TO_SORT].className = "pointer";
        tableItems[column].className = "sortThis";
    }
    else if (column > 0 && INACTIVE_COLUMN_TO_SORT > 0 && table_name == "inactive_content_table") {
        tableItems[INACTIVE_COLUMN_TO_SORT].className = "pointer";
        tableItems[column].className = "sortThis";
    }
    if (table_name == "content_table") {
        COLUMN_TO_SORT = column;
    }
    else if (table_name == "inactive_content_table") {
        INACTIVE_COLUMN_TO_SORT = column;
    }
    var rows = table.rows;
    if (rows[1] != undefined) {
        tableHeader = rows[0];
        x = rows[1].getElementsByTagName("TD")[column];
        for (i = 1; i < rows.length; i++) {
            x = rows[i].getElementsByTagName("TD")[column];
            switch (x.childNodes[0].tagName.toLowerCase()) {
                case "input":
                    xValue = x.getElementsByTagName("INPUT")[0].value.toLowerCase();
                    break;
                case "p":
                    xValue = x.getElementsByTagName("P")[0].innerText.toLowerCase();
                    break;
                default: console.log(x.childNodes[0].tagName);
            }
            if (xValue == "") {
                xValue = i;
                sortObj[i] = rows[i];
            }
            else {
                switch (isNaN(xValue)) {
                    case false:
                        xValue = parseFloat(xValue);
                        sortObj[xValue] = rows[i];
                        break;
                    case true:
                        sortByString = true;
                        sortObj[xValue.toLowerCase() + i] = rows[i];
                        break;
                }
            }
        }
        while (table.firstChild) {
            table.removeChild(table.firstChild);
        }
        var sortValues = getObjKeys(sortObj);
        if (sortByString == true) {
            if (column == 3) {
                var collator = new Intl.Collator(undefined, { numeric: true, sensitivity: 'base' });
                sortValues.sort(collator.compare);
            }
            else {
                sortValues.sort();
            }
        }
        else {
            function sortFloat(a, b) {
                return a - b;
            }
            sortValues.sort(sortFloat);
        }
        table.appendChild(tableHeader);
        for (var i = 0; i < sortValues.length; i++) {
            table.appendChild(sortObj[sortValues[i]]);
        }
    }
    return;
}
function createSearchObj() {
    SEARCH_MAPPING = new Object();
    var data = SERVER["xepg"]["epgMapping"];
    var channels = getObjKeys(data);
    var channelKeys = ["x-active", "x-channelID", "x-name", "_file.m3u.name", "x-group-title", "x-xmltv-file"];
    channels.forEach(id => {
        channelKeys.forEach(key => {
            if (key == "x-active") {
                switch (data[id][key]) {
                    case true:
                        SEARCH_MAPPING[id] = "online ";
                        break;
                    case false:
                        SEARCH_MAPPING[id] = "offline ";
                        break;
                }
            }
            else {
                if (key == "x-xmltv-file") {
                    var xmltvFile = getValueFromProviderFile(data[id][key], "xmltv", "name");
                    if (xmltvFile != undefined) {
                        SEARCH_MAPPING[id] = SEARCH_MAPPING[id] + xmltvFile + " ";
                    }
                }
                else {
                    SEARCH_MAPPING[id] = SEARCH_MAPPING[id] + data[id][key] + " ";
                }
            }
        });
    });
    return;
}
function enableGroupSelection(selector) {
    var lastcheck = null; // no checkboxes clicked yet
    // get desired checkboxes
    var checkboxes = document.querySelectorAll(selector);
    // loop over checkboxes to add event listener
    Array.prototype.forEach.call(checkboxes, function (cbx, idx) {
        cbx.addEventListener('click', function (evt) {
            // test for shift key, not first checkbox, and not same checkbox
            if (evt.shiftKey && null !== lastcheck && idx !== lastcheck) {
                // get range of checks between last-checkbox and shift-checkbox
                // Math.min/max does our sorting for us
                Array.prototype.slice.call(checkboxes, Math.min(lastcheck, idx), Math.max(lastcheck, idx))
                    // and loop over each
                    .forEach(function (ccbx) {
                    ccbx.checked = true;
                });
            }
            lastcheck = idx; // set this checkbox as last-checked for later
        });
    });
}
function searchInMapping() {
    var searchValue = document.getElementById("searchMapping").value;
    var trs = document.getElementById("content_table").getElementsByTagName("TR");
    for (var i = 1; i < trs.length; ++i) {
        var id = trs[i].getAttribute("id");
        var element = SEARCH_MAPPING[id];
        switch (element.toLowerCase().includes(searchValue.toLowerCase())) {
            case true:
                document.getElementById(id).style.display = "";
                break;
            case false:
                document.getElementById(id).style.display = "none";
                break;
        }
    }
    return;
}
function changeChannelNumbers(elements) {
    var starting_number_element = document.getElementsByName("x-channels-start")[0];
    var elems = elements.split(",");
    var starting_number = parseFloat(starting_number_element.value);
    var data = SERVER["xepg"]["epgMapping"];
    elems.forEach(element => {
        var elem = document.getElementById(element);
        var input = elem.childNodes[1].firstChild;
        input.value = starting_number.toString();
        data[element]["x-channelID"] = starting_number.toString();
        starting_number++;
    });
    if (COLUMN_TO_SORT == 1) {
        COLUMN_TO_SORT = -1;
        sortTable(1);
    }
    if (INACTIVE_COLUMN_TO_SORT == 1) {
        INACTIVE_COLUMN_TO_SORT = -1;
        sortTable(1, "inactive_content_page");
    }
}
function changeChannelNumber(element) {
    var dbID = element.parentNode.parentNode.id;
    var newNumber = parseFloat(element.value);
    var channelNumbers = [];
    var data = SERVER["xepg"]["epgMapping"];
    var channels = getObjKeys(data);
    if (isNaN(newNumber)) {
        alert("{{.alert.invalidChannelNumber}}");
        return;
    }
    channels.forEach(id => {
        var channelNumber = parseFloat(data[id]["x-channelID"]);
        channelNumbers.push(channelNumber);
    });
    for (var i = 0; i < channelNumbers.length; i++) {
        if (channelNumbers.indexOf(newNumber) == -1) {
            break;
        }
        if (Math.floor(newNumber) == newNumber) {
            newNumber = newNumber + 1;
        }
        else {
            newNumber = newNumber + 0.1;
            newNumber.toFixed(1);
            newNumber = Math.round(newNumber * 10) / 10;
        }
    }
    data[dbID]["x-channelID"] = newNumber.toString();
    element.value = newNumber;
    if (COLUMN_TO_SORT == 1) {
        COLUMN_TO_SORT = -1;
        sortTable(1);
    }
    if (INACTIVE_COLUMN_TO_SORT == 1) {
        INACTIVE_COLUMN_TO_SORT = -1;
        sortTable(1, "inactive_content_page");
    }
    return;
}
function backup() {
    var data = new Object();
    console.log("Backup data");
    var cmd = "ThreadfinBackup";
    console.log("SEND TO SERVER");
    console.log(data);
    var server = new Server(cmd);
    server.request(data);
    return;
}
function toggleChannelStatus(id) {
    var element;
    var status;
    if (document.getElementById("active")) {
        var checkbox = document.getElementById("active");
        status = (checkbox).checked;
    }
    var ids = getAllSelectedChannels();
    if (ids.length == 0) {
        ids.push(id);
    }
    ids.forEach(id => {
        var channel = SERVER["xepg"]["epgMapping"][id];
        channel["x-active"] = status;
        switch (channel["x-active"]) {
            case true:
                if (channel["x-xmltv-file"] == "-" || channel["x-mapping"] == "-") {
                    if (BULK_EDIT == false) {
                        // alert(channel["x-name"] + ": Missing XMLTV file / channel")
                        checkbox.checked = true;
                    }
                    channel["x-active"] = true;
                }
                break;
            case false:
                // code...
                break;
        }
        if (channel["x-active"] == false) {
            document.getElementById(id).className = "notActiveEPG";
        }
        else {
            document.getElementById(id).className = "activeEPG";
        }
    });
}
function restore() {
    if (document.getElementById('upload')) {
        document.getElementById('upload').remove();
    }
    var restore = document.createElement("INPUT");
    restore.setAttribute("type", "file");
    restore.setAttribute("class", "notVisible");
    restore.setAttribute("name", "");
    restore.id = "upload";
    document.body.appendChild(restore);
    restore.click();
    restore.onchange = function () {
        var filename = restore.files[0].name;
        var check = confirm("File: " + filename + "\n{{.confirm.restore}}");
        if (check == true) {
            var reader = new FileReader();
            var file = document.querySelector('input[type=file]').files[0];
            if (file) {
                reader.readAsDataURL(file);
                reader.onload = function () {
                    console.log(reader.result);
                    var data = new Object();
                    var cmd = "ThreadfinRestore";
                    data["base64"] = reader.result;
                    var server = new Server(cmd);
                    server.request(data);
                };
            }
            else {
                alert("File could not be loaded");
            }
            restore.remove();
            return;
        }
    };
    return;
}
function uploadLogo() {
    if (document.getElementById('upload')) {
        document.getElementById('upload').remove();
    }
    var upload = document.createElement("INPUT");
    upload.setAttribute("type", "file");
    upload.setAttribute("class", "notVisible");
    upload.setAttribute("name", "");
    upload.id = "upload";
    document.body.appendChild(upload);
    upload.click();
    upload.onblur = function () {
        alert();
    };
    upload.onchange = function () {
        var filename = upload.files[0].name;
        var reader = new FileReader();
        var file = document.querySelector('input[type=file]').files[0];
        if (file) {
            reader.readAsDataURL(file);
            reader.onload = function () {
                console.log(reader.result);
                var data = new Object();
                var cmd = "uploadLogo";
                data["base64"] = reader.result;
                data["filename"] = file.name;
                var server = new Server(cmd);
                server.request(data);
                var updateLogo = document.getElementById('update-icon');
                updateLogo.checked = false;
                updateLogo.className = "changed";
            };
        }
        else {
            alert("File could not be loaded");
        }
        upload.remove();
        return;
    };
}
function checkUndo(key) {
    switch (key) {
        case "epgMapping":
            if (UNDO.hasOwnProperty(key)) {
                SERVER["xepg"][key] = JSON.parse(JSON.stringify(UNDO[key]));
            }
            else {
                UNDO[key] = JSON.parse(JSON.stringify(SERVER["xepg"][key]));
            }
            break;
        default:
            break;
    }
    return;
}
function sortSelect(elem) {
    var tmpAry = [];
    var selectedValue = elem[elem.selectedIndex].value;
    for (var i = 0; i < elem.options.length; i++)
        tmpAry.push(elem.options[i]);
    tmpAry.sort(function (a, b) { return (a.text < b.text) ? -1 : 1; });
    while (elem.options.length > 0)
        elem.options[0] = null;
    var newSelectedIndex = 0;
    for (var i = 0; i < tmpAry.length; i++) {
        elem.options[i] = tmpAry[i];
        if (elem.options[i].value == selectedValue)
            newSelectedIndex = i;
    }
    elem.selectedIndex = newSelectedIndex; // Set new selected index after sorting
    return;
}
function updateLog() {
    console.log("TOKEN");
    var server = new Server("updateLog");
    server.request(new Object());
}
