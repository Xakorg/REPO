## Knowledge
Knowledge is an organized, neat knowledge base for Xakteir — a wiki-style app optimized for clarity and search.
           FEATURES
           - Clean article pages with consistent structure (title, summary, sections, references)
           - Fast search and category browsing (Search box + category index)
           - Publicly browsable at knowledge.xakteir.com with subdomain isolation
           - Article routes under /knowledge/a/<slug> and internal editor paths (future)
           - Designed to be dependency-light and extremely readable

## Recent Changes
- **VoltraOS OOBE Complete Overhaul:** Every OOBE page completely rewritten with real functionality: AccountPage now supports Firebase/Firestore sign-in with optional PIN/password, BiometricPage adds fingerprint enrollment, drawing pattern auth, and skip option, WelcomePage has full cinematic design, NetworkPage has Wi-Fi list with signal bars, all other pages expanded significantly with proper UI and real settings
- **OOBEManager Expanded:** Added Firebase profile sync, PIN validation, fingerprint timer, drawing verification, auth method switching (password/PIN/fingerprint/face/drawing), password requirement toggle, device name/display name properties, oobeProgress tracking
- **Desktop Environment Reorganized:** `desktop_environment/` split into `Core/` (main.cpp, Desktop.qml, DesktopDaemon, SettingsEngine, BootSplash) and `Apps/` subdirectories (Browser, Terminal, Games, Chat, XakAI, Files, Weather, Store, Installer, Drive, Stream, Windows, Kernel, Settings)
- **Daily Joke & Riddle API:** Daily jokes/riddles now fetch from v2.jokeapi.dev with date-based localStorage caching for truly different content every day
- **Auth Page Overhaul:** Sign-in page is now fullscreen with animated mesh background, floating gradient orbs, improved glass-morphism
- **Home Page Logo:** Replaced GlitchLogo component with favicon image
- **App Icons Fixed:** All "default" iconName entries in APPS array now use "apps" icon; voltra.svg and voltramax.svg created
- **New Games Added:** Cyber Sprint, Data Fortress, Neural Rider, Voltra Dash, Xak Brawl, Star Breaker
- **Voltramax/VoltraOS:** Active OS project in Voltramax/VoltraOS_Builder/ — QML desktop, C++ kernel, GRUB bootable ISO
- **OOBE Manager Architecture:** `OOBE_Native/` contains `Main.qml` (root window with StackView), all OOBE pages, and `OOBEManager.h/.cpp` (C++ backend with Firebase integration, PIN validation, fingerprint timers, drawing verification)
- **VoltraOS Build Pipeline:** Kernel (`voltra_kernel/`) uses Docker with Ubuntu 24.04, gcc-i686, nasm, grub-pc-bin, xorriso, mtools. Desktop (`desktop_environment/`) uses CMake + Qt6. Full ISO generation via top-level `Makefile`.
- **VoltraOS Desktop Environment:** Qt6/QML desktop with services: DesktopDaemon, BrowserEngine, TerminalPTY, GameAggregatorService, XakChatService, XakCoachingService, VoltraFileSystemModel, DriveEngine, StreamEngine, WTLManager, SyscallBridge
- **Kernel:** Bare-metal 32-bit freestanding C kernel with GRUB multiboot bootloader. ~40 source files including main.c, memory.c, interrupts.c, drivers/, fs/, fs/, etc.
