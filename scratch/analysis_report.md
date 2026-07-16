# Xakteir App Analysis Report

This report breaks down the real, fake (placeholder), and static components across the Xakteir ecosystem based on code heuristics.

## Directory: `/about\settings`
- ⚪ **page.tsx**: Mostly static UI or standard logic

## Directory: `/about`
- ⚪ **page.tsx**: Mostly static UI or standard logic

## Directory: `/admin\settings`
- ⚪ **page.tsx**: Mostly static UI or standard logic

## Directory: `/admin`
**Status Overview:** 🟢 Real DB Connected | 🟢 API Connected

- 🟢 **page.tsx**: Uses Firebase/Firestore (Real DB), Makes API calls (Real)

## Directory: `/ai-chat\settings`
- ⚪ **page.tsx**: Mostly static UI or standard logic

## Directory: `/ai-chat`
**Status Overview:** 🟢 Real DB Connected

- 🟢 **chat-widgets.tsx**: Uses Firebase/Firestore (Real DB)
- 🟢 **page.tsx**: Uses Firebase/Firestore (Real DB)
- ⚪ **xak-ai-chat-assistant-flow.ts**: Mostly static UI or standard logic

## Directory: `/api\admin\change-password`
**Status Overview:** 🟢 Real DB Connected

- 🟢 **route.ts**: Uses Firebase/Firestore (Real DB)

## Directory: `/api\admin\remove-user`
**Status Overview:** 🟢 Real DB Connected

- 🟢 **route.ts**: Uses Firebase/Firestore (Real DB), Uses env vars

## Directory: `/api\admin\seed`
**Status Overview:** 🟢 Real DB Connected

- 🟢 **route.ts**: Uses Firebase/Firestore (Real DB), Uses env vars

## Directory: `/api\antigravity`
**Status Overview:** 🟢 API Connected

- ⚪ **memory.ts**: Mostly static UI or standard logic
- 🟢 **route.ts**: Makes API calls (Real), Uses env vars

## Directory: `/api\auth\sso`
**Status Overview:** 🟢 Real DB Connected

- 🟢 **route.ts**: Uses Firebase/Firestore (Real DB)

## Directory: `/api\auth\sync`
**Status Overview:** 🟢 Real DB Connected

- 🟢 **route.ts**: Uses Firebase/Firestore (Real DB)

## Directory: `/api\discord\broadcast`
**Status Overview:** 🟢 API Connected

- 🟢 **route.ts**: Makes API calls (Real), Uses env vars

## Directory: `/api\dns\verify`
**Status Overview:** 🟢 Real DB Connected | 🟢 API Connected

- 🟢 **route.ts**: Uses Firebase/Firestore (Real DB), Makes API calls (Real)

## Directory: `/api\domain`
**Status Overview:** 🟢 API Connected

- 🟢 **route.ts**: Makes API calls (Real), Uses env vars

## Directory: `/api\edge\[funcId]`
**Status Overview:** 🟢 Real DB Connected | 🟠 Uses Hardcoded/Mock Data

- 🟡 **route.ts**: Uses Firebase/Firestore (Real DB), Uses Mock/Dummy Data (Fake)

## Directory: `/api\edge-config\[storeId]`
**Status Overview:** 🟢 Real DB Connected

- 🟢 **route.ts**: Uses Firebase/Firestore (Real DB)

## Directory: `/api\email\receive`
**Status Overview:** 🟢 Real DB Connected

- 🟢 **route.ts**: Uses Firebase/Firestore (Real DB)

## Directory: `/api\email\send`
**Status Overview:** 🟢 Real DB Connected

- 🟢 **route.ts**: Uses Firebase/Firestore (Real DB), Uses env vars

## Directory: `/api\flathub\[app_id]`
**Status Overview:** 🟢 API Connected

- 🟢 **route.ts**: Makes API calls (Real)

## Directory: `/api\flathub`
**Status Overview:** 🟢 API Connected

- 🟢 **route.ts**: Makes API calls (Real)

## Directory: `/api\oauth\token`
**Status Overview:** 🟢 Real DB Connected

- 🟢 **route.ts**: Uses Firebase/Firestore (Real DB)

## Directory: `/api\oauth\userinfo`
**Status Overview:** 🟢 Real DB Connected

