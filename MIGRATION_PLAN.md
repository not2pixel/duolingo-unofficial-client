# Migration Plan

Source analyzed: `D:\Study Fold ✨\Tài liệu🎓\Duolingo DuoHacker-2026.06.08 (12).user.js`.

The userscript mixes UI, browser hooks, account persistence, automation, and API
helpers in one file. This package extracts only neutral, reusable, read-only API
client concepts.

## Endpoint Inventory

- Web API: `https://www.duolingo.com`
- Users API paths:
  - `/2017-06-30/users/{id}?fields=id,username,fromLanguage,learningLanguage,streak,totalXp,gems,picture,streakData`
  - `/2017-06-30/users/{id}?fields=currentCourse{pathSectioned{units{levels{pathLevelMetadata{skillId},pathLevelClientData{skillId}}}}}`
  - `/2023-05-23/shop-items`
  - `/2023-05-23/users/{id}/privacy-settings?fields=privacySettings`
- Goals API: `https://goals-api.duolingo.com`
  - `/schema?ui_language=en`
  - `/users/{id}/progress?timezone={timezone}&ui_language=en`
  - `/users/{id}/progress/batch`
- Leaderboard API: `https://duolingo-leaderboards-prod.duolingo.com`
  - `/leaderboards/7d9f5dd1-8423-491a-91f2-2532052038ce/users/{id}?client_unlocked=true`
- Stories API: `https://stories.duolingo.com`
  - `/api2/stories/{slug}/complete`

`/progress/batch`, story completion, session creation/update, rewards, shop
purchase, privacy update, and subscription-like shop-item requests are excluded
from high-level modules because they mutate state or support automation.

## Classification Table

