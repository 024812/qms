import { systemSettingsRepository } from '../src/lib/repositories/system-settings.repository';
import { aiCardService } from '../src/modules/cards/services/ai-card-service';
(async () => {
  try {
    const tavilyKey = await systemSettingsRepository.getTavilyApiKey();
    console.log('Tavily Key Length:', tavilyKey?.length);

    console.log('1. Fetching Tavily search results...');
    const searchRes = await fetch('https://api.tavily.com/search', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tavilyKey}`,
      },
      body: JSON.stringify({
        query: `Buddy Hield NBA player recent stats game log career stats`,
        search_depth: 'advanced',
        include_raw_content: false,
        max_results: 5,
      }),
    });

    console.log('searchRes.ok:', searchRes.ok, searchRes.status);
    if (!searchRes.ok) {
      console.log(await searchRes.text());
    }
    const searchData = await searchRes.json();
    const searchContext = (searchData.results || []).map((r: any) => r.content).join('\n---\n');
    console.log('Search Context Length:', searchContext.length);

    console.log('2. Fetching Azure OpenAI client...');
    const { client, deployment } = await (aiCardService as any).getClient();
    console.log('Client exists:', !!client, 'Deployment:', deployment);

    console.log('3. Sending to Azure OpenAI...');
    const aiResponse = await client.chat.completions.create({
      model: deployment,
      messages: [
        {
          role: 'system',
          content: `You are a sports data analyst. Extract the player's stats from the provided search context and return ONLY valid JSON.
The JSON must follow this exact schema:
{
  "stats": {"games_played": 1, "ppg": 1, "rpg": 1, "apg": 1, "mpg": 1, "efficiency": 1},
  "game_log": [],
  "season": "2024-25",
  "aiAnalysis": "abc"
}
Rules:
- For ACTIVE players: extract current 2024-25 season stats and last 5 games from context.
- For RETIRED players: use their career averages and last season played. game_log can be empty [].
- aiAnalysis MUST be in Chinese (Simplified).
- Return ONLY the JSON object.`,
        },
        {
          role: 'user',
          content: `Player Name: "Buddy Hield"\n\nSearch Context:\n${searchContext}`,
        },
      ],
      response_format: { type: 'json_object' },
    });

    const choice = aiResponse.choices[0];
    console.log('Azure Choice Array:', JSON.stringify(choice, null, 2));

    const content = choice.message.content;
    console.log('Azure Response Length:', content?.length);
    console.log('Content:', content);
  } catch (e) {
    console.error('Exception caught:', e);
  } finally {
    process.exit(0);
  }
})();