- 🟢 **route.ts**: Uses Firebase/Firestore (Real DB)

## Directory: `/api\search-images`
**Status Overview:** 🟢 API Connected

- 🟢 **route.ts**: Makes API calls (Real)

## Directory: `/api\search-web`
**Status Overview:** 🟢 API Connected

- 🟢 **route.ts**: Makes API calls (Real), Uses env vars

## Directory: `/api\upload`
- ⚪ **route.ts**: Mostly static UI or standard logic

## Directory: `/api\webhooks\[hookId]`
**Status Overview:** 🟢 Real DB Connected

- 🟢 **route.ts**: Uses Firebase/Firestore (Real DB)

## Directory: `/apps\settings`
- ⚪ **page.tsx**: Mostly static UI or standard logic

## Directory: `/apps`
**Status Overview:** 🟢 Real DB Connected

- 🟢 **page.tsx**: Uses Firebase/Firestore (Real DB)

## Directory: `/archive\settings`
- ⚪ **page.tsx**: Mostly static UI or standard logic

## Directory: `/archive`
**Status Overview:** 🟢 Real DB Connected

- 🟢 **page.tsx**: Uses Firebase/Firestore (Real DB)

## Directory: `/art\settings`
- ⚪ **page.tsx**: Mostly static UI or standard logic

## Directory: `/art`
**Status Overview:** 🟢 Real DB Connected

- 🟢 **page.tsx**: Uses Firebase/Firestore (Real DB)

## Directory: `/auth\add-acct`
- ⚪ **page.tsx**: Mostly static UI or standard logic

## Directory: `/auth\settings`
- ⚪ **page.tsx**: Mostly static UI or standard logic

## Directory: `/auth`
**Status Overview:** 🟢 Real DB Connected | 🟢 API Connected | 🟡 Local State Used

- 🟢 **page.tsx**: Uses Firebase/Firestore (Real DB), Makes API calls (Real), Uses localStorage (Real Client State)

## Directory: `/authenticator\settings`
- ⚪ **page.tsx**: Mostly static UI or standard logic

## Directory: `/authenticator`
**Status Overview:** 🟢 Real DB Connected

- 🟢 **page.tsx**: Uses Firebase/Firestore (Real DB)

## Directory: `/buddy\settings`
- ⚪ **page.tsx**: Mostly static UI or standard logic

## Directory: `/buddy`
**Status Overview:** 🟢 Real DB Connected

- 🟢 **page.tsx**: Uses Firebase/Firestore (Real DB)

## Directory: `/calculator\settings`
- ⚪ **page.tsx**: Mostly static UI or standard logic

## Directory: `/calculator`
- ⚪ **page.tsx**: Mostly static UI or standard logic

## Directory: `/calendar\settings`
- ⚪ **page.tsx**: Mostly static UI or standard logic

## Directory: `/calendar`
**Status Overview:** 🟢 Real DB Connected

- 🟢 **page.tsx**: Uses Firebase/Firestore (Real DB)

## Directory: `/challenge`
- ⚪ **page.tsx**: Mostly static UI or standard logic

## Directory: `/chat\dm\[personName]`
**Status Overview:** 🟢 Real DB Connected | 🟢 API Connected

- 🟢 **page.tsx**: Uses Firebase/Firestore (Real DB), Makes API calls (Real)

## Directory: `/chat\s\[serverName]`
**Status Overview:** 🟢 Real DB Connected | 🟢 API Connected

- 🟢 **page.tsx**: Uses Firebase/Firestore (Real DB), Makes API calls (Real)
- 🟢 **Room3D.tsx**: Uses Firebase/Firestore (Real DB)

## Directory: `/chat`
**Status Overview:** 🟢 Real DB Connected

- 🟢 **layout.tsx**: Uses Firebase/Firestore (Real DB)
- 🟢 **page.tsx**: Uses Firebase/Firestore (Real DB)

## Directory: `/classroom\[classId]\assignments`
**Status Overview:** 🟢 Real DB Connected

- 🟢 **page.tsx**: Uses Firebase/Firestore (Real DB)

## Directory: `/classroom\[classId]\roster`
**Status Overview:** 🟢 Real DB Connected

