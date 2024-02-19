import { sendMessageAsUser } from '../../../../script.js';
import { getContext } from '../../../extensions.js';
export { BrowserSpeechRecognition };

const DEBUG_PREFIX = "Browser-Speech-Recognition";

class BrowserSpeechRecognition {
	getSettings = null;
	jMicButton = null;
	speechRecognition = null;
    inputArea = null;
    inputAreaInitialText = null;
    forceStop = false;
    sendMsg = false;

	constructor(getSettings, jMicButton) {
		this.getSettings = getSettings;
		this.jMicButton = jMicButton;
		this.inputArea = $("#send_textarea");

		//keyboard changes take priority
		this.inputArea.on("input", (e) => {
			if(this.inputAreaInitialText) {
				this.inputAreaInitialText = this.inputArea.val();
			}
		});

		this.jMicButton.on("click", (e) => {
			if(this.jMicButton.hasClass("listening")) {
				this.forceStop = true;
				this.stopRecognition();
			} else {
				this.forceStop = false;
				this.startRecognition();
			}
		});

		this.initSpeechRecognition();
	}

	initSpeechRecognition() {
		if (!(window.SpeechRecognition || window.webkitSpeechRecognition)) {
			this.jMicButton.hide();
			window.toastr.error(
				"Speech recognition is not supported in this browser.",
				"Speech recognition activation failed",
				{ timeOut: 10000, extendedTimeOut: 20000, preventDuplicates: true }
			);
			return;
		}

		let sr = (window.SpeechRecognition || window.webkitSpeechRecognition);

		this.speechRecognition = new sr();

		this.speechRecognition.continuous = true;
		this.speechRecognition.interimResults = true;
		this.speechRecognition.lang = this.getSettings().language;

		this.speechRecognition.onresult = (speechEvent) => {
			let interimTranscript = "";

			for(let i = speechEvent.resultIndex; i < speechEvent.results.length; i++) {
				let transcript = speechEvent.results[i][0].transcript;

				transcript = this.parseForReplacements(transcript);

				interimTranscript += transcript;

				if(speechEvent.results[i].isFinal) {
					console.debug(DEBUG_PREFIX, "final result", interimTranscript);
					interimTranscript = this.parseForCommands(interimTranscript);
					this.stopRecognition();
				}
				this.processResult(interimTranscript, speechEvent.results[i].isFinal);
			}
		};

		this.speechRecognition.onerror = (speechEvent) => {
            console.error("Browser-Speech-Recognition error:", speechEvent);
		};

		this.speechRecognition.onend = (speechEvent) => {
			this.jMicButton.removeClass("listening");

			if(this.getSettings().activation === "always") {
				this.startRecognition();
			}
		};

		this.speechRecognition.onstart = (speechEvent) => {
			this.jMicButton.addClass("listening");

			//Might not be allowed to start at initial load, needs 1 user input on page
			//this.tinyBoop(true);
			if(this.jMicButton.css("rotate") === "360deg") {
				this.jMicButton.css("rotate", "0deg");
			} else {
				this.jMicButton.css("rotate", "360deg");
			}
		};

		if(this.getSettings().activation === "always") {
			this.startRecognition();
		}
	}

	parseForReplacements(input) {
		let settings = this.getSettings();

		if(settings.rep1from && input.includes(settings.rep1from)) {
			input = input.replaceAll(" " + settings.rep1from, settings.rep1to);
			input = input.replaceAll(settings.rep1from, settings.rep1to);
		}
		if(settings.rep2from && input.includes(settings.rep2from)) {
			input = input.replaceAll(" " + settings.rep2from, settings.rep2to);
			input = input.replaceAll(settings.rep2from, settings.rep2to);
		}
		if(settings.rep3from && input.includes(settings.rep3from)) {
			input = input.replaceAll(" " + settings.rep3from, settings.rep3to);
			input = input.replaceAll(settings.rep3from, settings.rep3to);
		}
		if(settings.rep4from && input.includes(settings.rep4from)) {
			input = input.replaceAll(" " + settings.rep4from, settings.rep4to);
			input = input.replaceAll(settings.rep4from, settings.rep4to);
		}
		if(settings.rep5from && input.includes(settings.rep5from)) {
			input = input.replaceAll(" " + settings.rep5from, settings.rep5to);
			input = input.replaceAll(settings.rep5from, settings.rep5to);
		}

		return input;
	}

