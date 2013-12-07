# We also update the statusbar here for efficiency
window.Player = class Player
	# Which codec will we be using?
	codec: null

	# Easy reference to our <audio> element
	audio: $('audio')[0]

	# Current playing track
	_curplaying:
		trackId: null
		length: 1
		start: 0

	_bufstart: null
	_draggingseekbar: false


	###
	###
	constructor: ->
		@initVolume()
		@initSeekbar()
		@initMouse()
		@initPlayer()


	###
	###
	initMouse: ->
		my = this

		$('#player').on 'click', '.settings', window.showSettings

		$('#player').on 'click', '.play', (e) ->
			if isNaN(my.audio.duration)
				active = $('#playlist .active')
				return window.playlist.playRow active if active.length > 0
				return window.playlist.playRow $('#playlist tbody tr:eq(0)')
			my.audio.play()

		$('#player').on 'click', '.pause', (e) -> my.audio.pause()
		$('#player').on 'click', '.forward', (e) -> my.playNext()
		$('#player').on 'click', '.backward', (e) -> my.playPrev()

		$('#player').on 'click', '.stop', (e) ->
			$('.seekbar .buffer').css 'width', '0px'
			my.audio.pause()
			$('#playlist tr').removeClass 'playing'
			my.audio.src = ''
			$('#player').attr 'class', 'right-of-library stopped'
			store.set 'lasttrack', null
			my._bufstart = null
			$('#status span').html ''
			$('#status span:eq(0)').html 'Stopped'



	###
	###
	initVolume: ->
		my = this

		window.vol = new Slider
			target: $('#player .volume')
			move: (pos) ->
				#v = Math.min 100, pos * 2
				my.setVol pos
				return Math.round pos

		if store.get('volume') isnt null
			my.setVol store.get('volume')
		else
			my.setVol 50


	###
	###
	initSeekbar: ->
		my = this

		@seekbar = new window.Slider
			target: $('#player .seekbar')
			start: -> my._draggingseekbar = true
			move: (pos) ->
				v = my._curplaying.length / 100 * pos
				my.audio.currentTime = v
				return displaytime v
			stop: -> my._draggingseekbar = false

	
	###
	###
	initPlayer: ->
		my = this

		$(@audio).bind 'play', ->
			$('#player').attr 'class', 'right-of-library playing'
			$('#playlist .playing .icon-pause').attr 'class', 'icon-play'

		$(@audio).bind 'pause', ->
			$('#player').attr 'class', 'right-of-library paused'
			$('#playlist .playing .icon-play').attr 'class', 'icon-pause'
			$('#status span:eq(0)').html 'Paused'

		$(@audio).bind 'ended', ->
			$('.seekbar .buffer').css 'width', '0px'
			my._bufstart = null

			if my._curplaying.length > 30
				[track, album, artist] = window.info.getInfo my._curplaying.trackId
				if track
					window.scrobble.scrobble
						#mbid: track.mbid
						timestamp: my._curplaying.start
						artist: artist.name
						album: album.name
						track: track.name
						trackNumber: track.trackno
						duration: track.length

			unless my.playNext()
				$('#player').attr 'class', 'right-of-library stopped'
				store.set 'lasttrack', null
				$('#status span').html ''
				$('#status span:eq(0)').html 'Stopped'

		$(@audio).bind 'timeupdate', (e) ->
			return if my._draggingseekbar
			v = my.audio.currentTime / my._curplaying.length * 100
			my.seekbar.setpos v

			t = displaytime my.audio.currentTime
			$('#status span:eq(0)').html 'Playing'
			$('#status span:eq(1)').html "#{t} / #{displaytime my._curplaying.length}"

		$(@audio).bind 'progress', (e) ->
			try
				c = Math.round(my.audio.buffered.end(0) / my._curplaying.length * 100)
			catch exc
				return

			if c is 100
				$('#status span:eq(2)').html "Buffer #{c}%"
			else
				unless my.bufstart
					my.bufstart = new Date().getTime() / 1000
					return

				dur = (new Date().getTime() / 1000 - my.bufstart)
				r = (dur / c) * (100 - c)

				$('#status span:eq(2)').html "Buffer #{c}% (~#{displaytime Math.round(r)}s remaining)"

		$(@audio).bind 'progress', (e) ->
			try
				v = my.audio.buffered.end(0) / my._curplaying.length * 100
			catch exc
				return
			$('.seekbar .buffer').css 'width', "#{v}%"


	###
	Play audio file `trackId` of `length` seconds
	###
	play: (trackId, length) ->
		if @codec is null
			return alert "Your browser doesn't seem to support either Ogg/Vorbis or MP3 playback"

		@bufstart = null
		@audio.pause()
		@audio.src = ''
		@audio.src = "#{_root}/play-track/#{@codec}/#{trackId}"

		@_curplaying =
			trackId: trackId
			length: length
			start: (new Date().getTime() / 1000).toNum() + new Date().getTimezoneOffset()
		@setVol()
		@audio.play()

		row = $("#playlist tr[data-id=#{trackId}]")
		$('#playlist tr').removeClass 'playing'
		row.addClass('playing').find('td:eq(0)').html '<i class="icon-play"></i>'
		store.set 'lasttrack', trackId

		[track, album, artist] = window.info.getInfo trackId
		if track
			window.scrobble.nowPlaying
				artist: artist.name
				album: album.name
				track: track.name
				trackNumber: track.trackno
				duration: track.length


	###
	Try and play the next track
	###
	playNext: (prev=false) ->
		n = if prev then $('#playlist .playing').prev() else $('#playlist .playing').next()
		$('#playlist .playing').removeClass 'playing'
		if n.length > 0
			window.playlist.playRow n
			return true
		else
			return false


	###
	Try and play the previous track
	###
	playPrev: -> @playNext true


	###
	Set volume in percentage (0-100) & adjust for replaygain
	If the volume is null, we'll set it to the current volume, but re-apply
	replaygain (do this when switching tracks)
	###
	setVol: (v=null) ->
		v = store.get('volume') if v is null
		store.set 'volume', v

		scale = 1
		if @_curplaying.trackId
			rg = false
			apply = store.get 'replaygain'
			if apply is 'album'
				rg = window._cache.albums[window._cache.tracks[@_curplaying.trackId].album].rg_gain
			else if apply is 'track'
				rg = window._cache.tracks[@_curplaying.trackId].rg_gain
			scale = Math.pow(10, rg / 20) if rg

		@audio.volume = v * scale / 100
		window.vol.setpos store.get('volume')
