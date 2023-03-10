const HIDDEN_CONTENT_ID = '#pulsante_nascosto';
const HLS_VIDEO = 'https://cdn.muse.ai/u/Q8kBnK2/353ebb135aac1aa4ba1d2834c1f9556e50fb8a781834375220a8e1b130b7966c/videos/video.mp4'

class Index {
  constructor() {
    this.player = new MediaPlayer('player')
    this.isPlaying = false
    this.webhookUrlsConsumed = []

    window.onload = () => this.init()
  }
  init() {
    this.initPlayer()
    this.onLayerClick()
    this.autoplay()
    this.playPauseVideo()
    this.listenForCurrentTime()
    this.setupLayer()
    this.showShowed()
  }
  async initPlayer() {
    const builder = new MediaBuilder(this.player);
    await builder.configureFromJSON({
      content: [{
        url: HLS_VIDEO,
        autoplay: true,
        controls: {}
      }],
    });
    const units = await builder.mediaUnits()
    this.player.playMediaUnits(units)
    this.player.setMute()
  }
  /**
   * Play/pause video
   */
  autoplay(){
    this.player.setMute(!this.isPlaying)
    this.player[!this.isPlaying ? 'play' : 'pause']()
    this.isPlaying = !this.isPlaying
  }
  /**
   * Handles clicks on overlay
   */
  onLayerClick(){
    this.layer = document
      .querySelector('.layer')

    this.layer
      .addEventListener('click',() => {
        this.player.setCurrentPlaybackTime(
          this.getPlayback()
        )
        this.player.setMute(false)
        this.player.play()
        setTimeout(() => {
          this.setLayerVisibility()
        },300)
      })

    document
      .querySelector('.restart')
      .addEventListener('click',() =>{
        localStorage.setItem('played',0)
        this.layer.click()
      })
  }
  getPlayback(){
    return localStorage.getItem('played') || 0
  }
  /**
   * Show/hide the overlay
   */
  setLayerVisibility(){
    if(this.layer) {
      this.layer.style.display = this.isLayerVisible() ? 'none' : 'block'
      document
      .querySelector('.restart').style.display = this.layer.style.display
      if(this.player.playbackState()==PLAYBACK_STATE.PAUSED && this.player.currentPlaybackTime()>0){
        this.layer.setAttribute('src','./assets/images/disegnocontinua.png')
        document.querySelector('.restart').style.display = 'none'
      }
    }
  }
  /**
   *
   * @returns Tells if the overlay is visible or not
   */
  isLayerVisible(){
    return this.layer.style.display!='none'
  }
  /**
   * Play/pause video when toggling
   */
  playPauseVideo(){
    this.player
      .getEventTracker()
      .emitter
      .on('trackedEvent', (e) => {
        if(e.event == EVENTS.PAUSE){
          setTimeout(() => {
            this.setLayerVisibility()
          },150)
        }
      })
  }
  /**
   * Updates the localStorage with the current time of the playback
   */
  listenForCurrentTime(){
    setInterval(() => {
      if(!this.player.getMute()){
        localStorage.setItem('played',this.player.currentPlaybackTime())
        this.behaveOnPlayTime()
      }
    },1000)
  }
  /**
   * Call a webhook if a threshold is reached
   */
  behaveOnPlayTime(){
    const url = new URLSearchParams(window.location.search)
    const wh_email = url.get('em')



    /**
     * The key is the threshold expressed in seconds
     */
    const playback_threshold = {
      3840: '?email='+wh_email, //webhook + email
    }

    Object.keys(playback_threshold).map((key,i) => {
      if(this.player.currentPlaybackTime()>key) {
        this.showHiddenItem();
        localStorage.setItem('showed',"1")

        if(!wh_email) return
        this.callWebhook(playback_threshold[key])
      }
    })
  }
  /**
   * Sets up the overlay
   */
  setupLayer(){
    const played = localStorage.getItem('played') || 0

    if(played>0){
      this.layer.setAttribute('src','./assets/images/disegnoplay.png')
    }
  }

  showShowed(){
    const show = localStorage.getItem('showed') || 0
    if (show === '1') {
      document.querySelector(HIDDEN_CONTENT_ID).style.display = "block";
      document.querySelector(HIDDEN_CONTENT_ID).style.margin = "0 auto";
      document.querySelector(HIDDEN_CONTENT_ID).style.visibility = "visible";
    }

  }

  showHiddenItem() {
    document.querySelector(HIDDEN_CONTENT_ID).style.display = "block";
    document.querySelector(HIDDEN_CONTENT_ID).style.margin = "0 auto";
    document.querySelector(HIDDEN_CONTENT_ID).style.visibility = "visible";
  }
  /**
   * Calls the webhook url
   */
  callWebhook = (url) => {
    if (this.webhookUrlsConsumed.indexOf(url) != -1) return

    this.webhookUrlsConsumed = [...this.webhookUrlsConsumed, url]
    fetch(url)
  }
}

new Index
