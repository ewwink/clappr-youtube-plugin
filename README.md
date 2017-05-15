# clappr-youtube-plugin
youtube plugin for [Clappr](https://github.com/clappr/clappr/), added options to select playback quality and captions (CC)

## TODO
- Add Playback Speed
- Add Subtitle Translation
- Add Show Hide Annotation
- Add Setting (Gear icon)


## DEMO
https://ewwink.github.io/clappr-youtube-plugin/

```
var playerElement = document.getElementById("player-wrapper");

var ytid = '4hME3n8Lkbs'; // with CC 
//var ytid = '9ZXTBHqG6CA'; // no CC
var player = new Clappr.Player({
  source: ytid,
  poster: 'https://i.ytimg.com/vi/'+ytid+'/hqdefault.jpg',
  height: 360,
  width: 640,
  plugins: [YoutubePlugin, YoutubePluginControl],
  YoutubeVars : {"languageCode":"en"}
});

player.attachTo(playerElement);

```

![clappr-youtube-plugin](https://cloud.githubusercontent.com/assets/760764/26022681/3966469c-37d5-11e7-9670-5cf1c9bd8f22.jpg)
