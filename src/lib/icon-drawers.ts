export const drawEnvelope = (c: CanvasRenderingContext2D) => {
  c.lineWidth = 2.5;
  c.lineCap = "round";
  c.lineJoin = "round";
  c.beginPath();
  c.roundRect(2, 4, 20, 16, 2);
  c.stroke();
  c.beginPath();
  c.moveTo(2, 6);
  c.lineTo(12, 13);
  c.lineTo(22, 6);
  c.stroke();
};

export const drawChat = (c: CanvasRenderingContext2D) => {
  c.lineWidth = 2.5;
  c.lineCap = "round";
  c.lineJoin = "round";
  c.beginPath();
  c.moveTo(21, 15);
  c.arcTo(21, 17, 19, 17, 2);
  c.lineTo(7, 17);
  c.lineTo(3, 21);
  c.lineTo(3, 5);
  c.arcTo(3, 3, 5, 3, 2);
  c.lineTo(19, 3);
  c.arcTo(21, 3, 21, 5, 2);
  c.closePath();
  c.stroke();
};

export const drawGamepad = (c: CanvasRenderingContext2D) => {
  c.lineWidth = 2.5;
  c.lineCap = "round";
  c.lineJoin = "round";
  c.beginPath();
  c.roundRect(2, 6, 20, 12, 3);
  c.stroke();
  c.beginPath(); c.moveTo(6, 12); c.lineTo(10, 12); c.stroke();
  c.beginPath(); c.moveTo(8, 10); c.lineTo(8, 14); c.stroke();
  c.beginPath(); c.arc(15, 13, 0.5, 0, 2*Math.PI); c.stroke();
  c.beginPath(); c.arc(18, 11, 0.5, 0, 2*Math.PI); c.stroke();
};

export const drawLayers = (c: CanvasRenderingContext2D) => {
  c.lineWidth = 2.5;
  c.lineCap = "round";
  c.lineJoin = "round";
  c.beginPath();
  c.moveTo(12, 2); c.lineTo(22, 7); c.lineTo(12, 12); c.lineTo(2, 7); c.closePath();
  c.stroke();
  c.beginPath();
  c.moveTo(2, 12); c.lineTo(12, 17); c.lineTo(22, 12);
  c.stroke();
  c.beginPath();
  c.moveTo(2, 17); c.lineTo(12, 22); c.lineTo(22, 17);
  c.stroke();
};

export const drawXakteirX = (c: CanvasRenderingContext2D) => {
  c.lineWidth = 3.5;
  c.lineCap = "round";
  c.lineJoin = "round";
  c.beginPath();
  c.moveTo(6, 6);
  c.bezierCurveTo(8.4, 6, 15.6, 18, 18, 18);
  c.stroke();
  c.beginPath();
  c.moveTo(18, 6);
  c.bezierCurveTo(15.6, 6, 8.4, 18, 6, 18);
  c.stroke();
};

export const drawCalculator = (c: CanvasRenderingContext2D) => {
  c.lineWidth = 2.5;
  c.lineCap = "round";
  c.lineJoin = "round";
  c.beginPath();
  c.roundRect(4, 3, 16, 18, 2);
  c.stroke();
  c.beginPath();
  c.moveTo(4, 9); c.lineTo(20, 9);
  c.moveTo(12, 9); c.lineTo(12, 21);
  c.stroke();
};

export const drawNotes = (c: CanvasRenderingContext2D) => {
  c.lineWidth = 2.5;
  c.lineCap = "round";
  c.lineJoin = "round";
  c.beginPath();
  c.moveTo(4, 2); c.lineTo(15, 2); c.lineTo(20, 7); c.lineTo(20, 22); c.lineTo(4, 22);
  c.closePath();
  c.stroke();
  c.beginPath();
  c.moveTo(15, 2); c.lineTo(15, 7); c.lineTo(20, 7);
  c.stroke();
};

export const drawSocial = (c: CanvasRenderingContext2D) => {
  c.lineWidth = 2.2;
  c.lineCap = "round";
  c.lineJoin = "round";
  c.beginPath(); c.arc(9, 8, 2.5, 0, Math.PI*2); c.stroke();
  c.beginPath(); c.arc(9, 18, 5, Math.PI, 0); c.stroke();
  c.beginPath(); c.arc(15, 8, 2.5, 0, Math.PI*2); c.stroke();
  c.beginPath(); c.arc(15, 18, 5, Math.PI, 0); c.stroke();
};

export const drawShop = (c: CanvasRenderingContext2D) => {
  c.lineWidth = 2.5;
  c.lineCap = "round";
  c.lineJoin = "round";
  c.beginPath();
  c.roundRect(4, 8, 16, 13, 2);
  c.stroke();
  c.beginPath();
  c.arc(12, 8, 4, Math.PI, 0);
  c.stroke();
};

