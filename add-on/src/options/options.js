'use strict'
/* eslint-env browser, webextensions */

const choo = require('choo')
const optionsPage = require('./page')
const optionsStore = require('./store')

const app = choo()

// Use the store to setup state defaults and event listeners for mutations
app.use(optionsStore)

// Register our single route
app.route('*', optionsPage)

// Start the application and render it to the given querySelector
app.mount('#root')
