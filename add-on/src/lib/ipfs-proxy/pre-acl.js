const defaultRequestAccess = require('./request-access')

// This are the function that DO NOT require an allow/deny decision by the user.
// All other IPFS functions require authorization.
const ACL_WHITELIST = Object.freeze(require('./acl-whitelist.json'))

// Creates a "pre" function that is called prior to calling a real function
// on the IPFS instance. It will throw if access is denied, and ask the user if
// no access decision has been made yet.
function createPreAcl (getState, accessControl, origin, permission, requestAccess = defaultRequestAccess) {
  return async (...args) => {
    // Check if all access to the IPFS node is disabled
    if (!getState().ipfsProxy) throw new Error('User disabled access to IPFS')

    // No need to verify access if permission is on the whitelist
    if (ACL_WHITELIST.includes(permission)) return args

    let access = await accessControl.getAccess(origin, permission)

    if (!access) {
      const { allow } = await requestAccess(origin, permission)
      access = await accessControl.setAccess(origin, permission, allow)
    }

    if (!access.allow) throw new Error(`User denied access to ${permission}`)

    return args
  }
}

module.exports = createPreAcl
