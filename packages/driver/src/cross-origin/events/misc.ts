import type { $Cy } from '../../cypress/cy'
import { $Location } from '../../cypress/location'
import * as cors from '@packages/network/lib/cors'

export const handleMiscEvents = (Cypress: Cypress.Cypress, cy: $Cy) => {
  Cypress.on('viewport:changed', (viewport, callbackFn) => {
    Cypress.specBridgeCommunicator.once('viewport:changed:end', () => {
      callbackFn()
    })

    Cypress.specBridgeCommunicator.toPrimary('viewport:changed', viewport)
  })

  Cypress.specBridgeCommunicator.on('sync:state', (state) => {
    cy.state(state)
  })

  // Forward url:changed Message to the primary origin to enable changing the url displayed in the AUT
  // @ts-ignore
  Cypress.on('url:changed', (url) => {
    Cypress.specBridgeCommunicator.toPrimary('url:changed', { url })
  })

  // Listen for any unload events in other origins, if any have unloaded we should also become unstable.
  Cypress.specBridgeCommunicator.on('before:unload', (origin) => {
    // If the unload event originated from this spec bridge, isStable is already being handled.
    if (window.location.origin !== cors.getOriginPolicy(origin)) {
      cy.state('isStable', false)
    }
  })

  Cypress.specBridgeCommunicator.on('window:load', ({ url }) => {
    cy.isStable(true, 'primary onload')

    cy.state('autLocation', $Location.create(url))
    Cypress.action('app:window:load', undefined, url)
    Cypress.emit('internal:window:load', { type: 'same:origin', url })
  })
}