export const drawDevCentre = (c: CanvasRenderingContext2D) => {
  c.lineWidth = 2.5;
  c.lineCap = "round";
  c.lineJoin = "round";
  c.beginPath();
  c.moveTo(8, 7); c.lineTo(3, 12); c.lineTo(8, 17);
  c.stroke();
  c.beginPath();
  c.moveTo(16, 7); c.lineTo(21, 12); c.lineTo(16, 17);
  c.stroke();
};

export const drawArt = (c: CanvasRenderingContext2D) => {
  c.lineWidth = 2.5;
  c.lineCap = "round";
  c.lineJoin = "round";
  c.beginPath();
  c.arc(12, 12, 8, 0, Math.PI*2);
  c.stroke();
  c.beginPath();
  c.arc(9, 13, 1.5, 0, Math.PI*2);
  c.stroke();
};

export const drawApps = (c: CanvasRenderingContext2D) => {
  c.lineWidth = 2.2;
  c.lineCap = "round";
  c.lineJoin = "round";
  c.beginPath();
  c.roundRect(3, 3, 7, 7, 1);
  c.roundRect(14, 3, 7, 7, 1);
  c.roundRect(3, 14, 7, 7, 1);
  c.roundRect(14, 14, 7, 7, 1);
  c.stroke();
};

export const drawArchive = (c: CanvasRenderingContext2D) => {
  c.lineWidth = 2.5;
  c.lineCap = "round";
  c.lineJoin = "round";
  c.beginPath();
  c.roundRect(3, 7, 18, 14, 2);
  c.stroke();
  c.beginPath(); c.moveTo(3, 7); c.lineTo(21, 7); c.stroke();
  c.beginPath(); c.moveTo(10, 11); c.lineTo(14, 11); c.stroke();
};

export const drawAuthenticator = (c: CanvasRenderingContext2D) => {
  c.lineWidth = 2.5;
  c.lineCap = "round";
  c.lineJoin = "round";
  c.beginPath();
  c.moveTo(12, 3); c.lineTo(20, 6); c.lineTo(20, 13);
  c.bezierCurveTo(20, 18, 16, 21, 12, 22);
  c.bezierCurveTo(8, 21, 4, 18, 4, 13);
  c.lineTo(4, 6);
  c.closePath();
  c.stroke();
};

export const drawBuddy = (c: CanvasRenderingContext2D) => {
  c.lineWidth = 2.5;
  c.lineCap = "round";
  c.lineJoin = "round";
  c.beginPath();
  c.moveTo(12, 7);
  c.bezierCurveTo(12, 3, 6, 2, 6, 8);
  c.bezierCurveTo(6, 14, 12, 19, 12, 21);
  c.bezierCurveTo(12, 19, 18, 14, 18, 8);
  c.bezierCurveTo(18, 2, 12, 3, 12, 7);
  c.closePath();
  c.stroke();
};

export const drawInstaller = (c: CanvasRenderingContext2D) => {
  c.lineWidth = 2.5;
  c.lineCap = "round";
  c.lineJoin = "round";
  c.beginPath();
  c.moveTo(12, 3); c.lineTo(12, 15);
  c.moveTo(8, 11); c.lineTo(12, 15); c.lineTo(16, 11);
  c.moveTo(4, 20); c.lineTo(20, 20);
  c.stroke();
};

export const drawMap = (c: CanvasRenderingContext2D) => {
  c.lineWidth = 2.5;
  c.lineCap = "round";
  c.lineJoin = "round";
  c.beginPath();
  c.arc(12, 8, 4.5, 0, Math.PI*2);
  c.stroke();
  c.beginPath();
  c.moveTo(12, 12.5); c.lineTo(12, 21);
  c.stroke();
};

export const drawNews = (c: CanvasRenderingContext2D) => {
  c.lineWidth = 2.5;
  c.lineCap = "round";
  c.lineJoin = "round";
  c.beginPath();
  c.roundRect(3, 4, 18, 16, 2);
  c.stroke();
  c.beginPath();
  c.moveTo(6, 8); c.lineTo(18, 8);
  c.moveTo(6, 12); c.lineTo(14, 12);
  c.moveTo(6, 16); c.lineTo(18, 16);
  c.stroke();
};

export const drawSearch = (c: CanvasRenderingContext2D) => {
  c.lineWidth = 2.5;
  c.lineCap = "round";
  c.lineJoin = "round";
  c.beginPath();
  c.arc(10, 10, 5.5, 0, Math.PI*2);
  c.stroke();
  c.beginPath();
  c.moveTo(14, 14); c.lineTo(20, 20);
  c.stroke();
};

