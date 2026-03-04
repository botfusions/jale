import { Skill, SkillContext, SkillResult } from './skill-manager';
import { safeLog, safeError } from '../utils/logger';
import { getEnv } from '../config/env';

export const weatherSkill: Skill = {
  name: 'weather',
  displayName: 'Hava Durumu',
  emoji: '⛅',
  description: 'Belirtilen şehrin güncel hava durumunu gösterir.',
  triggers: ['hava durumu', 'hava nasıl', 'kaç derece', 'sıcaklık', 'weather'],
  enabled: true,
  execute: async (ctx: SkillContext): Promise<SkillResult> => {
    try {
      let city = ctx.userMessage.trim();

      // If the LLM passed a long sentence, try to extract city.
      // But if it's just "Istanbul", use it directly.
      if (city.split(' ').length > 2) {
        let query = city.toLowerCase();
        for (const trigger of weatherSkill.triggers) {
          query = query.replace(new RegExp(trigger, 'gi'), '').trim();
        }
        query = query.replace(/için|da|de|daki|ne|durumu|hava/g, '').trim();
        if (query.length > 1) {
          city = query;
        }
      }

      // Normalize Turkish İ for OpenWeatherMap
      city = city.replace(/İ/g, 'I').replace(/ı/g, 'i');

      safeLog('Weather Skill running', { city });

      // Note: OpenWeatherMap handles city names directly.
      const env = getEnv();
      const apiKey = env.OPENWEATHERMAP_API_KEY;

      if (!apiKey) {
        return {
          text: '⚠️ OpenWeatherMap API anahtarı bulunamadı (.env dosyasına ekleyin).',
          voiceText: 'Hava durumu için API anahtarı eksik.',
        };
      }

      const weatherUrl = `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(city)}&appid=${apiKey}&units=metric&lang=tr`;
      const weatherResponse = await fetch(weatherUrl);

      if (!weatherResponse.ok) {
        if (weatherResponse.status === 404) {
          return {
            text: `🤷‍♂️ "${city}" isminde bir şehir bulamadım. Lütfen şehri daha net yazın.`,
            voiceText: `${city} şehrini bulamadım.`,
          };
        }
        throw new Error(`Weather fetch failed: ${weatherResponse.status}`);
      }

      const data: any = await weatherResponse.json();
      const temp = Math.round(data.main.temp);
      const condition = data.weather[0].description;
      const resolvedCity = data.name;
      const country = data.sys.country;
      const windSpeed = Math.round(data.wind.speed * 3.6); // m/s to km/h

      // Basic emoji mapping based on OpenWeatherMap icon codes
      const icon = data.weather[0].icon;
      let emoji = '🌤️';
      if (icon.startsWith('01')) emoji = '☀️';
      else if (icon.startsWith('02') || icon.startsWith('03') || icon.startsWith('04'))
        emoji = '☁️';
      else if (icon.startsWith('09') || icon.startsWith('10')) emoji = '🌧️';
      else if (icon.startsWith('11')) emoji = '⛈️';
      else if (icon.startsWith('13')) emoji = '❄️';
      else if (icon.startsWith('50')) emoji = '🌫️';

      const text =
        `🌡️ **${resolvedCity}, ${country} Hava Durumu**\n` +
        `Durum: ${emoji} ${condition}\n` +
        `Sıcaklık: **${temp} °C**\n` +
        `Rüzgar: ${windSpeed} km/s`;

      const voiceText = `${resolvedCity} için hava şu anda ${condition} ve sıcaklık ${temp} derece.`;

      return { text, voiceText };
    } catch (error: any) {
      safeError('Weather Skill Error', error);
      return {
        text: `⚠️ Hava durumu bilgisi alınamadı: ${error.message}`,
        voiceText: 'Hava durumunu şu an kontrol edemiyorum.',
      };
    }
  },
};
