import { aiCardService } from '../src/modules/cards/services/ai-card-service';
(async () => {
  const stats = await aiCardService.analyzePlayerStats('Buddy Hield');
  console.log(JSON.stringify(stats, null, 2));
  process.exit(0);
})();