export const drawSign = (c: CanvasRenderingContext2D) => {
  c.lineWidth = 2.5;
  c.lineCap = "round";
  c.lineJoin = "round";
  c.beginPath();
  c.roundRect(3, 3, 18, 18, 2);
  c.stroke();
  c.beginPath();
  c.moveTo(7, 12); c.lineTo(10, 15); c.lineTo(17, 8);
  c.stroke();
};

export const drawStream = (c: CanvasRenderingContext2D) => {
  c.lineWidth = 2.5;
  c.lineCap = "round";
  c.lineJoin = "round";
  c.beginPath(); c.arc(12, 12, 2, 0, Math.PI*2); c.stroke();
  c.beginPath(); c.arc(12, 12, 5.5, Math.PI, 0); c.stroke();
  c.beginPath(); c.arc(12, 12, 9, Math.PI, 0); c.stroke();
};

export const drawTasks = (c: CanvasRenderingContext2D) => {
  c.lineWidth = 2.2;
  c.lineCap = "round";
  c.lineJoin = "round";
  c.beginPath(); c.roundRect(3, 4, 4, 4, 1); c.stroke();
  c.beginPath(); c.moveTo(9, 6); c.lineTo(20, 6); c.stroke();
  c.beginPath(); c.roundRect(3, 11, 4, 4, 1); c.stroke();
  c.beginPath(); c.moveTo(9, 13); c.lineTo(20, 13); c.stroke();
  c.beginPath(); c.roundRect(3, 18, 4, 4, 1); c.stroke();
  c.beginPath(); c.moveTo(9, 20); c.lineTo(20, 20); c.stroke();
};

export const drawWeather = (c: CanvasRenderingContext2D) => {
  c.lineWidth = 2.5;
  c.lineCap = "round";
  c.beginPath(); c.arc(12, 12, 4.5, 0, Math.PI*2); c.stroke();
  for (let i = 0; i < 8; i++) {
    const angle = (i * Math.PI) / 4;
    const x1 = 12 + Math.cos(angle) * 6.5;
    const y1 = 12 + Math.sin(angle) * 6.5;
    const x2 = 12 + Math.cos(angle) * 8.5;
    const y2 = 12 + Math.sin(angle) * 8.5;
    c.beginPath(); c.moveTo(x1, y1); c.lineTo(x2, y2); c.stroke();
  }
};

export const drawSupport = (c: CanvasRenderingContext2D) => {
  c.lineWidth = 2.5;
  c.lineCap = "round";
  c.lineJoin = "round";
  c.beginPath(); c.arc(12, 12, 9, 0, Math.PI*2); c.stroke();
  c.beginPath(); c.arc(12, 8, 2.5, Math.PI, 0); c.stroke();
  c.beginPath(); c.moveTo(14.5, 8); c.lineTo(12, 11); c.lineTo(12, 14); c.stroke();
  c.beginPath(); c.arc(12, 17, 0.4, 0, Math.PI*2); c.stroke();
};

export const drawProfile = (c: CanvasRenderingContext2D) => {
  c.lineWidth = 2.5;
  c.lineCap = "round";
  c.lineJoin = "round";
  c.beginPath(); c.arc(12, 7, 3.5, 0, Math.PI*2); c.stroke();
  c.beginPath(); c.arc(12, 20, 7, Math.PI, 0); c.stroke();
};

export const drawAbout = (c: CanvasRenderingContext2D) => {
  c.lineWidth = 2.5;
  c.lineCap = "round";
  c.lineJoin = "round";
  c.beginPath(); c.arc(12, 12, 9, 0, Math.PI*2); c.stroke();
  c.beginPath(); c.arc(12, 7, 0.5, 0, Math.PI*2); c.stroke();
  c.beginPath(); c.moveTo(12, 10); c.lineTo(12, 17); c.stroke();
};

export const drawAIChat = (c: CanvasRenderingContext2D) => {
  c.lineWidth = 2.5;
  c.lineCap = "round";
  c.lineJoin = "round";
  c.beginPath(); c.roundRect(4, 7, 16, 12, 2); c.stroke();
  c.beginPath(); c.moveTo(4, 13); c.lineTo(2, 13); c.moveTo(20, 13); c.lineTo(22, 13); c.stroke();
  c.beginPath(); c.arc(9, 12, 0.8, 0, Math.PI*2); c.arc(15, 12, 0.8, 0, Math.PI*2); c.stroke();
};

