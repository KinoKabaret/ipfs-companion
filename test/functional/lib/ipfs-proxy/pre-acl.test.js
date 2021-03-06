'use strict'
const { describe, it, before, after } = require('mocha')
const { expect } = require('chai')
const { URL } = require('url')
const Storage = require('mem-storage-area/Storage')
const Sinon = require('sinon')
const AccessControl = require('../../../../add-on/src/lib/ipfs-proxy/access-control')
const createPreAcl = require('../../../../add-on/src/lib/ipfs-proxy/pre-acl')
const ACL_WHITELIST = require('../../../../add-on/src/lib/ipfs-proxy/acl-whitelist.json')

describe('lib/ipfs-proxy/pre-acl', () => {
  before(() => {
    global.URL = URL
  })

  it('should throw if access is disabled', async () => {
    const getState = () => ({ ipfsProxy: false })
    const accessControl = new AccessControl(new Storage())
    const origin = 'https://ipfs.io'
    const permission = 'files.add'

    const preAcl = createPreAcl(getState, accessControl, origin, permission)

    let error

    try {
      await preAcl()
    } catch (err) {
      error = err
    }

    expect(() => { if (error) throw error }).to.throw('User disabled access to IPFS')
  })

  it('should allow access if permission is on whitelist', async () => {
    const getState = () => ({ ipfsProxy: true })
    const accessControl = new AccessControl(new Storage())
    const origin = 'https://ipfs.io'
    const requestAccess = async () => { throw new Error('Requested access for whitelist permission') }

    let error

    try {
      await Promise.all(ACL_WHITELIST.map(permission => {
        const preAcl = createPreAcl(getState, accessControl, origin, permission, requestAccess)
        return preAcl()
      }))
    } catch (err) {
      error = err
    }

    expect(error).to.equal(undefined)
  })

  it('should request access if no grant exists', async () => {
    const getState = () => ({ ipfsProxy: true })
    const accessControl = new AccessControl(new Storage())
    const origin = 'https://ipfs.io'
    const permission = 'files.add'
    const requestAccess = Sinon.spy(async () => ({ allow: true }))
    const preAcl = createPreAcl(getState, accessControl, origin, permission, requestAccess)

    await preAcl()

    expect(requestAccess.called).to.equal(true)
  })

  it('should deny access when user denies request', async () => {
    const getState = () => ({ ipfsProxy: true })
    const accessControl = new AccessControl(new Storage())
    const origin = 'https://ipfs.io'
    const permission = 'files.add'
    const requestAccess = Sinon.spy(async () => ({ allow: false }))
    const preAcl = createPreAcl(getState, accessControl, origin, permission, requestAccess)

    let error

    try {
      await preAcl()
    } catch (err) {
      error = err
    }

    expect(requestAccess.called).to.equal(true)
    expect(() => { if (error) throw error }).to.throw(`User denied access to ${permission}`)
  })

  it('should not re-request if denied', async () => {
    const getState = () => ({ ipfsProxy: true })
    const accessControl = new AccessControl(new Storage())
    const origin = 'https://ipfs.io'
    const permission = 'files.add'
    const requestAccess = Sinon.spy(async () => ({ allow: false }))
    const preAcl = createPreAcl(getState, accessControl, origin, permission, requestAccess)

    let error

    try {
      await preAcl()
    } catch (err) {
      error = err
    }

    expect(requestAccess.called).to.equal(true)
    expect(() => { if (error) throw error }).to.throw(`User denied access to ${permission}`)

    error = null
    requestAccess.reset()

    try {
      await preAcl()
    } catch (err) {
      error = err
    }

    expect(requestAccess.called).to.equal(false)
    expect(() => { if (error) throw error }).to.throw(`User denied access to ${permission}`)
  })

  it('should not re-request if allowed', async () => {
    const getState = () => ({ ipfsProxy: true })
    const accessControl = new AccessControl(new Storage())
    const origin = 'https://ipfs.io'
    const permission = 'files.add'
    const requestAccess = Sinon.spy(async () => ({ allow: true }))
    const preAcl = createPreAcl(getState, accessControl, origin, permission, requestAccess)

    await preAcl()
    expect(requestAccess.callCount).to.equal(1)

    await preAcl()
    expect(requestAccess.callCount).to.equal(1)
  })

  after(() => {
    delete global.URL
  })
})
