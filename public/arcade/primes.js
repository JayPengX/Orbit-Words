// 質數: is it a prime? 45 seconds; the numbers grow as you get them right.
import { quiz } from './kit.js';

const isPrime = n => {
  if (n < 2) return false;
  for (let d = 2; d * d <= n; d++) if (n % d === 0) return false;
  return true;
};
export default function primes(api) {
  return quiz(api, {
    seconds: 45,
    ask(level) {
      const max = 30 + Math.round(level * 170);
      // Half primes, half not (never an even number above 2 or one ending in 5: too easy).
      let n;
      const want = api.rand() < 0.5;
      do n = 2 + Math.floor(api.rand() * max);
      while (isPrime(n) !== want || (!want && (n % 2 === 0 || n % 5 === 0) && api.rand() < 0.8));
      return { prompt: api.el('span', { class: 'num', text: String(n) }), choices: [api.L('質數', 'Prime'), api.L('不是', 'Not prime')], answer: isPrime(n) ? 0 : 1 };
    }
  });
}
