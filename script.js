var WE_visualizer = (function($, createjs) {

    // Scope defintion to empty object
    var _ = {};

    var transitionAudioData = [];
    var audioData = [];

    var stage;

    var bgContainer = new createjs.Container();

    var bgAudio = new createjs.Shape();
    var bgAudioX, bgAudioY;

    var bgColorClock = new createjs.Shape();
    var bgClockX, bgClockY;

    var bgSpotify = new createjs.Shape();
    var bgSpotifyX, bgSpotifyY;

    var audioContainer = new createjs.Container();
    var spotifyContainer = new createjs.Container();
    var clockContainer = new createjs.Container();

    var offsetX;
    var offsetY;

    var accessToken = '';
    var client_id = '';
    var client_secret = '';
    var redirect_uri = '';
    var refresh_token = ''

    var timeToLive = (new Date()).getTime();
    var refreshPlayingTime = (new Date()).getTime();

    $(document).ready(function() {
        // Initializer WE Visualizer
        init();
    });

    // Initializer function
    var init = function() {

        _.setCanvasSize();

        // Create stage for the canvas with ID '#canvas'
        stage = new createjs.Stage("mainCanvas");
    
        // Performance
        stage.snapToPixel = true;
        stage.snapToPixelEnabled = true;

        audioContainer.snapToPixel = true;
        audioContainer.snapToPixelEnabled = true;
        clockContainer.snapToPixel = true;
        clockContainer.snapToPixelEnabled = true;

        //Main Offsets
        offsetX = stage.canvas.width;
        offsetY = stage.canvas.height;

        _.initBgContainers();

        stage.addChild(clockContainer);
        stage.addChild(audioContainer);
        stage.addChild(spotifyContainer);

        _.bind();

        // Every 'tick' is the 'Frame per Second'
        createjs.Ticker.setFPS(30);
        createjs.Ticker.addEventListener("tick", _.draw);
    }

     function getAccessTokenSpotify(callback) {
        
        const accessTokenBody = new URLSearchParams();
        accessTokenBody.append('client_id', client_id);
        accessTokenBody.append('client_secret', client_secret);
        accessTokenBody.append('grant_type', 'refresh_token');
        accessTokenBody.append('refresh_token', refresh_token);
        const accessTokenHeader = {
            method: 'POST',
            body: JSON.stringify(accessTokenBody)
        }
        fetch('https://accounts.spotify.com/api/token', {method: 'post', body: accessTokenBody})
            .then(response => response.json())
            .then(data => {
                callback(data.access_token);
            })
    }

    function getCurrentlyPlayingSpotify(callback) {
        var obj = {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${accessToken}`
            }
        }

        //console.log(obj);
        fetch('https://api.spotify.com/v1/me/player/currently-playing', obj)
            .then(response => response.status == 200 ? response.json() : {})
            .then(data => {
                callback(data.item);
            })
            .catch()
    }

    _.setCanvasSize = function() {
        var canvas = document.getElementById('mainCanvas');
        context = canvas.getContext('2d');

        // Set canvas width and height attributes to screen resolution
        $("#mainCanvas").attr({
            width: $(document).width(),
            height: $(document).height()
        });
    }

    // Bind events to the visualizer
    _.bind = function() {
        if (window.wallpaperRegisterAudioListener) {

            window.wallpaperRegisterAudioListener(function(data) {
            // data is an array with 128 floats
            audioData = data;

            if (transitionAudioData.length == audioData.length) {
                // Transition fadedSoundData to 
                createjs.Tween.get(transitionAudioData, {
                    override: true
                }).to(audioData, 50);
            } else {
                transitionAudioData = audioData;
            }
            });
        } else {
            setInterval(function() {
                transitionAudioData = [];
                for (x = 0; x < 128; x++) {
                    transitionAudioData.push(Math.random() * 1);
                }
            }, 75);
        }
    }

    _.initBgContainers = function() {
        bgContainer.snapToPixel = true;
        bgContainer.snapToPixelEnabled = true;

        stage.addChild(bgContainer);

        //AUDIO BG COORDS
        bgAudioX = offsetX / 1.27;
        bgAudioY = offsetY / 4;
        //AUDIO BG CREATION
        bgAudio.graphics.beginFill("#48474C");
        bgAudio.graphics.drawRoundRectComplex(bgAudioX, bgAudioY / 2.5, offsetX, bgAudioY, 10, 0, 0, 10);
        bgAudio.graphics.endFill();
        bgAudio.alpha = 0.3;
        bgContainer.addChild(bgAudio);
        //CLOCK BG COORDS
        bgClockX = offsetX / 1.27;
        bgClockY = offsetY / 1.7;
        //CLOCK BG CREATION
        bgColorClock.graphics.beginFill("#48474C");
        bgColorClock.graphics.drawRoundRectComplex(bgClockX, bgClockY / 1.55, offsetX, bgClockY, 10, 0, 0, 10);
        bgColorClock.graphics.endFill();
        bgColorClock.alpha = 0.3;
        bgContainer.addChild(bgColorClock);
        //SPOTIFY PLAYING BG COORDS
        bgSpotifyX = bgAudioX / 3.5;
        bgSpotifyY = bgAudioY / 3;
        //SPOTIFY PLAYING BG CREATION
        bgSpotify.graphics.beginFill("#18191D")
        bgSpotify.graphics.drawRoundRectComplex(bgSpotifyX / 0.28, bgSpotifyY / 0.32, bgSpotifyX / 1.24, bgSpotifyY, 10, 10, 10, 10);
        bgSpotify.graphics.endFill();
        bgSpotify.alpha = 0.7;
        bgContainer.addChild(bgSpotify);
    }

    _.draw = function() {
        // Clear Stage
        audioContainer.removeAllChildren();
        clockContainer.removeAllChildren();

        _.drawAudioVisualizer();
        _.drawSpotify();
        _.drawClock();
    
        // Update the stage ( this is the actual drawing method )
        stage.update();
    }

    _.drawSpotify = function() {
        //Get the access token if there is none or if the time to live is reached
        var currentTime = (new Date()).getTime();
        if (accessToken == '') {
            getAccessTokenSpotify(function(result) {
                accessToken = result;
            });
        } else {
            var time = Math.floor((currentTime-timeToLive)/1000);
            if (time >= 3600) {
                startTime = currentTime;
                getAccessTokenSpotify(function(result) {
                    accessToken = result;
                });
            }
        }

        //Get the currently playing song and displaying it
        time = Math.floor((currentTime-refreshPlayingTime)/1000);
        if (time >= 10) {

            getCurrentlyPlayingSpotify(function(result) {
                var currentlyPlaying = result;

                spotifyContainer.removeAllChildren();

                var songName = currentlyPlaying.name;
                var songArtist = currentlyPlaying.artists[0].name;
                var textSongName = new createjs.Text(songName, "15px Arial", "#8C897A");
                var textSongArtist = new createjs.Text(songArtist, "12px Arial", "#8C897A");
                textSongName.x = bgSpotifyX * 3.6;
                textSongName.y = bgSpotifyY / 0.3;
                textSongArtist.x = textSongName.x;
                textSongArtist.y = textSongName.y / 0.9;

                spotifyContainer.addChild(textSongName);
                spotifyContainer.addChild(textSongArtist);
            });
            refreshPlayingTime = currentTime;

            
        }
    }

    _.drawClock = function() {
        //CLOCK PART
        var clockPosX = bgClockX;
        var clockPosY = bgClockY * 1.05;
        

        var dateClock = new Date();
        var hours = `${('0'+dateClock.getHours()).slice(-2)}:${('0'+dateClock.getMinutes()).slice(-2)}`;
        var textClock = new createjs.Text(hours, "50px Arial", "#8C897A");
        textClock.x = clockPosX / 0.93;
        textClock.y = clockPosY / 1.5;

        var date = `${('0' + (dateClock).getDate()).slice(-2)}.${('0'+((dateClock).getMonth()+1)).slice(-2)}.${(dateClock).getFullYear()}`;
        var textDate = new createjs.Text(date, "15px Arial", "#8C897A");
        textDate.x = textClock.x / 0.98;
        textDate.y = textClock.y / 0.86;

        clockContainer.addChild(textClock);
        clockContainer.addChild(textDate);
    }

    _.drawAudioVisualizer = function() {
        //AUDIO PART
        var spacing = 2; // spacing between lines in pixels
        var lineWidth = 2; // width of lines in pixels
        var lineHeightMultiplier = 50; // multiplier for length * audioValue to pixels
        var color = "#B4123B"; // color string ( rgba(255,0,0,1), #FF0000, red )
    
        var totalWidth = transitionAudioData.length * spacing - spacing;
        var audioPosX = (bgAudioX  - totalWidth) * 1.32;
        var audioPosY = bgAudioY;

        // AUDIO LINES
        for (var x = 0; x < transitionAudioData.length; x+=1) {
    
            // Get audio value from the data set for current position
            var audioValue = transitionAudioData[x];
    
            // Multiply the value in the audio data set with the height multiplier. 
            var lineHeight = audioValue * lineHeightMultiplier;
    
            // Create a new line-shape object
            var line = new createjs.Shape();
    
            // Set the width of the line, and the caps to 'round'
            line.graphics.setStrokeStyle(lineWidth, "square")
    
            // Set the color of the line to 'red'
            line.graphics.beginStroke(color);
    
            // Draw the line from {x,y}, to {x,y}
            line.graphics.moveTo(x * spacing + audioPosX, -lineHeight + audioPosY);
            line.graphics.lineTo(x * spacing + audioPosX, 0 + audioPosY);
    
            // Add the line to the stage
            audioContainer.addChild(line);
        }
    }
})(jQuery, createjs);