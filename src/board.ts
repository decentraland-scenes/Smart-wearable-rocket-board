import { Sound } from './sound'
import * as utils from '@dcl/ecs-scene-utils'

export class RocketBoard extends Entity {
  startPos: Vector3
  rocketFlames: Entity
  rocketBoosterSound: Sound
  body: CANNON.Body | null = null
  constructor(startPos: Vector3) {
    super()
    engine.addEntity(this)

    this.startPos = startPos

    this.addComponent(
      new Transform({
        position: startPos,
      })
    )

    this.addComponent(new GLTFShape('models/rocketBoard.glb'))

    this.rocketFlames = new Entity()
    this.rocketFlames.addComponent(
      new Transform({ scale: new Vector3(0, 0, 0) })
    )
    this.rocketFlames.addComponent(new GLTFShape('models/rocketFlames.glb'))
    this.rocketFlames.setParent(this)

    this.rocketBoosterSound = new Sound(
      new AudioClip('sounds/rocketBooster.mp3'),
      true
    )
  }

  // Activate booster animation
  activateRocketBooster(isOn: boolean) {
    if (isOn) {
      this.rocketBoosterSound.getComponent(AudioSource).playing = true
      this.rocketFlames.getComponent(Transform).scale.setAll(1)
    } else {
      this.rocketBoosterSound.getComponent(AudioSource).playing = false
      this.rocketFlames.getComponent(Transform).scale.setAll(0)
    }
  }
  respawn() {
    let newBoardPos = Camera.instance.position.clone().add(new Vector3(3, 3, 0))
    log('new pos to ', newBoardPos)

    if (this.body) {
      this.body.angularVelocity.setZero()
      this.body.velocity = CANNON.Vec3.ZERO
      this.body.position = new CANNON.Vec3(
        newBoardPos.x,
        newBoardPos.y,
        newBoardPos.z
      )
      this.getComponent(Transform).position.copyFrom(this.body.position)
    }
  }

  addOneTimeTrigger() {
    this.addComponent(
      new utils.TriggerComponent(
        new utils.TriggerBoxShape(new Vector3(2, 2, 2), new Vector3(0, 1.5, 0)),
        {
          onCameraEnter: () => {
            this.getComponent(utils.TriggerComponent).enabled = false
            this.removeComponent(utils.TriggerComponent)
          },
        }
      )
    )
  }
}
