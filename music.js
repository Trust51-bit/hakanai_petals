(() => {
  const button = document.querySelector("[data-sound-toggle]");
  const AudioEngine = window.AudioContext || window.webkitAudioContext;

  if (!button || !AudioEngine) {
    if (button) {
      button.textContent = "Suono non disponibile";
      button.disabled = true;
    }
    return;
  }

  const palettes = {
    home: [261.63, 329.63, 392.0, 523.25],
    blog: [293.66, 349.23, 440.0, 587.33],
    about: [246.94, 329.63, 369.99, 493.88],
    contact: [220.0, 277.18, 329.63, 440.0],
    diary: [196.0, 261.63, 329.63, 392.0],
    poems: [233.08, 293.66, 349.23, 466.16],
    words: [174.61, 261.63, 349.23, 523.25],
    voice: [207.65, 311.13, 392.0, 466.16],
    english: [220.0, 330.0, 415.3, 554.37],
    lunar: [185.0, 277.18, 369.99, 493.88]
  };

  let ctx;
  let master;
  let lfo;
  let lfoGain;
  let nodes = [];
  let active = false;
  let stopping = false;

  const pageSound = document.body.dataset.sound || "home";
  const notes = palettes[pageSound] || palettes.home;

  function setButton(isActive) {
    button.textContent = isActive ? "Disattiva suono" : "Attiva suono";
    button.setAttribute("aria-label", isActive ? "Disattiva il sottofondo sonoro" : "Attiva il sottofondo sonoro");
    button.setAttribute("aria-pressed", String(isActive));
  }

  async function ensureContext() {
    ctx = ctx || new AudioEngine();
    if (ctx.state === "suspended") {
      await ctx.resume();
    }
  }

  function startSound() {
    master = ctx.createGain();
    master.gain.setValueAtTime(0.0001, ctx.currentTime);
    master.connect(ctx.destination);

    lfo = ctx.createOscillator();
    lfoGain = ctx.createGain();
    lfo.type = "sine";
    lfo.frequency.value = 0.045;
    lfoGain.gain.value = 0.018;
    lfo.connect(lfoGain);
    lfoGain.connect(master.gain);
    lfo.start();

    nodes = notes.map((frequency, index) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const filter = ctx.createBiquadFilter();

      osc.type = index % 2 ? "sine" : "triangle";
      osc.frequency.value = frequency / (index === 0 ? 2 : 1);
      osc.detune.value = (index - 1.5) * 3;
      filter.type = "lowpass";
      filter.frequency.value = 560 + index * 130;
      gain.gain.value = 0.012 / (index + 1);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(master);
      osc.start();

      return { osc, gain, filter };
    });

    master.gain.exponentialRampToValueAtTime(0.12, ctx.currentTime + 1.8);
  }

  function stopSound() {
    if (!ctx || !master || stopping) return;
    stopping = true;
    master.gain.cancelScheduledValues(ctx.currentTime);
    master.gain.setTargetAtTime(0.0001, ctx.currentTime, 0.45);

    window.setTimeout(() => {
      nodes.forEach(({ osc }) => {
        try {
          osc.stop();
          osc.disconnect();
        } catch (_error) {}
      });
      if (lfo) {
        try {
          lfo.stop();
          lfo.disconnect();
        } catch (_error) {}
      }
      if (lfoGain) lfoGain.disconnect();
      if (master) master.disconnect();

      nodes = [];
      lfo = null;
      lfoGain = null;
      master = null;
      stopping = false;
    }, 900);
  }

  button.addEventListener("click", async () => {
    button.disabled = true;
    try {
      if (!active) {
        await ensureContext();
        startSound();
        active = true;
        setButton(true);
      } else {
        stopSound();
        active = false;
        setButton(false);
      }
    } catch (_error) {
      active = false;
      button.textContent = "Riprova suono";
      button.setAttribute("aria-pressed", "false");
    } finally {
      button.disabled = false;
    }
  });

  setButton(false);
})();
