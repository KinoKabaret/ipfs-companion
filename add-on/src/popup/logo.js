'use strict'
/* eslint-env browser, webextensions */

const html = require('choo/html')
require('./heartbeat.css')

function logo ({ path, size = 52, ipfsNodeType = 'external', isIpfsOnline = true, heartbeat = true }) {
  const logoTypePrefix = ipfsNodeType === 'embedded' ? 'js-' : ''
  const logoFileName = `${logoTypePrefix}ipfs-logo-${isIpfsOnline ? 'on' : 'off'}.svg`
  return html`
    <img
      alt="IPFS"
      title='IPFS'
      src="${path}/${logoFileName}"
      class="${isIpfsOnline && heartbeat ? 'heartbeat' : ''}"
      style="width:${size}px; height:${size}px" />
  `
}

module.exports = logo
