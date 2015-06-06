/*
 * Copyright 2014 Steffen Coenen <steffen@steffen-coenen.de>
 *
 * Redistribution and use in source and binary forms, with or without
 * modification, are permitted provided that the following conditions are met: 
 * 
 * 1. Redistributions of source code must retain the above copyright notice, this
 *    list of conditions and the following disclaimer. 
 * 2. Redistributions in binary form must reproduce the above copyright notice,
 *    this list of conditions and the following disclaimer in the documentation
 *    and/or other materials provided with the distribution. 
 * 
 * THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND
 * ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED
 * WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE
 * DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT OWNER OR CONTRIBUTORS BE LIABLE FOR
 * ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES
 * (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES;
 * LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND
 * ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
 * (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS
 * SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
 */

"use strict";

(function(Nuvola)
{

// vars
var DEFAULT_ADDRESS = "http://localhost:9000/";
var ADDRESS = "app.address";
var ADDRESS_DEFAULT = "default";
var ADDRESS_CUSTOM = "custom";
var HOST = "app.host";
var PORT = "app.port";

var WebApp = Nuvola.$WebApp();

// Translations
var _ = Nuvola.Translate.gettext;

// Create media player component
var player = Nuvola.$object(Nuvola.MediaPlayer);

// Home Request
WebApp._onHomePageRequest = function(emitter, result)
{
    result.url = (Nuvola.config.get(ADDRESS) === ADDRESS_CUSTOM)
    ? Nuvola.format("http://{1}:{2}", Nuvola.config.get(HOST), Nuvola.config.get(PORT))
    : DEFAULT_ADDRESS;
}

WebApp._onInitAppRunner = function(emitter)
{
    Nuvola.WebApp._onInitAppRunner.call(this, emitter);

    Nuvola.config.setDefault(ADDRESS, ADDRESS_DEFAULT);
    Nuvola.config.setDefault(HOST, "");
    Nuvola.config.setDefault(PORT, "");

    Nuvola.core.connect("InitializationForm", this);
    Nuvola.core.connect("PreferencesForm", this);
}

WebApp._onInitializationForm = function(emitter, values, entries)
{
    if (!Nuvola.config.hasKey(ADDRESS))
        this.appendPreferences(values, entries);
}

WebApp._onPreferencesForm = function(emitter, values, entries)
{
    this.appendPreferences(values, entries);
}

WebApp.appendPreferences = function(values, entries)
{
    values[ADDRESS] = Nuvola.config.get(ADDRESS);
    values[HOST] = Nuvola.config.get(HOST);
    values[PORT] = Nuvola.config.get(PORT);
    entries.push(["header", _("Logitech Media Server")]);
    entries.push(["label", _("Address of your Logitech Media Server")]);
    entries.push(["option", ADDRESS, ADDRESS_DEFAULT,
        _("use default address ('localhost:9000')"), null, [HOST, PORT]]);
    entries.push(["option", ADDRESS, ADDRESS_CUSTOM,
        _("use custom address"), [HOST, PORT], null]);
    entries.push(["string", HOST, "Host"]);
    entries.push(["string", PORT, "Port"]);
}



// Handy aliases
var PlaybackState = Nuvola.PlaybackState;
var PlayerAction = Nuvola.PlayerAction;

// Create new WebApp prototype
var WebApp = Nuvola.$WebApp();

// Initialization routines
WebApp._onInitWebWorker = function(emitter)
{
    Nuvola.WebApp._onInitWebWorker.call(this, emitter);

    var state = document.readyState;
    if (state === "interactive" || state === "complete")
        this._onPageReady();
    else
        document.addEventListener("DOMContentLoaded", this._onPageReady.bind(this));
}

// Page is ready for magic
WebApp._onPageReady = function()
{
    // Connect handler for signal ActionActivated
    Nuvola.actions.connect("ActionActivated", this);

    // Start update routine
    this.update();
}

// Extract data from the web page
WebApp.update = function()
{
    var track = {}

	var artistDiv = document.getElementById('ctrlCurrentArtist');
	try{
		var artist = artistDiv.firstChild;
		track.artist = artist.innerText || artist.textContent;
	}
	catch (e){
		track.artist = null;
	}

	try{
		var song = document.getElementById('ctrlCurrentTitle').firstChild;
		track.title = song.innerText || song.textContent;
		var songtosplit = song.innerText || song.textContent;
		// Kills track number if there is any one.
		if (songtosplit.indexOf(". ",0) > 0){
			track.title = songtosplit.split(/\.(.+)?/)[1].trim();
		}         
	}
		catch (e){
			track.title = null;
		}

	var albumDiv = document.getElementById('ctrlCurrentAlbum');
	try{
		var album = albumDiv.firstChild;
		track.album = album.innerText || album.textContent;
	}
	catch (e){
		track.album = null;
	} 

	try{
		var album_object = document.getElementById('ctrlCurrentArt').children[0];
		if (album_object.nodeName == 'IMG') {
			track.artLocation = album_object.src;
		}
		else{
			track.artLocation = album_object.children[0].src;
		}       
	}
	catch (e){
		track.artLocation = null;
	} 

	player.setTrack(track);

	player.setCanPause(true)
	player.setCanPlay(true)
	player.setCanGoPrev(true)
	player.setCanGoNext(true)

	var state = PlaybackState.UNKNOWN
	var play_pause = document.getElementById('ext-gen43'); // ? ext-gen42 7.8/7.9
	try {
		var pp_pressed = play_pause.getAttribute("title");
		state = (pp_pressed == "Pause") ? PlaybackState.PLAYING : PlaybackState.PAUSED;
	        }
	catch (e) {
		state = PlaybackState.UNKNOWN
	} 
	





    player.setPlaybackState(state);

    // Schedule the next update
    setTimeout(this.update.bind(this), 500);
}

// Handler of playback actions
WebApp._onActionActivated = function(emitter, name, param)
{
 switch (name)
    {
    case PlayerAction.TOGGLE_PLAY:
		document.getElementById('ext-gen42').click();
	break;
    case PlayerAction.PLAY:
	if (this.state != Nuvola.STATE_PLAYING)
		document.getElementById('ext-gen42').click();
	break;
    case PlayerAction.PAUSE:
		document.getElementById('ext-gen42').click();
	break;
    case PlayerAction.STOP:
		document.getElementById('ext-gen42').click();
	break;
    case PlayerAction.PREV_SONG:
		document.getElementById('ext-gen40').click();
	break;
    case PlayerAction.NEXT_SONG:
		document.getElementById('ext-gen44').click();
	break;
    }
}

WebApp.start();

})(this);  // function(Nuvola)