export const drawClassroom = (c: CanvasRenderingContext2D) => {
  c.lineWidth = 2.5;
  c.lineCap = "round";
  c.lineJoin = "round";
  c.beginPath();
  c.moveTo(12, 4); c.lineTo(22, 9); c.lineTo(12, 14); c.lineTo(2, 9); c.closePath();
  c.stroke();
  c.beginPath();
  c.moveTo(6, 12); c.lineTo(6, 16);
  c.bezierCurveTo(6, 18, 18, 18, 18, 16);
  c.lineTo(18, 12);
  c.stroke();
};

export const drawMeet = (c: CanvasRenderingContext2D) => {
  c.lineWidth = 2.5;
  c.lineCap = "round";
  c.lineJoin = "round";
  c.beginPath(); c.roundRect(3, 6, 11, 12, 2); c.stroke();
  c.beginPath();
  c.moveTo(14, 9); c.lineTo(20, 5); c.lineTo(20, 19); c.lineTo(14, 15);
  c.closePath();
  c.stroke();
};

export const drawDrive = (c: CanvasRenderingContext2D) => {
  c.lineWidth = 2.5;
  c.lineCap = "round";
  c.lineJoin = "round";
  c.beginPath();
  c.moveTo(12, 4); c.lineTo(20, 19); c.lineTo(4, 19); c.closePath();
  c.stroke();
};

export const drawWhiteboard = (c: CanvasRenderingContext2D) => {
  c.lineWidth = 2.5;
  c.lineCap = "round";
  c.lineJoin = "round";
  c.beginPath(); c.roundRect(3, 5, 18, 11, 1); c.stroke();
  c.beginPath();
  c.moveTo(12, 16); c.lineTo(12, 20);
  c.moveTo(12, 20); c.lineTo(8, 23);
  c.moveTo(12, 20); c.lineTo(16, 23);
  c.stroke();
};

export const drawSettings = (c: CanvasRenderingContext2D) => {
  c.lineWidth = 2.5;
  c.lineCap = "round";
  c.beginPath(); c.arc(12, 12, 3.5, 0, Math.PI * 2); c.stroke();
  c.beginPath(); c.arc(12, 12, 7.5, 0, Math.PI * 2); c.stroke();
  for (let i = 0; i < 8; i++) {
    const angle = (i * Math.PI) / 4;
    const x1 = 12 + Math.cos(angle) * 7.5;
    const y1 = 12 + Math.sin(angle) * 7.5;
    const x2 = 12 + Math.cos(angle) * 9.5;
    const y2 = 12 + Math.sin(angle) * 9.5;
  c.beginPath(); c.moveTo(x1, y1); c.lineTo(x2, y2); c.stroke();
  }
};

// Main dispatcher function
export const drawAppIconPath = (ctx: CanvasRenderingContext2D, iconName: string) => {
  ctx.strokeStyle = "#ffffff";
  ctx.fillStyle = "none";
  
  if (iconName === "mail") drawEnvelope(ctx);
  else if (iconName === "chat") drawChat(ctx);
  else if (iconName === "games" || iconName === "xaksports") drawGamepad(ctx);
  else if (iconName === "suite") drawLayers(ctx);
  else if (iconName === "calculator") drawCalculator(ctx);
  else if (iconName === "notes") drawNotes(ctx);
  else if (iconName === "social") drawSocial(ctx);
  else if (iconName === "shop") drawShop(ctx);
  else if (iconName === "dev-centre") drawDevCentre(ctx);
  else if (iconName === "art") drawArt(ctx);
  else if (iconName === "apps") drawApps(ctx);
  else if (iconName === "archive") drawArchive(ctx);
  else if (iconName === "authenticator") drawAuthenticator(ctx);
  else if (iconName === "buddy") drawBuddy(ctx);
  else if (iconName === "installer") drawInstaller(ctx);
  else if (iconName === "map") drawMap(ctx);
  else if (iconName === "news") drawNews(ctx);
  else if (iconName === "search-console" || iconName === "search") drawSearch(ctx);
  else if (iconName === "sign") drawSign(ctx);
  else if (iconName === "stream") drawStream(ctx);
  else if (iconName === "tasks") drawTasks(ctx);
  else if (iconName === "weather") drawWeather(ctx);
  else if (iconName === "contact" || iconName === "support") drawSupport(ctx);
  else if (iconName === "profile") drawProfile(ctx);
  else if (iconName === "about") drawAbout(ctx);
  else if (iconName === "ai-chat") drawAIChat(ctx);
  else if (iconName === "classroom") drawClassroom(ctx);
  else if (iconName === "meet") drawMeet(ctx);
  else if (iconName === "drive") drawDrive(ctx);
  else if (iconName === "whiteboard") drawWhiteboard(ctx);
  else if (iconName === "settings") drawSettings(ctx);
  else drawXakteirX(ctx);
};
