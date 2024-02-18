import { extension_settings } from "../../../extensions.js";
import { saveSettingsDebounced } from "../../../../script.js";

import { BrowserSpeechRecognition } from "./bsr.js";

const extensionName = "Browser-Speech-Recognition";
const extensionFolderPath = `scripts/extensions/third-party/${extensionName}`;
const extensionSettings = extension_settings[extensionName];
const defaultSettings = {
	enabled: false,
	language: "",
	activation: "manual",
	autosend: false,
	cmd_stop: "stop recognition",
	cmd_send: "send message",
	cmd_deleteSentence: "delete sentence",
	cmd_deleteAll: "delete all text",
	rep1from: "comma",
	rep1to: ",",
	rep2from: "question mark",
	rep2to: "?",
	rep3from: "exclamation",
	rep3to: "!",
	rep4from: "",
	rep4to: "",
	rep5from: "",
	rep5to: ""
};

async function loadSettings() {
	//Create the settings if they don't exist
	extension_settings[extensionName] = extension_settings[extensionName] || {};
	for(let key in defaultSettings) {
		if(!extension_settings[extensionName].hasOwnProperty(key)) {
			extension_settings[extensionName][key] = defaultSettings[key];
		}
	}

	console.debug("Browser Speech Recognition", "Settings", extension_settings[extensionName]);

	//Updating settings in the UI
	//Checkboxes
	$("#bsr-enabled").prop("checked", extension_settings[extensionName]["enabled"]);
	$("#bsr-autosend").prop("checked", extension_settings[extensionName]["autosend"]);

	//Inputs
	$("#bsr-cmd-stop").val(extension_settings[extensionName]["cmd_stop"]);
	$("#bsr-cmd-sendmsg").val(extension_settings[extensionName]["cmd_send"]);
	$("#bsr-cmd-delsen").val(extension_settings[extensionName]["cmd_deleteSentence"]);
	$("#bsr-cmd-delall").val(extension_settings[extensionName]["cmd_deleteAll"]);

	$("#bsr-rep-1-from").val(extension_settings[extensionName]["rep1from"]);
	$("#bsr-rep-1-to").val(extension_settings[extensionName]["rep1to"]);
	$("#bsr-rep-2-from").val(extension_settings[extensionName]["rep2from"]);
	$("#bsr-rep-2-to").val(extension_settings[extensionName]["rep2to"]);
	$("#bsr-rep-3-from").val(extension_settings[extensionName]["rep3from"]);
	$("#bsr-rep-3-to").val(extension_settings[extensionName]["rep3to"]);
	$("#bsr-rep-4-from").val(extension_settings[extensionName]["rep4from"]);
	$("#bsr-rep-4-to").val(extension_settings[extensionName]["rep4to"]);
	$("#bsr-rep-5-from").val(extension_settings[extensionName]["rep5from"]);
	$("#bsr-rep-5-to").val(extension_settings[extensionName]["rep5to"]);

	//Selects
	$("#bsr-language").val(extension_settings[extensionName]["language"]);
	$("#bsr-activation").val(extension_settings[extensionName]["activation"]);

}

jQuery(async () => {
	const settingsHtml = await $.get(`${extensionFolderPath}/view.html`);
	$("#extensions_settings").append(settingsHtml);

	//Checkboxes
	$("#bsr-enabled").on("change", onCheckBoxSettingChange);
	$("#bsr-autoformat").on("change", onCheckBoxSettingChange);
	$("#bsr-autosend").on("change", onCheckBoxSettingChange);

	//Inputs
	$("#bsr-cmd-stop").on("input", onInputSettingChange);
	$("#bsr-cmd-sendmsg").on("input", onInputSettingChange);
	$("#bsr-cmd-delword").on("input", onInputSettingChange);
	$("#bsr-cmd-delsen").on("input", onInputSettingChange);
	$("#bsr-cmd-delall").on("input", onInputSettingChange);

	$("#bsr-rep-1-from").on("input", onInputSettingChange);
	$("#bsr-rep-1-to").on("input", onInputSettingChange);
	$("#bsr-rep-2-from").on("input", onInputSettingChange);
	$("#bsr-rep-2-to").on("input", onInputSettingChange);
	$("#bsr-rep-3-from").on("input", onInputSettingChange);
	$("#bsr-rep-3-to").on("input", onInputSettingChange);
	$("#bsr-rep-4-from").on("input", onInputSettingChange);
	$("#bsr-rep-4-to").on("input", onInputSettingChange);
	$("#bsr-rep-5-from").on("input", onInputSettingChange);
	$("#bsr-rep-5-to").on("input", onInputSettingChange);

	//Selects
	$("#bsr-language").on("change", onSelectSettingChange);
	$("#bsr-activation").on("change", onSelectSettingChange);

	loadSettings();
    const $button = $("<div id='bsr-mic' class='fa-solid fa-microphone' title='Click to speak'></div>");
    // For versions before 1.10.10
    if ($("#send_but_sheld").length == 0) {
        $("#rightSendForm").prepend($button);
    } else {
        $("#send_but_sheld").prepend($button);
    }
	let bsr = new BrowserSpeechRecognition(() => extension_settings[extensionName], $button);
});

//Managing setting changes
function onCheckBoxSettingChange(event) {
	extension_settings[extensionName][event.target.dataset.setting] = event.target.checked;
	saveSettingsDebounced();
}

function onInputSettingChange(event) {
	extension_settings[extensionName][event.target.dataset.setting] = event.target.value;
	saveSettingsDebounced();
}

function onSelectSettingChange(event) {
	extension_settings[extensionName][event.target.dataset.setting] = event.target.value;
	saveSettingsDebounced();
}