| Existing function or section | Current responsibility | Library destination | Include or exclude | Reason |
| --- | --- | --- | --- | --- |
| Userscript metadata `@connect` entries | Lists remote hosts used by the userscript | `src/config.ts` base URL defaults | Include partially | Duolingo API hosts are useful defaults; non-API DuoHacker, GreasyFork, GitHub, font, and asset hosts are excluded. |
| Page-context fetch/XHR hook near top of file | Intercepts and rewrites user, story, Super/Max, and lesson responses | None | Exclude | Response manipulation, subscription spoofing, lesson/story bypass, and monkey-patching are outside a neutral SDK. |
| `_getJwt()` | Reads `jwt_token` from browser cookies | `examples/userscript.ts` only | Exclude from core | Core must not depend on cookies or browser storage. Users can pass a token explicitly or through a provider. |
| `_decodeJwt(t)` | Decodes JWT payload to obtain `sub` | `src/auth/decode-jwt.ts` | Include conceptually | Needed to find current user id; rewritten with safer Base64URL handling and documented as non-verifying. |
| `_buildHdrs(jwt)` | Builds JSON and bearer authorization headers | `src/utils/headers.ts` | Include conceptually | Rewritten without `User-Agent` and with redaction utilities. |
| `_goalHdrs(jwt)` and `_goalHdrsLocal(jwt)` | Builds Goals API headers | `src/utils/headers.ts` | Include conceptually | Goals endpoints use `x-requested-with` and JSON accept headers; token still comes from memory only. |
| `_gm(method, url, data, hdrs)` and `_mqGm(...)` | Wraps `GM_xmlhttpRequest` | `src/transport/*`, `examples/userscript.ts` | Include conceptually | Core gets a transport interface and default fetch transport; GM transport is an example only. |
| `_connect()` user request | Reads token, decodes user id, fetches profile | `DuolingoClient.auth`, `client.users.getCurrent()` | Include conceptually | Read-only profile fetch is reusable; UI state, retries, unsafeWindow assignment, and preloading are excluded. |
| `_renderUser(u)` | Renders profile stats and avatar | None | Exclude | UI-only. |
| `_farmXP(txp)`, `_storyXP(hh)`, `_probeSlug()` | Completes stories to generate XP | None | Exclude | XP farming and fake story completion are prohibited. |
| `_fetchGemRewards()`, `_exploitGemReward()`, `_getGemCount()`, `_farmGems()` | Reads reward bundles and exploits rewards for gems | None | Exclude | Gem farming and reward exploitation are prohibited. |
| `_farmStreak(days)` | Creates/updates sessions to alter streak | None | Exclude | Streak modification is prohibited. |
| `_farmPractice(count)`, `_solveCurrentLesson()` | Automates practice lessons and DOM solving | None | Exclude | Automatic lesson solving and artificial completion are prohibited. |
| `_farmLeague()` read portion | Reads current leaderboard rankings and score gap | `client.leaderboards.getCurrent()` | Include read-only concept | Leaderboard reading is neutral; looped XP farming to reach rank #1 is excluded. |
| `_getGoals()` | Reads Goals API schema | `client.goals.getSchema()` | Include | Read-only schema loading is reusable. |
| `_getProgress()` | Reads Goals API progress | `client.goals.getProgress()` | Include | Read-only progress loading is reusable. |
| `_bruteForceGoals(metrics)`, `_updateGoal(metric, amount, goalId)` | Posts artificial goal progress | None | Exclude | Forced quest completion and artificial goal progress are prohibited. |
| `_farmDailyQuest()` | Calculates missing daily metrics and posts progress | None | Exclude | Automation and forced daily quest completion are prohibited. |
| `_getShopItems()` | Reads shop catalog | `client.shop.listItems()` | Include | Catalog reading is neutral. |
| `_formatItem()` and `_categorizeItem(item)` | UI display labels and icons for shop items | None | Exclude | Presentation-specific; consumers can group items themselves. |
| `_buyShopItem(itemId)` | Posts free/consumed shop-item payload | None | Exclude | Obtaining shop items for free is prohibited. |
| `_loadShop()` | Caches and renders shop items in localStorage/UI | None | Exclude | Core must not use persistent storage or include UI. |
| `_v1FetchSkillId()` | Reads current course path to find a skill id | `client.courses.getCurrent()` | Include read-only concept | Course path reading is neutral; only a minimal normalized field is exposed because upstream shape is unstable. |
| `_v1XP110Once()`, `_v1FarmXP()`, `_v1FarmGems()`, `_v1FarmStreak()` | Creates/updates sessions to farm XP, gems, streak | None | Exclude | State mutation and farming behavior are prohibited. |
| Account manager `_accGetAll()`, `_accSetAll()`, `_accSaveCurrent()`, `_accLogin()` | Stores JWTs in localStorage and writes auth cookies | None | Exclude | Persistent JWT storage, account switching, and cookie writes are prohibited. |
| `_loadMonthlyQuests()` read portion | Reads schema and progress for monthly quest UI | `client.goals.getSchema()`, `client.goals.getProgress()` | Include read-only concept | Useful read-only goal data; UI rendering and claim actions excluded. |
| `_renderMonthlyQuests(...)` | Renders monthly quest cards | None | Exclude | UI-only. |
| `_claimAllMonthly()` | Posts progress batch updates for monthly quests | None | Exclude | Forced monthly quest completion is prohibited. |
| `_getSuperJWT()` and `_activateFreeSuper(...)` | Reads cookie token and posts subscription-like shop item | None | Exclude | Fake/free subscription activation and cookie auth are prohibited. |
| `_getPrivacy()` | Reads privacy settings | Not implemented in 0.1.0 | Defer | Read-only, but outside the requested initial public API. Endpoint is documented for possible future review. |
| `_setPrivacy(hide)` | Patches privacy settings | None | Exclude | Mutation method; high-level modules are read-only in 0.1.0. |
| Version/license update checks | Fetches GreasyFork/GitHub metadata | None | Exclude | Userscript maintenance behavior, not Duolingo API client behavior. |
| UI, CSS, translations, event handlers | Renders DuoHacker interface | None | Exclude | Application-specific UI. |

## Assumptions and Stability Notes

- JWT `sub` is treated as the current user id because the userscript used that
  claim for user, goals, and leaderboard requests.
- Decoding a JWT does not verify its signature.
- The leaderboard UUID was copied from the source and may represent a current
  weekly leaderboard endpoint. It is internal and unstable.
- Goals endpoints are internal and unstable. Only GET schema/progress are
  exposed.
- Course path data is highly nested and unstable. The library returns raw course
  data plus a normalized `firstSkillId` because that is the only stable concept
  the userscript needed.
- Stories endpoints are documented as discovered but no high-level story module
  is provided because the source only used completion mutations.
