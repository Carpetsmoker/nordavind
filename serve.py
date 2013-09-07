#!/usr/bin/env python3
# encoding:utf-8
#
# http://code.arp242.net/nordavind
#
# Copyright © 2013 Martin Tournoij <martin@arp242.net>
# See below for full copyright
#

import sys, json, os

import cherrypy

import nordavind


def JSONDefault(obj):
	if obj.__class__.__name__ == 'datetime':
		return obj.strftime('%Y-%m-%d %H:%M')


class AgentCooper:
	@cherrypy.expose
	def index():
		nordavind.start()
		return nordavind.template('main.html', {
			'library': nordavind.getLibrary(),
		})


	@cherrypy.expose
	def get_album(albumid):
		nordavind.start()
		return json.dumps(nordavind.getAlbum(albumid),
			default=JSONDefault)


	@cherrypy.expose
	def get_album_by_track(trackid):
		nordavind.start()
		return json.dumps(nordavind.getAlbumByTrack(trackid),
			default=JSONDefault)


	@cherrypy.expose
	def play_track(codec, trackid):
		nordavind.start()

		cherrypy.response.headers['Content-Type'] = 'audio/%s' % codec
		return nordavind.playTrack(codec, trackid)
	play_track._cp_config = {'response.stream': True}


server = '0.0.0.0'
port = 8001

if len(sys.argv) > 1:
	listen = sys.argv[1].split(':')
	server = listen[0]
	if len(listen) > 1:
		port = listen[1]

cherrypy.tools.playTrack_clean = cherrypy.Tool('on_end_request', nordavind.playTrack_clean)
cherrypy.config.update({
	'server.socket_host': server,
	'server.socket_port': port,
})
cherrypy.quickstart(AgentCooper, config={
	'/': {
		'tools.staticdir.root': os.path.dirname(os.path.realpath(sys.argv[0])),
	},
	'/tpl': {
		'tools.staticdir.on': 'True',
		'tools.staticdir.dir': 'tpl',
	},
	'/play-track': {
		'tools.playTrack_clean.on': True,
	}
})


# The MIT License (MIT)
#
# Copyright © 2013 Martin Tournoij
#
# Permission is hereby granted, free of charge, to any person obtaining a copy
# of this software and associated documentation files (the "Software"), to
# deal in the Software without restriction, including without limitation the
# rights to use, copy, modify, merge, publish, distribute, sublicense, and/or
# sell copies of the Software, and to permit persons to whom the Software is
# furnished to do so, subject to the following conditions:
#
# The above copyright notice and this permission notice shall be included in
# all copies or substantial portions of the Software.
#
# The software is provided "as is", without warranty of any kind, express or
# implied, including but not limited to the warranties of merchantability,
# fitness for a particular purpose and noninfringement. In no event shall the
# authors or copyright holders be liable for any claim, damages or other
# liability, whether in an action of contract, tort or otherwise, arising
# from, out of or in connection with the software or the use or other dealings
# in the software.
