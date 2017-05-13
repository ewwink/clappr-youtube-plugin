var YoutubePlugin = Clappr.Playback.extend({
  name: 'youtube_plugin',
  initialize: function() {
    this.YoutubePluginPlayer(this.options);
    this.render();
  },

  YoutubePluginPlayer: function(options) {
    this.settings = {
      changeCount: 0,
      seekEnabled: true,
      left: ['playpause', 'position', 'duration'],
      'default': ['seekbar'],
      right: ['fullscreen', 'volume', 'hd-indicator']
    };
    Clappr.Mediator.on(Clappr.Events.PLAYER_RESIZE, this.updateSize, this);
    this.embedYoutubeApiScript();
  },

  setupYoutubePlayer: function() {
    var _this = this;
    if (window.YT && window.YT.Player) {
      this.embedYoutubePlayer();
    }
    else {
      this.once(Clappr.Events.PLAYBACK_READY, function() {
        _this.embedYoutubePlayer();
      });
    }
  },

  embedYoutubeApiScript: function() {
    window.YT = null;
    _this3 = this;
    if (document.getElementById('www-widgetapi-script'))
      document.getElementById('www-widgetapi-script').remove();
    var script = document.createElement('script');
    script.setAttribute('type', 'text/javascript');
    script.setAttribute('async', 'async');
    script.setAttribute('src', 'https://www.youtube.com/iframe_api');
    document.body.appendChild(script);
    window.onYouTubeIframeAPIReady = function() {
      return _this3.ready();
    };
  },

  embedYoutubePlayer: function() {
    _this3 = this;
    var playerVars = {
      controls: 0,
      autoplay: 1,
      disablekb: 1,
      enablejsapi: 1,
      iv_load_policy: 3,
      modestbranding: 1,
      showinfo: 0,
      rel: 0,
      html5: 1,
      cc_load_policy: 1
    };
    if (typeof this.options.YoutubeVars === "object") {
      $.each(this.options.YoutubeVars, function(key, value) {
        playerVars[key] = value;
      });
    }
    $.each(playerVars, function(key, value) {
        YOUTUBE_VARIABLES[key] = value;
      });

    YOUTUBE_VARIABLES.id = "yt" + this.cid;
    if (this.options.youtubePlaylist) {
      playerVars.listType = 'playlist';
      playerVars.list = this.options.youtubePlaylist;
    }
    this.player = new YT.Player('yt' + this.cid, {
      videoId: this.options.src,
      playerVars: playerVars,
      width: '100%',
      height: '100%',
      events: {
        onReady: function() {
          return _this3.ready();
        },
        onStateChange: function(event) {
          return _this3.stateChange(event);
        },
        onPlaybackQualityChange: function(event) {
          return _this3.qualityChange(event);
        }
      }
    });
  },

  updateSize: function() {
    if (this.player) this.player.setSize('100%', '100%');
  },

  ready: function() {
    this._ready = true;
    this.trigger(Clappr.Events.PLAYBACK_READY);
    //this.YTMC = new YoutubePluginControl(newoptions);
    //this.YTMC.render();
  },

  qualityChange: function(event) {
    this.trigger(Clappr.Events.PLAYBACK_HIGHDEFINITIONUPDATE, this.isHighDefinitionInUse());
  },

  stateChange: function(event) {
    switch (event.data) {
      case YT.PlayerState.PLAYING:
        {
          this.enableMediaControl();
          var playbackType = this.getPlaybackType();
          if (this._playbackType !== playbackType) {
            this.settings.changeCount++;
            this._playbackType = playbackType;
            this.trigger(Clappr.Events.PLAYBACK_SETTINGSUPDATE);
          }
          this.trigger(Clappr.Events.PLAYBACK_BUFFERFULL);
          this.trigger(Clappr.Events.PLAYBACK_PLAY);
          if (YOUTUBE_VARIABLES.captions) {
            this.player.setOption("captions", "track", {
              "languageCode": YOUTUBE_VARIABLES.languageCode
            });
          }
          console.log('###### Quality Set: ' + YOUTUBE_VARIABLES.rate + ' - player.getPlaybackQuality: ' + this.player.getPlaybackQuality());
          break;
        }
      case YT.PlayerState.PAUSED:
        this.enableMediaControl();
        this.trigger(Clappr.Events.PLAYBACK_PAUSE);
        break;
      case YT.PlayerState.BUFFERING:
        this.trigger(Clappr.Events.PLAYBACK_BUFFERING);
        break;
      case YT.PlayerState.ENDED:
        if (this.options.youtubeShowRelated) {
          this.disableMediaControl();
        }
        else {
          this.trigger(Clappr.Events.PLAYBACK_ENDED);
        }
        break;
      default:
        break;
    }
  },

  play: function() {
    var _this4 = this;

    if (this.player) {
      this._progressTimer = this._progressTimer || setInterval(function() {
        return _this4.progress();
      }, 100);
      this._timeupdateTimer = this._timeupdateTimer || setInterval(function() {
        return _this4.timeupdate();
      }, 100);
      this.player.playVideo();
    }
    else if (this._ready) {
      this.trigger(Clappr.Events.PLAYBACK_BUFFERING);
      this._progressTimer = this._progressTimer || setInterval(function() {
        return _this4.progress();
      }, 100);
      this._timeupdateTimer = this._timeupdateTimer || setInterval(function() {
        return _this4.timeupdate();
      }, 100);
      this.setupYoutubePlayer();
    }
    else {
      this.trigger(Clappr.Events.PLAYBACK_BUFFERING);
      this.listenToOnce(this, Clappr.Events.PLAYBACK_READY, this.play);
    }
  },

  pause: function() {
    clearInterval(this._timeupdateTimer);
    this._timeupdateTimer = null;
    if (this.player) this.player.pauseVideo();
  },

  seek: function(time) {
    if (!this.player) return;
    this.player.seekTo(time);
  },

  seekPercentage: function(percentage) {
    if (!this.player) return;
    var duration = this.player.getDuration();
    var time = percentage * duration / 100;
    this.seekTo(time);
  },

  volume: function(value) {
    if (this.player && this.player.setVolume) this.player.setVolume(value);
  },

  progress: function() {
    if (!this.player || !this.player.getDuration) return;
    var buffered = this.player.getDuration() * this.player.getVideoLoadedFraction();
    this.trigger(Clappr.Events.PLAYBACK_PROGRESS, {
      start: 0,
      current: buffered,
      total: this.player.getDuration()
    });
  },

  timeupdate: function() {
    if (!this.player || !this.player.getDuration) return;
    this.trigger(Clappr.Events.PLAYBACK_TIMEUPDATE, {
      current: this.player.getCurrentTime(),
      total: this.player.getDuration()
    });
  },

  isPlaying: function() {
    if (this.player && this.player.getPlayerState() == YT.PlayerState.PLAYING)
      return true;
    return false;
  },

  isHighDefinitionInUse: function() {
    return this.player && !!this.player.getPlaybackQuality().match(/^hd\d+/);
  },

  getDuration: function() {
    var duration = 0;
    if (this.player) {
      duration = this.player.getDuration();
    }
    return duration;
  },

  getPlaybackType: function() {
    return Clappr.Playback.VOD;
  },

  disableMediaControl: function() {
    this.$el.css({
      'pointer-events': 'auto'
    });
    this.trigger(Clappr.Events.PLAYBACK_MEDIACONTROL_DISABLE);

  },

  enableMediaControl: function() {

    this.$el.css({
      'pointer-events': 'none'
    });
    this.trigger(Clappr.Events.PLAYBACK_MEDIACONTROL_ENABLE);
  },

  subtitleLoaded(evt, data) {
    this.trigger(Events.CONTAINER_LOADEDTEXTTRACK, evt, data)
  },

  render: function() {
    var youtube_html = '<div id="yt' + this.cid + '"></div>';
    var _YoutubePluginCss = ['.clappr-youtube-playback[data-youtube-playback]{position:absolute;height:100%;width:100%;display:block;pointer-events:none'];

    this.$el.html(youtube_html);
    var style = Clappr.Styler.getStyleFor(_YoutubePluginCss, {
      baseUrl: this.options.baseUrl
    });
    this.$el.append(style);

    return this;
  }
});
YoutubePlugin.canPlay = function(source) {
  return true;
};


