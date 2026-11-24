export function drawRopeAim(ctx, sprite, scene, player) {
  const {guard, phase, time} = scene;
  const side = guard.facing === 1 ? 1 : -1;
  const aim = phase === 'aim' ? Math.min(1, time / 0.65) : 1;
  const recoil = phase === 'fall' ? Math.max(0, 1 - time * 8) : 0;
  const firing = phase === 'fall' && time < 0.13;

  ctx.save();
  ctx.translate(guard.x, guard.y + 22);
  ctx.scale(side, 1);
  ctx.drawImage(sprite, 100, 0, 100, 200, -21, -84, 42, 86);
  ctx.translate(1, -40);
  ctx.rotate((1 - aim) * 0.72 - recoil * 0.12);

  // A simplified silhouette of the existing carried prop, pivoting with the guard's hands.
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.strokeStyle = '#17120e';
  ctx.lineWidth = 7;
  ctx.beginPath();
  ctx.moveTo(-10, 3);
  ctx.lineTo(7, 0);
  ctx.lineTo(33, 0);
  ctx.stroke();
  ctx.strokeStyle = '#674c36';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(-9, 3);
  ctx.lineTo(13, 0);
  ctx.stroke();
  ctx.fillStyle = '#aa7651';
  for (const x of [0, 15]) {
    ctx.beginPath();
    ctx.ellipse(x, 3, 3, 2.6, 0, 0, Math.PI * 2);
    ctx.fill();
  }
  if (firing) {
    ctx.fillStyle = '#ffe39f';
    ctx.beginPath();
    ctx.moveTo(34, 0);
    ctx.lineTo(42, -7);
    ctx.lineTo(42, -2);
    ctx.lineTo(50, 0);
    ctx.lineTo(42, 3);
    ctx.lineTo(42, 8);
    ctx.closePath();
    ctx.fill();
  }
  ctx.restore();

  if (firing) {
    ctx.strokeStyle = '#ffe7abbd';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(guard.x + side * 44, guard.y - 17);
    ctx.lineTo(player.x, player.y - 17);
    ctx.stroke();
  }
}

export function drawPipFall(ctx, player, time, drawPip) {
  const progress = Math.min(1, time / 0.55);
  const fall = 1 - (1 - progress) ** 2;
  const foot = player.y + 19;
  ctx.save();
  ctx.translate(player.x, foot);
  ctx.rotate(fall * Math.PI / 2);
  ctx.translate(-player.x, -foot);
  drawPip(ctx, player, 0);
  ctx.restore();

  const spread = Math.min(1, time / 0.35);
  ctx.fillStyle = '#a72b36';
  for (let i = 0; i < 8; i++) {
    const angle = i * 2.39;
    const radius = (13 + i * 4) * spread;
    ctx.beginPath();
    ctx.ellipse(player.x + Math.cos(angle) * radius, foot - 8 + Math.sin(angle) * radius * 0.48,
      2 + i % 3, 1.3 + i % 2, angle, 0, Math.PI * 2);
    ctx.fill();
  }
}