	parseForCommands(input) {
		let settings = this.getSettings();
		let txt = input.toLowerCase();

		//Stop recognition command
		if(txt.endsWith(settings.cmd_stop) && settings.cmd_stop) {
			console.debug(DEBUG_PREFIX, "Stop recognition command");
			this.forceStop = true;
			let idx = txt.indexOf(settings.cmd_stop);
			return txt.substring(0, idx).trim();
		}

		//Send command
		if(txt.endsWith(settings.cmd_send) && settings.cmd_send) {
			console.debug(DEBUG_PREFIX, "Send command");
			this.sendMsg = true;
			let idx = txt.indexOf(settings.cmd_send);
			return txt.substring(0, idx).trim();
		}

		//Delete sentence command
		if(txt.endsWith(settings.cmd_deleteSentence) && settings.cmd_deleteSentence) {
			console.debug(DEBUG_PREFIX, "Delete sentence command");
			if(txt === settings.cmd_deleteSentence) {
				//Delete ongoing sentence
				txt = '';
				//Plus delete sentence behind current one (dirty)
				let sentences = this.inputAreaInitialText.split(/[\.\?\!]/).filter(x => x.length > 0).map(x => x.trim());
				this.inputAreaInitialText = sentences.splice(0, sentences.length - 1).join(". ").trim() + ".";
				if(this.inputAreaInitialText.length === 1) {
					this.inputAreaInitialText = ""; //rogue dot
				}
				this.inputArea.val(this.inputAreaInitialText).trigger('input');
			} else {
				//Delete ongoing sentence
				txt = '';
			}
			return txt;
		}

		//Delete all command
		if(txt.endsWith(settings.cmd_deleteAll) && settings.cmd_deleteAll) {
			console.debug(DEBUG_PREFIX, "Delete all command");
			this.inputAreaInitialText = '';
			txt = '';
			this.inputArea.val('').trigger('input');
			return '';
		}

		//No commands found, return original input
		return input;
	}

	formatText(txt) {
		if(txt.length > 0) {
			let capitalised = txt[0].toUpperCase() + txt.substring(1) + ".";
			return capitalised.replaceAll(/([^\w])\./g,"$1"); //remove ?. !. etc
		} else {
			return txt;
		}
	}

	processResult(txt, final) {
		if(this.sendMsg) {
			this.sendMsg = false;
			this.inputArea.val("");
			txt = this.inputAreaInitialText + " " + this.formatText(txt);
			sendMessageAsUser(txt.trim());
        	return getContext().generate();
		}

		if(txt.length > 0) {
			let newTxt = this.inputAreaInitialText + " " + this.formatText(txt);
			this.inputArea.val(newTxt.trim());
		} else {
			this.inputArea.val(this.inputAreaInitialText.trim());
		}

		if(final) {
			this.inputAreaInitialText = this.inputArea.val();
		}
	}

	startRecognition() {
		if(this.forceStop) {
			return;
		}

		this.speechRecognition.start();
		this.inputAreaInitialText = this.inputArea.val();
	}

	stopRecognition() {
		this.speechRecognition.stop();
	}

	tinyBoop(init) {
		return;
		let a = new AudioContext();
		let osc = a.createOscillator();
		let gain = a.createGain();

		osc.connect(gain);
		osc.frequency.value = init ? 100 : 200; //boop freq
		osc.type = "square";

		gain.connect(a.destination);
		gain.gain.value = 0.01; //quiet

		osc.start(a.currentTime);
		osc.stop(a.currentTime + 25*0.001); //25ms duration

		if(init) {
			setTimeout(() => {
				this.tinyBoop();
			}, 65);
		}
	}
}