- 🟢 **page.tsx**: Uses Firebase/Firestore (Real DB)

## Directory: `/classroom\[classId]\submissions`
**Status Overview:** 🟢 Real DB Connected

- 🟢 **page.tsx**: Uses Firebase/Firestore (Real DB)

## Directory: `/classroom\[classId]`
**Status Overview:** 🟢 Real DB Connected

- 🟢 **layout.tsx**: Uses Firebase/Firestore (Real DB)
- 🟢 **page.tsx**: Uses Firebase/Firestore (Real DB)

## Directory: `/classroom`
**Status Overview:** 🟢 Real DB Connected

- 🟢 **page.tsx**: Uses Firebase/Firestore (Real DB)

## Directory: `/code`
- ⚪ **page.tsx**: Mostly static UI or standard logic

## Directory: `/contact\settings`
- ⚪ **page.tsx**: Mostly static UI or standard logic

## Directory: `/contact`
**Status Overview:** 🟢 Real DB Connected

- 🟢 **page.tsx**: Uses Firebase/Firestore (Real DB)

## Directory: `/desktop`
**Status Overview:** 🔴 Has Placeholders

- 🔴 **page.tsx**: Contains "Coming Soon" or similar text (Placeholder)

## Directory: `/dev-centre\auth`
- ⚪ **page.tsx**: Mostly static UI or standard logic

## Directory: `/dev-centre\automate`
**Status Overview:** 🟢 Real DB Connected

- 🟢 **page.tsx**: Uses Firebase/Firestore (Real DB)

## Directory: `/dev-centre\billing`
**Status Overview:** 🟢 Real DB Connected | 🔴 Has Placeholders

- 🟡 **page.tsx**: Uses Firebase/Firestore (Real DB), Contains "Coming Soon" or similar text (Placeholder)

## Directory: `/dev-centre\compute\containers`
**Status Overview:** 🟢 Real DB Connected

- 🟢 **page.tsx**: Uses Firebase/Firestore (Real DB)

## Directory: `/dev-centre\compute\vms`
- ⚪ **page.tsx**: Mostly static UI or standard logic

## Directory: `/dev-centre\crashlytics`
**Status Overview:** 🟢 Real DB Connected

- 🟢 **page.tsx**: Uses Firebase/Firestore (Real DB)

## Directory: `/dev-centre\credentials`
**Status Overview:** 🟢 Real DB Connected

- 🟢 **page.tsx**: Uses Firebase/Firestore (Real DB)

## Directory: `/dev-centre\database`
**Status Overview:** 🟢 Real DB Connected | 🟠 Uses Hardcoded/Mock Data

- 🟡 **page.tsx**: Uses Firebase/Firestore (Real DB), Uses Mock/Dummy Data (Fake)

## Directory: `/dev-centre\edge-config`
**Status Overview:** 🟢 Real DB Connected

- 🟢 **page.tsx**: Uses Firebase/Firestore (Real DB)

## Directory: `/dev-centre\emails`
**Status Overview:** 🟠 Uses Hardcoded/Mock Data

- 🔴 **page.tsx**: Uses Mock/Dummy Data (Fake)

## Directory: `/dev-centre\functions`
- ⚪ **page.tsx**: Mostly static UI or standard logic

## Directory: `/dev-centre\git`
**Status Overview:** 🟢 API Connected

- 🟢 **page.tsx**: Makes API calls (Real)

## Directory: `/dev-centre\monitoring`
**Status Overview:** 🟢 Real DB Connected

- 🟢 **page.tsx**: Uses Firebase/Firestore (Real DB)

## Directory: `/dev-centre\preview`
**Status Overview:** 🟢 Real DB Connected

- 🟢 **page.tsx**: Uses Firebase/Firestore (Real DB)

## Directory: `/dev-centre\sockets`
**Status Overview:** 🟢 Real DB Connected

- 🟢 **page.tsx**: Uses Firebase/Firestore (Real DB)

## Directory: `/dev-centre\storage`
- ⚪ **page.tsx**: Mostly static UI or standard logic

## Directory: `/dev-centre\teams`
- ⚪ **page.tsx**: Mostly static UI or standard logic

## Directory: `/dev-centre\voltra-apps`
**Status Overview:** 🟢 Real DB Connected

