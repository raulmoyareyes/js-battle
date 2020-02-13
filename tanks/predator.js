importScripts('lib/tank.js') // eslint-disable-line

function shootDummy(state) {
  const enemy = state.radar.enemy
  if (!enemy) return

  const targetPosition = calculateNextTargetPosition(state, enemy)
  const angleDiff = calculateTargeAngleDiff(state, targetPosition)
  const GUN_TURN = angleDiff * 0.1

  const SHOOT = (store.TIMER % 100 === 0) ? 0.1 : 0

  return { GUN_TURN, SHOOT }
}

function shootAggressive(state) {
  const enemy = state.radar.enemy
  if (!enemy) return

  const targetPosition = calculateNextTargetPosition(state, enemy)
  const angleDiff = calculateTargeAngleDiff(state, targetPosition)
  const GUN_TURN = angleDiff * 0.1

  const distance = calculateTargetDistance(state, enemy)
  const SHOOT = distance < 100 ? 1 : 0.3

  return { GUN_TURN, SHOOT }
}

function calculateNextTargetPosition(state, target) {
  const bulletSpeed = 4
  const distance = Math.distance(state.x, state.y, target.x, target.y)
  const bulletTime = distance / bulletSpeed
  const x = target.x + bulletTime * target.speed * Math.cos(Math.deg2rad(target.angle))
  const y = target.y + bulletTime * target.speed * Math.sin(Math.deg2rad(target.angle))

  return { x, y }
}

function calculateTargeAngleDiff(state, target) {
  const targetAngle = Math.deg.atan2(target.y - state.y, target.x - state.x)
  const gunAngle = Math.deg.normalize(targetAngle - state.angle)

  return Math.deg.normalize(gunAngle - state.gun.angle)
}

function calculateTargetDistance(state, target) {
  return Math.distance(state.x, state.y, target.x, target.y)
}

function scanEnemy(state, control) {
  control.RADAR_TURN = 1

  const enemy = state.radar.enemy
  if (!enemy) return

  const targetAngle = Math.deg.atan2(enemy.y - state.y, enemy.x - state.x)
  const radarAngle = Math.deg.normalize(targetAngle - state.angle)
  const angleDiff = Math.deg.normalize(radarAngle - state.radar.angle)
  control.RADAR_TURN = angleDiff * 0.1
}

function followTarget(state) {
  const enemy = state.radar.enemy
  if (!enemy) return

  const targetAngle = Math.deg.atan2(enemy.y - state.y, enemy.x - state.x)
  const bodyAngleDiff = Math.deg.normalize(targetAngle - state.angle)
  const TURN = 0.5 * bodyAngleDiff

  const targetDistance = calculateTargetDistance(state, enemy)
  const distanceDiff = targetDistance - 150
  const THROTTLE = distanceDiff / 100

  return { TURN, THROTTLE }
}

function moveRandomly(state) {
  const lastMovement = store.LAST_TURN - store.TIMER

  if (lastMovement > 0) return

  const THROTTLE = state.collisions.wall ? -1 : 1
  // const direction = Math.random() * 10 > 5 ? 1 : -1
  // const TURN = 0.5 * Math.deg.normalize(Math.random() * 1000 % 180 - state.angle) * direction

  store.LAST_TURN = store.TIMER + Math.random() * 100

  return { TURN: 0, THROTTLE }
}

function shoot(state, control) {
  const shooting = SHOOT[store.STRATEGY](state)
  if (!shooting) return

  control.SHOOT = shooting.SHOOT
  control.GUN_TURN = shooting.GUN_TURN
}

function move(state, control) {
  const movement = MOVE[store.STRATEGY](state)
  if (!movement) return

  control.TURN = movement.TURN
  control.THROTTLE = movement.THROTTLE
}

const STRATEGIES = {
  PEACEFUL: 'PEACEFUL',
  DESTROYER: 'DESTROYER',
}

const SHOOT = {
  [STRATEGIES.PEACEFUL]: shootDummy,
  [STRATEGIES.DESTROYER]: shootAggressive,
}

const MOVE = {
  [STRATEGIES.PEACEFUL]: moveRandomly,
  [STRATEGIES.DESTROYER]: followTarget,
}

const store = {
  TIMER: 0,
  LAST_TURN: 100,
  STRATEGY: STRATEGIES.PEACEFUL,
}

tank.init((settings, info) => {
  settings.SKIN = 'tiger'
})

tank.loop((state, control) => {
  scanEnemy(state, control)

  shoot(state, control)
  move(state, control)

  // if (state.energy < 80) { store.STRATEGY = STRATEGIES.DESTROYER }
  store.TIMER++

  control.DEBUG = {
    store,
  }
})
