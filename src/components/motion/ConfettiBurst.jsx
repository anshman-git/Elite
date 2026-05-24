import confetti from 'canvas-confetti';

export function fireConfetti(origin = { x: 0.5, y: 0.5 }) {
  const defaults = { startVelocity: 32, spread: 70, ticks: 80, gravity: 0.9, scalar: 0.9, origin };
  confetti({ ...defaults, particleCount: 60, colors: ['#FFA500', '#FFC233', '#22D3EE', '#34D399'] });
  setTimeout(() => confetti({ ...defaults, particleCount: 40, spread: 100, colors: ['#FFA500', '#FB7185'] }), 120);
}