- 🟢 **page.tsx**: Uses Firebase/Firestore (Real DB)

## Directory: `/dev-centre\webhooks`
- ⚪ **page.tsx**: Mostly static UI or standard logic

## Directory: `/dev-centre\[...slug]`
**Status Overview:** 🔴 Has Placeholders

- 🔴 **page.tsx**: Contains "Coming Soon" or similar text (Placeholder)

## Directory: `/dev-centre`
**Status Overview:** 🟢 Real DB Connected | 🟡 Local State Used

- 🟢 **layout.tsx**: Uses Firebase/Firestore (Real DB), Uses localStorage (Real Client State)
- 🟢 **page.tsx**: Uses Firebase/Firestore (Real DB)

## Directory: `/dns`
**Status Overview:** 🟢 Real DB Connected

- 🟢 **page.tsx**: Uses Firebase/Firestore (Real DB)

## Directory: `/download-desktop`
- ⚪ **page.tsx**: Mostly static UI or standard logic

## Directory: `/drive\settings`
- ⚪ **page.tsx**: Mostly static UI or standard logic

## Directory: `/drive`
**Status Overview:** 🟢 Real DB Connected | 🟢 API Connected

- 🟢 **page.tsx**: Uses Firebase/Firestore (Real DB), Makes API calls (Real)

## Directory: `/everyworld\components`
**Status Overview:** 🔴 Has Placeholders

- ⚪ **GameScene.tsx**: Mostly static UI or standard logic
- 🔴 **MainMenu.tsx**: Contains "Coming Soon" or similar text (Placeholder)
- ⚪ **ProceduralCharacter.tsx**: Mostly static UI or standard logic

## Directory: `/everyworld`
- ⚪ **page.tsx**: Mostly static UI or standard logic
- ⚪ **store.ts**: Mostly static UI or standard logic

## Directory: `/forms`
- ⚪ **page.tsx**: Mostly static UI or standard logic

## Directory: `/frebgtredtuvotfrspfe7rvfteupdre7bf8repftrefrygf7ei3673e7ewq86rqe9r76vr7982e34r23\antigravity`
**Status Overview:** 🟢 API Connected

- 🟢 **page.tsx**: Makes API calls (Real)

## Directory: `/games\code-arena`
**Status Overview:** 🟢 Real DB Connected

- 🟢 **page.tsx**: Uses Firebase/Firestore (Real DB)

## Directory: `/games\components`
**Status Overview:** 🟢 Real DB Connected | 🟠 Uses Hardcoded/Mock Data

