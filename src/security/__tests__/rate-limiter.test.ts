/**
 * Rate Limiter Test
 * Çalıştırmak için: npx ts-node src/security/__tests__/rate-limiter.test.ts
 */

import { RateLimiter } from '../rate-limiter';

async function testRateLimiter() {
  console.log('🧪 Rate Limiter Test Başlıyor...\n');

  // Test rate limiter: 5 istek / 10 saniye
  const limiter = new RateLimiter(5, 10000);
  const testUserId = 'test_user_123';

  console.log('✅ Test 1: Normal istekler (5 adet)');
  for (let i = 1; i <= 5; i++) {
    const result = limiter.checkLimit(testUserId);
    console.log(`  İstek ${i}: allowed=${result.allowed}, remaining=${result.remaining}`);
  }

  console.log('\n✅ Test 2: Limit aşımı denemesi');
  const exceeded = limiter.checkLimit(testUserId);
  console.log(`  İstek 6: allowed=${exceeded.allowed}, remaining=${exceeded.remaining}`);

  if (!exceeded.allowed) {
    const waitSeconds = Math.ceil((exceeded.resetTime - Date.now()) / 1000);
    console.log(`  ⏱️ Bekleme süresi: ${waitSeconds} saniye`);
  }

  console.log('\n✅ Test 3: Reset sonrası istek');
  await new Promise((resolve) => setTimeout(resolve, 100)); // Kısa bekle
  const afterReset = limiter.checkLimit(testUserId);
  console.log(`  Time window sonrası: allowed=${afterReset.allowed}, remaining=${afterReset.remaining}`);

  console.log('\n✅ Test 4: Çoklu kullanıcı');
  const user1 = 'user1';
  const user2 = 'user2';

  limiter.checkLimit(user1);
  limiter.checkLimit(user1);
  limiter.checkLimit(user2);

  console.log(`  User1 istek: ${limiter.checkLimit(user1).remaining} kalan`);
  console.log(`  User2 istek: ${limiter.checkLimit(user2).remaining} kalan`);

  console.log('\n✅ Test 5: İstatistikler');
  const stats = limiter.getStats();
  console.log(`  Toplam kullanıcı: ${stats.totalUsers}`);
  console.log(`  Aktif kullanıcı: ${stats.activeUsers}`);

  console.log('\n🎉 Tüm testler tamamlandı!');
}

// Testi çalıştır
testRateLimiter().catch(console.error);
