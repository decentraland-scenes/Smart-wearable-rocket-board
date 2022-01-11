import { Sound } from './sound'
import { RocketBoard } from './board'
import * as ui from '@dcl/ui-scene-utils'

/*
  IMPORTANT: The tsconfig.json has been configured to include "node_modules/cannon/build/cannon.js"
*/

const RING_AMMOUNT = 8

// Create rocket board
let boardPos = Camera.instance.position.clone().add(new Vector3(3, 3, 0))
const rocketBoard = new RocketBoard(boardPos)

// Useful vectors
let forwardVector: Vector3 = Vector3.Forward().rotate(Camera.instance.rotation) // Camera's forward vector
let velocityScale: number = 250

// Setup our world
const world = new CANNON.World()
world.gravity.set(0, -9.82, 0) // m/s²
const groundMaterial = new CANNON.Material('groundMaterial')
const groundContactMaterial = new CANNON.ContactMaterial(
  groundMaterial,
  groundMaterial,
  { friction: 0.5, restitution: 0.33 }
)
world.addContactMaterial(groundContactMaterial)

// Invisible walls
//#region
// const wallShape = new CANNON.Box(new CANNON.Vec3(40, 50, 0.5))
// const wallNorth = new CANNON.Body({
//   mass: 0,
//   shape: wallShape,
//   position: new CANNON.Vec3(40, 49.5, 80),
// })
// world.addBody(wallNorth)

// const wallSouth = new CANNON.Body({
//   mass: 0,
//   shape: wallShape,
//   position: new CANNON.Vec3(40, 49.5, 0),
// })
// world.addBody(wallSouth)

// const wallEast = new CANNON.Body({
//   mass: 0,
//   shape: wallShape,
//   position: new CANNON.Vec3(80, 49.5, 40),
// })
// wallEast.quaternion.setFromAxisAngle(new CANNON.Vec3(0, 1, 0), -Math.PI / 2)
// world.addBody(wallEast)

// const wallWest = new CANNON.Body({
//   mass: 0,
//   shape: wallShape,
//   position: new CANNON.Vec3(0, 49.5, 40),
// })
// wallWest.quaternion.setFromAxisAngle(new CANNON.Vec3(0, 1, 0), -Math.PI / 2)
// world.addBody(wallWest)
//#endregion

// Create a ground plane and apply physics material
const groundBody = new CANNON.Body({ mass: 0 })
groundBody.quaternion.setFromAxisAngle(new CANNON.Vec3(1, 0, 0), -Math.PI / 2) // Reorient ground plane to be in the y-axis

const groundShape: CANNON.Plane = new CANNON.Plane()
groundBody.addShape(groundShape)
groundBody.material = groundMaterial
world.addBody(groundBody)

const boxMaterial = new CANNON.Material('boxMaterial')
// const boxContactMaterial = new CANNON.ContactMaterial(
//   groundMaterial,
//   boxMaterial,
//   { friction: 0.4, restitution: 0 }
// )
// world.addContactMaterial(boxContactMaterial)

// Create body to represent the rocket board
let rocketTransform = rocketBoard.getComponent(Transform)

rocketBoard.body = new CANNON.Body({
  mass: 5, // kg
  position: new CANNON.Vec3(
    rocketTransform.position.x,
    rocketTransform.position.y,
    rocketTransform.position.z
  ), // m
  shape: new CANNON.Box(new CANNON.Vec3(2, 0.1, 2)), // m (Create sphere shaped body with a radius of 1)
})
rocketBoard.body.material = boxMaterial // Add bouncy material to box body
world.addBody(rocketBoard.body) // Add body to the world

const fixedTimeStep: number = 1.0 / 60.0 // seconds
const maxSubSteps: number = 3

class physicsUpdateSystem implements ISystem {
  update(dt: number): void {
    // Instruct the world to perform a single step of simulation.
    // It is generally best to keep the time step and iterations fixed.
    world.step(fixedTimeStep, dt, maxSubSteps)

    if (isFKeyPressed && rocketBoard.body) {
      rocketBoard.body.applyForce(
        new CANNON.Vec3(0, 1 * velocityScale, 0),
        new CANNON.Vec3(
          rocketBoard.body.position.x,
          rocketBoard.body.position.y,
          rocketBoard.body.position.z
        )
      )
    }

    if (isEKeyPressed && rocketBoard.body) {
      rocketBoard.body.applyForce(
        new CANNON.Vec3(
          forwardVector.x * velocityScale,
          0,
          forwardVector.z * velocityScale
        ),
        new CANNON.Vec3(
          rocketBoard.body.position.x,
          rocketBoard.body.position.y,
          rocketBoard.body.position.z
        )
      )
    }

    if (rocketBoard.body) {
      rocketBoard.body.angularVelocity.setZero() // Prevents the board from rotating in any direction

      // Position the rocket board to match that of the rocket body that's affected by physics
      rocketBoard
        .getComponent(Transform)
        .position.copyFrom(rocketBoard.body.position)
      forwardVector = Vector3.Forward().rotate(Camera.instance.rotation) // Update forward vector to wherever the player is facing
    }

    if (gotOnBoard && !flewHigh) {
      if (Camera.instance.position.y > 20) {
        flewHigh = true
      }
    }
  }
}

engine.addSystem(new physicsUpdateSystem())

// Controls (workaround to check if a button is pressed or not)
const input = Input.instance
let isEKeyPressed = false
let isFKeyPressed = false

// E Key
input.subscribe('BUTTON_DOWN', ActionButton.PRIMARY, false, () => {
  rocketBoard.activateRocketBooster((isEKeyPressed = true))
})
input.subscribe('BUTTON_UP', ActionButton.PRIMARY, false, () => {
  isEKeyPressed = false
  if (!isFKeyPressed) {
    rocketBoard.activateRocketBooster(false)
  }
})

// F Key
input.subscribe('BUTTON_DOWN', ActionButton.SECONDARY, false, () => {
  rocketBoard.activateRocketBooster((isFKeyPressed = true))
})
input.subscribe('BUTTON_UP', ActionButton.SECONDARY, false, () => {
  isFKeyPressed = false
  if (!isEKeyPressed) {
    rocketBoard.activateRocketBooster(false)
  }
})

let gotOnBoard: boolean = false
let flewHigh: boolean = false
let didCheckpoints: boolean = false

let summon = new ui.SmallIcon('assets/summon.png', -50, 250, 75, 75, {
  sourceHeight: 128,
  sourceWidth: 128,
})
summon.image.onClick = new OnClick(() => {
  rocketBoard.respawn()
})