- ⚪ **AimGame.tsx**: Mostly static UI or standard logic
- ⚪ **BalanceGame.tsx**: Mostly static UI or standard logic
- ⚪ **BasketballGame.tsx**: Mostly static UI or standard logic
- ⚪ **BreakerGame.tsx**: Mostly static UI or standard logic
- ⚪ **BubbleGame.tsx**: Mostly static UI or standard logic
- ⚪ **ClickerGame.tsx**: Mostly static UI or standard logic
- ⚪ **ClickSpeedGame.tsx**: Mostly static UI or standard logic
- ⚪ **ColorMatchGame.tsx**: Likely uses hardcoded array data (Static/Fake), Mostly static UI or standard logic
- ⚪ **ConnectFourGame.tsx**: Mostly static UI or standard logic
- ⚪ **DodgeGame.tsx**: Mostly static UI or standard logic
- ⚪ **DrawingGame.tsx**: Mostly static UI or standard logic
- ⚪ **FishingGame.tsx**: Mostly static UI or standard logic
- ⚪ **FlappyGame.tsx**: Mostly static UI or standard logic
- ⚪ **Football3DGame.tsx**: Mostly static UI or standard logic
- ⚪ **FroggerGame.tsx**: Mostly static UI or standard logic
- ⚪ **GolfGame.tsx**: Mostly static UI or standard logic
- ⚪ **GravityGame.tsx**: Mostly static UI or standard logic
- ⚪ **InvadersGame.tsx**: Mostly static UI or standard logic
- ⚪ **JumpGame.tsx**: Mostly static UI or standard logic
- ⚪ **KnifeGame.tsx**: Mostly static UI or standard logic
- ⚪ **Match3Game.tsx**: Mostly static UI or standard logic
- ⚪ **MathGame.tsx**: Mostly static UI or standard logic
- ⚪ **MazeGame.tsx**: Mostly static UI or standard logic
- ⚪ **MemoryGame.tsx**: Mostly static UI or standard logic
- ⚪ **MinesweeperGame.tsx**: Mostly static UI or standard logic
- ⚪ **PaintGame.tsx**: Mostly static UI or standard logic
- ⚪ **ParkingGame.tsx**: Mostly static UI or standard logic
- ⚪ **PinballGame.tsx**: Mostly static UI or standard logic
- ⚪ **PlinkoGame.tsx**: Mostly static UI or standard logic
- ⚪ **PongGame.tsx**: Mostly static UI or standard logic
- ⚪ **ReactionGame.tsx**: Mostly static UI or standard logic
- ⚪ **RPSGame.tsx**: Mostly static UI or standard logic
- ⚪ **SequenceGame.tsx**: Mostly static UI or standard logic
- ⚪ **SnakeGame.tsx**: Mostly static UI or standard logic
- ⚪ **SpinWheelGame.tsx**: Mostly static UI or standard logic
- ⚪ **StackGame.tsx**: Mostly static UI or standard logic
- ⚪ **SudokuGame.tsx**: Mostly static UI or standard logic
- ⚪ **TicTacToeGame.tsx**: Mostly static UI or standard logic
- ⚪ **TowerDefenseGame.tsx**: Mostly static UI or standard logic
- ⚪ **TriviaGame.tsx**: Likely uses hardcoded array data (Static/Fake), Mostly static UI or standard logic
- ⚪ **Tunnel3DGame.tsx**: Mostly static UI or standard logic
- ⚪ **TwoZeroFourEightGame.tsx**: Mostly static UI or standard logic
- ⚪ **TypingGame.tsx**: Mostly static UI or standard logic
- ⚪ **WhackGame.tsx**: Mostly static UI or standard logic
- ⚪ **WordGame.tsx**: Mostly static UI or standard logic
- 🟢 **XbrGame.tsx**: Uses Firebase/Firestore (Real DB)

## Directory: `/games\neural_defense`
- ⚪ **page.tsx**: Mostly static UI or standard logic

## Directory: `/games\play\[id]`
**Status Overview:** 🟢 Real DB Connected

- 🟢 **page.tsx**: Uses Firebase/Firestore (Real DB)

## Directory: `/games\retro`
- ⚪ **page.tsx**: Mostly static UI or standard logic

## Directory: `/games\store`
**Status Overview:** 🟢 Real DB Connected | 🟡 Local State Used

- 🟢 **page.tsx**: Uses Firebase/Firestore (Real DB), Uses localStorage (Real Client State)

## Directory: `/games\studio`
**Status Overview:** 🟢 Real DB Connected

- 🟢 **page.tsx**: Uses Firebase/Firestore (Real DB)

## Directory: `/games`
**Status Overview:** 🟢 Real DB Connected | 🟡 Local State Used

- 🟢 **page.tsx**: Uses Firebase/Firestore (Real DB), Uses localStorage (Real Client State)

## Directory: `/installer\settings`
- ⚪ **page.tsx**: Mostly static UI or standard logic

## Directory: `/installer`
**Status Overview:** 🟡 Local State Used

- ⚪ **layout.tsx**: Mostly static UI or standard logic
- 🟢 **page.tsx**: Uses localStorage (Real Client State)

## Directory: `/learn-pro\settings`
- ⚪ **page.tsx**: Mostly static UI or standard logic

## Directory: `/learn-pro`
**Status Overview:** 🟢 Real DB Connected

- 🟢 **page.tsx**: Uses Firebase/Firestore (Real DB)

## Directory: `/mail\settings`
- ⚪ **page.tsx**: Mostly static UI or standard logic

## Directory: `/mail`
**Status Overview:** 🟢 Real DB Connected | 🟢 API Connected | 🟡 Local State Used | 🔴 Has Placeholders | 🟠 Uses Hardcoded/Mock Data

- 🟡 **page.tsx**: Uses Firebase/Firestore (Real DB), Makes API calls (Real), Uses localStorage (Real Client State), Contains "Coming Soon" or similar text (Placeholder), Uses Mock/Dummy Data (Fake)

