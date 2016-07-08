delete process.env.BROWSER

import Express from 'express'
import React from 'react'
import { match, RouterContext } from 'react-router'
import { createStore } from 'redux'
import ReactDomServer from 'react-dom/server'
import blogStore from './dist/store/blogStore'
import { Provider } from 'react-redux'
import createLocation from 'history/lib/createLocation'
import rootReducer from './dist/reducers'
import AboutMe from './dist/pages/aboutMe/AboutMe'
import routes from './dist/route/routes'
import IndexLayout from './dist/IndexLayout'
import firebase from './dist/services/firebase'

import config from './server/config/production'


const app = Express()
const port = config.port
app.use(Express.static(__dirname + '/public'))

app.use('/diaries/:id', function(req, res) {
    const query = req.query,
        params = req.params,
        completeUrl = req.protocol + '://' + req.get('host') + req.originalUrl

    firebase.database().ref('diaries/' + query.category + '/datas/' + params.id).once('value')
        .then(function(result) {
            const diary = result.val(),
                initialState = {
                    diaries: {
                        diary: diary
                    }
                },
                ogTagParams = {
                    url: completeUrl,
                    type: 'diary',
                    title: diary.title,
                    description: diary.content
                }
            handleRender(req, res, initialState, ogTagParams)
        })
})

app.use('/masterpieces', function(req, res) {
    const query = req.query,
        params = req.params,
        completeUrl = req.protocol + '://' + req.get('host') + req.originalUrl
    firebase.database().ref('paintings').once('value')
        .then(function(result) {
            const paintings = result.val(),
                initialState = {
                    paintings: {
                        paintings: paintings
                    }
                },
                ogTagParams = {
                    url: completeUrl,
                    type: 'paintings',
                    title: "dumdumgenius' paintings",
                    description: "I like paintings, althought I'm not not so well on it."
                        + " But, you cant fall in love with something by no reason, right ?"
                }
            handleRender(req, res, initialState, ogTagParams)
        })
})

app.use('*', function(req, res) {
    const initialState = {},
        ogTagParams = {
            url: "http://dumdumgenius.com",
            type: 'blog',
            title: "DumDumGenius' Blog",
            description: "Welcome to dumdumgenius' blog, it's my first blog, enjoy every thing you see"
                + " and of course, if you have any advice to me, please contact me, the email can be found"
                + " in about me page, thank you, sincerely, Messi Yang"
        }
    handleRender(req, res, initialState, ogTagParams)
})

function handleRender(req, res, initialState, ogTagParams) {

  	const store = createStore(rootReducer, initialState),
  	    location = createLocation(req.originalUrl)

  	match({ routes, location }, function(error, redirectLocation, renderProps) {
    	// if (err) { 
    	//   console.error(err)
    	//   return res.status(500).end('Internal server error')
    	// }
    	if (!renderProps) {
    		return res.status(404).end('Not found.')
    	}
    	
    	const html = ReactDomServer.renderToString(
  			<Provider store={store}>
    			<RouterContext {...renderProps} />
  			</Provider>
    	)

	
  		const initialState = store.getState()

	
  		res.send(renderFullPage(html, initialState, ogTagParams))
	})
}

function renderFullPage(html, initialState, ogTagParams) {
  	return `
  	  	<!doctype html>
  	  	<html>
  	  	  	<head>
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <meta property="og:url" content="${ogTagParams.url}" />
                <meta property="og:type" content="${ogTagParams.type}" />
                <meta property="og:title" content="${ogTagParams.title}" />
                <meta property="og:description" content="${ogTagParams.description}" />
                <meta property="og:image" content="https://firebasestorage.googleapis.com/v0/b/myblog-1decf.appspot.com/o/selfPhoto2.jpg?alt=media" />
                <meta property="og:image:width" content="200" />
                <meta property="og:image:height" content="250" />
  	  	  	 	<title>${ogTagParams.title}</title>
                <style>
                    body {
                        margin: 0px;
                    }
        
                    * {
                        box-sizing: border-box;
                    }
                    
                    a {
                        text-decoration: none;
                        cursor: none;
                    } 
        
                    a:hover {
                    }
                </style>  
  	  	  	</head>
  	  	  	<body>
  	  	  	  	<div id="app">${html}</div>
  	  	  	  	<script>
  	  	  	    	window.__INITIAL_STATE__ = ${JSON.stringify(initialState)}
  	  	  	  	</script>
  	  	  	  	<script src="/main.min.js" charset="utf-8"></script>
  	  	  	</body>
  	  	</html>
  	  	`
}

app.listen(port, function() {
	console.log('Start!')
})