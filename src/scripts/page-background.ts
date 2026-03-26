interface LetterPosition {
  x: number;
  y: number;
  letter: string;
}

interface LetterInstance extends LetterPosition {
  timestamp: number;
  fadeout: number;
}

class PageBackground {
  private LETTER_FADE_DURATION: [number, number] = [2, 7];

  private baseCanvas: HTMLCanvasElement;
  private overlayCanvas: HTMLCanvasElement;

  private baseCtx: CanvasRenderingContext2D;
  private overlayCtx: CanvasRenderingContext2D;

  private width: number = window.innerWidth;
  private height: number = window.innerHeight;

  private letterPositions: LetterPosition[] = [];
  private letterInstances: LetterInstance[] = [];

  private primaryRgb: string;

  constructor(baseCanvas: HTMLCanvasElement, overlayCanvas: HTMLCanvasElement) {
    const baseCtx = baseCanvas.getContext("2d");
    const overlayCtx = overlayCanvas.getContext("2d");

    if (!baseCtx || !overlayCtx) {
      throw new Error("Unable to get 2D context.");
    }

    this.baseCanvas = baseCanvas;
    this.overlayCanvas = overlayCanvas;
    this.baseCtx = baseCtx;
    this.overlayCtx = overlayCtx;

    baseCanvas.width = this.width;
    baseCanvas.height = this.height;

    overlayCanvas.width = this.width;
    overlayCanvas.height = this.height;

    this.primaryRgb = window
      .getComputedStyle(document.documentElement)
      .getPropertyValue("--primary-rgb")
      .trim();

    this.initBackground();

    requestAnimationFrame(this.redrawBackground);
  }

  private initBackground = () => {
    let text: string = "minjun_park_flutter_developer_";

    const letters = Math.ceil(this.width / 17);
    const lines = Math.ceil(this.height / 35);

    this.baseCtx.font = "28px Geist Mono";
    this.baseCtx.textAlign = "start";
    this.baseCtx.textBaseline = "top";
    this.baseCtx.fillStyle = "rgba(255, 255, 255, 0.015)";

    for (let i = 0; i < lines; i++) {
      for (let j = 0; j < letters; j++) {
        this.baseCtx.fillText(text[j % text.length], j * 17, i * 35);
        this.letterPositions.push({
          x: j * 17,
          y: i * 35,
          letter: text[j % text.length],
        });
      }
    }

    const randomLetters = this.getRandomAmountFromArray<LetterPosition>(
      this.letterPositions,
      Number.parseInt((lines * 0.75).toFixed(), 10)
    );

    this.overlayCtx.font = "bold 28px Geist Mono";
    this.overlayCtx.textAlign = "start";
    this.overlayCtx.textBaseline = "top";
    this.overlayCtx.fillStyle = `rgba(${this.primaryRgb}, 0)`;
    this.overlayCtx.shadowBlur = 16;
    this.overlayCtx.shadowColor = `rgba(${this.primaryRgb}, 0)`;

    for (const letter of randomLetters) {
      this.overlayCtx.fillText(letter.letter, letter.x, letter.y);

      const animLength =
        this.LETTER_FADE_DURATION[0] +
        Math.random() * (this.LETTER_FADE_DURATION[1] - this.LETTER_FADE_DURATION[0]);

      this.letterInstances.push({
        x: letter.x,
        y: letter.y,
        letter: letter.letter,
        timestamp: Date.now(),
        fadeout: Date.now() + animLength * 1000,
      });
    }

    this.baseCanvas.style.opacity = "1";
  };

  private easeInOutSine = (timestamp: number, start: number, end: number) => {
    const totalDuration = end - start;

    if (timestamp < start) {
      return 0;
    }

    if (timestamp > end) {
      const elapsedAfterEnd = timestamp - end;
      const progressAfterEnd = elapsedAfterEnd / (totalDuration / 2);

      return Math.sin(progressAfterEnd * Math.PI);
    }

    const progress = (timestamp - start) / totalDuration;

    return Math.max(0, 0.5 - 0.5 * Math.cos(progress * Math.PI));
  };

  private getRandomAmountFromArray = <T>(arr: Array<T>, n = 20): Array<T> => {
    let len = arr.length;

    const result = new Array(n);
    const taken = new Array(len);

    if (n > len) {
      throw new Error("getRandomAmountFromArray: more elements taken than available");
    }

    while (n--) {
      const x = Math.floor(Math.random() * len);
      result[n] = arr[x in taken ? taken[x] : x];
      taken[x] = --len in taken ? taken[len] : len;
    }

    return result;
  };

  private redrawBackground = () => {
    this.overlayCtx.clearRect(0, 0, this.overlayCanvas.width, this.overlayCanvas.height);

    this.overlayCtx.font = "bold 28px Geist Mono";
    this.overlayCtx.textAlign = "start";
    this.overlayCtx.textBaseline = "top";
    this.overlayCtx.shadowBlur = 16;

    for (const letter of this.letterInstances) {
      if (letter.fadeout > Date.now()) continue;

      const alpha = this.easeInOutSine(Date.now(), letter.timestamp, letter.fadeout);

      if (alpha <= 0 && Date.now() > letter.fadeout) {
        this.letterInstances.splice(this.letterInstances.indexOf(letter), 1);
        const randomLetter = this.getRandomAmountFromArray<LetterPosition>(
          this.letterPositions,
          1
        );

        this.letterInstances.push({
          x: randomLetter[0].x,
          y: randomLetter[0].y,
          letter: randomLetter[0].letter,
          timestamp: Date.now(),
          fadeout:
            Date.now() +
            (this.LETTER_FADE_DURATION[0] +
              Math.random() * (this.LETTER_FADE_DURATION[1] - this.LETTER_FADE_DURATION[0])) *
              1000,
        });
      }

      this.overlayCtx.fillStyle = `rgba(${this.primaryRgb}, ${alpha})`;
      this.overlayCtx.shadowColor = `rgba(${this.primaryRgb}, ${alpha})`;
      this.overlayCtx.fillText(letter.letter, letter.x, letter.y);
    }

    requestAnimationFrame(this.redrawBackground);
  };

  public resizeBackground = () => {
    this.width = window.innerWidth;
    this.height = window.innerHeight;

    this.baseCanvas.width = this.width;
    this.baseCanvas.height = this.height;

    this.overlayCanvas.width = this.width;
    this.overlayCanvas.height = this.height;

    this.baseCtx.clearRect(0, 0, this.baseCanvas.width, this.baseCanvas.height);
    this.overlayCtx.clearRect(0, 0, this.overlayCanvas.width, this.overlayCanvas.height);

    this.letterInstances = [];
    this.letterPositions = [];

    this.initBackground();
  };
}

async function loadFont() {
  const font = new FontFace("Geist Mono", "url(/fonts/GeistMono.woff2)");

  await font.load();

  document.fonts.add(font);
}

async function initializeBackground() {
  await loadFont();

  const canvas = document.getElementById("bg-canvas") as HTMLCanvasElement;
  const overlayCanvas = document.getElementById("overlay-canvas") as HTMLCanvasElement;

  const background = new PageBackground(canvas, overlayCanvas);

  window.addEventListener("resize", () => {
    background.resizeBackground();
  });
}

initializeBackground();