## Directory: `/map\settings`
- ⚪ **page.tsx**: Mostly static UI or standard logic

## Directory: `/map`
**Status Overview:** 🟢 Real DB Connected | 🟢 API Connected

- 🟢 **page.tsx**: Uses Firebase/Firestore (Real DB), Makes API calls (Real), Uses env vars

## Directory: `/meet\settings`
- ⚪ **page.tsx**: Mostly static UI or standard logic

## Directory: `/meet\[roomId]`
**Status Overview:** 🟢 Real DB Connected

- 🟢 **page.tsx**: Uses Firebase/Firestore (Real DB)

## Directory: `/meet`
**Status Overview:** 🟢 Real DB Connected

- 🟢 **page.tsx**: Uses Firebase/Firestore (Real DB)

## Directory: `/microdimension\components`
**Status Overview:** 🟠 Uses Hardcoded/Mock Data

- 🔴 **EditorUI.tsx**: Uses Mock/Dummy Data (Fake)
- ⚪ **SceneCanvas.tsx**: Mostly static UI or standard logic
- ⚪ **SceneState.tsx**: Mostly static UI or standard logic

## Directory: `/microdimension`
- ⚪ **layout.tsx**: Mostly static UI or standard logic
- ⚪ **page.tsx**: Mostly static UI or standard logic

## Directory: `/mini-player`
- ⚪ **page.tsx**: Mostly static UI or standard logic

## Directory: `/news\settings`
- ⚪ **page.tsx**: Mostly static UI or standard logic

## Directory: `/news`
**Status Overview:** 🟢 Real DB Connected

- 🟢 **page.tsx**: Uses Firebase/Firestore (Real DB)

## Directory: `/notes\settings`
- ⚪ **page.tsx**: Mostly static UI or standard logic

## Directory: `/notes`
**Status Overview:** 🟢 Real DB Connected

- 🟢 **page.tsx**: Uses Firebase/Firestore (Real DB)

## Directory: `/notifications\settings`
- ⚪ **page.tsx**: Mostly static UI or standard logic

## Directory: `/notifications`
**Status Overview:** 🟢 Real DB Connected

- 🟢 **page.tsx**: Uses Firebase/Firestore (Real DB)

## Directory: `/oauth\authorize`
**Status Overview:** 🟢 Real DB Connected | 🟠 Uses Hardcoded/Mock Data

- 🟡 **page.tsx**: Uses Firebase/Firestore (Real DB), Uses Mock/Dummy Data (Fake)

## Directory: `/overlay`
- ⚪ **page.tsx**: Mostly static UI or standard logic

## Directory: `/pics\private`
**Status Overview:** 🟢 Real DB Connected

- 🟢 **page.tsx**: Uses Firebase/Firestore (Real DB)

## Directory: `/pics\settings`
- ⚪ **page.tsx**: Mostly static UI or standard logic

## Directory: `/pics`
**Status Overview:** 🟢 Real DB Connected | 🟠 Uses Hardcoded/Mock Data

- 🟡 **page.tsx**: Uses Firebase/Firestore (Real DB), Uses Mock/Dummy Data (Fake)

## Directory: `/privacy\settings`
- ⚪ **page.tsx**: Mostly static UI or standard logic

## Directory: `/privacy`
- ⚪ **page.tsx**: Mostly static UI or standard logic

## Directory: `/profile\security`
**Status Overview:** 🟢 Real DB Connected

- 🟢 **page.tsx**: Uses Firebase/Firestore (Real DB)

## Directory: `/profile`
**Status Overview:** 🟢 Real DB Connected

- 🟢 **page.tsx**: Uses Firebase/Firestore (Real DB)

## Directory: `/projects\[projectName]`
**Status Overview:** 🟢 Real DB Connected

- 🟢 **page.tsx**: Uses Firebase/Firestore (Real DB)

## Directory: `/quick-reply`
**Status Overview:** 🟢 Real DB Connected

- 🟢 **page.tsx**: Uses Firebase/Firestore (Real DB)

## Directory: `/rietkax\settings`
- ⚪ **page.tsx**: Mostly static UI or standard logic

