export class Sound extends Entity {
  constructor(audio: AudioClip, loop: boolean) {
    super()
    engine.addEntity(this)
    this.addComponent(new AudioSource(audio))
    this.getComponent(AudioSource).loop = loop
    this.addComponent(new Transform())
    this.getComponent(Transform).position = Camera.instance.position // Play the sound wherever the player is standing
  }
}
