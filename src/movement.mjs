export function stepToward(actor, target, maxDistance) {
  const dx = target.x - actor.x;
  const dy = target.y - actor.y;
  const distance = Math.hypot(dx, dy);
  const step = Math.min(distance, maxDistance);
  const arrived = step === distance;
  return {
    x: arrived ? target.x : actor.x + dx * step / distance,
    y: arrived ? target.y : actor.y + dy * step / distance,
    dx, dy, step, arrived
  };
}