## Directory: `/rietkax`
- ⚪ **layout.tsx**: Mostly static UI or standard logic
- ⚪ **page.tsx**: Mostly static UI or standard logic

## Directory: `/search\settings`
**Status Overview:** 🟡 Local State Used

- 🟢 **page.tsx**: Uses localStorage (Real Client State)

## Directory: `/search`
**Status Overview:** 🟢 Real DB Connected | 🟢 API Connected | 🟡 Local State Used | 🟠 Uses Hardcoded/Mock Data

- 🟢 **actions.ts**: Makes API calls (Real)
- 🟡 **page.tsx**: Uses Firebase/Firestore (Real DB), Makes API calls (Real), Uses localStorage (Real Client State), Uses Mock/Dummy Data (Fake)

## Directory: `/search-console\settings`
- ⚪ **page.tsx**: Mostly static UI or standard logic

## Directory: `/search-console`
**Status Overview:** 🟢 Real DB Connected

- 🟢 **page.tsx**: Uses Firebase/Firestore (Real DB)

## Directory: `/sheets`
- ⚪ **page.tsx**: Mostly static UI or standard logic

## Directory: `/shop\settings`
- ⚪ **page.tsx**: Mostly static UI or standard logic

## Directory: `/shop`
**Status Overview:** 🟢 Real DB Connected

- 🟢 **page.tsx**: Uses Firebase/Firestore (Real DB)

## Directory: `/sign\settings`
- ⚪ **page.tsx**: Mostly static UI or standard logic

## Directory: `/sign`
**Status Overview:** 🟢 Real DB Connected

- 🟢 **page.tsx**: Uses Firebase/Firestore (Real DB)

## Directory: `/sites\[slug]`
**Status Overview:** 🟢 Real DB Connected

- ⚪ **not-found.tsx**: Mostly static UI or standard logic
- 🟢 **page.tsx**: Uses Firebase/Firestore (Real DB)

## Directory: `/slides`
- ⚪ **page.tsx**: Mostly static UI or standard logic

## Directory: `/social\groups`
**Status Overview:** 🟢 Real DB Connected

- 🟢 **page.tsx**: Uses Firebase/Firestore (Real DB)

## Directory: `/social`
**Status Overview:** 🟢 Real DB Connected

- 🟢 **page.tsx**: Uses Firebase/Firestore (Real DB)

## Directory: `/sports`
**Status Overview:** 🟢 API Connected

- 🟢 **page.tsx**: Makes API calls (Real)

## Directory: `/stream\settings`
- ⚪ **page.tsx**: Mostly static UI or standard logic

## Directory: `/stream`
- ⚪ **page.tsx**: Mostly static UI or standard logic

## Directory: `/suite\settings`
- ⚪ **page.tsx**: Mostly static UI or standard logic

## Directory: `/suite`
**Status Overview:** 🟢 Real DB Connected

- 🟢 **page.tsx**: Uses Firebase/Firestore (Real DB)

## Directory: `/tasks\settings`
- ⚪ **page.tsx**: Mostly static UI or standard logic

## Directory: `/tasks`
**Status Overview:** 🟢 Real DB Connected

- 🟢 **page.tsx**: Uses Firebase/Firestore (Real DB)

## Directory: `/terms\settings`
- ⚪ **page.tsx**: Mostly static UI or standard logic

## Directory: `/terms`
- ⚪ **page.tsx**: Mostly static UI or standard logic

## Directory: `/translate\settings`
- ⚪ **page.tsx**: Mostly static UI or standard logic

## Directory: `/translate`
**Status Overview:** 🟢 Real DB Connected

- 🟢 **page.tsx**: Uses Firebase/Firestore (Real DB)

## Directory: `/upgrade\settings`
- ⚪ **page.tsx**: Mostly static UI or standard logic

## Directory: `/upgrade`
**Status Overview:** 🟢 Real DB Connected

- 🟢 **page.tsx**: Uses Firebase/Firestore (Real DB)

## Directory: `/voltra`
- ⚪ **page.tsx**: Mostly static UI or standard logic

## Directory: `/voltramax`
- ⚪ **page.tsx**: Mostly static UI or standard logic

## Directory: `/voltraplay`
- ⚪ **page.tsx**: Mostly static UI or standard logic