//// YoutubePluginControl //////////

var DEFAULT_PLAYBACK_RATES = [];
var YOUTUBE_VARIABLES = {
  "captions": false,
  "rate": "auto",
  "languageCode": "en"
};

var YoutubePluginControl = Clappr.UICorePlugin.extend({

  name: 'youtube_plugin_control',
  bindEvents: function() {
    this.listenTo(this.core.mediaControl, Clappr.Events.MEDIACONTROL_CONTAINERCHANGED, this.reload);
    this.listenTo(this.core.mediaControl, Clappr.Events.MEDIACONTROL_RENDERED, this.render);
    this.listenTo(this.core.mediaControl, Clappr.Events.MEDIACONTROL_HIDE, this.hideContextMenu);
    this.listenTo(this.core.mediaControl, Clappr.Events.MEDIACONTROL_PLAYING, this.hideControlPaused);
    this.listenTo(this.core.mediaControl, Clappr.Events.MEDIACONTROL_NOTPLAYING, this.showControlPaused);
    this.listenTo(this.core.mediaControl, YoutubePluginControl.MEDIACONTROL_YOUTUBECONTROL, this.updatePlaybackRate);
  },
  unBindEvents: function() {
    this.stopListening(this.core.mediaControl, Clappr.Events.MEDIACONTROL_CONTAINERCHANGED);
    this.stopListening(this.core.mediaControl, Clappr.Events.MEDIACONTROL_RENDERED);
    this.stopListening(this.core.mediaControl, Clappr.Events.MEDIACONTROL_HIDE);
  },

  reload: function() {
    this.unBindEvents();
    this.bindEvents();
  },
  shouldRender: function() {
    if (!this.core.getCurrentContainer()) {
      return false;
    }

    if (window.YT && window.YT.Player) {
      DEFAULT_PLAYBACK_RATES = [];
      this.ytplayer = YT.get(YOUTUBE_VARIABLES.id);
      var quality = this.ytplayer.getAvailableQualityLevels();
      var qualityDict = {
        "highres": "highres",
        "hd1080": '1080p',
        "hd720": '720p',
        "large": '480p',
        "medium": '360p',
        "small": '240p',
        "tiny": '144p',
        'auto': "Auto"
      };

      for (var i = 0; i < quality.length; i++) {
        DEFAULT_PLAYBACK_RATES.push({
          value: quality[i],
          label: qualityDict[quality[i]]
        });
      }
      return true;
    }

    return false;
  },
  render: function() {
    var cfg = this.core.options.playbackRateConfig || {};   
    if (!this.playbackRates) {

    }
    if (!this.selectedRate) {
      this.selectedRate = YOUTUBE_VARIABLES.rate = "auto";
    }
    if (this.shouldRender()) {
      this.playbackRates = cfg.options || DEFAULT_PLAYBACK_RATES;
      var t = (0, Clappr.template)(this.template());
      var html = t({
        playbackRates: this.playbackRates,
        title: this.getTitle()
      });
      this.$el.html(html);
      var style = Clappr.Styler.getStyleFor(this.templateCSS(), {
        baseUrl: this.core.options.baseUrl
      });
      this.$el.append(style);
      this.core.mediaControl.$('.media-control-right-panel').append(this.el);
      ytoptions = this.ytplayer.getOptions();
      if (ytoptions.indexOf('captions') === -1 && ytoptions.indexOf('cc') === -1) {
        $('#youtube-plugin-cc').css('display', 'none');
      }
      this.updateText();
    }

    return this;
  },
  onRateSelect: function(event) { //console.log('onRateSelect', event.target);
    var rate = event.target.dataset.youtubeControlSelect;
    this.setSelectedRate(rate);
    this.toggleContextMenu();
    event.stopPropagation();
    return false;
  },
  onShowMenu: function(event) {
    this.toggleContextMenu();
  },
  toggleContextMenu: function() {
    this.$('.youtube_plugin_control ul').toggle();
  },
  hideContextMenu: function() {
    this.$('.youtube_plugin_control ul').hide();
  },
  updatePlaybackRate: function(rate) {
    this.setSelectedRate(rate);
  },
  setSelectedRate: function(rate) {
    this.selectedRate = rate;
    var currentTIme = this.ytplayer.getCurrentTime();
    this.ytplayer.stopVideo();
    this.ytplayer.setPlaybackQuality(rate);
    this.ytplayer.playVideo();
    this.ytplayer.seekTo(currentTIme, false);
    this.updateText();
    YOUTUBE_VARIABLES.rate = rate;
  },

  setActiveListItem: function(rateValue) {
    this.$('a').removeClass('active');
    this.$('a[data-youtube-control-select="' + rateValue + '"]').addClass('active');
  },
  buttonElement: function() {
    return this.$('#youtubeQuality');
  },
  getTitle: function() {
    var _this = this;
    var title = this.selectedRate;
    this.playbackRates.forEach(function(r) {
      if (r.value == _this.selectedRate) {
        title = r.label;
      }
    });
    return title;
  },
  updateText: function() {
    this.buttonElement().text(this.getTitle());
    this.setActiveListItem(this.selectedRate);
  },
  template: function() {
    tmpl = "<button id='youtube-plugin-cc'>CC</button><button id='youtubeQuality' data-youtube-control-button>\n  <%= title %>\n</button>\n<ul>\n  <% for (var i = 0; i < playbackRates.length; i++) { %>\n    <li><a href=\"#\" data-youtube-control-select=\"<%= playbackRates[i].value %>\"><%= playbackRates[i].label %></a></li>\n  <% }; %>\n</ul>\n";
    return tmpl;
  },
  templateCSS: function() {
    css = "#youtube-plugin-cc{padding: 0 1px;margin-right: 5px;}\n .youtube_plugin_control[data-youtube-control-select] {\n  float: right;\n  margin-top: 5px;\n  position: relative; }\n  .youtube_plugin_control[data-youtube-control-select] button {\n    background-color: transparent;\n    color: #fff;\n    font-family: Roboto,\"Open Sans\",Arial,sans-serif;\n    -webkit-font-smoothing: antialiased;\n    border: none;\n    font-size: 10px;\n    cursor: pointer; }\n    .youtube_plugin_control[data-youtube-control-select] button:hover {\n      color: #c9c9c9; }\n    .youtube_plugin_control[data-youtube-control-select] button.changing {\n      -webkit-animation: pulse 0.5s infinite alternate; }\n  .youtube_plugin_control[data-youtube-control-select] > ul {\n    display: none;\n    list-style-type: none;\n    position: absolute;\n    bottom: 25px;\n    border: 1px solid black;\n    border-radius: 4px;\n    background-color: rgba(0, 0, 0, 0.7); }\n  .youtube_plugin_control[data-youtube-control-select] li {\n    position: relative;\n    font-size: 10px; }\n    .youtube_plugin_control[data-youtube-control-select] li[data-title] {\n      padding: 5px; }\n    .youtube_plugin_control[data-youtube-control-select] li a {\n      color: #aaa;\n      padding: 2px 10px 2px 15px;\n      display: block;\n      text-decoration: none; }\n      .youtube_plugin_control[data-youtube-control-select] li a.active {\n        background-color: black;\n        font-weight: bold;\n        color: #fff; }\n        .youtube_plugin_control[data-youtube-control-select] li a.active:before {\n          content: '\\2713';\n          position: absolute;\n          top: 2px;\n          left: 4px; }\n      .youtube_plugin_control[data-youtube-control-select] li a:hover {\n        color: #fff;\n        text-decoration: none; }\n\n@-webkit-keyframes pulse {\n  0% {\n    color: #fff; }\n  50% {\n    color: #ff0101; }\n  100% {\n    color: #B80000; } }\n";
    return css;
  },
  attributes: function() {
    return {
      'class': this.name,
      'data-youtube-control-select': ''
    };
  },
  hideControlPaused: function() {
    this.core.mediaControl.keepVisible = false;
  },
  showControlPaused: function() {
    if (this.core.mediaControl.container.isReady)
      this.core.mediaControl.keepVisible = true;
  },
  YTShowCaptions: function() {
    this.ytplayer.setOption("captions", "track", {
      "languageCode": YOUTUBE_VARIABLES.languageCode
    });
    this.$('#youtube-plugin-cc').css({
      'border-bottom': '4px double #fff'
    });
    //this.ytplayer.loadModule('captions');
    YOUTUBE_VARIABLES.captions = true;
  },

  YTHideCaptions: function() {
    this.$('#youtube-plugin-cc').css({
      'border-bottom': 'none'
    });
    this.ytplayer.unloadModule('captions');
    YOUTUBE_VARIABLES.captions = false;
  },

  YTtoggleCaptions: function() {
    if (YOUTUBE_VARIABLES.captions) {
      this.YTHideCaptions();
    }
    else {
      this.YTShowCaptions();
    }
  },
  events: function() {
    return {
      'click [data-youtube-control-select]': 'onRateSelect',
      'click [data-youtube-control-button]': 'onShowMenu',
      'click #youtube-plugin-cc': 'YTtoggleCaptions',
    };
  }
});

YoutubePluginControl.type = 'core';
YoutubePluginControl.MEDIACONTROL_YOUTUBECONTROL = 'youtube_plugin_control';