## Directory: `/voltrastore\[source]\[appId]`
**Status Overview:** 🟢 Real DB Connected | 🟢 API Connected

- 🟢 **page.tsx**: Uses Firebase/Firestore (Real DB), Makes API calls (Real)

## Directory: `/voltrastore`
**Status Overview:** 🟢 Real DB Connected | 🟢 API Connected

- ⚪ **layout.tsx**: Mostly static UI or standard logic
- 🟢 **page.tsx**: Uses Firebase/Firestore (Real DB), Makes API calls (Real)

## Directory: `/weather\settings`
- ⚪ **page.tsx**: Mostly static UI or standard logic

## Directory: `/weather`
**Status Overview:** 🟢 API Connected

- ⚪ **layout.tsx**: Mostly static UI or standard logic
- 🟢 **page.tsx**: Makes API calls (Real)

## Directory: `/weywqdvtewbytdibsaudbeowbfdbwyiyewdufoesncmersuifreybfoyuvtobewufewfdefbeyufvesiyfrebfdyre9nfrebfibeurw`
**Status Overview:** 🟠 Uses Hardcoded/Mock Data

- ⚪ **audio.ts**: Mostly static UI or standard logic
- ⚪ **HomeScreen.tsx**: Likely uses hardcoded array data (Static/Fake), Mostly static UI or standard logic
- ⚪ **layout.tsx**: Mostly static UI or standard logic
- ⚪ **page.tsx**: Mostly static UI or standard logic
- ⚪ **QuickMenu.tsx**: Mostly static UI or standard logic
- ⚪ **StoreScreen.tsx**: Likely uses hardcoded array data (Static/Fake), Mostly static UI or standard logic

## Directory: `/whiteboard\settings`
- ⚪ **page.tsx**: Mostly static UI or standard logic

## Directory: `/whiteboard`
**Status Overview:** 🟢 Real DB Connected

- 🟢 **page.tsx**: Uses Firebase/Firestore (Real DB)

## Directory: `/write`
- ⚪ **page.tsx**: Mostly static UI or standard logic

## Directory: `/xakarena`
- ⚪ **page.tsx**: Mostly static UI or standard logic

## Directory: `/xakarena-creator`
**Status Overview:** 🟠 Uses Hardcoded/Mock Data

- 🔴 **page.tsx**: Uses Mock/Dummy Data (Fake)

## Directory: `/xakcode\console`
**Status Overview:** 🟢 API Connected

- 🟢 **page.tsx**: Makes API calls (Real)

## Directory: `/xakcode\git`
- ⚪ **page.tsx**: Mostly static UI or standard logic

## Directory: `/xakcode\hosting`
- ⚪ **page.tsx**: Mostly static UI or standard logic

## Directory: `/xakcode\settings`
- ⚪ **page.tsx**: Mostly static UI or standard logic

## Directory: `/xakcode\utilities`
- ⚪ **page.tsx**: Mostly static UI or standard logic

## Directory: `/xakcode`
**Status Overview:** 🟢 Real DB Connected | 🟢 API Connected

- 🟢 **context.tsx**: Uses Firebase/Firestore (Real DB), Makes API calls (Real)
- ⚪ **layout.tsx**: Mostly static UI or standard logic
- ⚪ **page.tsx**: Mostly static UI or standard logic

## Directory: `/xaksports`
- ⚪ **page.tsx**: Mostly static UI or standard logic

## Directory: `/xakview\studio`
**Status Overview:** 🟢 Real DB Connected

- 🟢 **page.tsx**: Uses Firebase/Firestore (Real DB)

## Directory: `/xakview`
**Status Overview:** 🟢 Real DB Connected | 🟡 Local State Used | 🟠 Uses Hardcoded/Mock Data

- 🟡 **page.tsx**: Uses Firebase/Firestore (Real DB), Uses localStorage (Real Client State), Uses env vars, Uses Mock/Dummy Data (Fake)

## Directory: `/Root (src/app)`
**Status Overview:** 🟢 Real DB Connected

- 🟢 **layout.tsx**: Uses Firebase/Firestore (Real DB)
- ⚪ **loading.tsx**: Mostly static UI or standard logic
- 🟢 **page.tsx**: Uses Firebase/Firestore (Real DB)

